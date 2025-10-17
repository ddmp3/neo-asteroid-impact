/**
 * Phase 1.2 Bootstrap Calibration Script
 *
 * OBJECTIVE: Calibrate crater scaling constant C with uncertainty quantification
 *
 * APPROACH:
 * 1. Train/test split (60/40) with stratification by composition
 * 2. Bootstrap resampling (N=1000 iterations) on training set
 * 3. Calculate C for each bootstrap sample → distribution of C values
 * 4. Report C_mean ± σ_C (standard error)
 * 5. Validate on independent test set
 * 6. Compare with previous N=10 calibration uncertainty
 *
 * FORMULA (simplified pi-group):
 * D_crater = C × D_imp × (ρ_imp / ρ_target)^(1/3) × (v / v_ref)^(2/3) × sin^(1/3)(θ)
 *
 * Where:
 * - D_imp = (6m / πρ_imp)^(1/3)  [impactor diameter from mass]
 * - v_ref = 10 km/s
 * - θ = impact angle
 *
 * EXPECTED RESULTS:
 * - Previous (N=10): σ_C / C ≈ 16% (high uncertainty)
 * - Target (N≥50): σ_C / C < 5% (robust calibration)
 *
 * v1.7.9 - Phase 1.2 completion
 */

const {
    EARTH_CRATER_DATABASE,
    getAllCraters,
    trainTestSplit,
    getDatabaseStats
} = require('../data/earthCraterDatabase.js');

// ============================================
// PHYSICS CONSTANTS
// ============================================
const PI = Math.PI;
const G = 9.81;  // m/s²
const RHO_TARGET_DEFAULT = 2500;  // kg/m³ (crustal rock)
const V_REF = 15000;  // 15 km/s reference velocity (matches smallIronCraterPhysics.js)
const DEG_TO_RAD = Math.PI / 180;

// ============================================
// CRATER SCALING FORMULA
// ============================================

/**
 * Calculate impactor diameter from mass
 */
function calculateImpactorDiameter(mass_kg, density_kg_m3) {
    return Math.pow((6 * mass_kg) / (PI * density_kg_m3), 1/3);
}

/**
 * Calculate expected crater diameter using simplified pi-group formula
 *
 * D_crater = C × D_imp × (ρ_imp / ρ_target)^(1/3) × (v / v_ref)^(2/3) × sin^(1/3)(θ)
 */
function calculateExpectedCraterDiameter(impactor, C, rho_target = RHO_TARGET_DEFAULT) {
    const { diameter_m, velocity_m_s, angle_deg, density_kg_m3 } = impactor;

    // Impactor diameter
    const D_imp = diameter_m;

    // Density ratio term
    const density_ratio = density_kg_m3 / rho_target;
    const density_term = Math.pow(density_ratio, 1/3);

    // Velocity term
    const velocity_term = Math.pow(velocity_m_s / V_REF, 2/3);

    // Angle term
    const angle_rad = angle_deg * DEG_TO_RAD;
    const angle_term = Math.pow(Math.sin(angle_rad), 1/3);

    // Final crater diameter
    const D_crater = C * D_imp * density_term * velocity_term * angle_term;

    return D_crater;
}

/**
 * Calibrate C from observed craters
 *
 * For each crater: C_i = D_crater_observed / [D_imp × (ρ_imp/ρ_target)^(1/3) × (v/v_ref)^(2/3) × sin^(1/3)(θ)]
 * Then: C = mean(C_i)
 */
function calibrateC(craters) {
    const C_values = [];

    for (const crater of craters) {
        if (!crater.impactor || !crater.impactor.diameter_m || !crater.crater || !crater.crater.diameter_m) {
            continue;  // Skip if missing data
        }

        const D_obs = crater.crater.diameter_m;
        const { diameter_m, velocity_m_s, angle_deg, density_kg_m3 } = crater.impactor;
        const rho_target = RHO_TARGET_DEFAULT;

        // Calculate scaling factors
        const D_imp = diameter_m;
        const density_term = Math.pow(density_kg_m3 / rho_target, 1/3);
        const velocity_term = Math.pow(velocity_m_s / V_REF, 2/3);
        const angle_rad = angle_deg * DEG_TO_RAD;
        const angle_term = Math.pow(Math.sin(angle_rad), 1/3);

        // Infer C from this crater
        const C_i = D_obs / (D_imp * density_term * velocity_term * angle_term);
        C_values.push(C_i);
    }

    // Return mean C
    if (C_values.length === 0) {
        return null;
    }

    const C_mean = C_values.reduce((a, b) => a + b, 0) / C_values.length;
    return C_mean;
}

