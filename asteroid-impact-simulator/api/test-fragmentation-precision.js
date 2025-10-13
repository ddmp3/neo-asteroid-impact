/**
 * PHASE 0 - FRAGMENTATION PRECISION TEST
 * Target: <1% error on burst altitude
 *
 * Tests high-precision interpolation method (v1.7.0)
 * Against 3 documented real impacts
 */

const AtmosphericFragmentation = require('./src/services/atmosphericFragmentation');

const frag = new AtmosphericFragmentation();

console.log('='.repeat(80));
console.log('PHASE 0: FRAGMENTATION PRECISION TEST (v1.7.0)');
console.log('Target: <1% error on burst altitude');
console.log('Method: Multi-dimensional interpolation (IDW)');
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
        observed_altitude: 23300, // m (Brown et al. 2013)
        observed_type: 'high_altitude_airburst',
        reference: 'Brown et al. (2013) Nature 503:238-241'
    },
    {
        name: 'Tunguska (1908)',
        diameter: 50,           // m
        velocity: 15000,        // m/s
        angle: 45,              // degrees
        composition: 'rocky',
        density: 3000,          // kg/m³
        observed_altitude: 8000,  // m (Vasilyev 1998)
        observed_type: 'airburst',
        reference: 'Vasilyev (1998) Planet. Space Sci. 46:129-150'
    },
    {
        name: 'Barringer Crater (50,000 BCE)',
        diameter: 50,           // m
        velocity: 12800,        // m/s
        angle: 80,              // degrees (nearly vertical)
        composition: 'iron',
        density: 7800,          // kg/m³
        observed_altitude: 0,     // m (reaches ground)
        observed_type: 'ground',
        reference: 'Shoemaker (1963)'
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

    const result = frag.analyzeFragmentation(
        test.diameter,
        test.velocity,
        test.composition,
        test.density,
        test.angle
    );

    const calculated = result.altitude;
    const observed = test.observed_altitude;

    // Special case: both 0 (ground impact) = perfect match
    let error;
    if (observed === 0 && calculated === 0) {
        error = 0.0;
    } else if (observed === 0) {
        // Object should reach ground but didn't
        error = 100.0;
    } else {
        error = Math.abs((calculated - observed) / observed * 100);
    }

    totalError += error;
    maxError = Math.max(maxError, error);

    const passed = error < 1.0; // Target: <1% error
    if (passed) testsPassed++;

    const status = passed ? '✅ PASS' : '❌ FAIL';

    console.log(`   Observed burst altitude: ${observed} m`);
    console.log(`   Calculated burst altitude: ${calculated.toFixed(0)} m`);
    console.log(`   Error: ${error.toFixed(2)}%`);
    console.log(`   Impact type: ${result.impactType} (expected: ${test.observed_type})`);
    console.log(`   Method: ${result.interpolationMethod}`);
    if (result.nearestAnchor) {
        console.log(`   Nearest anchor: ${result.nearestAnchor} (distance: ${result.distance?.toFixed(4)})`);
    }
    if (result.nearestAnchors) {
        console.log(`   Anchors used: ${result.nearestAnchors.map(a => `${a.name} (w=${a.weight.toFixed(2)})`).join(', ')}`);
    }
    console.log(`   Status: ${status} (${error.toFixed(2)}% error)`);
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
    console.log('✅ PHASE 0 COMPLETE - Fragmentation precision validated');
    process.exit(0);
} else if (maxError < 5.0) {
    console.log('⚠️  ACCEPTABLE: All tests <5% error (tolerance met)');
    console.log('⚙️  Consider calibration adjustment to reach <1% target');
    process.exit(0);
} else {
    console.log('❌ FAILED: Some tests exceed 5% error tolerance');
    console.log('🔧 Interpolation method needs adjustment');
    process.exit(1);
}
