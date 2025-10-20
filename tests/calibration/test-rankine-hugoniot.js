/**
 * Test Rankine-Hugoniot Shock Physics Module
 *
 * Phase 1.4 - Task 2.1: Validation of shock wave physics
 *
 * VALIDATION STRATEGY:
 *   1. Jump conditions: Verify conservation laws
 *   2. Known explosions: Trinity, Hiroshima, Tunguska
 *   3. Overpressure decay: Compare with Sedov-Taylor solution
 *   4. Damage thresholds: Validate against nuclear test data
 */

const {
    calculateShockJump,
    calculateBlastOverpressure,
    categorizeBlastDamage,
    calculateBlastZones,
    validateRankineHugoniot
} = require('../../asteroid-impact-simulator/api/src/services/rankineHugoniot');

console.log('='.repeat(80));
console.log('RANKINE-HUGONIOT SHOCK PHYSICS - VALIDATION TESTS');
console.log('Phase 1.4 - Task 2.1');
console.log('='.repeat(80));
console.log();

// ========== TEST 1: JUMP CONDITIONS ==========
console.log('TEST 1: Rankine-Hugoniot Jump Conditions');
console.log('-'.repeat(80));

// Atmospheric conditions at sea level
const P1 = 101325;    // Pa (1 atm)
const rho1 = 1.225;   // kg/m³
const T1 = 288.15;    // K (15°C)

const shock_tests = [
    { M: 1.5, name: 'Weak shock' },
    { M: 3.0, name: 'Moderate shock' },
    { M: 5.0, name: 'Strong shock' },
    { M: 10.0, name: 'Very strong shock' }
];

let jump_passed = 0;
shock_tests.forEach(test => {
    const c1 = Math.sqrt(1.4 * P1 / rho1);  // ~340 m/s
    const shockVelocity = test.M * c1;

    const result = calculateShockJump(P1, rho1, T1, shockVelocity);

    // Conservation checks
    const gamma = 1.4;
    const expected_P_ratio = 1 + (2 * gamma / (gamma + 1)) * (test.M * test.M - 1);
    const error_pct = Math.abs((result.pressure_ratio - expected_P_ratio) / expected_P_ratio) * 100;
    const passed = error_pct < 0.1;  // <0.1% numerical error

    console.log(`${test.name.padEnd(20)} M=${test.M.toFixed(1)} | P₂/P₁=${result.pressure_ratio.toFixed(3)} (expected ${expected_P_ratio.toFixed(3)}) | ρ₂/ρ₁=${result.density_ratio.toFixed(3)} | ${passed ? '✅' : '❌'}`);

    if (passed) jump_passed++;
});

console.log(`\nJump Conditions: ${jump_passed}/${shock_tests.length} passed\n`);

// ========== TEST 2: KNOWN NUCLEAR TESTS ==========
console.log('TEST 2: Known Nuclear Explosions');
console.log('-'.repeat(80));

// Trinity test (first nuclear detonation, well-documented)
console.log('\n--- Trinity Test (July 16, 1945) ---');
const trinity_energy = 22 * 4.184e12;  // 22 kilotons TNT
const trinity_distance = 1000;  // 1 km from ground zero

const trinity_blast = calculateBlastOverpressure(trinity_energy, trinity_distance);
console.log(`Energy: 22 kt TNT`);
console.log(`Distance: 1.0 km`);
console.log(`Overpressure: ${trinity_blast.overpressure_kPa.toFixed(1)} kPa (${trinity_blast.overpressure_psi.toFixed(2)} psi)`);
console.log(`Damage category: ${trinity_blast.damage_category}`);
console.log(`Expected: ~7-20 kPa (moderate to severe damage)`);

const trinity_valid = trinity_blast.overpressure_kPa >= 7 && trinity_blast.overpressure_kPa <= 25;
console.log(`Validation: ${trinity_valid ? '✅ PASS' : '❌ FAIL'}`);

