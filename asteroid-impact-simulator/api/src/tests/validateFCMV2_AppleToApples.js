/**
 * FCM V2 - Apple-to-Apple Comparison
 *
 * Test Case C vs Comp-Specific with IDENTICAL input parameters
 * to isolate the effect of composition-specific parameters alone
 */

const { FragmentCloudModelV2 } = require('../services/fragmentCloudModelV2');
const { COMPOSITION_PROPERTIES } = require('../data/compositionProperties');

// Wheeler Case C parameters (from v1.7.5 best result)
const WHEELER_CASE_C = {
    diameter: 19.8,
    velocity: 19160,
    angle: 18.3,
    density: 2500,           // WITH macro-porosity adjustment
    strength: 1.5e6,         // 1.5 MPa
    alpha: 0.36,
    cloud_mass_fraction: 0.86,
    n_fragments: 4,
    fragment_mass_splits: [0.28, 0.26, 0.24, 0.22],
    sigma_ablation_fragment: 1e-8,
    sigma_ablation_cloud: 5e-9,
    C_disp: 3.5
};

// Chelyabinsk observations
const OBS = {
    altitude_km: 23,
    energy_MT: 0.50
};

async function testConfig(name, params) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`${name}`);
    console.log(`${'='.repeat(80)}`);

    console.log(`\nParameters:`);
    console.log(`  Diameter:  ${params.diameter} m`);
    console.log(`  Velocity:  ${params.velocity} m/s`);
    console.log(`  Angle:     ${params.angle}°`);
    console.log(`  Density:   ${params.density} kg/m³`);
    console.log(`  Strength:  ${(params.strength/1e6).toFixed(1)} MPa`);
    console.log(`  Alpha:     ${params.alpha}`);
    console.log(`  C_disp:    ${params.C_disp}`);

    const fcm = new FragmentCloudModelV2(params);
    const result = await fcm.integrate();

    const alt_error = Math.abs(result.peak_altitude_km - OBS.altitude_km) / OBS.altitude_km * 100;
    const energy_error = Math.abs(result.energy_deposited_MT - OBS.energy_MT) / OBS.energy_MT * 100;
    const total_error = (alt_error + energy_error) / 2;

    console.log(`\nRESULTS:`);
    console.log(`  Fragmentations:    ${result.fragmentation_count}`);
    console.log(`  Peak altitude:     ${result.peak_altitude_km.toFixed(1)} km`);
    console.log(`  Altitude error:    ${alt_error.toFixed(1)}%`);
    console.log(`  Energy deposited:  ${result.energy_deposited_MT.toFixed(3)} MT`);
    console.log(`  Energy error:      ${energy_error.toFixed(1)}%`);
    console.log(`  Total error:       ${total_error.toFixed(1)}%`);
    console.log(`  Conservation:      ${result.energy_conservation_error_pct.toFixed(2)}%`);

    return {
        name: name,
        alt_km: result.peak_altitude_km,
        energy_MT: result.energy_deposited_MT,
        alt_error: alt_error,
        energy_error: energy_error,
        total_error: total_error,
        fragmentations: result.fragmentation_count,
        params: {
            diameter: params.diameter,
            velocity: params.velocity,
            density: params.density,
            strength: params.strength/1e6
        }
    };
}

