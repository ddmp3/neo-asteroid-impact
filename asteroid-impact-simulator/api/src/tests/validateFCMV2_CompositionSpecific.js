/**
 * FCM V2 - Validation avec Paramètres Spécifiques par Composition
 *
 * Utilise la base de données scientifique de propriétés de composition
 * pour calibrer FCM V2 selon le type d'astéroïde
 */

const { FragmentCloudModelV2 } = require('../services/fragmentCloudModelV2');
const { DOCUMENTED_IMPACTS } = require('../data/documentedImpacts');
const { COMPOSITION_PROPERTIES, getCompositionParams } = require('../data/compositionProperties');

function buildFCMParams(impact) {
    const params = impact.parameters;

    // Get composition-specific properties from scientific database
    const comp_props = getCompositionParams(params.composition, null);

    console.log(`\n  Using composition profile: ${comp_props.name}`);
    console.log(`  Scientific basis:`);
    console.log(`    Meteorite density: ${comp_props.density.meteorite} kg/m³`);
    console.log(`    Bulk density typical: ${comp_props.density.bulk_typical} kg/m³`);
    console.log(`    Bulk density range: ${comp_props.density.bulk_range[0]}-${comp_props.density.bulk_range[1]} kg/m³`);
    console.log(`    Tensile strength: ${(comp_props.strength.tensile/1e6).toFixed(1)} MPa`);
    console.log(`    Porosity: ${(comp_props.porosity.total*100).toFixed(0)}% (${comp_props.porosity.structure})`);

    // CRITICAL FIX: Use bulk density (with porosity), not observed meteorite density
    // Observed density (params.density.value) is often meteorite grain density WITHOUT porosity
    // We must use bulk_typical which accounts for macro+micro porosity
    const density = comp_props.density.bulk_typical;

    console.log(`  Applied density: ${density} kg/m³ (bulk with porosity-adjusted)`);
    console.log(`  Observed density: ${params.density.value} kg/m³ (grain, for reference)`);

    return {
        diameter: params.diameter.value,
        velocity: params.velocity.value,
        angle: params.angle.value,
        density: density,  // Use bulk_typical, NOT observed grain density
        strength: comp_props.strength.tensile,  // Use composition-specific strength
        ...comp_props.wheeler_params  // Use composition-specific Wheeler params
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

    // Build FCM parameters with composition-specific properties
    const fcm_params = buildFCMParams(impact);

    // Run FCM V2
    console.log(`\nRunning FCM V2 with composition-specific parameters...`);
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
    console.log(`  Energy deposited:  ${result.energy_deposited_MT.toFixed(4)} MT (obs: ${obs_energy.value} MT)`);
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
        quality: quality,
        strength_used: fcm_params.strength
    };
}

async function validateAll() {
    console.log(`${'═'.repeat(80)}`);
    console.log(`FCM V2 - VALIDATION WITH COMPOSITION-SPECIFIC PARAMETERS`);
    console.log(`${'═'.repeat(80)}`);
    console.log(`\nUsing scientific database of asteroid material properties`);
    console.log(`Sources: Pohl et al. (2020), Carry (2012), Grott et al. (2020), Wheeler (2017)`);

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
    console.log(`SUMMARY - COMPOSITION-SPECIFIC CALIBRATION`);
    console.log(`${'═'.repeat(80)}`);

    console.log(`\nCase                      Comp    Obs Alt  Mod Alt  Alt Err%  Obs E(MT)    Mod E(MT)    E Err%  Tot Err%  Qual`);
    console.log('-'.repeat(122));

    for (const r of results) {
        const line = [
            r.name.padEnd(24),
            r.composition.substring(0,4).padEnd(6),
            r.obs_alt_km.toFixed(1).padStart(6),
            r.model_alt_km.toFixed(1).padStart(7),
            (r.alt_error.toFixed(1) + '%').padStart(9),
            r.obs_energy_MT.toFixed(4).padStart(10),
            r.model_energy_MT.toFixed(4).padStart(10),
            (r.energy_error.toFixed(1) + '%').padStart(7),
            (r.total_error.toFixed(1) + '%').padStart(9),
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

    // Compare to Case C (single-parameter approach)
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`COMPARISON: Composition-Specific vs Generic Case C`);
    console.log(`${'═'.repeat(80)}`);
    console.log(`\nPrevious validation (Case C uniform): 20.3% average error`);
    console.log(`Current validation (composition-specific): ${avg_total_error.toFixed(1)}% average error`);

    const improvement = ((20.3 - avg_total_error) / 20.3 * 100);
    if (improvement > 0) {
        console.log(`Improvement: ${improvement.toFixed(1)}% reduction in error ✅`);
    } else {
        console.log(`Change: ${Math.abs(improvement).toFixed(1)}% ${improvement < 0 ? 'increase' : 'decrease'} in error`);
    }

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`CONCLUSION`);
    console.log(`${'═'.repeat(80)}`);

    if (avg_total_error < 20) {
        console.log(`\n✅ EXCELLENT: Composition-specific parameters show very good agreement`);
        console.log(`   Average error ${avg_total_error.toFixed(1)}% demonstrates fundamental physics validity`);
    } else if (avg_total_error < 25) {
        console.log(`\n✅ GOOD: Composition-specific parameters show good agreement`);
        console.log(`   Average error ${avg_total_error.toFixed(1)}% is acceptable for physics-based model`);
    } else if (avg_total_error < 35) {
        console.log(`\n⚠️  MODERATE: Composition-specific parameters show moderate agreement`);
        console.log(`   Average error ${avg_total_error.toFixed(1)}% indicates remaining uncertainties`);
    } else {
        console.log(`\n❌ POOR: Composition-specific parameters need refinement`);
        console.log(`   Average error ${avg_total_error.toFixed(1)}% suggests model limitations`);
    }

    if (max_conservation_error > 1.0) {
        console.log(`\n⚠️  WARNING: Energy conservation error up to ${max_conservation_error.toFixed(2)}%`);
    } else {
        console.log(`\n✅ Energy conservation excellent (<1%) across all cases`);
    }

    console.log(`\nComposition-specific calibration uses:`);
    console.log(`  • Scientific strength data (Pohl et al. 2020)`);
    console.log(`  • Measured densities (Carry 2012, Grott et al. 2020)`);
    console.log(`  • Porosity constraints (Britt et al. 2002)`);
    console.log(`  • NO curve fitting or empirical adjustments`);
}

if (require.main === module) {
    validateAll().catch(err => {
        console.error('Error:', err);
        console.error(err.stack);
        process.exit(1);
    });
}

module.exports = { validateAll };
