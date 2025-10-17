/**
 * FCM V2 - Extended Validation on ALL HIGH Confidence Airbursts
 *
 * Tests FCM V2 on all documented airbursts with instrumental data
 */

const { FragmentCloudModelV2 } = require('../services/fragmentCloudModelV2');
const { DOCUMENTED_IMPACTS } = require('../data/documentedImpacts');

// Wheeler Case C parameters (best fit for Chelyabinsk)
const CASE_C_TEMPLATE = {
    alpha: 0.38,
    cloud_mass_fraction: 0.86,
    n_fragments: 4,
    fragment_mass_splits: [0.28, 0.26, 0.24, 0.22],
    sigma_ablation_fragment: 1e-8,
    sigma_ablation_cloud: 5e-9,
    C_disp: 2.0
};

// Material strength by composition
const MATERIAL_STRENGTH = {
    'rocky': 1.5e6,        // 1.5 MPa (ordinary chondrite)
    'carbonaceous': 0.5e6, // 0.5 MPa (weak carbonaceous)
    'iron': 50e6,          // 50 MPa (strong iron)
    'icy': 0.1e6           // 0.1 MPa (very weak comet)
};

// Density adjustment for macro-porosity (Case C uses 2500 vs 3300)
const POROSITY_FACTOR = 2500 / 3300;  // ~0.76

function buildFCMParams(impact) {
    const params = impact.parameters;

    // Apply Case C porosity to density
    const density_adjusted = params.density.value * POROSITY_FACTOR;

    return {
        diameter: params.diameter.value,
        velocity: params.velocity.value,
        angle: params.angle.value,
        density: density_adjusted,  // Apply macro-porosity
        strength: MATERIAL_STRENGTH[params.composition] || 1.5e6,
        ...CASE_C_TEMPLATE
    };
}

async function validateImpact(impact) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`${impact.name} (${impact.date})`);
    console.log(`${'='.repeat(80)}`);

    console.log(`\nParameters:`);
    console.log(`  Diameter:     ${impact.parameters.diameter.value} m ${impact.parameters.diameter.uncertainty}`);
    console.log(`  Velocity:     ${impact.parameters.velocity.value} m/s ${impact.parameters.velocity.uncertainty}`);
    console.log(`  Angle:        ${impact.parameters.angle.value}° ${impact.parameters.angle.uncertainty}`);
    console.log(`  Density:      ${impact.parameters.density.value} kg/m³ ${impact.parameters.density.uncertainty}`);
    console.log(`  Composition:  ${impact.parameters.composition}`);

    console.log(`\nObservations:`);
    const obs_alt = impact.observed.altitude_fragmentation;
    const obs_energy = impact.observed.energy_total;

    if (!obs_alt) {
        console.log(`  ⚠️  No altitude data - GROUND IMPACT, skipping`);
        return null;
    }

    console.log(`  Altitude:     ${obs_alt.value/1000} km ${obs_alt.uncertainty}`);
    console.log(`  Energy:       ${obs_energy.value} ${obs_energy.unit} ${obs_energy.uncertainty}`);

    // Build FCM parameters
    const fcm_params = buildFCMParams(impact);
    console.log(`\nFCM V2 Parameters (Case C adjusted):`);
    console.log(`  Density (porosity): ${fcm_params.density.toFixed(0)} kg/m³ (${POROSITY_FACTOR.toFixed(2)}x)`);
    console.log(`  Strength:           ${(fcm_params.strength/1e6).toFixed(1)} MPa`);

    // Run FCM V2
    console.log(`\nRunning FCM V2...`);
    const fcm = new FragmentCloudModelV2(fcm_params);
    const result = await fcm.integrate();

    // Compare
    const alt_error = Math.abs(result.peak_altitude_km - obs_alt.value/1000) / (obs_alt.value/1000) * 100;
    const energy_error = Math.abs(result.energy_deposited_MT - obs_energy.value) / obs_energy.value * 100;
    const total_error = (alt_error + energy_error) / 2;

    console.log(`\nRESULTS:`);
    console.log(`  Fragmentations:    ${result.fragmentation_count}`);
    console.log(`  Peak altitude:     ${result.peak_altitude_km.toFixed(1)} km (obs: ${obs_alt.value/1000} km)`);
    console.log(`  Altitude error:    ${alt_error.toFixed(1)}%`);
    console.log(`  Energy deposited:  ${result.energy_deposited_MT.toFixed(3)} MT (obs: ${obs_energy.value} MT)`);
    console.log(`  Energy error:      ${energy_error.toFixed(1)}%`);
    console.log(`  Total error:       ${total_error.toFixed(1)}%`);
    console.log(`  Conservation:      ${result.energy_conservation_error_pct.toFixed(2)}%`);

    // Quality assessment
    let quality = '❌ POOR';
    if (total_error < 20) quality = '✅ EXCELLENT';
    else if (total_error < 30) quality = '⚠️  ACCEPTABLE';
    else if (total_error < 50) quality = '⚠️  MARGINAL';

    console.log(`  Quality:           ${quality}`);

    return {
        name: impact.name,
        confidence: impact.confidence,
        composition: impact.parameters.composition,
        obs_alt_km: obs_alt.value / 1000,
        obs_energy_MT: obs_energy.value,
        model_alt_km: result.peak_altitude_km,
        model_energy_MT: result.energy_deposited_MT,
        alt_error: alt_error,
        energy_error: energy_error,
        total_error: total_error,
        conservation_error: result.energy_conservation_error_pct,
        fragmentations: result.fragmentation_count,
        quality: quality
    };
}

