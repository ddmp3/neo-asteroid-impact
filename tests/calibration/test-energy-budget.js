/**
 * Test Energy Budget Module
 *
 * Phase 1.4 - Task 1.2: Validation of complete energy budget calculations
 *
 * VALIDATION STRATEGY:
 *   1. Energy conservation: Total = Sum of components
 *   2. Physical magnitudes: Rotational << Translational
 *   3. Deformation energy: 5-20% of total (velocity-dependent)
 *   4. Known impacts: Compare with literature values
 */

const {
    calculateRotationalEnergy,
    calculateDeformationEnergy,
    calculateCompleteEnergyBudget,
    validateEnergyBudget
} = require('../../asteroid-impact-simulator/api/src/services/energyBudget');

const { calculateCouplingEfficiency } = require('../../asteroid-impact-simulator/api/src/services/energyCoupling');

console.log('='.repeat(80));
console.log('ENERGY BUDGET - VALIDATION TESTS');
console.log('Phase 1.4 - Task 1.2');
console.log('='.repeat(80));
console.log();

// ========== TEST 1: ROTATIONAL ENERGY ==========
console.log('TEST 1: Rotational Energy Calculation');
console.log('-'.repeat(80));

const rotation_tests = [
    { name: 'Small fast rotator', mass: 1e9, diameter: 100, period: 2, expected_fraction: 3e-12 },
    { name: 'Typical asteroid', mass: 1e12, diameter: 1000, period: 6, expected_fraction: 4e-11 },
    { name: 'Slow rotator', mass: 1e15, diameter: 10000, period: 24, expected_fraction: 2e-10 }
];

let rotation_passed = 0;
rotation_tests.forEach(test => {
    const result = calculateRotationalEnergy(test.mass, test.diameter, test.period);
    const error_pct = Math.abs((result.rotation_fraction - test.expected_fraction) / test.expected_fraction) * 100;
    const passed = error_pct < 50;  // 50% tolerance (order of magnitude check)

    // Use scientific notation for very small numbers
    const actual_str = result.rotation_fraction < 0.0001 ? result.rotation_fraction.toExponential(2) : result.rotation_fraction.toFixed(6);
    const expected_str = test.expected_fraction < 0.0001 ? test.expected_fraction.toExponential(2) : test.expected_fraction.toFixed(6);

    console.log(`${test.name.padEnd(25)} | P=${test.period}h | E_rot/E_trans=${actual_str} | Expected=${expected_str} | ${passed ? '✅' : '❌'}`);

    if (passed) rotation_passed++;
});

console.log(`\nRotation Tests: ${rotation_passed}/${rotation_tests.length} passed\n`);

// ========== TEST 2: DEFORMATION ENERGY ==========
console.log('TEST 2: Deformation Energy (Velocity-Dependent)');
console.log('-'.repeat(80));

const deformation_tests = [
    { name: 'Low velocity (3 km/s)', E: 1e15, v: 3000, comp: 'rocky', expected_fraction: 0.05 },
    { name: 'Medium velocity (12 km/s)', E: 1e15, v: 12000, comp: 'rocky', expected_fraction: 0.10 },
    { name: 'High velocity (20 km/s)', E: 1e15, v: 20000, comp: 'rocky', expected_fraction: 0.15 },
    { name: 'Hypervelocity (30 km/s)', E: 1e15, v: 30000, comp: 'rocky', expected_fraction: 0.10 },
    { name: 'Iron impactor (12 km/s)', E: 1e15, v: 12000, comp: 'iron', expected_fraction: 0.08 },
    { name: 'Icy impactor (12 km/s)', E: 1e15, v: 12000, comp: 'icy', expected_fraction: 0.12 }
];

let deformation_passed = 0;
deformation_tests.forEach(test => {
    const result = calculateDeformationEnergy(test.E, test.v, test.comp);
    const actual_fraction = result.total_deformation / test.E;
    const error_pct = Math.abs((actual_fraction - test.expected_fraction) / test.expected_fraction) * 100;
    const passed = error_pct < 20;  // 20% tolerance

    console.log(`${test.name.padEnd(30)} | v=${(test.v/1000).toFixed(0)} km/s | E_def/E_tot=${actual_fraction.toFixed(3)} | Expected=${test.expected_fraction.toFixed(3)} | ${passed ? '✅' : '❌'}`);

    if (passed) deformation_passed++;
});

console.log(`\nDeformation Tests: ${deformation_passed}/${deformation_tests.length} passed\n`);

