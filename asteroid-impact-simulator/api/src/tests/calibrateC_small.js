/**
 * Calibration C_small pour Petits Cratères/Fragments
 *
 * OBJECTIF: Calibrer constante C spécifique pour petits impacts (<200m crater)
 *
 * PHYSIQUE:
 * - Grands impacts (D_crater > 1km): Onde de choc, excavation flow → C_large
 * - Petits impacts (D_crater < 200m): Pénétration balistique → C_small
 *
 * CRITÈRE DE SÉLECTION DATABASE:
 * - Cratère 10m < D < 200m (regime balistique/transition)
 * - Composition: Principalement fer (objets cohésifs)
 * - Exclure: Grands cratères (>1km) optimisés pour C_large
 *
 * MÉTHODE:
 * - Bootstrap sur sous-ensemble petits cratères
 * - Même formule: D = C × D_imp × (ρ/ρ_t)^(1/3) × (v/v_ref)^(2/3) × sin^(1/3)(θ)
 * - Mais C_small ≠ C_large (deux régimes physiques)
 *
 * v1.7.10 - Calibration séparée petits vs grands impacts
 */

const {
    getAllCraters,
    trainTestSplit
} = require('../data/earthCraterDatabase.js');

// Physics constants (same as main calibration)
const PI = Math.PI;
const RHO_TARGET_DEFAULT = 2500;  // kg/m³
const V_REF = 15000;  // 15 km/s
const DEG_TO_RAD = Math.PI / 180;

/**
 * Filter craters for small crater calibration
 *
 * CRITÈRES:
 * - 10m < D_crater < 200m (petits cratères)
 * - Composition fer préférée (plus cohésif, mieux documenté)
 * - Paramètres impacteur complets
 */
function filterSmallCraters(craters) {
    return craters.filter(c => {
        if (!c.crater || !c.crater.diameter_m) return false;
        if (!c.impactor || !c.impactor.diameter_m) return false;
        if (!c.impactor.velocity_m_s || !c.impactor.angle_deg) return false;

        const D_crater = c.crater.diameter_m;

        // Petits cratères: 10m < D < 200m
        if (D_crater < 10 || D_crater > 200) return false;

        return true;
    });
}

/**
 * Calculate expected crater diameter
 */
function calculateExpectedCraterDiameter(impactor, C, rho_target = RHO_TARGET_DEFAULT) {
    const { diameter_m, velocity_m_s, angle_deg, density_kg_m3 } = impactor;

    const D_imp = diameter_m;
    const density_term = Math.pow(density_kg_m3 / rho_target, 1/3);
    const velocity_term = Math.pow(velocity_m_s / V_REF, 2/3);
    const angle_rad = angle_deg * DEG_TO_RAD;
    const angle_term = Math.pow(Math.sin(angle_rad), 1/3);

    return C * D_imp * density_term * velocity_term * angle_term;
}

/**
 * Calibrate C from crater set
 */
function calibrateC(craters) {
    const C_values = [];

    for (const crater of craters) {
        const D_obs = crater.crater.diameter_m;
        const { diameter_m, velocity_m_s, angle_deg, density_kg_m3 } = crater.impactor;

        const D_imp = diameter_m;
        const density_term = Math.pow(density_kg_m3 / RHO_TARGET_DEFAULT, 1/3);
        const velocity_term = Math.pow(velocity_m_s / V_REF, 2/3);
        const angle_rad = angle_deg * DEG_TO_RAD;
        const angle_term = Math.pow(Math.sin(angle_rad), 1/3);

        const C_i = D_obs / (D_imp * density_term * velocity_term * angle_term);
        C_values.push(C_i);
    }

    if (C_values.length === 0) return null;

    return C_values.reduce((a, b) => a + b, 0) / C_values.length;
}

/**
 * Bootstrap calibration
 */
function bootstrapCalibration(train_craters, N_bootstrap = 1000) {
    const C_bootstrap = [];

    for (let i = 0; i < N_bootstrap; i++) {
        // Resample with replacement
        const sample = [];
        let rng = 42 + i;
        for (let j = 0; j < train_craters.length; j++) {
            rng = (rng * 1103515245 + 12345) % 2147483648;
            const idx = rng % train_craters.length;
            sample.push(train_craters[idx]);
        }

        const C_i = calibrateC(sample);
        if (C_i !== null) {
            C_bootstrap.push(C_i);
        }
    }

    const C_mean = C_bootstrap.reduce((a, b) => a + b, 0) / C_bootstrap.length;
    const C_variance = C_bootstrap.reduce((sum, C_i) => sum + Math.pow(C_i - C_mean, 2), 0) / C_bootstrap.length;
    const C_std = Math.sqrt(C_variance);

    return {
        C_mean: C_mean,
        C_std: C_std,
        C_relative_uncertainty_pct: (C_std / C_mean) * 100,
        C_min: Math.min(...C_bootstrap),
        C_max: Math.max(...C_bootstrap),
        C_median: C_bootstrap.sort((a, b) => a - b)[Math.floor(C_bootstrap.length / 2)]
    };
}

