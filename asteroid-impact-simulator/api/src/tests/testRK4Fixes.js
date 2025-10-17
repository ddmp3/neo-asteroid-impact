/**
 * Test RK4 Corrections - v1.7.1
 * Vérifie les 3 bugs corrigés:
 * 1. Conservation d'énergie (E_ablation ajoutée)
 * 2. Énergie cinétique à fragmentation pour airbursts
 * 3. Coefficients C_h réduits (moins d'ablation)
 */

const AtmosphericTrajectory = require('../services/atmosphericTrajectory');

async function testChelyabinsk() {
    const traj = new AtmosphericTrajectory();

    console.log('='.repeat(80));
    console.log('CHELYABINSK 2013 - Test RK4 avec corrections');
    console.log('Attendu: 0.50 MT, altitude 23 km, airburst');
    console.log('='.repeat(80));

    const result = await traj.integrateTrajectory({
        diameter: 19,
        velocity: 19000,
        angle: 18,
        density: 3300,
        composition: 'rocky'
    });

    console.log('\n📊 Résultats:');
    console.log('  Énergie initiale:', result.summary.energy_initial_MT.toFixed(3), 'MT (attendu: 0.50 MT)');
    console.log('  Énergie à fragmentation:', result.summary.energy_kinetic_fragmentation_MT.toFixed(3), 'MT');
    console.log('  Altitude fragmentation:', (result.summary.altitude_fragmentation/1000).toFixed(1), 'km (attendu: 23 km)');
    console.log('  Type impact:', result.summary.impact_type, '(attendu: airburst)');

    console.log('\n🔬 Conservation d\'énergie:');
    console.log('  E_initial:', result.summary.energy_initial_MT.toFixed(3), 'MT');
    console.log('  E_final:', result.summary.energy_final_MT.toFixed(3), 'MT');
    console.log('  E_atmospheric:', result.summary.energy_atmospheric_MT.toFixed(3), 'MT');
    console.log('  E_ablation:', result.summary.energy_ablation_MT.toFixed(3), 'MT');
    console.log('  Conservation error:', result.summary.conservation_error_percent.toFixed(2), '%');

    const errorEnergy = ((result.summary.energy_kinetic_fragmentation_MT - 0.5) / 0.5 * 100);
    const errorAltitude = ((result.summary.altitude_fragmentation - 23000) / 23000 * 100);

    console.log('\n✅ Précision vs réalité:');
    console.log('  Erreur énergie:', errorEnergy.toFixed(1), '%');
    console.log('  Erreur altitude:', errorAltitude.toFixed(1), '%');

    return result;
}

async function testTunguska() {
    const traj = new AtmosphericTrajectory();

    console.log('\n' + '='.repeat(80));
    console.log('TUNGUSKA 1908 - Test RK4 avec corrections');
    console.log('Attendu: 15 MT, altitude 8.5 km, airburst');
    console.log('='.repeat(80));

    const result = await traj.integrateTrajectory({
        diameter: 60,
        velocity: 15000,
        angle: 45,
        density: 3000,
        composition: 'rocky'
    });

    console.log('\n📊 Résultats:');
    console.log('  Énergie initiale:', result.summary.energy_initial_MT.toFixed(3), 'MT (attendu: 15 MT)');
    console.log('  Énergie à fragmentation:', result.summary.energy_kinetic_fragmentation_MT.toFixed(3), 'MT');
    console.log('  Altitude fragmentation:', (result.summary.altitude_fragmentation/1000).toFixed(1), 'km (attendu: 8.5 km)');
    console.log('  Type impact:', result.summary.impact_type, '(attendu: airburst)');

    console.log('\n🔬 Conservation d\'énergie:');
    console.log('  E_initial:', result.summary.energy_initial_MT.toFixed(3), 'MT');
    console.log('  E_final:', result.summary.energy_final_MT.toFixed(3), 'MT');
    console.log('  E_atmospheric:', result.summary.energy_atmospheric_MT.toFixed(3), 'MT');
    console.log('  E_ablation:', result.summary.energy_ablation_MT.toFixed(3), 'MT');
    console.log('  Conservation error:', result.summary.conservation_error_percent.toFixed(2), '%');

    const errorEnergy = ((result.summary.energy_kinetic_fragmentation_MT - 15) / 15 * 100);
    const errorAltitude = ((result.summary.altitude_fragmentation - 8500) / 8500 * 100);

    console.log('\n✅ Précision vs réalité:');
    console.log('  Erreur énergie:', errorEnergy.toFixed(1), '%');
    console.log('  Erreur altitude:', errorAltitude.toFixed(1), '%');

    return result;
}

async function main() {
    console.log('\n' + '█'.repeat(80));
    console.log('TEST RK4 v1.7.1 - Corrections des bugs critiques');
    console.log('█'.repeat(80));

    try {
        await testChelyabinsk();
        await testTunguska();

        console.log('\n' + '█'.repeat(80));
        console.log('TESTS TERMINÉS');
        console.log('█'.repeat(80) + '\n');
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        console.error(error.stack);
    }
}

main();
