/**
 * Phase 1.2 Option B - Bootstrap Calibration for C_small (Small Fragments)
 *
 * OBJECTIF:
 * Calibrer séparément la constante C pour les PETITS FRAGMENTS (<5m)
 * post-fragmentation atmosphérique.
 *
 * JUSTIFICATION PHYSIQUE:
 * Les petits fragments (<5m) et grands impacts intacts (>50m) opèrent dans
 * des régimes balistiques différents:
 *
 * 1. GRANDS IMPACTS INTACTS (D > 50m):
 *    - Cratère formation dominée par onde de choc
 *    - Excavation flow (écoulement matériau)
 *    - C ≈ 14.10 (déjà calibré Phase 1.2)
 *
 * 2. PETITS FRAGMENTS (<5m):
 *    - Pénétration balistique pure
 *    - Moins d'étalement latéral
 *    - Régime hypersonique différent (Ma, Re, Kn)
 *    - C_small à déterminer (hypothèse: C_small > C_large)
 *
 * MÉTHODOLOGIE:
 * - Bootstrap resampling (N=1000 iterations)
 * - Train/test split 60/40
 * - Focus sur cratères 10-200m (fragments post-fragmentation)
 * - Estimer D_fragment final pour chaque cas
 *
 * IMPORTANT:
 * Ce n'est PAS une régression linéaire K(D)!
 * C'est une reconnaissance que deux régimes physiques distincts existent.
 *
 * v1.7.11 - Option B calibration
 */

const { getAllCraters } = require('../data/earthCraterDatabase');

// CONSTANTES PHYSIQUES
const RHO_TARGET = 2500; // kg/m³ (cible terrestre moyenne)
const V_REF = 12000;     // m/s (vitesse référence)
const G = 9.81;          // m/s² (gravité)

/**
 * Estime le diamètre du fragment final après fragmentation
 *
 * Utilise critère Hills-Goda simplifié:
 * - Si P_ram(h=10km) < σ_min: Intact (pas de fragmentation)
 * - Si P_ram(h=10km) > σ_max: Fragmentation progressive
 *
 * Pour fragmentation progressive, utilise conservation masse:
 * N_fragments ≈ (D_initial / D_final)³
 */
function estimateFinalFragmentDiameter(impactor) {
    const { diameter_m, velocity_m_s, composition, density_kg_m3 } = impactor;

    // Strength ranges (MPa)
    const STRENGTH_RANGES = {
        iron: { min: 20e6, max: 120e6, typical: 35e6 },
        rocky: { min: 5e6, max: 40e6, typical: 15e6 },
        ice: { min: 0.2e6, max: 3e6, typical: 1e6 }
    };

    const strength_range = STRENGTH_RANGES[composition] || STRENGTH_RANGES.iron;

    // Ram pressure at h=10km (ρ_atm ≈ 0.413 kg/m³)
    const rho_atm_10km = 0.413;
    const v_10km = 0.9 * velocity_m_s; // 10% velocity loss by 10km
    const P_ram = 0.5 * rho_atm_10km * v_10km * v_10km;

    // Décision fragmentation
    if (P_ram < strength_range.min) {
        // Pas de fragmentation - objet intact
        return diameter_m;
    } else if (P_ram > strength_range.max) {
        // Fragmentation certaine
        // Estimation conservative: N_fragments ≈ (P_ram / σ_typical)^1.5
        const N_fragments = Math.pow(P_ram / strength_range.typical, 1.5);
        const D_fragment = diameter_m / Math.pow(N_fragments, 1/3);
        return Math.max(D_fragment, 0.5); // Minimum 0.5m
    } else {
        // Fragmentation incertaine - assume fragmentation partielle
        const sigma_effective = 0.5 * (strength_range.min + strength_range.max);
        const N_fragments = Math.pow(P_ram / sigma_effective, 1.2);
        const D_fragment = diameter_m / Math.pow(N_fragments, 1/3);
        return Math.max(D_fragment, 1.0); // Minimum 1m
    }
}

/**
 * Calcule C requis pour un cratère donné
 *
 * Inverse de la formule:
 * D_crater = C × D_imp × (ρ/ρ_target)^(1/3) × (v/v_ref)^(2/3) × sin^(1/3)(θ)
 *
 * Donc:
 * C = D_crater / [D_imp × (ρ/ρ_target)^(1/3) × (v/v_ref)^(2/3) × sin^(1/3)(θ)]
 */
function calculateRequiredC(crater_data) {
    const { crater, impactor } = crater_data;

    // Estimer diamètre fragment final
    const D_fragment = estimateFinalFragmentDiameter(impactor);

    const D_crater = crater.diameter_m;
    const D_imp = D_fragment; // Utiliser fragment final, pas impacteur initial!
    const rho_imp = impactor.density_kg_m3;
    const v = impactor.velocity_m_s;
    const theta = impactor.angle_deg * Math.PI / 180;

    const rho_ratio = Math.pow(rho_imp / RHO_TARGET, 1/3);
    const v_ratio = Math.pow(v / V_REF, 2/3);
    const sin_theta = Math.pow(Math.sin(theta), 1/3);

    const C_required = D_crater / (D_imp * rho_ratio * v_ratio * sin_theta);

    return {
        C_required,
        D_fragment,
        D_initial: impactor.diameter_m,
        fragmentation_ratio: impactor.diameter_m / D_fragment
    };
}