/**
 * Validate on test set
 */
function validateC(test_craters, C) {
    const errors = [];
    const results = [];

    for (const crater of test_craters) {
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

    const MAE = errors.reduce((a, b) => a + b, 0) / errors.length;
    const RMSE = Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / errors.length);

    return {
        MAE: MAE,
        RMSE: RMSE,
        N_test: test_craters.length,
        results: results.sort((a, b) => a.error_pct - b.error_pct)
    };
}

/**
 * Main calibration
 */
async function runCalibration() {
    console.log('='.repeat(80));
    console.log('CALIBRATION C_SMALL - PETITS CRATÈRES (<200m)');
    console.log('='.repeat(80));
    console.log();

    // Get all craters
    const all_craters = getAllCraters();
    console.log(`Total database: ${all_craters.length} craters`);

    // Filter for small craters
    const small_craters = filterSmallCraters(all_craters);
    console.log(`Small craters (10-200m): ${small_craters.length} craters`);
    console.log();

    if (small_craters.length < 5) {
        console.error('❌ ERROR: Not enough small craters for calibration (need ≥5)');
        process.exit(1);
    }

    // List small craters
    console.log('SMALL CRATERS IDENTIFIED:');
    for (const c of small_craters) {
        console.log(`  - ${c.name}: D_crater=${c.crater.diameter_m}m, D_imp=${c.impactor.diameter_m}m, v=${(c.impactor.velocity_m_s/1000).toFixed(1)}km/s`);
    }
    console.log();

    // Train/test split (60/40)
    let rng = 42;
    const shuffled = [...small_craters];
    for (let i = shuffled.length - 1; i > 0; i--) {
        rng = (rng * 1103515245 + 12345) % 2147483648;
        const j = rng % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const train_size = Math.floor(small_craters.length * 0.6);
    const train = shuffled.slice(0, train_size);
    const test = shuffled.slice(train_size);

    console.log(`Train set: ${train.length} craters`);
    console.log(`Test set: ${test.length} craters`);
    console.log();

    // Point estimate
    console.log('POINT ESTIMATE CALIBRATION:');
    const C_point = calibrateC(train);
    console.log(`  C_small (point) = ${C_point.toFixed(2)}`);
    console.log();

    // Bootstrap
    console.log('BOOTSTRAP CALIBRATION (N=1000):');
    const bootstrap = bootstrapCalibration(train, 1000);
    console.log(`  C_small (mean) = ${bootstrap.C_mean.toFixed(2)}`);
    console.log(`  C_std = ${bootstrap.C_std.toFixed(2)}`);
    console.log(`  Uncertainty = ${bootstrap.C_relative_uncertainty_pct.toFixed(2)}%`);
    console.log(`  Range: [${bootstrap.C_min.toFixed(2)}, ${bootstrap.C_max.toFixed(2)}]`);
    console.log();

    // Validation
    console.log('VALIDATION ON TEST SET:');
    const validation = validateC(test, bootstrap.C_mean);
    console.log(`  MAE = ${validation.MAE.toFixed(2)}%`);
    console.log(`  RMSE = ${validation.RMSE.toFixed(2)}%`);
    console.log();

    console.log('TEST RESULTS (sorted by error):');
    for (const r of validation.results) {
        const status = r.error_pct < 30 ? '✅' : '❌';
        console.log(`  ${status} ${r.name}: ${r.D_obs}m obs, ${r.D_pred.toFixed(1)}m pred (${r.error_pct.toFixed(1)}% error)`);
    }
    console.log();

    // Compare with C_large
    const C_large = 14.10;  // From Phase 1.2 full database calibration
    console.log('COMPARISON WITH C_LARGE:');
    console.log(`  C_large (full database) = ${C_large.toFixed(2)}`);
    console.log(`  C_small (petits cratères) = ${bootstrap.C_mean.toFixed(2)}`);
    console.log(`  Ratio C_small / C_large = ${(bootstrap.C_mean / C_large).toFixed(2)}`);
    console.log();

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    console.log(`✅ C_small = ${bootstrap.C_mean.toFixed(2)} ± ${bootstrap.C_std.toFixed(2)}`);
    console.log(`✅ Uncertainty: ${bootstrap.C_relative_uncertainty_pct.toFixed(2)}%`);
    console.log(`✅ Test MAE: ${validation.MAE.toFixed(2)}%`);
    console.log(`✅ Calibrated on N=${small_craters.length} small craters`);

    if (validation.MAE < 30) {
        console.log(`✅ PASS: MAE < 30% (acceptable accuracy)`);
    } else {
        console.log(`⚠️  WARNING: MAE ≥ 30% (further refinement may be needed)`);
    }

    console.log();
    console.log('Calibration complete.');
    console.log('='.repeat(80));

    return {
        C_small: bootstrap.C_mean,
        C_std: bootstrap.C_std,
        uncertainty_pct: bootstrap.C_relative_uncertainty_pct,
        MAE: validation.MAE,
        N_craters: small_craters.length,
        test_results: validation.results
    };
}

// Run calibration
runCalibration().catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
});
