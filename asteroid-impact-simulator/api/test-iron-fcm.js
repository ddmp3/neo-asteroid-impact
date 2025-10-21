// Test FCM V2 extension for ALL iron craters (not just <50m)
// Phase 1 v2.2.0-fcm-iron validation

const PhysicsEngine = require('./src/services/physicsEngine');

async function testIronCraters() {
    const engine = new PhysicsEngine();

    console.log('=== TEST FCM V2 EXTENDED TO ALL IRON CRATERS ===\n');

    // Test 1: Barringer (50m - at previous threshold)
    console.log('TEST 1: Barringer Crater (Arizona)');
    console.log('Parameters: 50m iron, 12.8 km/s, 80°, ρ=7870 kg/m³');
    console.log('Observed: 1200m');
    console.log('v2.1.0 Collins: 984m (-18%)');
    console.log('Expected FCM V2: ~1100-1200m (<10% error)\n');

    const barringerMass = engine.calculateMass(50, 7870);
    const barringerVel = engine.calculateImpactVelocity(12.8 * 1000, 80);
    const barringerEnergy = engine.calculateImpactEnergy(barringerMass, barringerVel, 80, 'iron', 50);
    const barringer = engine.calculateLandImpact(barringerEnergy, 80, 2500);

    console.log(`Result: ${barringer.crater.diameter.toFixed(0)}m`);
    console.log(`Error: ${((barringer.crater.diameter - 1200) / 1200 * 100).toFixed(1)}%`);
    console.log(`Physics Model: ${barringer.crater.physics_model || 'N/A'}`);
    console.log('---\n');

    // Test 2: Wolfe Creek (15m - should now use FCM V2)
    console.log('TEST 2: Wolfe Creek Crater (Australia)');
    console.log('Parameters: 15m iron, 17 km/s, 45°, ρ=7870 kg/m³');
    console.log('Observed: 892m');
    console.log('v2.1.0 Collins: 188m (-79% ❌)');
    console.log('Expected FCM V2: ~800-900m (<15% error)\n');

    const wolfe = await engine.calculateImpactEffects({
        diameter: 15,
        velocity: 17,
        angle: 45,
        composition: 'iron',
        impactLocation: { lat: -19.18, lon: 127.78 }
    });

    console.log(`Result: ${wolfe.crater.diameter.toFixed(0)}m`);
    console.log(`Error: ${((wolfe.crater.diameter - 892) / 892 * 100).toFixed(1)}%`);
    console.log(`Physics Model: ${wolfe.crater.physics_model || 'N/A'}`);
    console.log('---\n');

    // Test 3: Roter Kamm (30m - worst case in validation)
    console.log('TEST 3: Roter Kamm Crater (Namibia)');
    console.log('Parameters: 30m iron, 15 km/s, 45°, ρ=7870 kg/m³');
    console.log('Observed: 2500m');
    console.log('v2.1.0 Collins: 213m (-91% ❌ WORST CASE)');
    console.log('Expected FCM V2: ~2200-2500m (<15% error)\n');

    const roter = await engine.calculateImpactEffects({
        diameter: 30,
        velocity: 15,
        angle: 45,
        composition: 'iron',
        impactLocation: { lat: -27.766, lon: 16.75 }
    });

    console.log(`Result: ${roter.crater.diameter.toFixed(0)}m`);
    console.log(`Error: ${((roter.crater.diameter - 2500) / 2500 * 100).toFixed(1)}%`);
    console.log(`Physics Model: ${roter.crater.physics_model || 'N/A'}`);
    console.log('---\n');

    // Summary
    console.log('=== SUMMARY ===');
    const barringerError = Math.abs((barringer.crater.diameter - 1200) / 1200 * 100);
    const wolfeError = Math.abs((wolfe.crater.diameter - 892) / 892 * 100);
    const roterError = Math.abs((roter.crater.diameter - 2500) / 2500 * 100);
    const meanError = (barringerError + wolfeError + roterError) / 3;

    console.log(`Barringer: ${barringerError.toFixed(1)}%`);
    console.log(`Wolfe Creek: ${wolfeError.toFixed(1)}%`);
    console.log(`Roter Kamm: ${roterError.toFixed(1)}%`);
    console.log(`\nMean Absolute Error: ${meanError.toFixed(1)}%`);
    console.log(`\nExpected improvement: From 58.60% (v2.1.0 iron MAE) to <15%`);
    console.log(`Target achieved: ${meanError < 15 ? '✅ YES' : '❌ NO (needs tuning)'}`);

    process.exit(0);
}

testIronCraters().catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
});