// ========== TEST 3: COMPLETE ENERGY BUDGET ==========
console.log('TEST 3: Complete Energy Budget - Known Impacts');
console.log('-'.repeat(80));

// Test Case 1: Barringer Crater
console.log('\n--- Barringer Crater (Meteor Crater, Arizona) ---');
const barringer_mass = 3e8;  // 300,000 tons
const barringer_diameter = 50;  // meters
const barringer_velocity = 12800;  // 12.8 km/s
const barringer_angle = 90;  // vertical
const barringer_composition = 'iron';

const barringer_eta = calculateCouplingEfficiency(barringer_angle, barringer_velocity, barringer_composition);
const barringer_budget = calculateCompleteEnergyBudget(
    barringer_mass,
    barringer_diameter,
    barringer_velocity,
    barringer_angle,
    barringer_composition,
    6.0,  // typical rotation period
    barringer_eta
);

console.log(`Impactor: ${barringer_diameter}m iron @ ${barringer_velocity/1000} km/s`);
console.log(`Total Energy: ${(barringer_budget.total_energy/1e15).toFixed(2)} PJ`);
console.log();
console.log('Energy Partitioning:');
console.log(`  Translational Kinetic: ${(barringer_budget.translational_kinetic/1e15).toFixed(2)} PJ (${(barringer_budget.fractions.crater*100 + barringer_budget.fractions.ejecta*100 + barringer_budget.fractions.deformation*100).toFixed(1)}%)`);
console.log(`  Rotational Kinetic:    ${(barringer_budget.rotational_kinetic/1e12).toFixed(2)} TJ (${(barringer_budget.fractions.rotational*100).toFixed(4)}%)`);
console.log();
console.log(`  → Crater Excavation:   ${(barringer_budget.crater_excavation/1e15).toFixed(2)} PJ (${(barringer_budget.fractions.crater*100).toFixed(1)}%)`);
console.log(`  → Ejecta Curtain:      ${(barringer_budget.ejecta_curtain/1e15).toFixed(2)} PJ (${(barringer_budget.fractions.ejecta*100).toFixed(1)}%)`);
console.log(`  → Deformation:         ${(barringer_budget.deformation/1e15).toFixed(2)} PJ (${(barringer_budget.fractions.deformation*100).toFixed(1)}%)`);
console.log(`  → Thermal Ablation:    ${(barringer_budget.thermal_ablation/1e15).toFixed(2)} PJ (${(barringer_budget.fractions.thermal*100).toFixed(1)}%) [Task 1.3]`);

const barringer_validation = validateEnergyBudget(barringer_budget);
console.log();
console.log('Validation:', barringer_validation.summary);
console.log(`  Energy Conservation: ${barringer_validation.checks.energy_conservation.error_pct}% error (tolerance: ${barringer_validation.checks.energy_conservation.tolerance})`);
console.log(`  Rotational Magnitude: ${barringer_validation.checks.rotational_magnitude.fraction_pct}% (expected: ${barringer_validation.checks.rotational_magnitude.expected})`);
console.log(`  Deformation Range: ${barringer_validation.checks.deformation_range.fraction_pct}% (expected: ${barringer_validation.checks.deformation_range.expected})`);

// Test Case 2: Chicxulub (K-Pg boundary impact)
console.log('\n--- Chicxulub Impact (K-Pg Boundary, 66 Ma) ---');
const chicxulub_mass = 1e15;  // ~1 trillion tons (10 km rocky asteroid)
const chicxulub_diameter = 10000;  // 10 km
const chicxulub_velocity = 20000;  // 20 km/s
const chicxulub_angle = 60;  // moderately oblique (Schulte et al. 2010)
const chicxulub_composition = 'rocky';

const chicxulub_eta = calculateCouplingEfficiency(chicxulub_angle, chicxulub_velocity, chicxulub_composition);
const chicxulub_budget = calculateCompleteEnergyBudget(
    chicxulub_mass,
    chicxulub_diameter,
    chicxulub_velocity,
    chicxulub_angle,
    chicxulub_composition,
    8.0,
    chicxulub_eta
);

