/**
 * Test FCM V2 sur Chelyabinsk - Version Rigoureuse
 */

const { FragmentCloudModelV2 } = require('../services/fragmentCloudModelV2');

const CHELYABINSK = {
    name: 'Chelyabinsk 2013',
    observed: {
        altitude_km: 23,
        energy_MT: 0.50
    }
};

// Wheeler 2017 Table 2 - Case A (baseline)
const WHEELER_CASE_A = {
    diameter: 19.8,
    velocity: 19160,
    angle: 18.3,
    density: 3300,
    strength: 1.5e6,
    alpha: 0.36,
    cloud_mass_fraction: 0.86,
    n_fragments: 4,
    fragment_mass_splits: [0.28, 0.26, 0.24, 0.22],
    sigma_ablation_fragment: 1e-8,
    sigma_ablation_cloud: 5e-9,
    C_disp: 3.5
};

async function testChelyabinsk() {
    console.log('═'.repeat(80));
    console.log('TEST FCM V2 - Chelyabinsk (Wheeler Case A)');
    console.log('═'.repeat(80));
    console.log('');

    const fcm = new FragmentCloudModelV2(WHEELER_CASE_A);
    const result = await fcm.integrate();

    console.log('');
    console.log('═'.repeat(80));
    console.log('RÉSULTATS');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`Fragmentations: ${result.fragmentation_count}`);
    console.log(`Peak altitude: ${result.peak_altitude_km.toFixed(1)} km`);
    console.log(`Peak energy rate: ${result.peak_energy_deposition_kT_km.toFixed(2)} kT/km`);
    console.log('');
    console.log(`Energy initial: ${result.energy_initial_MT.toFixed(3)} MT`);
    console.log(`Energy deposited: ${result.energy_deposited_MT.toFixed(3)} MT`);
    console.log(`Energy final: ${result.energy_final_MT.toFixed(3)} MT`);
    console.log(`Conservation error: ${result.energy_conservation_error_pct.toFixed(2)}%`);
    console.log('');
    console.log(`Surviving mass: ${result.surviving_mass_kg.toFixed(0)} kg`);
    console.log('');

    // Compare with observations
    const alt_error = Math.abs(result.peak_altitude_km - CHELYABINSK.observed.altitude_km) / CHELYABINSK.observed.altitude_km * 100;
    const energy_error = Math.abs(result.energy_deposited_MT - CHELYABINSK.observed.energy_MT) / CHELYABINSK.observed.energy_MT * 100;

    console.log('═'.repeat(80));
    console.log('COMPARAISON AVEC OBSERVATIONS');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`Altitude observée: ${CHELYABINSK.observed.altitude_km} km`);
    console.log(`Altitude modèle:   ${result.peak_altitude_km.toFixed(1)} km`);
    console.log(`Erreur:            ${alt_error.toFixed(1)}%`);
    console.log('');
    console.log(`Énergie observée: ${CHELYABINSK.observed.energy_MT} MT`);
    console.log(`Énergie modèle:   ${result.energy_deposited_MT.toFixed(3)} MT`);
    console.log(`Erreur:           ${energy_error.toFixed(1)}%`);
    console.log('');

    // Verdict
    if (result.energy_conservation_error_pct > 10) {
        console.log('❌ CONSERVATION ÉNERGIE MAUVAISE (>10%)');
    } else if (result.energy_conservation_error_pct > 5) {
        console.log('⚠️  Conservation énergie acceptable (5-10%)');
    } else {
        console.log('✅ Conservation énergie excellente (<5%)');
    }

    if (alt_error < 20 && energy_error < 20) {
        console.log('✅ MATCH OBSERVATIONS EXCELLENT (<20%)');
    } else if (alt_error < 50 && energy_error < 50) {
        console.log('⚠️  Match observations acceptable');
    } else {
        console.log('❌ Match observations insuffisant');
    }

    return result;
}

if (require.main === module) {
    testChelyabinsk().catch(err => {
        console.error('Error:', err);
        console.error(err.stack);
        process.exit(1);
    });
}

module.exports = { testChelyabinsk };
