/**
 * PHASE 0 - FRAGMENTATION INTERPOLATION TEST
 * Test interpolated cases (between anchors)
 *
 * Tests the IDW (Inverse Distance Weighting) interpolation
 * on cases that are NOT exact anchor matches
 */

const AtmosphericFragmentation = require('./src/services/atmosphericFragmentation');

const frag = new AtmosphericFragmentation();

console.log('='.repeat(80));
console.log('PHASE 0: FRAGMENTATION INTERPOLATION TEST (v1.7.0)');
console.log('Testing IDW interpolation between anchor points');
console.log('='.repeat(80));
console.log();

const testCases = [
    {
        name: 'Mid-size rocky asteroid (between Chelyabinsk and Tunguska)',
        diameter: 35,           // m (between 20 and 50)
        velocity: 17000,        // m/s (between 19000 and 15000)
        angle: 30,              // degrees (between 18 and 45)
        composition: 'rocky',
        density: 3150,          // kg/m³ (between 3300 and 3000)
        expected_range: [8000, 23300], // Should be between Tunguska and Chelyabinsk
        note: 'Should interpolate between Chelyabinsk (23.3km) and Tunguska (8km)'
    },
    {
        name: 'Small rocky asteroid (near Chelyabinsk)',
        diameter: 22,           // m (near 20)
        velocity: 18500,        // m/s (near 19000)
        angle: 20,              // degrees (near 18)
        composition: 'rocky',
        density: 3250,          // kg/m³ (near 3300)
        expected_range: [20000, 25000], // Should be near Chelyabinsk
        note: 'Should be very close to Chelyabinsk altitude (23.3km)'
    },
    {
        name: 'Large rocky asteroid (near Tunguska)',
        diameter: 55,           // m (near 50)
        velocity: 14500,        // m/s (near 15000)
        angle: 50,              // degrees (near 45)
        composition: 'rocky',
        density: 2950,          // kg/m³ (near 3000)
        expected_range: [6000, 10000], // Should be near Tunguska
        note: 'Should be very close to Tunguska altitude (8km)'
    },
    {
        name: 'Iron asteroid with shallow angle',
        diameter: 55,           // m (near Barringer)
        velocity: 13000,        // m/s (near 12800)
        angle: 75,              // degrees (near 80)
        composition: 'iron',
        density: 7700,          // kg/m³ (near 7800)
        expected_range: [0, 2000], // Should reach ground or low altitude
        note: 'Should reach ground like Barringer (iron is strong)'
    },
    {
        name: 'Icy comet (weak material)',
        diameter: 40,           // m
        velocity: 20000,        // m/s (fast)
        angle: 35,              // degrees
        composition: 'icy',
        density: 1000,          // kg/m³ (ice)
        expected_range: [15000, 35000], // Icy = weak = high altitude fragmentation
        note: 'Icy comets are weak (0.1 MPa) - should fragment very high'
    }
];

console.log('INTERPOLATION TEST RESULTS:');
console.log('-'.repeat(80));

testCases.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   Params: D=${test.diameter}m, V=${test.velocity}m/s, θ=${test.angle}°, comp=${test.composition}`);
    console.log(`   Note: ${test.note}`);

    const result = frag.analyzeFragmentation(
        test.diameter,
        test.velocity,
        test.composition,
        test.density,
        test.angle
    );

    const calculated = result.altitude;
    const [min_expected, max_expected] = test.expected_range;
    const inRange = calculated >= min_expected && calculated <= max_expected;

    console.log(`   Calculated burst altitude: ${calculated.toFixed(0)} m (${(calculated/1000).toFixed(1)} km)`);
    console.log(`   Expected range: ${min_expected}-${max_expected} m`);
    console.log(`   Impact type: ${result.impactType}`);
    console.log(`   Crater formed: ${result.craterFormed ? 'YES' : 'NO'}`);
    console.log(`   Method: ${result.interpolationMethod}`);

    if (result.nearestAnchor) {
        console.log(`   Nearest anchor: ${result.nearestAnchor} (distance: ${result.distance?.toFixed(4)})`);
    }

    if (result.nearestAnchors) {
        console.log(`   Anchors used for interpolation:`);
        result.nearestAnchors.forEach(a => {
            console.log(`     - ${a.name}: weight=${(a.weight * 100).toFixed(1)}%, distance=${a.distance.toFixed(4)}`);
        });
    }

    console.log(`   Status: ${inRange ? '✅ PASS (in expected range)' : '⚠️  OUT OF RANGE'}`);
});

console.log();
console.log('='.repeat(80));
console.log('INTERPOLATION ANALYSIS:');
console.log('-'.repeat(80));
console.log('The interpolation method should:');
console.log('  1. Return EXACT values for anchor cases (0% error) ✅');
console.log('  2. Interpolate smoothly between anchors');
console.log('  3. Fall back to Hills-Goda for cases far from anchors');
console.log('  4. Handle all composition types (rocky, iron, icy)');
console.log();
console.log('✅ PHASE 0 INTERPOLATION TEST COMPLETE');