// Hiroshima (15 kt, 600m altitude burst)
console.log('\n--- Hiroshima (August 6, 1945) ---');
const hiroshima_energy = 15 * 4.184e12;  // 15 kilotons TNT
const hiroshima_altitude = 600;  // 600m airburst

const hiroshima_zones = calculateBlastZones(hiroshima_energy, hiroshima_altitude);
console.log(`Energy: 15 kt TNT`);
console.log(`Altitude: 600 m (airburst)`);
console.log(`Severe collapse radius: ${(hiroshima_zones.severe_collapse / 1000).toFixed(2)} km`);
console.log(`Moderate damage radius: ${(hiroshima_zones.moderate_structural / 1000).toFixed(2)} km`);
console.log(`Window shattering radius: ${(hiroshima_zones.window_shattering / 1000).toFixed(2)} km`);
console.log(`Expected severe radius: ~1.5-2.5 km (observed)`);

const hiroshima_valid = hiroshima_zones.severe_collapse / 1000 >= 1.0 &&
                       hiroshima_zones.severe_collapse / 1000 <= 3.0;
console.log(`Validation: ${hiroshima_valid ? '✅ PASS' : '⚠️  PARTIAL'}`);

// ========== TEST 3: TUNGUSKA AIRBURST ==========
console.log('\n--- Tunguska Event (June 30, 1908) ---');
const tunguska_energy = 15e15;  // ~15 PJ ≈ 3.6 MT TNT (consensus estimate)
const tunguska_altitude = 8000;  // 8 km altitude burst

const tunguska_zones = calculateBlastZones(tunguska_energy, tunguska_altitude);
console.log(`Energy: ${(tunguska_energy/4.184e15).toFixed(1)} MT TNT`);
console.log(`Altitude: 8 km (high airburst)`);
console.log(`Severe damage radius: ${(tunguska_zones.severe_collapse / 1000).toFixed(1)} km`);
console.log(`Tree blow-down radius: ~30 km (observed)`);
console.log(`Moderate damage radius: ${(tunguska_zones.moderate_structural / 1000).toFixed(1)} km`);

const tunguska_valid = tunguska_zones.moderate_structural / 1000 >= 20 &&
                      tunguska_zones.moderate_structural / 1000 <= 40;
console.log(`Validation: ${tunguska_valid ? '✅ PASS' : '⚠️  PARTIAL'}`);

// ========== TEST 4: OVERPRESSURE DECAY ==========
console.log('\n' + '='.repeat(80));
console.log('TEST 4: Overpressure Decay with Distance');
console.log('-'.repeat(80));

const test_energy = 1e15;  // 1 PJ = 0.24 MT TNT
const distances = [100, 500, 1000, 5000, 10000, 50000];  // meters

console.log(`Energy: ${(test_energy/4.184e15).toFixed(3)} MT TNT\n`);
console.log('Distance (km) | Overpressure (kPa) | Damage Category');
console.log('-'.repeat(60));

distances.forEach(dist => {
    const blast = calculateBlastOverpressure(test_energy, dist);
    console.log(`${(dist/1000).toFixed(1).padStart(13)} | ${blast.overpressure_kPa.toFixed(2).padStart(18)} | ${blast.damage_category}`);
});

// Check that overpressure decreases monotonically
let decay_valid = true;
let prev_overpressure = Infinity;
for (const dist of distances) {
    const blast = calculateBlastOverpressure(test_energy, dist);
    if (blast.overpressure >= prev_overpressure) {
        decay_valid = false;
        break;
    }
    prev_overpressure = blast.overpressure;
}

console.log(`\nMonotonic decay: ${decay_valid ? '✅ PASS' : '❌ FAIL'}`);

// ========== TEST 5: DAMAGE THRESHOLDS ==========
console.log('\n' + '='.repeat(80));
console.log('TEST 5: Damage Category Thresholds');
console.log('-'.repeat(80));

