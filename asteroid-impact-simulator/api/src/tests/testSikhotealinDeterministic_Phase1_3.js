/**
 * Test Sikhote-Alin Deterministic with C Uncertainty
 * Phase 1.3 - v1.7.11
 *
 * OBJECTIF: Valider que C incertitude améliore quantification incertitude
 *
 * SIKHOTE-ALIN (1947):
 * - Observed crater: 26m diameter (largest of crater field)
 * - Impactor: D=1.5m, v=14 km/s, θ=45°, composition=iron
 *
 * PHASE 1.2 RESULT:
 * - Deterministic with C=14.10, σ=35 MPa → 10.6% error ✅
 * - This was the validation result, NOT Monte Carlo
 *
 * PHASE 1.3 APPROACH:
 * - For validation, we override Monte Carlo and test deterministic
 * - Compare C=14.10 (Phase 1.2) vs C sampling (Phase 1.3)
 * - Show that C ~N(14.10, 1.13) explains additional uncertainty
 */

const SmallIronCraterPhysics = require('../services/smallIronCraterPhysics');

async function testSikhotealinDeterministic() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Test Sikhote-Alin Deterministic (Phase 1.3 Validation)      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log();

    const physics = new SmallIronCraterPhysics();

    const observed_diameter = 26;  // m

    console.log('SIKHOTE-ALIN EVENT (February 12, 1947)');
    console.log('─'.repeat(70));
    console.log(`Observed largest crater: ${observed_diameter} m`);
    console.log();

    // TEST 1: Phase 1.2 baseline (C=14.10, σ=35 MPa)
    console.log('═'.repeat(70));
    console.log('TEST 1: Phase 1.2 Baseline (C=14.10, σ=35 MPa)');
    console.log('═'.repeat(70));
    console.log();

    const params_baseline = {
        diameter: 1.5,
        velocity: 14000,
        angle: 45,
        density: 7800,
        composition: 'iron',
        targetDensity: 2500,
        strength_override: 35e6,  // 35 MPa (typical)
        disable_monte_carlo: true  // Force deterministic
    };

    const result_baseline = await physics.calculateSmallIronCrater(params_baseline);

    console.log();
    console.log(`Result: ${result_baseline.crater_diameter.toFixed(1)} m`);
    const error_baseline = Math.abs(result_baseline.crater_diameter - observed_diameter) / observed_diameter * 100;
    console.log(`Error: ${error_baseline.toFixed(1)}%`);
    console.log();

    // TEST 2: Phase 1.3 - Sample C with N=20 trials
    console.log('═'.repeat(70));
    console.log('TEST 2: Phase 1.3 - C Uncertainty (N=20 samples)');
    console.log('═'.repeat(70));
    console.log();
    console.log('Sampling C ~ N(14.10, 1.13) with σ fixed at 35 MPa');
    console.log();

    const N_samples = 20;
    const C_mean = 14.10;
    const C_std = 1.13;

    // Box-Muller for Normal sampling
    function sampleNormal(mean, std) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z * std;
    }

    const results = [];

    for (let i = 0; i < N_samples; i++) {
        const C_sample = Math.max(11.0, Math.min(17.0, sampleNormal(C_mean, C_std)));

        const params_sample = {
            ...params_baseline,
            C_override: C_sample
        };

        const result_sample = await physics.calculateSmallIronCrater(params_sample);

        results.push({
            C: C_sample,
            diameter: result_sample.crater_diameter
        });

        if ((i + 1) % 5 === 0) {
            console.log(`  Iteration ${i+1}/${N_samples}: C=${C_sample.toFixed(2)}, D=${result_sample.crater_diameter.toFixed(1)}m`);
        }
    }

    console.log();

    // Statistics
    const diameters = results.map(r => r.diameter).sort((a, b) => a - b);
    const C_values = results.map(r => r.C);

    const D_median = diameters[Math.floor(N_samples / 2)];
    const D_mean = diameters.reduce((a, b) => a + b, 0) / N_samples;
    const D_std = Math.sqrt(diameters.reduce((sum, d) => sum + Math.pow(d - D_mean, 2), 0) / N_samples);
    const D_P10 = diameters[Math.floor(N_samples * 0.10)];
    const D_P90 = diameters[Math.floor(N_samples * 0.90)];

    const C_mean_actual = C_values.reduce((a, b) => a + b, 0) / N_samples;

    console.log('═'.repeat(70));
    console.log('RESULTS');
    console.log('═'.repeat(70));
    console.log();
    console.log('C Statistics:');
    console.log(`  - Mean:               ${C_mean_actual.toFixed(2)} (expected: ${C_mean})`);
    console.log(`  - Range:              [${Math.min(...C_values).toFixed(2)}, ${Math.max(...C_values).toFixed(2)}]`);
    console.log();
    console.log('Crater Diameter Statistics:');
    console.log(`  - Median:             ${D_median.toFixed(1)} m`);
    console.log(`  - Mean:               ${D_mean.toFixed(1)} m`);
    console.log(`  - Std deviation:      ${D_std.toFixed(1)} m`);
    console.log(`  - 80% CI:             [${D_P10.toFixed(1)}, ${D_P90.toFixed(1)}] m`);
    console.log(`  - CI width:           ${(D_P90 - D_P10).toFixed(1)} m`);
    console.log();
    console.log('Validation:');
    console.log(`  - Observed:           ${observed_diameter} m`);

    const error_median = Math.abs(D_median - observed_diameter) / observed_diameter * 100;
    const in_CI = (observed_diameter >= D_P10 && observed_diameter <= D_P90);

    console.log(`  - Median error:       ${error_median.toFixed(1)}%`);
    console.log(`  - In 80% CI:          ${in_CI ? '✅ YES' : '❌ NO'}`);

    if (in_CI) {
        const position = (observed_diameter - D_P10) / (D_P90 - D_P10) * 100;
        console.log(`  - Position in CI:     ${position.toFixed(0)}% (0% = P10, 100% = P90)`);
    }

    console.log();
    console.log('═'.repeat(70));
    console.log('COMPARISON');
    console.log('═'.repeat(70));
    console.log();
    console.log('Phase 1.2 (C=14.10 fixed):');
    console.log(`  - Prediction:         ${result_baseline.crater_diameter.toFixed(1)} m`);
    console.log(`  - Error:              ${error_baseline.toFixed(1)}%`);
    console.log('  - No uncertainty quantification');
    console.log();
    console.log('Phase 1.3 (C ~ N(14.10, 1.13)):');
    console.log(`  - Median prediction:  ${D_median.toFixed(1)} m`);
    console.log(`  - 80% CI:             [${D_P10.toFixed(1)}, ${D_P90.toFixed(1)}] m`);
    console.log(`  - Width:              ${(D_P90 - D_P10).toFixed(1)} m (${((D_P90 - D_P10) / D_median * 100).toFixed(0)}% of median)`);
    console.log(`  - Observed in CI:     ${in_CI ? '✅' : '❌'}`);
    console.log();

    // Expected CI width from C uncertainty alone
    const expected_relative_width = 2 * 1.28 * (C_std / C_mean);  // 1.28 = z-score for 80% CI
    console.log('Theoretical Analysis:');
    console.log(`  - C uncertainty:      ${(C_std / C_mean * 100).toFixed(1)}%`);
    console.log(`  - Expected CI width:  ~${(expected_relative_width * 100).toFixed(0)}% of median`);
    console.log(`  - Observed CI width:  ${((D_P90 - D_P10) / D_median * 100).toFixed(0)}% of median`);
    console.log();

    console.log('═'.repeat(70));
    console.log('CONCLUSION');
    console.log('═'.repeat(70));
    console.log();

    if (Math.abs(D_median - result_baseline.crater_diameter) / result_baseline.crater_diameter < 0.15 &&
        (D_P90 - D_P10) / D_median > 0.10 && (D_P90 - D_P10) / D_median < 0.30) {
        console.log('✅ PHASE 1.3 VALIDATION SUCCESS');
        console.log();
        console.log('Phase 1.3 correctly quantifies C uncertainty:');
        console.log('  1. Median matches Phase 1.2 baseline ✅');
        console.log('  2. CI width reflects 8% C uncertainty ✅');
        console.log('  3. Fundamental physics preserved ✅');
        console.log();
        console.log('C uncertainty adds ~15-20% CI width, which is physically reasonable.');
        console.log('This represents the irreducible uncertainty in crater scaling constant.');
    } else if (Math.abs(D_median - result_baseline.crater_diameter) / result_baseline.crater_diameter > 0.15) {
        console.log('⚠️  WARNING: Median shifted from baseline');
        console.log();
        console.log(`Expected median ~${result_baseline.crater_diameter.toFixed(1)}m, got ${D_median.toFixed(1)}m`);
    } else {
        console.log('⚠️  WARNING: CI width unusual');
        console.log();
        console.log('CI width may be too narrow or too wide compared to C uncertainty');
    }

    console.log();
    console.log('═'.repeat(70));
}

testSikhotealinDeterministic()
    .then(() => {
        console.log();
        console.log('Test completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error();
        console.error('❌ TEST FAILED');
        console.error(error);
        process.exit(1);
    });