/**
 * Filtre database pour petits cratères (10-200m)
 */
function filterSmallCraters() {
    const all_craters = getAllCraters();

    // Filtre: cratère 10-200m, confidence MEDIUM ou HIGH
    const small_craters = all_craters.filter(crater => {
        const diameter = crater.crater.diameter_m;
        const confidence = crater.confidence;
        return diameter >= 10 && diameter <= 200 &&
               (confidence === 'HIGH' || confidence === 'MEDIUM');
    });

    console.log(`\n📊 DATABASE FILTERING:`);
    console.log(`   Total craters: ${all_craters.length}`);
    console.log(`   Small craters (10-200m): ${small_craters.length}`);

    return small_craters;
}

/**
 * Bootstrap calibration avec train/test split
 */
function bootstrapCalibration(craters, N_bootstrap = 1000) {
    console.log(`\n🔬 BOOTSTRAP CALIBRATION (N=${N_bootstrap}):`);

    // Train/test split 60/40
    const N_train = Math.floor(craters.length * 0.6);
    const shuffled = [...craters].sort(() => Math.random() - 0.5);
    const train_set = shuffled.slice(0, N_train);
    const test_set = shuffled.slice(N_train);

    console.log(`   Train set: ${train_set.length} craters`);
    console.log(`   Test set: ${test_set.length} craters`);

    const C_samples = [];

    // Bootstrap iterations
    for (let i = 0; i < N_bootstrap; i++) {
        // Resample train set with replacement
        const resampled = [];
        for (let j = 0; j < train_set.length; j++) {
            const idx = Math.floor(Math.random() * train_set.length);
            resampled.push(train_set[idx]);
        }

        // Calculate C for each crater
        const C_values = resampled.map(crater => {
            const result = calculateRequiredC(crater);
            return result.C_required;
        }).filter(c => isFinite(c) && c > 0);

        if (C_values.length > 0) {
            const mean_C = C_values.reduce((a, b) => a + b, 0) / C_values.length;
            C_samples.push(mean_C);
        }
    }

    // Statistics
    C_samples.sort((a, b) => a - b);
    const mean_C = C_samples.reduce((a, b) => a + b, 0) / C_samples.length;
    const std_C = Math.sqrt(
        C_samples.reduce((sum, c) => sum + Math.pow(c - mean_C, 2), 0) / C_samples.length
    );
    const median_C = C_samples[Math.floor(C_samples.length / 2)];
    const P10 = C_samples[Math.floor(C_samples.length * 0.1)];
    const P90 = C_samples[Math.floor(C_samples.length * 0.9)];

    console.log(`\n✅ BOOTSTRAP RESULTS:`);
    console.log(`   C_small (mean):   ${mean_C.toFixed(2)} ± ${std_C.toFixed(2)}`);
    console.log(`   C_small (median): ${median_C.toFixed(2)}`);
    console.log(`   C_small (P10):    ${P10.toFixed(2)}`);
    console.log(`   C_small (P90):    ${P90.toFixed(2)}`);
    console.log(`   Uncertainty:      ${(100 * std_C / mean_C).toFixed(2)}%`);

    return {
        mean: mean_C,
        std: std_C,
        median: median_C,
        P10,
        P90,
        train_set,
        test_set,
        samples: C_samples
    };
}

/**
 * Validation sur test set
 */
function validateOnTestSet(test_set, C_small) {
    console.log(`\n🎯 VALIDATION ON TEST SET (C_small = ${C_small.toFixed(2)}):`);
    console.log(`   N_test = ${test_set.length}`);

    const errors = [];

    test_set.forEach(crater_data => {
        const { crater, impactor, name } = crater_data;

        const D_fragment = estimateFinalFragmentDiameter(impactor);

        // Predicted crater diameter
        const rho_ratio = Math.pow(impactor.density_kg_m3 / RHO_TARGET, 1/3);
        const v_ratio = Math.pow(impactor.velocity_m_s / V_REF, 2/3);
        const theta = impactor.angle_deg * Math.PI / 180;
        const sin_theta = Math.pow(Math.sin(theta), 1/3);

        const D_predicted = C_small * D_fragment * rho_ratio * v_ratio * sin_theta;
        const D_observed = crater.diameter_m;

        const error_pct = 100 * Math.abs(D_predicted - D_observed) / D_observed;
        errors.push(error_pct);

        const status = error_pct < 30 ? '✅' : '⚠️';
        console.log(`   ${status} ${name}: ${D_observed.toFixed(1)}m obs, ${D_predicted.toFixed(1)}m pred, ${error_pct.toFixed(1)}% error`);
        console.log(`      Fragment: ${D_fragment.toFixed(1)}m (from ${impactor.diameter_m.toFixed(1)}m initial)`);
    });

    const mean_error = errors.reduce((a, b) => a + b, 0) / errors.length;
    const pass_rate = errors.filter(e => e < 30).length / errors.length;

    console.log(`\n   Mean Absolute Error: ${mean_error.toFixed(1)}%`);
    console.log(`   Pass Rate (<30%):    ${(100 * pass_rate).toFixed(0)}%`);

    return { mean_error, pass_rate, errors };
}