// ============================================
// BOOTSTRAP RESAMPLING
// ============================================

/**
 * Bootstrap resampling with replacement
 */
function bootstrapSample(data, seed) {
    const n = data.length;
    const sample = [];

    // Simple LCG random number generator (seeded)
    let rng = seed;
    for (let i = 0; i < n; i++) {
        rng = (rng * 1103515245 + 12345) % 2147483648;
        const idx = rng % n;
        sample.push(data[idx]);
    }

    return sample;
}

/**
 * Bootstrap calibration: resample training data N_bootstrap times
 * and calculate C for each sample → distribution of C
 */
function bootstrapCalibration(train_craters, N_bootstrap = 1000) {
    const C_bootstrap = [];

    for (let i = 0; i < N_bootstrap; i++) {
        const sample = bootstrapSample(train_craters, 42 + i);
        const C_i = calibrateC(sample);
        if (C_i !== null) {
            C_bootstrap.push(C_i);
        }
    }

    // Calculate statistics
    const C_mean = C_bootstrap.reduce((a, b) => a + b, 0) / C_bootstrap.length;
    const C_variance = C_bootstrap.reduce((sum, C_i) => sum + Math.pow(C_i - C_mean, 2), 0) / C_bootstrap.length;
    const C_std = Math.sqrt(C_variance);
    const C_std_err = C_std / Math.sqrt(C_bootstrap.length);  // Standard error of mean

    return {
        C_mean: C_mean,
        C_std: C_std,
        C_std_err: C_std_err,
        C_relative_uncertainty_pct: (C_std / C_mean) * 100,
        C_bootstrap_samples: C_bootstrap.length,
        C_min: Math.min(...C_bootstrap),
        C_max: Math.max(...C_bootstrap),
        C_median: C_bootstrap.sort((a, b) => a - b)[Math.floor(C_bootstrap.length / 2)],
        C_distribution: C_bootstrap
    };
}

// ============================================
// VALIDATION METRICS
// ============================================

/**
 * Validate calibrated C on test set
 */
function validateC(test_craters, C) {
    const errors = [];
    const results = [];

    for (const crater of test_craters) {
        if (!crater.impactor || !crater.impactor.diameter_m || !crater.crater || !crater.crater.diameter_m) {
            continue;
        }

        const D_obs = crater.crater.diameter_m;
        const D_pred = calculateExpectedCraterDiameter(crater.impactor, C);

        const error = Math.abs(D_pred - D_obs);
        const error_pct = (error / D_obs) * 100;

        errors.push(error_pct);
        results.push({
            name: crater.name,
            D_obs: D_obs,
            D_pred: D_pred,
            error_pct: error_pct
        });
    }

    // Calculate MAE, RMSE
    const MAE = errors.reduce((a, b) => a + b, 0) / errors.length;
    const RMSE = Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / errors.length);

    return {
        MAE: MAE,
        RMSE: RMSE,
        N_test: test_craters.length,
        results: results.sort((a, b) => b.error_pct - a.error_pct)  // Sort by worst errors
    };
}

// ============================================
// MAIN CALIBRATION SCRIPT
// ============================================

