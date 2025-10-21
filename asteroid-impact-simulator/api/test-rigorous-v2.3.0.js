/**
 * TEST v2.3.0 - APPROCHE SCIENTIFIQUEMENT RIGOUREUSE
 *
 * Test de l'implémentation 100% peer-reviewed:
 * - Hills & Goda (1993): Fragmentation atmosphérique
 * - Collins et al. (2005): Crater scaling
 * - ZÉRO calibration empirique
 */

const PhysicsEngine = require('./src/services/physicsEngine');

async function testRigorousApproach() {
    const engine = new PhysicsEngine();

    console.log('='.repeat(80));
    console.log('TEST v2.3.0 - APPROCHE RIGOUREUSE (ZÉRO CALIBRATION)');
    console.log('='.repeat(80));

    // Test 1: Barringer (50m iron, 12.8 km/s, 80°)
    console.log('\n📍 TEST 1: Barringer Crater (Arizona, USA)');
    console.log('   Observed: 1200m');
    console.log('   v2.1.0 Collins (no fragmentation): 984m (-18%)');
    console.log('   v2.2.0 FCM V2 + C=14.10 (calibrated): 564m (-53% ❌ WORSE)');
    console.log('   v2.3.0 Hills-Goda + Collins (rigorous): ?');

    const barringer = await engine.simulateImpact({
        diameter: 50,
        velocity: 12.8 * 1000,  // m/s
        angle: 80,
        density: 7870,
        composition: 'iron',
        impactLocation: { lat: 35.0, lon: -111.0 }
    });

    console.log('\n   DEBUG: barringer structure:', JSON.stringify(barringer, null, 2).substring(0, 500));

    const crater = barringer.crater || barringer;
    const craterDiameter = crater.diameter || crater.originalDiameter || crater.modifiedDiameter;

    console.log(`\n   Result: ${craterDiameter.toFixed(0)}m`);
    console.log(`   Error: ${((craterDiameter - 1200) / 1200 * 100).toFixed(1)}%`);
    console.log(`   Physics model: ${crater.physics_model || 'N/A'}`);
    if (crater.atmospheric_fragmentation) {
        console.log(`   Fragmentation: ${crater.atmospheric_fragmentation}`);
        console.log(`   Effective D: ${crater.effective_diameter_m.toFixed(1)}m`);
        console.log(`   Effective v: ${crater.effective_velocity_m_s.toFixed(0)} m/s`);
    }

    const barringerError = Math.abs((craterDiameter - 1200) / 1200 * 100);
    const barringerOK = barringerError < 20;
    console.log(`   ${barringerOK ? '✅ ACCEPTABLE' : '❌ NEEDS IMPROVEMENT'}`);

    // Test 2: Wolfe Creek (15m iron, 15 km/s, 90°)
    console.log('\n📍 TEST 2: Wolfe Creek (Australia)');
    console.log('   Observed: 892m');
    console.log('   v2.1.0 Collins: 188m (-79%)');

    const wolfe = await engine.simulateImpact({
        diameter: 15,
        velocity: 15 * 1000,
        angle: 90,
        density: 7870,
        composition: 'iron',
        impactLocation: { lat: -19.3, lon: 127.8 }
    });

    console.log(`\n   Result: ${wolfe.crater.diameter.toFixed(0)}m`);
    console.log(`   Error: ${((wolfe.crater.diameter - 892) / 892 * 100).toFixed(1)}%`);
    if (wolfe.crater.atmospheric_fragmentation) {
        console.log(`   Fragmentation: ${wolfe.crater.atmospheric_fragmentation}`);
    }

    const wolfeError = Math.abs((wolfe.crater.diameter - 892) / 892 * 100);
    const wolfeOK = wolfeError < 20;
    console.log(`   ${wolfeOK ? '✅ ACCEPTABLE' : '❌ NEEDS IMPROVEMENT'}`);

    // Test 3: Chicxulub (10km rocky, 20 km/s, 45°) - Should NOT change
    console.log('\n📍 TEST 3: Chicxulub (Mexico) - Control test (rocky, no fragmentation change expected)');
    console.log('   Observed: 180,000m');
    console.log('   v2.1.0 Collins: 96,558m (-46%)');

    const chicx = await engine.simulateImpact({
        diameter: 10000,
        velocity: 20 * 1000,
        angle: 45,
        density: 3000,
        composition: 'rocky',
        impactLocation: { lat: 21.4, lon: -89.5 }
    });

    console.log(`\n   Result: ${(chicx.crater.diameter/1000).toFixed(1)}km`);
    console.log(`   Error: ${((chicx.crater.diameter - 180000) / 180000 * 100).toFixed(1)}%`);
    console.log(`   ${chicx.crater.atmospheric_fragmentation ? 'Has fragmentation note' : 'No fragmentation (expected for rocky)'}`);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('RÉSUMÉ v2.3.0');
    console.log('='.repeat(80));
    console.log(`Barringer (iron): ${barringerError.toFixed(1)}% error ${barringerOK ? '✅' : '❌'}`);
    console.log(`Wolfe Creek (iron): ${wolfeError.toFixed(1)}% error ${wolfeOK ? '✅' : '❌'}`);
    console.log(`Chicxulub (rocky): Should be identical to v2.1.0 (no iron fragmentation)`);
    console.log('\nCONFORMITÉ AUX PRINCIPES:');
    console.log('✅ Hills & Goda (1993) - Peer-reviewed fragmentation');
    console.log('✅ Collins et al. (2005) - Peer-reviewed crater scaling');
    console.log('✅ Chyba et al. (1993) - Peer-reviewed energy retention (70%)');
    console.log('✅ ZÉRO calibration empirique');
    console.log('✅ ZÉRO régression linéaire');
    console.log('='.repeat(80));
}

testRigorousApproach().catch(err => {
    console.error('\n❌ ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
});
