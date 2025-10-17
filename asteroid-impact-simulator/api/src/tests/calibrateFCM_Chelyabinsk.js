/**
 * Calibration FCM sur Chelyabinsk - Wheeler 2017 Table 2
 *
 * Test des 5 configurations de Wheeler Table 2 pour trouver
 * le meilleur match avec les observations Chelyabinsk.
 *
 * Objectif: Match altitude + énergie à <10% erreur
 *
 * v1.7.4 - FCM Calibration
 */

const { FragmentCloudModel } = require('../services/fragmentCloudModel');

// Chelyabinsk observations (Brown et al. 2013, Popova et al. 2013)
const CHELYABINSK_OBSERVED = {
    altitude_fragmentation: 23000,  // meters (±2000m uncertainty)
    altitude_main_burst: 23000,     // meters
    energy_total: 0.50,             // MT (±0.1 MT uncertainty)
    energy_kinetic_initial: 0.57,   // MT (calculated from mass + velocity)
    diameter_estimated: 19.8,       // meters
    velocity: 19160,                // m/s
    angle: 18.3,                    // degrees
    density_meteorite: 3300,        // kg/m³ (LL5 chondrite fragments)
    mass_fallen: 5000               // kg (estimated total fragments)
};

// Wheeler 2017 Table 2 - Configurations testées pour Chelyabinsk
const WHEELER_CONFIGURATIONS = {
    'Case A': {
        name: 'Case A - 4 fragments, 3.3 g/cc',
        diameter: 19.8,
        density: 3300,
        velocity: 19160,
        angle: 18.3,
        strength: 1.5e6,
        alpha: 0.36,
        cloud_mass_fraction: 0.86,
        n_fragments: 4,
        fragment_mass_splits: [0.28, 0.26, 0.24, 0.22],
        sigma_ablation_fragment: 1e-8,
        sigma_ablation_cloud: 5e-9,
        C_disp: 3.5
    },
    'Case B': {
        name: 'Case B - 6 fragments, 3.3 g/cc',
        diameter: 19.8,
        density: 3300,
        velocity: 19160,
        angle: 18.3,
        strength: 1.6e6,
        alpha: 0.315,
        cloud_mass_fraction: 0.85,
        n_fragments: 6,
        fragment_mass_splits: [0.20, 0.18, 0.17, 0.16, 0.15, 0.14],
        sigma_ablation_fragment: 1e-8,
        sigma_ablation_cloud: 5e-9,
        C_disp: 3.5
    },
    'Case C': {
        name: 'Case C - 4 fragments, 2.5 g/cc (macro-porosity)',
        diameter: 19.8,
        density: 2500,  // LOWER density (macro-porosity ~24%)
        velocity: 19160,
        angle: 18.3,
        strength: 1.4e6,
        alpha: 0.38,
        cloud_mass_fraction: 0.84,
        n_fragments: 4,
        fragment_mass_splits: [0.28, 0.26, 0.24, 0.22],
        sigma_ablation_fragment: 1e-8,
        sigma_ablation_cloud: 5e-9,
        C_disp: 2.0  // REDUCED dispersion
    },
    'Case D': {
        name: 'Case D - 4 fragments, 18m diameter',
        diameter: 18.0,  // SMALLER diameter
        density: 3300,
        velocity: 19160,
        angle: 18.3,
        strength: 1.4e6,
        alpha: 0.385,
        cloud_mass_fraction: 0.84,
        n_fragments: 4,
        fragment_mass_splits: [0.28, 0.26, 0.24, 0.22],
        sigma_ablation_fragment: 1e-8,
        sigma_ablation_cloud: 7e-9,
        C_disp: 2.0
    },
    'Case E': {
        name: 'Case E - 4 fragments, 2.3 g/cc, 20m',
        diameter: 20.0,  // LARGER diameter
        density: 2300,   // LOWEST density (macro-porosity ~30%)
        velocity: 19160,
        angle: 18.3,
        strength: 1.3e6,
        alpha: 0.38,
        cloud_mass_fraction: 0.85,
        n_fragments: 4,
        fragment_mass_splits: [0.27, 0.26, 0.24, 0.23],
        sigma_ablation_fragment: 1e-8,
        sigma_ablation_cloud: 5e-9,
        C_disp: 1.5  // LOWEST dispersion
    }
};