/**
 * Analyse détaillée des cratères individuels
 */
function analyzeCraters(craters) {
    console.log(`\n🔍 DETAILED CRATER ANALYSIS:`);
    console.log(`\n${'Name'.padEnd(20)} ${'D_crater'.padEnd(10)} ${'D_initial'.padEnd(10)} ${'D_fragment'.padEnd(12)} ${'Frag Ratio'.padEnd(12)} ${'C_required'.padEnd(12)}`);
    console.log('─'.repeat(90));

    const results = craters.map(crater_data => {
        const result = calculateRequiredC(crater_data);

        console.log(
            `${crater_data.name.padEnd(20)} ` +
            `${crater_data.crater.diameter_m.toFixed(1).padEnd(10)} ` +
            `${result.D_initial.toFixed(1).padEnd(10)} ` +
            `${result.D_fragment.toFixed(2).padEnd(12)} ` +
            `${result.fragmentation_ratio.toFixed(2).padEnd(12)} ` +
            `${result.C_required.toFixed(2).padEnd(12)}`
        );

        return result;
    });

    return results;
}

/**
 * MAIN EXECUTION
 */
async function main() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Phase 1.2 Option B - C_small Calibration for Small Fragments ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    // Step 1: Filter small craters
    const small_craters = filterSmallCraters();

    if (small_craters.length < 10) {
        console.error(`\n❌ ERROR: Insufficient small craters (N=${small_craters.length}, need ≥10)`);
        return;
    }

    // Step 2: Analyze individual craters
    const crater_analysis = analyzeCraters(small_craters);

    // Step 3: Bootstrap calibration
    const bootstrap_result = bootstrapCalibration(small_craters, 1000);

    // Step 4: Validate on test set
    const validation_result = validateOnTestSet(
        bootstrap_result.test_set,
        bootstrap_result.mean
    );

    // Step 5: Compare with C_large
    console.log(`\n📊 COMPARISON WITH C_LARGE:`);
    console.log(`   C_large (>50m intact):  14.10 ± 1.13 (Phase 1.2)`);
    console.log(`   C_small (<5m fragment): ${bootstrap_result.mean.toFixed(2)} ± ${bootstrap_result.std.toFixed(2)}`);
    console.log(`   Ratio C_small/C_large:  ${(bootstrap_result.mean / 14.10).toFixed(2)}×`);

    // Step 6: Physical interpretation
    console.log(`\n🔬 PHYSICAL INTERPRETATION:`);
    if (bootstrap_result.mean > 14.10) {
        console.log(`   C_small > C_large suggests:`);
        console.log(`   - Small fragments penetrate more efficiently (less lateral spread)`);
        console.log(`   - Ballistic regime dominates over shock excavation`);
        console.log(`   - Higher energy concentration per unit mass`);
    } else if (bootstrap_result.mean < 14.10) {
        console.log(`   C_small < C_large suggests:`);
        console.log(`   - Small fragments lose more energy in atmosphere`);
        console.log(`   - Fragment cloud dispersal reduces effective impact`);
        console.log(`   - Multiple fragments create merged crater (overestimate D_fragment)`);
    } else {
        console.log(`   C_small ≈ C_large suggests:`);
        console.log(`   - Crater scaling is universal across regimes`);
        console.log(`   - Fragment estimation is accurate`);
    }

    // Step 7: Recommendation
    console.log(`\n🎯 RECOMMENDATION:`);
    if (validation_result.mean_error < 30 && validation_result.pass_rate > 0.7) {
        console.log(`   ✅ C_small = ${bootstrap_result.mean.toFixed(2)} VALIDATED`);
        console.log(`   Test set: ${(100*validation_result.pass_rate).toFixed(0)}% pass rate (<30% error)`);
        console.log(`   IMPLEMENT two-regime approach in smallIronCraterPhysics.js`);
    } else {
        console.log(`   ⚠️ C_small validation MARGINAL`);
        console.log(`   Test set: ${validation_result.mean_error.toFixed(1)}% mean error`);
        console.log(`   Consider Option A (accept single C) or Option C (pi-groups)`);
    }

    console.log(`\n✅ CALIBRATION COMPLETE\n`);
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { calculateRequiredC, estimateFinalFragmentDiameter, filterSmallCraters };