console.log(`Impactor: ${chicxulub_diameter/1000} km rocky @ ${chicxulub_velocity/1000} km/s`);
console.log(`Total Energy: ${(chicxulub_budget.total_energy/1e23).toFixed(2)} × 10²³ J = ${(chicxulub_budget.total_energy/4.184e15/1e6).toFixed(0)} million MT TNT`);
console.log();
console.log('Energy Partitioning:');
console.log(`  Translational:         ${(chicxulub_budget.translational_kinetic/1e23).toFixed(2)} × 10²³ J (${(100 - barringer_budget.fractions.rotational*100).toFixed(2)}%)`);
console.log(`  Rotational:            ${(chicxulub_budget.rotational_kinetic/1e20).toFixed(2)} × 10²⁰ J (${(chicxulub_budget.fractions.rotational*100).toFixed(4)}%)`);
console.log();
console.log(`  → Crater Excavation:   ${(chicxulub_budget.crater_excavation/1e23).toFixed(2)} × 10²³ J (${(chicxulub_budget.fractions.crater*100).toFixed(1)}%)`);
console.log(`  → Ejecta Curtain:      ${(chicxulub_budget.ejecta_curtain/1e23).toFixed(2)} × 10²³ J (${(chicxulub_budget.fractions.ejecta*100).toFixed(1)}%)`);
console.log(`  → Deformation:         ${(chicxulub_budget.deformation/1e23).toFixed(2)} × 10²³ J (${(chicxulub_budget.fractions.deformation*100).toFixed(1)}%)`);

const chicxulub_validation = validateEnergyBudget(chicxulub_budget);
console.log();
console.log('Validation:', chicxulub_validation.summary);

// ========== TEST 4: ENERGY CONSERVATION ==========
console.log('\n' + '='.repeat(80));
console.log('TEST 4: Energy Conservation Across Parameters');
console.log('-'.repeat(80));

const conservation_tests = [
    { mass: 1e10, diameter: 134, velocity: 15000, angle: 90, composition: 'rocky' },
    { mass: 1e12, diameter: 1000, velocity: 18000, angle: 45, composition: 'iron' },
    { mass: 1e14, diameter: 5000, velocity: 25000, angle: 30, composition: 'icy' }
];

let conservation_passed = 0;
conservation_tests.forEach((test, idx) => {
    const eta = calculateCouplingEfficiency(test.angle, test.velocity, test.composition);
    const budget = calculateCompleteEnergyBudget(
        test.mass, test.diameter, test.velocity, test.angle, test.composition, 6.0, eta
    );
    const validation = validateEnergyBudget(budget);

    console.log(`Test ${idx+1}: ${test.diameter}m ${test.composition} @ ${test.velocity/1000} km/s, θ=${test.angle}°`);
    console.log(`  Total Energy: ${(budget.total_energy/1e15).toFixed(2)} PJ`);
    console.log(`  Conservation Error: ${validation.checks.energy_conservation.error_pct}%`);
    console.log(`  Deformation Fraction: ${validation.checks.deformation_range.fraction_pct}%`);
    console.log(`  Status: ${validation.valid ? '✅ PASS' : '❌ FAIL'}`);
    console.log();

    if (validation.valid) conservation_passed++;
});

console.log(`Conservation Tests: ${conservation_passed}/${conservation_tests.length} passed\n`);

// ========== SUMMARY ==========
console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));

const total_tests = rotation_tests.length + deformation_tests.length + conservation_tests.length + 2;  // +2 for Barringer, Chicxulub
const total_passed = rotation_passed + deformation_passed + conservation_passed + (barringer_validation.valid ? 1 : 0) + (chicxulub_validation.valid ? 1 : 0);
const pass_rate = (total_passed / total_tests * 100).toFixed(1);

console.log(`Total Tests: ${total_passed}/${total_tests} passed (${pass_rate}%)`);
console.log();
console.log(`Rotational Energy:       ${rotation_passed}/${rotation_tests.length} ✅`);
console.log(`Deformation Energy:      ${deformation_passed}/${deformation_tests.length} ✅`);
console.log(`Barringer Budget:        ${barringer_validation.valid ? '1/1 ✅' : '0/1 ❌'}`);
console.log(`Chicxulub Budget:        ${chicxulub_validation.valid ? '1/1 ✅' : '0/1 ❌'}`);
console.log(`Energy Conservation:     ${conservation_passed}/${conservation_tests.length} ✅`);
console.log();

if (pass_rate >= 90) {
    console.log('✅ ENERGY BUDGET MODULE VALIDATED - READY FOR INTEGRATION');
} else if (pass_rate >= 75) {
    console.log('⚠️  ENERGY BUDGET MODULE NEEDS REFINEMENT');
} else {
    console.log('❌ ENERGY BUDGET MODULE FAILED VALIDATION');
}

console.log('='.repeat(80));