async function testConfiguration(config) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST: ${config.name}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Paramètres:`);
    console.log(`  D=${config.diameter}m, ρ=${config.density} kg/m³`);
    console.log(`  σ₀=${(config.strength/1e6).toFixed(1)} MPa, α=${config.alpha}`);
    console.log(`  Cloud=${(config.cloud_mass_fraction*100).toFixed(0)}%, n_frag=${config.n_fragments}`);
    console.log(`  C_disp=${config.C_disp}, σ_ab_cloud=${config.sigma_ablation_cloud}`);

    const fcm = new FragmentCloudModel(config);
    const result = await fcm.integrate();

    // Calculate errors
    const altitude_error = Math.abs(result.peak_altitude_km*1000 - CHELYABINSK_OBSERVED.altitude_fragmentation)
                          / CHELYABINSK_OBSERVED.altitude_fragmentation * 100;

    const energy_error = Math.abs(result.total_energy_deposited_MT - CHELYABINSK_OBSERVED.energy_total)
                        / CHELYABINSK_OBSERVED.energy_total * 100;

    console.log(`\nRÉSULTATS:`);
    console.log(`  Fragmentations: ${result.fragmentation_count}`);
    console.log(`  Peak altitude: ${result.peak_altitude_km.toFixed(1)} km`);
    console.log(`  Total energy: ${result.total_energy_deposited_MT.toFixed(3)} MT`);
    console.log(`  Surviving mass: ${result.surviving_mass_kg.toFixed(0)} kg`);

    console.log(`\nCOMPARAISON AVEC OBSERVATIONS:`);
    console.log(`  Altitude observée: ${CHELYABINSK_OBSERVED.altitude_fragmentation/1000} km ± 2 km`);
    console.log(`  Altitude modèle:   ${result.peak_altitude_km.toFixed(1)} km`);
    console.log(`  Erreur altitude:   ${altitude_error.toFixed(1)}%`);

    console.log(`  Énergie observée:  ${CHELYABINSK_OBSERVED.energy_total} MT ± 0.1 MT`);
    console.log(`  Énergie modèle:    ${result.total_energy_deposited_MT.toFixed(3)} MT`);
    console.log(`  Erreur énergie:    ${energy_error.toFixed(1)}%`);

    console.log(`  Masse tombée obs:  ${CHELYABINSK_OBSERVED.mass_fallen} kg`);
    console.log(`  Masse tombée mod:  ${result.surviving_mass_kg.toFixed(0)} kg`);

    // Score
    const score = altitude_error + energy_error;
    let verdict = '';
    if (altitude_error < 10 && energy_error < 10) {
        verdict = '✅ EXCELLENT (<10% erreur sur les deux)';
    } else if (altitude_error < 20 && energy_error < 20) {
        verdict = '✅ TRÈS BON (<20% erreur)';
    } else if (altitude_error < 30 && energy_error < 30) {
        verdict = '⚠️  ACCEPTABLE (<30% erreur)';
    } else {
        verdict = '❌ INSUFFISANT (>30% erreur)';
    }

    console.log(`\nVERDICT: ${verdict}`);
    console.log(`Score total: ${score.toFixed(1)}% (plus bas = meilleur)`);

    return {
        config: config.name,
        altitude_km: result.peak_altitude_km,
        altitude_error_pct: altitude_error,
        energy_MT: result.total_energy_deposited_MT,
        energy_error_pct: energy_error,
        fragmentations: result.fragmentation_count,
        surviving_mass_kg: result.surviving_mass_kg,
        score: score,
        verdict: verdict,
        full_result: result
    };
}

async function runCalibration() {
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║           CALIBRATION FCM - Chelyabinsk (Wheeler 2017 Table 2)               ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('OBJECTIF: Trouver meilleure configuration FCM pour matcher Chelyabinsk');
    console.log('');
    console.log('OBSERVATIONS CIBLES:');
    console.log(`  Altitude fragmentation: ${CHELYABINSK_OBSERVED.altitude_fragmentation/1000} km ± 2 km`);
    console.log(`  Énergie totale: ${CHELYABINSK_OBSERVED.energy_total} MT ± 0.1 MT`);
    console.log(`  Masse fragments tombés: ${CHELYABINSK_OBSERVED.mass_fallen} kg`);
    console.log('');

    const results = [];

    for (const [key, config] of Object.entries(WHEELER_CONFIGURATIONS)) {
        const result = await testConfiguration(config);
        results.push(result);
    }

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('RÉSUMÉ CALIBRATION');
    console.log('═'.repeat(80));
    console.log('');

    // Sort by score
    results.sort((a, b) => a.score - b.score);

    console.log('Classement par score (erreur altitude + énergie):');
    console.log('─'.repeat(80));
    console.log('Rank  Config    Alt(km)  Alt Err  Energy(MT)  Enrg Err  Score  Verdict');
    console.log('─'.repeat(80));

    results.forEach((r, i) => {
        console.log(
            `${(i+1).toString().padStart(4)}  ` +
            `${r.config.padEnd(9)} ` +
            `${r.altitude_km.toFixed(1).padStart(7)} ` +
            `${r.altitude_error_pct.toFixed(0).padStart(8)}% ` +
            `${r.energy_MT.toFixed(3).padStart(11)} ` +
            `${r.energy_error_pct.toFixed(0).padStart(8)}% ` +
            `${r.score.toFixed(1).padStart(6)}% ` +
            `${r.verdict}`
        );
    });

    console.log('');
    console.log('═'.repeat(80));
    console.log('MEILLEURE CONFIGURATION');
    console.log('═'.repeat(80));
    console.log('');

    const best = results[0];
    console.log(`🏆 ${best.config}`);
    console.log('');
    console.log('Performances:');
    console.log(`  Altitude: ${best.altitude_km.toFixed(1)} km (erreur ${best.altitude_error_pct.toFixed(1)}%)`);
    console.log(`  Énergie: ${best.energy_MT.toFixed(3)} MT (erreur ${best.energy_error_pct.toFixed(1)}%)`);
    console.log(`  Fragmentations: ${best.fragmentations}`);
    console.log(`  Score: ${best.score.toFixed(1)}% (cumulatif)`);
    console.log('');

    const best_config = WHEELER_CONFIGURATIONS[best.config];
    console.log('Paramètres optimaux:');
    console.log(`  diameter: ${best_config.diameter} m`);
    console.log(`  density: ${best_config.density} kg/m³`);
    console.log(`  strength: ${(best_config.strength/1e6).toFixed(1)} MPa`);
    console.log(`  alpha: ${best_config.alpha}`);
    console.log(`  cloud_mass_fraction: ${(best_config.cloud_mass_fraction*100).toFixed(0)}%`);
    console.log(`  n_fragments: ${best_config.n_fragments}`);
    console.log(`  fragment_mass_splits: [${best_config.fragment_mass_splits.join(', ')}]`);
    console.log(`  C_disp: ${best_config.C_disp}`);
    console.log(`  sigma_ablation_cloud: ${best_config.sigma_ablation_cloud}`);
    console.log('');

    console.log('═'.repeat(80));
    console.log('INSIGHTS SCIENTIFIQUES');
    console.log('═'.repeat(80));
    console.log('');

    // Analyze patterns
    const low_density_configs = results.filter(r =>
        WHEELER_CONFIGURATIONS[r.config].density < 3000
    );
    const avg_score_low_density = low_density_configs.reduce((s, r) => s + r.score, 0) / low_density_configs.length;

    const high_density_configs = results.filter(r =>
        WHEELER_CONFIGURATIONS[r.config].density >= 3000
    );
    const avg_score_high_density = high_density_configs.reduce((s, r) => s + r.score, 0) / high_density_configs.length;

    console.log(`Macro-porosity (ρ < 3000 kg/m³): Score moyen ${avg_score_low_density.toFixed(1)}%`);
    console.log(`Dense (ρ ≥ 3000 kg/m³): Score moyen ${avg_score_high_density.toFixed(1)}%`);
    console.log('');

    if (avg_score_low_density < avg_score_high_density) {
        const porosity_pct = (1 - best_config.density / 3300) * 100;
        console.log(`✅ Macro-porosity améliore fit: ${porosity_pct.toFixed(0)}% voids dans structure`);
        console.log(`   → Cohérent avec rubble pile / fractured structure`);
    }

    console.log('');

    return {
        results: results,
        best_config: best_config,
        best_result: best
    };
}

// Run if called directly
if (require.main === module) {
    runCalibration().catch(error => {
        console.error('Fatal error:', error);
        console.error(error.stack);
        process.exit(1);
    });
}

module.exports = { runCalibration, WHEELER_CONFIGURATIONS, CHELYABINSK_OBSERVED };