async function appleToAppleComparison() {
    console.log(`${'═'.repeat(80)}`);
    console.log(`APPLE-TO-APPLE COMPARISON: Case C vs Composition-Specific`);
    console.log(`${'═'.repeat(80)}`);
    console.log(`\nChelyabinsk observations:`);
    console.log(`  Altitude: ${OBS.altitude_km} km`);
    console.log(`  Energy:   ${OBS.energy_MT} MT`);
    console.log(`\nGoal: Isolate effect of composition-specific parameters ONLY`);
    console.log(`      by using IDENTICAL input parameters (D, v, ρ, θ)`);

    const results = [];

    // Test 1: Wheeler Case C (original)
    results.push(await testConfig('Wheeler Case C (Original)', WHEELER_CASE_C));

    // Test 2: Comp-Specific with SAME inputs as Case C
    const comp_spec_same_inputs = {
        ...WHEELER_CASE_C,
        strength: 20e6,          // ONLY change strength (tensile OC)
        alpha: 0.38,             // Use S-type alpha
        C_disp: 2.0              // Use S-type C_disp
    };
    results.push(await testConfig('Comp-Specific (SAME inputs, only σ/α/C_disp changed)', comp_spec_same_inputs));

    // Test 3: Comp-Specific with porosity-adjusted density
    const s_type_props = COMPOSITION_PROPERTIES.S_TYPE_CONSOLIDATED;
    const comp_spec_porosity = {
        diameter: 19.8,
        velocity: 19160,
        angle: 18.3,
        density: s_type_props.density.bulk_typical,  // 2700 kg/m³ (with porosity)
        strength: s_type_props.strength.tensile,     // 20 MPa
        alpha: s_type_props.wheeler_params.alpha,
        cloud_mass_fraction: s_type_props.wheeler_params.cloud_mass_fraction,
        C_disp: s_type_props.wheeler_params.C_disp,
        sigma_ablation_fragment: s_type_props.wheeler_params.sigma_ablation_fragment,
        sigma_ablation_cloud: s_type_props.wheeler_params.sigma_ablation_cloud,
        n_fragments: 4,
        fragment_mass_splits: [0.28, 0.26, 0.24, 0.22]
    };
    results.push(await testConfig('Comp-Specific (S-type bulk density 2700 kg/m³)', comp_spec_porosity));

    // Summary
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`SUMMARY`);
    console.log(`${'═'.repeat(80)}`);

    console.log(`\nConfiguration                              Density   Strength   Alt(km)  Alt Err%  Energy(MT)  E Err%  Total Err%  Frags`);
    console.log('-'.repeat(130));

    for (const r of results) {
        const line = [
            r.name.padEnd(42),
            (r.params.density + 'kg/m³').padStart(8),
            (r.params.strength.toFixed(1) + 'MPa').padStart(9),
            r.alt_km.toFixed(1).padStart(7),
            (r.alt_error.toFixed(1) + '%').padStart(9),
            r.energy_MT.toFixed(3).padStart(10),
            (r.energy_error.toFixed(1) + '%').padStart(7),
            (r.total_error.toFixed(1) + '%').padStart(11),
            r.fragmentations.toString().padStart(5)
        ].join('  ');
        console.log(line);
    }

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`ANALYSIS`);
    console.log(`${'═'.repeat(80)}`);

    console.log(`\n1. Case C (original):`);
    console.log(`   - Density: 2500 kg/m³ (with macro-porosity)`);
    console.log(`   - Strength: 1.5 MPa`);
    console.log(`   - Error: ${results[0].total_error.toFixed(1)}%`);

    console.log(`\n2. Comp-Specific (same inputs, only σ/α/C_disp):`);
    console.log(`   - Density: 2500 kg/m³ (UNCHANGED)`);
    console.log(`   - Strength: 20 MPa (13x higher)`);
    console.log(`   - Error: ${results[1].total_error.toFixed(1)}%`);
    console.log(`   - Δ from Case C: ${(results[1].total_error - results[0].total_error).toFixed(1)} points`);

    if (results[1].total_error < results[0].total_error) {
        console.log(`   → ✅ IMPROVEMENT by higher strength alone!`);
    } else {
        console.log(`   → ❌ DEGRADATION from higher strength`);
    }

    console.log(`\n3. Comp-Specific (S-type bulk density 2700):`);
    console.log(`   - Density: 2700 kg/m³ (porosity-adjusted bulk)`);
    console.log(`   - Strength: 20 MPa`);
    console.log(`   - Error: ${results[2].total_error.toFixed(1)}%`);
    console.log(`   - Δ from Case C: ${(results[2].total_error - results[0].total_error).toFixed(1)} points`);

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`CONCLUSION`);
    console.log(`${'═'.repeat(80)}`);

    const best = results.reduce((min, r) => r.total_error < min.total_error ? r : min);
    console.log(`\nBest configuration: ${best.name}`);
    console.log(`Error: ${best.total_error.toFixed(1)}%`);

    if (best.name.includes('Comp-Specific')) {
        console.log(`\n✅ Composition-specific parameters ARE better (apple-to-apple)`);
    } else {
        console.log(`\n⚠️  Case C remains best (composition-specific not better apple-to-apple)`);
    }

    console.log(`\nNote: Previous v1.7.6 "improvement" (7.1%) used DIFFERENT input parameters`);
    console.log(`      (D=19m, v=19000, ρ=3300) which is NOT apple-to-apple comparison.`);
}

if (require.main === module) {
    appleToAppleComparison().catch(err => {
        console.error('Error:', err);
        console.error(err.stack);
        process.exit(1);
    });
}

module.exports = { appleToAppleComparison };
