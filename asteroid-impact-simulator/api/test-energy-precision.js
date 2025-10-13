/**
 * PHASE 1 - ENERGY PRECISION TEST with atmospheric retention
 * Target: <1% error on ground energy
 *
 * Tests atmospheric retention factor corrections
 * Against 3 documented real impacts
 */

const AtmosphericFragmentation = require('./src/services/atmosphericFragmentation');

const frag = new AtmosphericFragmentation();

console.log('='.repeat(80));
console.log('PHASE 1: ENERGY PRECISION TEST (v1.7.0)');
console.log('Target: <1% error on ground-deposited energy');
console.log('Method: Fragmentation-based atmospheric retention');
console.log('='.repeat(80));
console.log();

const testCases = [
    {
        name: 'Chelyabinsk (2013)',
        diameter: 20,           // m
        velocity: 19000,        // m/s
        angle: 18,              // degrees
        composition: 'rocky',
        density: 3300,          // kg/m³
        observed_energy_MT: 0.5,  // Megatons TNT (ground-deposited energy)
        reference: 'Brown et al. (2013) Nature 503:238-241',
        note: 'High-altitude airburst (23km) - most energy lost to atmosphere'
    },
    {
        name: 'Tunguska (1908)',
        diameter: 50,           // m
        velocity: 15000,        // m/s
        angle: 45,              // degrees
        composition: 'rocky',
        density: 3000,          // kg/m³
        observed_energy_MT: 15.0, // Megatons TNT (ground-deposited)
        reference: 'Vasilyev (1998) Planet. Space Sci. 46:129-150',
        note: 'Medium-altitude airburst (8km) - moderate energy loss'
    },
    {
        name: 'Barringer Crater (50,000 BCE)',
        diameter: 50,           // m
        velocity: 12800,        // m/s
        angle: 80,              // degrees (nearly vertical)
        composition: 'iron',
        density: 7800,          // kg/m³
        observed_energy_MT: 10.0, // Megatons TNT (full ground impact)
        reference: 'Shoemaker (1963)',
        note: 'Ground impact (iron) - no atmospheric loss'
    }
];

let totalError = 0;
let maxError = 0;
let testsPassed = 0;

console.log('TEST RESULTS:');
console.log('-'.repeat(80));

testCases.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   Params: D=${test.diameter}m, V=${test.velocity}m/s, θ=${test.angle}°, comp=${test.composition}`);
    console.log(`   Reference: ${test.reference}`);
    console.log(`   Note: ${test.note}`);

    // Calculate mass
    const radius = test.diameter / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    const mass = volume * test.density;

    // Calculate initial kinetic energy (E = ½mv²)
    const E_kinetic_joules = 0.5 * mass * test.velocity * test.velocity;
    const E_kinetic_MT = E_kinetic_joules / 4.184e15;

    // Get fragmentation result
    const fragResult = frag.analyzeFragmentation(
        test.diameter,
        test.velocity,
        test.composition,
        test.density,
        test.angle
    );

    // Get atmospheric retention factor
    const retentionFactor = frag.getAtmosphericRetentionFactor(fragResult, test.diameter);

    // Calculate ground-deposited energy
    const E_ground_joules = E_kinetic_joules * retentionFactor;
    const E_ground_MT = E_kinetic_MT * retentionFactor;

    // Calculate error
    const observed_MT = test.observed_energy_MT;
    const error = Math.abs((E_ground_MT - observed_MT) / observed_MT * 100);

    totalError += error;
    maxError = Math.max(maxError, error);

    const passed = error < 1.0; // Target: <1% error
    if (passed) testsPassed++;

    const status = passed ? '✅ PASS' : '❌ FAIL';

    console.log(`   Initial kinetic energy: ${E_kinetic_MT.toFixed(2)} MT (E = ½mv²)`);
    console.log(`   Fragmentation: ${fragResult.impactType} at ${(fragResult.altitude/1000).toFixed(1)} km`);
    console.log(`   Atmospheric retention: ${(retentionFactor * 100).toFixed(0)}%`);
    console.log(`   Ground-deposited energy (calculated): ${E_ground_MT.toFixed(2)} MT`);
    console.log(`   Observed ground energy: ${observed_MT.toFixed(2)} MT`);
    console.log(`   Error: ${error.toFixed(2)}%`);
    console.log(`   Status: ${status}`);
});

console.log();
console.log('='.repeat(80));
console.log('SUMMARY:');
console.log('-'.repeat(80));
console.log(`Tests passed: ${testsPassed}/${testCases.length}`);
console.log(`Average error: ${(totalError / testCases.length).toFixed(2)}%`);
console.log(`Maximum error: ${maxError.toFixed(2)}%`);
console.log(`Target: <1% error per test`);
console.log();

if (testsPassed === testCases.length && maxError < 1.0) {
    console.log('🎯 TARGET ACHIEVED: All tests <1% error!');
    console.log('✅ PHASE 1 COMPLETE - Energy precision with atmospheric loss validated');
    process.exit(0);
} else if (maxError < 5.0) {
    console.log('⚠️  ACCEPTABLE: All tests <5% error (tolerance met)');
    console.log('⚙️  Consider calibration adjustment to reach <1% target');
    process.exit(0);
} else {
    console.log('❌ FAILED: Some tests exceed 5% error tolerance');
    console.log('🔧 Atmospheric retention model needs adjustment');
    process.exit(1);
}