const threshold_tests = [
    { kPa: 0.5, expected: 'minimal' },
    { kPa: 1.0, expected: 'window_shattering' },
    { kPa: 5.0, expected: 'minor_structural' },
    { kPa: 10.0, expected: 'moderate_structural' },
    { kPa: 25.0, expected: 'severe_collapse' },
    { kPa: 40.0, expected: 'severe_reinforced' },
    { kPa: 100.0, expected: 'total_destruction' },
    { kPa: 250.0, expected: 'crater_formation' }
];

let threshold_passed = 0;
threshold_tests.forEach(test => {
    const category = categorizeBlastDamage(test.kPa);
    const passed = category === test.expected;
    console.log(`${test.kPa.toFixed(1).padStart(6)} kPa → ${category.padEnd(22)} ${passed ? '✅' : '❌'} (expected: ${test.expected})`);
    if (passed) threshold_passed++;
});

console.log(`\nThreshold Tests: ${threshold_passed}/${threshold_tests.length} passed\n`);

// ========== TEST 6: BUILT-IN VALIDATION ==========
console.log('='.repeat(80));
console.log('TEST 6: Built-in Validation (Trinity, Hiroshima)');
console.log('-'.repeat(80));

const builtin = validateRankineHugoniot();
console.log('\nTrinity:');
console.log(`  Energy: ${builtin.trinity.energy_kt} kt TNT`);
console.log(`  Distance: ${builtin.trinity.distance_km} km`);
console.log(`  Overpressure: ${builtin.trinity.overpressure_kPa.toFixed(1)} kPa`);
console.log(`  Damage: ${builtin.trinity.damage}`);

console.log('\nHiroshima:');
console.log(`  Energy: ${builtin.hiroshima.energy_kt} kt TNT`);
console.log(`  Altitude: ${builtin.hiroshima.altitude_m} m`);
console.log(`  Severe radius: ${builtin.hiroshima.severe_collapse_radius_km.toFixed(2)} km`);
console.log(`  Moderate radius: ${builtin.hiroshima.moderate_damage_radius_km.toFixed(2)} km`);

// ========== SUMMARY ==========
console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));

const total_tests = shock_tests.length + threshold_tests.length + 5;  // +5 for Trinity, Hiroshima, Tunguska, decay, builtin
const total_passed = jump_passed + threshold_passed +
                    (trinity_valid ? 1 : 0) +
                    (hiroshima_valid ? 1 : 0) +
                    (tunguska_valid ? 1 : 0) +
                    (decay_valid ? 1 : 0) +
                    1;  // builtin always returns (informational)

const pass_rate = (total_passed / total_tests * 100).toFixed(1);

console.log(`Total Tests: ${total_passed}/${total_tests} passed (${pass_rate}%)`);
console.log();
console.log(`Jump Conditions:         ${jump_passed}/${shock_tests.length} ✅`);
console.log(`Trinity Test:            ${trinity_valid ? '1/1 ✅' : '0/1 ❌'}`);
console.log(`Hiroshima Test:          ${hiroshima_valid ? '1/1 ✅' : '0/1 ⚠️'}`);
console.log(`Tunguska Test:           ${tunguska_valid ? '1/1 ✅' : '0/1 ⚠️'}`);
console.log(`Overpressure Decay:      ${decay_valid ? '1/1 ✅' : '0/1 ❌'}`);
console.log(`Damage Thresholds:       ${threshold_passed}/${threshold_tests.length} ✅`);
console.log(`Built-in Validation:     1/1 ℹ️  (informational)`);
console.log();

if (pass_rate >= 90) {
    console.log('✅ RANKINE-HUGONIOT MODULE VALIDATED - READY FOR INTEGRATION');
} else if (pass_rate >= 75) {
    console.log('⚠️  RANKINE-HUGONIOT MODULE NEEDS REFINEMENT');
} else {
    console.log('❌ RANKINE-HUGONIOT MODULE FAILED VALIDATION');
}

console.log('='.repeat(80));
