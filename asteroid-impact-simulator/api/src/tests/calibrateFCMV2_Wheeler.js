/**
 * FCM V2 - Wheeler 2017 Table 2 Calibration
 *
 * Test all 5 configurations from Wheeler Table 2 to find best match
 */

const { FragmentCloudModelV2 } = require('../services/fragmentCloudModelV2');

const CHELYABINSK_OBS = {
    altitude_km: 23,
    energy_MT: 0.50
};

const WHEELER_CONFIGS = {
    'Case A (baseline)': {
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
    },
    'Case B (weak)': {
        diameter: 19.8,
        velocity: 19160,
        angle: 18.3,
        density: 3300,
        strength: 1.0e6,  // Weaker
        alpha: 0.36,
        cloud_mass_fraction: 0.86,
        n_fragments: 4,
        fragment_mass_splits: [0.28, 0.26, 0.24, 0.22],
        sigma_ablation_fragment: 1e-8,
        sigma_ablation_cloud: 5e-9,
        C_disp: 3.5
    },
    'Case C (macro-porosity)': {
        diameter: 19.8,
        velocity: 19160,
        angle: 18.3,
        density: 2500,  // Lower density (macro-porosity ~24%)
        strength: 1.5e6,
        alpha: 0.38,  // Higher Weibull modulus
        cloud_mass_fraction: 0.86,
        n_fragments: 4,
        fragment_mass_splits: [0.28, 0.26, 0.24, 0.22],
        sigma_ablation_fragment: 1e-8,
        sigma_ablation_cloud: 5e-9,
        C_disp: 2.0  // Reduced dispersion
    },
    'Case D (fewer fragments)': {
        diameter: 19.8,
        velocity: 19160,
        angle: 18.3,
        density: 3300,
        strength: 1.5e6,
        alpha: 0.36,
        cloud_mass_fraction: 0.86,
        n_fragments: 2,  // Only 2 fragments
        fragment_mass_splits: [0.5, 0.5],
        sigma_ablation_fragment: 1e-8,
        sigma_ablation_cloud: 5e-9,
        C_disp: 3.5
    },
    'Case E (high ablation)': {
        diameter: 19.8,
        velocity: 19160,
        angle: 18.3,
        density: 3300,
        strength: 1.5e6,
        alpha: 0.36,
        cloud_mass_fraction: 0.86,
        n_fragments: 4,
        fragment_mass_splits: [0.28, 0.26, 0.24, 0.22],
        sigma_ablation_fragment: 2e-8,  // 2x higher
        sigma_ablation_cloud: 1e-8,  // 2x higher
        C_disp: 3.5
    }
};

async function testConfig(name, params) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`${name}`);
    console.log(`${'='.repeat(80)}`);

    const fcm = new FragmentCloudModelV2(params);
    const result = await fcm.integrate();

    const alt_error = Math.abs(result.peak_altitude_km - CHELYABINSK_OBS.altitude_km) / CHELYABINSK_OBS.altitude_km * 100;
    const energy_error = Math.abs(result.energy_deposited_MT - CHELYABINSK_OBS.energy_MT) / CHELYABINSK_OBS.energy_MT * 100;
    const total_error = (alt_error + energy_error) / 2;

    console.log(`\nRESULTS:`);
    console.log(`  Fragmentations:    ${result.fragmentation_count}`);
    console.log(`  Peak altitude:     ${result.peak_altitude_km.toFixed(1)} km (obs: ${CHELYABINSK_OBS.altitude_km} km, error: ${alt_error.toFixed(1)}%)`);
    console.log(`  Energy deposited:  ${result.energy_deposited_MT.toFixed(3)} MT (obs: ${CHELYABINSK_OBS.energy_MT} MT, error: ${energy_error.toFixed(1)}%)`);
    console.log(`  Energy conserved:  ${result.energy_conservation_error_pct.toFixed(2)}%`);
    console.log(`  Total error:       ${total_error.toFixed(1)}%`);

    return {
        name: name,
        alt_km: result.peak_altitude_km,
        energy_MT: result.energy_deposited_MT,
        alt_error: alt_error,
        energy_error: energy_error,
        total_error: total_error,
        conservation_error: result.energy_conservation_error_pct,
        fragmentations: result.fragmentation_count
    };
}

async function calibrateAll() {
    console.log(`${'═'.repeat(80)}`);
    console.log(`FCM V2 - WHEELER 2017 TABLE 2 CALIBRATION`);
    console.log(`${'═'.repeat(80)}`);
    console.log(`\nChelyabinsk observations:`);
    console.log(`  Peak altitude: ${CHELYABINSK_OBS.altitude_km} km`);
    console.log(`  Energy:        ${CHELYABINSK_OBS.energy_MT} MT`);

    const results = [];

    for (const [name, params] of Object.entries(WHEELER_CONFIGS)) {
        const result = await testConfig(name, params);
        results.push(result);
    }

    // Sort by total error
    results.sort((a, b) => a.total_error - b.total_error);

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`SUMMARY - RANKED BY ACCURACY`);
    console.log(`${'═'.repeat(80)}`);
    console.log(`\nConfig                         Alt(km)    Alt Err%     Energy(MT)   E Err%     Total Err%   Frags`);
    console.log('-'.repeat(105));

    for (const r of results) {
        const line = [
            r.name.padEnd(30),
            r.alt_km.toFixed(1).padStart(6),
            (r.alt_error.toFixed(1) + '%').padStart(10),
            r.energy_MT.toFixed(3).padStart(10),
            (r.energy_error.toFixed(1) + '%').padStart(8),
            (r.total_error.toFixed(1) + '%').padStart(10),
            r.fragmentations.toString().padStart(5)
        ].join('   ');
        console.log(line);
    }

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`BEST CONFIGURATION: ${results[0].name}`);
    console.log(`${'═'.repeat(80)}`);
    console.log(`  Altitude error:    ${results[0].alt_error.toFixed(1)}%`);
    console.log(`  Energy error:      ${results[0].energy_error.toFixed(1)}%`);
    console.log(`  Total error:       ${results[0].total_error.toFixed(1)}%`);
    console.log(`  Conservation:      ${results[0].conservation_error.toFixed(2)}%`);

    if (results[0].total_error < 20) {
        console.log(`\n✅ EXCELLENT MATCH (<20% error)`);
    } else if (results[0].total_error < 30) {
        console.log(`\n⚠️  ACCEPTABLE MATCH (20-30% error)`);
    } else {
        console.log(`\n❌ POOR MATCH (>30% error)`);
    }
}

if (require.main === module) {
    calibrateAll().catch(err => {
        console.error('Error:', err);
        console.error(err.stack);
        process.exit(1);
    });
}

module.exports = { calibrateAll };