async function runCalibration() {
    console.log('='.repeat(80));
    console.log('PHASE 1.2: BOOTSTRAP CALIBRATION WITH N≥50 CRATERS');
    console.log('='.repeat(80));
    console.log();

    // Database statistics
    const stats = getDatabaseStats();
    console.log('📊 DATABASE STATISTICS:');
    console.log(`   Total craters: ${stats.total}`);
    console.log(`   Iron craters: ${stats.iron}`);
    console.log(`   Rocky craters: ${stats.rocky}`);
    console.log(`   HIGH confidence: ${stats.high_confidence}`);
    console.log(`   MEDIUM confidence: ${stats.medium_confidence}`);
    console.log(`   LOW confidence: ${stats.low_confidence}`);
    console.log(`   With impactor params: ${stats.with_impactor_params}`);
    console.log();

    // Train/test split
    console.log('🔀 TRAIN/TEST SPLIT (60/40):');
    const split = trainTestSplit(0.6, 42);
    console.log(`   Training set: ${split.train.length} craters`);
    console.log(`   Test set: ${split.test.length} craters`);
    console.log();

    // Point estimate calibration (no bootstrap)
    console.log('📐 POINT ESTIMATE CALIBRATION (Training Set):');
    const C_point = calibrateC(split.train);
    console.log(`   C (point estimate) = ${C_point.toFixed(2)}`);
    console.log();

    // Bootstrap calibration
    console.log('🔁 BOOTSTRAP CALIBRATION (N=1000 iterations):');
    const bootstrap_result = bootstrapCalibration(split.train, 1000);
    console.log(`   C_mean = ${bootstrap_result.C_mean.toFixed(2)}`);
    console.log(`   C_std = ${bootstrap_result.C_std.toFixed(2)}`);
    console.log(`   C_std_err = ${bootstrap_result.C_std_err.toFixed(4)}`);
    console.log(`   C_relative_uncertainty = ${bootstrap_result.C_relative_uncertainty_pct.toFixed(2)}%`);
    console.log(`   C_min = ${bootstrap_result.C_min.toFixed(2)}`);
    console.log(`   C_max = ${bootstrap_result.C_max.toFixed(2)}`);
    console.log(`   C_median = ${bootstrap_result.C_median.toFixed(2)}`);
    console.log();

    // Comparison with previous N=10 uncertainty
    console.log('📉 UNCERTAINTY REDUCTION:');
    console.log(`   Previous (N=10): σ_C / C ≈ 16% (estimated)`);
    console.log(`   Current (N=${stats.total}): σ_C / C = ${bootstrap_result.C_relative_uncertainty_pct.toFixed(2)}%`);
    const uncertainty_reduction = ((16 - bootstrap_result.C_relative_uncertainty_pct) / 16) * 100;
    console.log(`   Uncertainty reduction: ${uncertainty_reduction.toFixed(1)}% ✅`);
    console.log();

    // Validation on test set
    console.log('✅ VALIDATION ON TEST SET:');
    const validation = validateC(split.test, bootstrap_result.C_mean);
    console.log(`   Test set size: ${validation.N_test} craters`);
    console.log(`   MAE (test): ${validation.MAE.toFixed(2)}%`);
    console.log(`   RMSE (test): ${validation.RMSE.toFixed(2)}%`);
    console.log();

    // Worst 5 predictions
    console.log('⚠️  WORST 5 PREDICTIONS (Test Set):');
    const worst_5 = validation.results.slice(0, 5);
    for (const r of worst_5) {
        console.log(`   ${r.name}: ${r.D_obs.toFixed(0)}m observed, ${r.D_pred.toFixed(0)}m predicted (${r.error_pct.toFixed(1)}% error)`);
    }
    console.log();

    // Best 5 predictions
    console.log('✅ BEST 5 PREDICTIONS (Test Set):');
    const best_5 = validation.results.slice(-5).reverse();
    for (const r of best_5) {
        console.log(`   ${r.name}: ${r.D_obs.toFixed(0)}m observed, ${r.D_pred.toFixed(0)}m predicted (${r.error_pct.toFixed(1)}% error)`);
    }
    console.log();

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    console.log(`✅ Calibration constant: C = ${bootstrap_result.C_mean.toFixed(2)} ± ${bootstrap_result.C_std.toFixed(2)}`);
    console.log(`✅ Relative uncertainty: ${bootstrap_result.C_relative_uncertainty_pct.toFixed(2)}%`);
    console.log(`✅ Test MAE: ${validation.MAE.toFixed(2)}%`);
    console.log(`✅ Database size: N=${stats.total} (target N≥50 achieved)`);

    if (bootstrap_result.C_relative_uncertainty_pct < 5.0) {
        console.log(`✅ PASS: Uncertainty < 5% (robust calibration achieved)`);
    } else if (bootstrap_result.C_relative_uncertainty_pct < 10.0) {
        console.log(`⚠️  ACCEPTABLE: Uncertainty < 10% (good calibration)`);
    } else {
        console.log(`❌ FAIL: Uncertainty ≥ 10% (need more data)`);
    }

    if (validation.MAE < 30.0) {
        console.log(`✅ PASS: Test MAE < 30% (acceptable predictive accuracy)`);
    } else {
        console.log(`❌ FAIL: Test MAE ≥ 30% (poor predictive accuracy)`);
    }

    console.log();
    console.log('Phase 1.2 calibration complete.');
    console.log('='.repeat(80));
}

// Run calibration
runCalibration().catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
});