async function validateAll() {
    console.log(`${'═'.repeat(80)}`);
    console.log(`FCM V2 - EXTENDED VALIDATION ON ALL HIGH CONFIDENCE AIRBURSTS`);
    console.log(`${'═'.repeat(80)}`);
    console.log(`\nUsing Wheeler Case C parameters (macro-porosity, best fit for Chelyabinsk)`);

    // Filter HIGH confidence airbursts only
    const airbursts = DOCUMENTED_IMPACTS.filter(i =>
        i.confidence === 'HIGH' &&
        i.observed.altitude_fragmentation !== null &&
        i.name !== 'Chelyabinsk (alternate params)'  // Skip duplicate
    );

    console.log(`\nFound ${airbursts.length} HIGH confidence airbursts:`);
    airbursts.forEach(i => console.log(`  - ${i.name} (${i.parameters.composition})`));

    const results = [];

    for (const impact of airbursts) {
        const result = await validateImpact(impact);
        if (result) results.push(result);
    }

    // Summary table
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`SUMMARY - ALL HIGH CONFIDENCE AIRBURSTS`);
    console.log(`${'═'.repeat(80)}`);

    console.log(`\nCase                      Comp    Obs Alt  Mod Alt  Alt Err%  Obs E(MT)  Mod E(MT)  E Err%  Total Err%  Qual`);
    console.log('-'.repeat(120));

    for (const r of results) {
        const line = [
            r.name.padEnd(24),
            r.composition.substring(0,4).padEnd(6),
            r.obs_alt_km.toFixed(1).padStart(6),
            r.model_alt_km.toFixed(1).padStart(7),
            (r.alt_error.toFixed(1) + '%').padStart(9),
            r.obs_energy_MT.toFixed(3).padStart(10),
            r.model_energy_MT.toFixed(3).padStart(10),
            (r.energy_error.toFixed(1) + '%').padStart(7),
            (r.total_error.toFixed(1) + '%').padStart(11),
            r.quality.padStart(4)
        ].join('  ');
        console.log(line);
    }

    // Statistics
    const avg_alt_error = results.reduce((sum, r) => sum + r.alt_error, 0) / results.length;
    const avg_energy_error = results.reduce((sum, r) => sum + r.energy_error, 0) / results.length;
    const avg_total_error = results.reduce((sum, r) => sum + r.total_error, 0) / results.length;
    const max_conservation_error = Math.max(...results.map(r => r.conservation_error));

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`STATISTICS`);
    console.log(`${'═'.repeat(80)}`);
    console.log(`  Cases tested:            ${results.length}`);
    console.log(`  Average altitude error:  ${avg_alt_error.toFixed(1)}%`);
    console.log(`  Average energy error:    ${avg_energy_error.toFixed(1)}%`);
    console.log(`  Average total error:     ${avg_total_error.toFixed(1)}%`);
    console.log(`  Max conservation error:  ${max_conservation_error.toFixed(2)}%`);

    const excellent = results.filter(r => r.total_error < 20).length;
    const acceptable = results.filter(r => r.total_error >= 20 && r.total_error < 30).length;
    const marginal = results.filter(r => r.total_error >= 30 && r.total_error < 50).length;
    const poor = results.filter(r => r.total_error >= 50).length;

    console.log(`\n  Quality breakdown:`);
    console.log(`    ✅ Excellent (<20%):   ${excellent}/${results.length} (${(excellent/results.length*100).toFixed(0)}%)`);
    console.log(`    ⚠️  Acceptable (20-30%): ${acceptable}/${results.length} (${(acceptable/results.length*100).toFixed(0)}%)`);
    console.log(`    ⚠️  Marginal (30-50%):   ${marginal}/${results.length} (${(marginal/results.length*100).toFixed(0)}%)`);
    console.log(`    ❌ Poor (>50%):         ${poor}/${results.length} (${(poor/results.length*100).toFixed(0)}%)`);

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`CONCLUSION`);
    console.log(`${'═'.repeat(80)}`);

    if (avg_total_error < 25) {
        console.log(`\n✅ FCM V2 (Case C) shows GOOD agreement with HIGH confidence observations`);
        console.log(`   Average error ${avg_total_error.toFixed(1)}% is acceptable for fundamental physics model`);
    } else if (avg_total_error < 35) {
        console.log(`\n⚠️  FCM V2 (Case C) shows MODERATE agreement with HIGH confidence observations`);
        console.log(`   Average error ${avg_total_error.toFixed(1)}% indicates model limitations or parameter uncertainties`);
    } else {
        console.log(`\n❌ FCM V2 (Case C) shows POOR agreement with HIGH confidence observations`);
        console.log(`   Average error ${avg_total_error.toFixed(1)}% - model may need recalibration`);
    }

    if (max_conservation_error > 1.0) {
        console.log(`\n⚠️  WARNING: Energy conservation error up to ${max_conservation_error.toFixed(2)}% detected`);
    } else {
        console.log(`\n✅ Energy conservation excellent (<1%) across all cases`);
    }

    console.log(`\nNote: Case C parameters (macro-porosity) were calibrated on Chelyabinsk.`);
    console.log(`      Other compositions (carbonaceous, iron) may need different parameters.`);
}

if (require.main === module) {
    validateAll().catch(err => {
        console.error('Error:', err);
        console.error(err.stack);
        process.exit(1);
    });
}

module.exports = { validateAll };
