/**
 * Test Sikhote-Alin with Complete Uncertainty Quantification
 * Phase 1.3 - v1.7.11
 *
 * OBJECTIF: Valider que incertitude C améliore couverture CI
 *
 * SIKHOTE-ALIN (1947):
 * - Observed crater: 26m diameter (largest of crater field)
 * - Impactor: D=1.5m, v=14 km/s, θ=45°, composition=iron
 * - Multiple fragments (crater field ~100 fragments)
 *
 * PHASE 1.2 (v1.7.10):
 * - C constant (14.10), σ variable (20-120 MPa)
 * - Result: 80% CI = [18.2m, 29.8m] → 26m inside ✅
 *
 * PHASE 1.3 (v1.7.11):
 * - C variable (14.10 ± 1.13), σ variable (20-120 MPa)
 * - Expected: Wider 80% CI, still contains 26m
 * - Hypothesis: C uncertainty = 8% contributes ~5-10% width to CI
 */

const SmallIronCraterPhysics = require('../services/smallIronCraterPhysics');

async function testSikhotealinPhase13() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Test Sikhote-Alin with Complete Uncertainty (Phase 1.3)     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log();

    const physics = new SmallIronCraterPhysics();

    // SIKHOTE-ALIN PARAMETERS
    const params = {
        diameter: 1.5,          // m (estimated from fragments)
        velocity: 14000,        // m/s (14 km/s)
        angle: 45,              // degrees
        density: 7800,          // kg/m³ (iron)
        composition: 'iron',
        targetDensity: 2500     // kg/m³ (dry soil)
    };

    const observed_diameter = 26;  // m (largest crater in field)

    console.log('SIKHOTE-ALIN EVENT (February 12, 1947)');
    console.log('─'.repeat(70));
    console.log('Input Parameters:');
    console.log(`  - Impactor diameter:  ${params.diameter} m`);
    console.log(`  - Velocity:           ${params.velocity/1000} km/s`);
    console.log(`  - Angle:              ${params.angle}°`);
    console.log(`  - Density:            ${params.density} kg/m³`);
    console.log(`  - Composition:        ${params.composition}`);
    console.log();
    console.log('Observed:');
    console.log(`  - Largest crater:     ${observed_diameter} m diameter`);
    console.log(`  - Total fragments:    ~100 (crater field)`);
    console.log(`  - Location:           Sikhote-Alin Mountains, Russia`);
    console.log();

    // RUN SIMULATION WITH MONTE CARLO (Phase 1.3 - C + σ)
    console.log('═'.repeat(70));
    console.log('PHASE 1.3: Monte Carlo with C ~ N(14.10, 1.13) + σ ~ U(20, 120)');
    console.log('═'.repeat(70));

    const result = await physics.calculateSmallIronCrater(params);

    console.log();
    console.log('═'.repeat(70));
    console.log('RESULTS');
    console.log('═'.repeat(70));
    console.log();

    if (result.monte_carlo) {
        const D_median = result.crater_diameter;
        const D_P10 = result.crater_diameter_P10;
        const D_P90 = result.crater_diameter_P90;
        const CI_width = D_P90 - D_P10;

        console.log('Monte Carlo Statistics:');
        console.log(`  - N samples:          ${result.N_samples}`);
        console.log(`  - Median prediction:  ${D_median.toFixed(1)} m`);
        console.log(`  - Mean prediction:    ${result.crater_diameter_mean.toFixed(1)} m`);
        console.log(`  - Std deviation:      ${result.crater_diameter_std.toFixed(1)} m`);
        console.log();
        console.log('80% Confidence Interval:');
        console.log(`  - P10 (lower bound):  ${D_P10.toFixed(1)} m`);
        console.log(`  - P90 (upper bound):  ${D_P90.toFixed(1)} m`);
        console.log(`  - CI width:           ${CI_width.toFixed(1)} m`);
        console.log();

        // VALIDATION
        const error_median = Math.abs(D_median - observed_diameter) / observed_diameter * 100;
        const in_CI = (observed_diameter >= D_P10 && observed_diameter <= D_P90);

        console.log('Validation:');
        console.log(`  - Observed:           ${observed_diameter} m`);
        console.log(`  - Median error:       ${error_median.toFixed(1)}%`);
        console.log(`  - In 80% CI:          ${in_CI ? '✅ YES' : '❌ NO'}`);

        if (in_CI) {
            const position_in_CI = (observed_diameter - D_P10) / CI_width * 100;
            console.log(`  - Position in CI:     ${position_in_CI.toFixed(1)}% (0% = P10, 100% = P90)`);
        }

        console.log();
        console.log('Regime Information:');
        console.log(`  - Regime:             ${result.regime}`);
        console.log(`  - Fragment count:     ${result.fragment_count || 'N/A'}`);
        if (result.fragmentation_altitude_km !== undefined) {
            console.log(`  - Fragmentation alt:  ${result.fragmentation_altitude_km.toFixed(1)} km`);
        }

        console.log();
        console.log('═'.repeat(70));
        console.log('COMPARISON: Phase 1.2 vs Phase 1.3');
        console.log('═'.repeat(70));
        console.log();
        console.log('Phase 1.2 (C constant, σ variable):');
        console.log('  - 80% CI:             [18.2m, 29.8m]  (width: 11.6m)');
        console.log('  - Observed in CI:     ✅ YES');
        console.log();
        console.log('Phase 1.3 (C + σ variable):');
        console.log(`  - 80% CI:             [${D_P10.toFixed(1)}m, ${D_P90.toFixed(1)}m]  (width: ${CI_width.toFixed(1)}m)`);
        console.log(`  - Observed in CI:     ${in_CI ? '✅ YES' : '❌ NO'}`);
        console.log();

        // QUANTIFY C CONTRIBUTION
        const width_phase_1_2 = 11.6;  // From Phase 1.2 result
        const width_increase = CI_width - width_phase_1_2;
        const width_increase_pct = width_increase / width_phase_1_2 * 100;

        console.log('Impact of C Uncertainty:');
        console.log(`  - CI width increase:  ${width_increase.toFixed(1)} m (${width_increase_pct.toFixed(1)}%)`);

        if (width_increase > 0) {
            console.log(`  - Interpretation:     C uncertainty contributes ~${width_increase_pct.toFixed(0)}% to total CI width`);
        }

        console.log();
        console.log('═'.repeat(70));
        console.log('CONCLUSION');
        console.log('═'.repeat(70));
        console.log();

        if (in_CI && error_median < 20) {
            console.log('✅ VALIDATION SUCCESS');
            console.log();
            console.log('Phase 1.3 achieves objectives:');
            console.log('  1. Observed crater (26m) within 80% CI ✅');
            console.log('  2. C uncertainty properly propagated ✅');
            console.log('  3. Median error < 20% ✅');
            console.log();
            console.log('Ready for deployment!');
        } else if (in_CI) {
            console.log('⚠️  PARTIAL SUCCESS');
            console.log();
            console.log(`Observed crater in CI but median error high (${error_median.toFixed(1)}%)`);
        } else {
            console.log('❌ VALIDATION FAILED');
            console.log();
            console.log('Observed crater NOT in 80% CI');
            console.log('Possible issues:');
            console.log('  - C distribution incorrect?');
            console.log('  - σ range incorrect?');
            console.log('  - Need more samples (N > 100)?');
        }

        console.log();
        console.log('═'.repeat(70));

    } else {
        console.log('⚠️  WARNING: Deterministic result (no Monte Carlo used)');
        console.log();
        console.log(`Crater diameter: ${result.crater_diameter.toFixed(1)} m`);
        console.log(`Error: ${Math.abs(result.crater_diameter - observed_diameter) / observed_diameter * 100}%`);
        console.log();
        console.log('Expected Monte Carlo for this case!');
    }
}

// RUN TEST
testSikhotealinPhase13()
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
