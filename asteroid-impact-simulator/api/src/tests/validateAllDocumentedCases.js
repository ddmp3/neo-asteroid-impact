/**
 * Validation Complète - TOUS les Cas Documentés
 *
 * Test du Fragment-Cloud Model sur TOUS les impacts documentés
 * du plus documenté (Chelyabinsk) au moins documenté (Vredefort).
 *
 * Pour cas peu documentés: Monte Carlo quantifie incertitudes
 *
 * v1.7.4 - Comprehensive validation
 */

const { FragmentCloudModel } = require('../services/fragmentCloudModel');
const { DOCUMENTED_IMPACTS, BY_CONFIDENCE } = require('../data/documentedImpacts');

async function testSingleCase(impact) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST: ${impact.name} (${impact.date})`);
    console.log(`Confidence: ${impact.confidence}`);
    console.log(`${'='.repeat(80)}`);

    const params = impact.parameters;

    // Run FCM
    const fcm = new FragmentCloudModel({
        diameter: params.diameter.value,
        velocity: params.velocity.value,
        angle: params.angle.value,
        density: params.density.value,
        composition: params.composition,
        quality: params.quality || 'consolidated',
        // FCM parameters (baseline)
        strength: 1.5e6,
        alpha: 0.35,
        cloud_mass_fraction: 0.85,
        n_fragments: 4
    });

    const result = await fcm.integrate();

    console.log(`\nRÉSULTATS:`);
    console.log(`  Fragmentations: ${result.fragmentation_count}`);
    console.log(`  Peak altitude: ${result.peak_altitude_km.toFixed(1)} km`);
    console.log(`  Peak energy rate: ${result.peak_energy_deposition_kT_per_km.toFixed(1)} kT/km`);
    console.log(`  Total energy: ${result.total_energy_deposited_MT.toFixed(3)} MT`);

    // Compare with observations
    if (impact.observed.altitude_fragmentation) {
        const obs_alt = impact.observed.altitude_fragmentation.value / 1000;
        const error_alt = Math.abs(result.peak_altitude_km - obs_alt) / obs_alt * 100;
        console.log(`\nCOMPARAISON ALTITUDE:`);
        console.log(`  Observé: ${obs_alt.toFixed(1)} km ± ${(impact.observed.altitude_fragmentation.uncertainty/1000).toFixed(1)} km`);
        console.log(`  Modèle:  ${result.peak_altitude_km.toFixed(1)} km`);
        console.log(`  Erreur:  ${error_alt.toFixed(0)}%`);
    }

    if (impact.observed.energy_total) {
        const obs_energy = impact.observed.energy_total.value;
        const error_energy = Math.abs(result.total_energy_deposited_MT - obs_energy) / obs_energy * 100;
        console.log(`\nCOMPARAISON ÉNERGIE:`);
        console.log(`  Observé: ${obs_energy.toFixed(2)} MT ± ${impact.observed.energy_total.uncertainty} MT`);
        console.log(`  Modèle:  ${result.total_energy_deposited_MT.toFixed(2)} MT`);
        console.log(`  Erreur:  ${error_energy.toFixed(0)}%`);
    }

    return {
        name: impact.name,
        confidence: impact.confidence,
        result: result,
        observed: impact.observed,
        parameters_uncertainty: extractUncertainty(impact.parameters)
    };
}

function extractUncertainty(parameters) {
    const uncertainties = {};
    for (const [key, value] of Object.entries(parameters)) {
        if (value.uncertainty) {
            uncertainties[key] = value.uncertainty;
        }
    }
    return uncertainties;
}

async function runComprehensiveValidation() {
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║       VALIDATION COMPLÈTE - Fragment-Cloud Model sur TOUS les cas            ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('APPROCHE:');
    console.log('  - HIGH confidence: Validation directe (mesures instrumentales)');
    console.log('  - MEDIUM confidence: Validation avec ranges d\'incertitude');
    console.log('  - LOW/VERY_LOW: Monte Carlo pour quantifier incertitudes');
    console.log('');

    const results = {
        HIGH: [],
        MEDIUM: [],
        LOW: [],
        VERY_LOW: []
    };

    // Test HIGH confidence cases (instrumental data)
    console.log('\n' + '═'.repeat(80));
    console.log('HIGH CONFIDENCE CASES (Instrumental Measurements)');
    console.log('═'.repeat(80));

    for (const impact of BY_CONFIDENCE.HIGH) {
        // Skip alternate parameter sets for now
        if (impact.name.includes('alternate')) continue;

        const result = await testSingleCase(impact);
        results.HIGH.push(result);
    }

    // Test MEDIUM confidence cases
    console.log('\n' + '═'.repeat(80));
    console.log('MEDIUM CONFIDENCE CASES (Visual Observations)');
    console.log('═'.repeat(80));

    for (const impact of BY_CONFIDENCE.MEDIUM) {
        const result = await testSingleCase(impact);
        results.MEDIUM.push(result);
    }

    // LOW/VERY_LOW will use Monte Carlo (implemented later)
    console.log('\n' + '═'.repeat(80));
    console.log('LOW/VERY_LOW CONFIDENCE CASES');
    console.log('═'.repeat(80));
    console.log('→ Ces cas nécessitent Monte Carlo (paramètres très incertains)');
    console.log('→ Implémentation en cours...');

    // Generate summary
    console.log('\n' + '═'.repeat(80));
    console.log('RÉSUMÉ VALIDATION');
    console.log('═'.repeat(80));
    console.log('');

    // HIGH confidence summary
    console.log('HIGH CONFIDENCE (Meilleure qualité données):');
    console.log(`  Cas testés: ${results.HIGH.length}`);
    const high_avg_error_alt = results.HIGH
        .filter(r => r.observed.altitude_fragmentation)
        .reduce((sum, r) => {
            const obs = r.observed.altitude_fragmentation.value / 1000;
            const model = r.result.peak_altitude_km;
            return sum + Math.abs(model - obs) / obs * 100;
        }, 0) / results.HIGH.filter(r => r.observed.altitude_fragmentation).length;

    const high_avg_error_energy = results.HIGH
        .filter(r => r.observed.energy_total)
        .reduce((sum, r) => {
            const obs = r.observed.energy_total.value;
            const model = r.result.total_energy_deposited_MT;
            return sum + Math.abs(model - obs) / obs * 100;
        }, 0) / results.HIGH.filter(r => r.observed.energy_total).length;

    console.log(`  Erreur moyenne altitude: ${high_avg_error_alt.toFixed(0)}%`);
    console.log(`  Erreur moyenne énergie: ${high_avg_error_energy.toFixed(0)}%`);
    console.log('');

    // MEDIUM confidence summary
    console.log('MEDIUM CONFIDENCE (Observations visuelles):');
    console.log(`  Cas testés: ${results.MEDIUM.length}`);
    const medium_avg_error_alt = results.MEDIUM
        .filter(r => r.observed.altitude_fragmentation)
        .reduce((sum, r) => {
            const obs = r.observed.altitude_fragmentation.value / 1000;
            const model = r.result.peak_altitude_km;
            return sum + Math.abs(model - obs) / obs * 100;
        }, 0) / results.MEDIUM.filter(r => r.observed.altitude_fragmentation).length;

    console.log(`  Erreur moyenne altitude: ${medium_avg_error_alt.toFixed(0)}%`);
    console.log('  Note: Incertitudes observationnelles ±30-50%');
    console.log('');

    // Recommendations
    console.log('═'.repeat(80));
    console.log('RECOMMANDATIONS CALIBRATION:');
    console.log('═'.repeat(80));
    console.log('');

    if (high_avg_error_energy < 20) {
        console.log('✅ ÉNERGIE: Excellente (<20% erreur) - Pas d\'ajustement nécessaire');
    } else {
        console.log(`⚠️  ÉNERGIE: ${high_avg_error_energy.toFixed(0)}% erreur - Ajuster paramètres FCM`);
    }

    if (high_avg_error_alt < 30) {
        console.log('✅ ALTITUDE: Acceptable (<30% erreur) pour cas documentés');
    } else {
        console.log(`❌ ALTITUDE: ${high_avg_error_alt.toFixed(0)}% erreur - Biais systématique détecté`);
        console.log('   → Tester paramètres: C_disp, σ_ablation_cloud, α');
    }

    console.log('');

    return results;
}

// Run if called directly
if (require.main === module) {
    runComprehensiveValidation().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runComprehensiveValidation, testSingleCase };
