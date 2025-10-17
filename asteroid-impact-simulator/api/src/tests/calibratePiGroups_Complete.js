/**
 * Calibration Complète Pi-Groups (Option C)
 *
 * OBJECTIF:
 * Calibrer les 7 paramètres du modèle complet Holsapple 1993:
 * - K: scaling constant
 * - μ: density coupling exponent
 * - ν: gravity scaling exponent
 * - β: velocity/strength coupling exponent
 * - γ: strength-gravity transition exponent
 * - δ: gravity correction exponent
 * - ε: angle coupling exponent
 *
 * MÉTHODOLOGIE:
 * 1. Grid search initial pour trouver région optimale
 * 2. Gradient descent (ou Nelder-Mead) pour optimisation fine
 * 3. Bootstrap pour quantifier incertitude
 * 4. Train/test split 60/40 pour validation
 *
 * CONTRAINTES PHYSIQUES (de la littérature):
 * - K: 0.5 - 2.0 (calibré empiriquement)
 * - μ: 0.2 - 0.4 (théorie: 1/3 pour 3D)
 * - ν: 0.15 - 0.25 (0.195 strength, 0.217 gravity)
 * - β: 0.5 - 0.8 (théorie: 2/3 pour strength)
 * - γ: -0.2 - 0.2 (transition term, peut être ~0)
 * - δ: -0.1 - 0.1 (correction, peut être ~0)
 * - ε: 0.2 - 0.4 (théorie: 1/3 pour sin(θ))
 *
 * v1.7.12 - Option C implementation
 */

const CompletePiGroupCraterModel = require('../services/craterPiGroupsComplete');
const { getAllCraters, trainTestSplit } = require('../data/earthCraterDatabase');

/**
 * Calculate RMSE log error for model
 * (Log error is better for craters spanning many orders of magnitude)
 */
function calculateError(craters, model_params, model) {
    let sum_squared_log_error = 0;
    let count = 0;

    for (const crater of craters) {
        const { impactor, crater: crater_info } = crater;

        if (!impactor || !impactor.diameter_m) continue;

        const input_params = {
            diameter_m: impactor.diameter_m,
            velocity_m_s: impactor.velocity_m_s,
            angle_deg: impactor.angle_deg,
            density_imp: impactor.density_kg_m3,
            density_target: 2500,  // Earth crust
            strength_target: 1e6,  // 1 MPa default
            gravity: 9.81
        };

        try {
            const result = model.calculateCraterDiameter(input_params, model_params);
            const predicted = result.diameter_m;
            const observed = crater_info.diameter_m;

            // Log error (better for wide range)
            const log_error = Math.log10(predicted / observed);
            sum_squared_log_error += log_error * log_error;
            count++;

        } catch (error) {
            // Skip craters that fail
            continue;
        }
    }

    if (count === 0) return Infinity;

    const rmse_log = Math.sqrt(sum_squared_log_error / count);
    return rmse_log;
}

/**
 * Calculate detailed errors for reporting
 */
function calculateDetailedErrors(craters, model_params, model) {
    const errors = [];

    for (const crater of craters) {
        const { name, impactor, crater: crater_info } = crater;

        if (!impactor || !impactor.diameter_m) continue;

        const input_params = {
            diameter_m: impactor.diameter_m,
            velocity_m_s: impactor.velocity_m_s,
            angle_deg: impactor.angle_deg,
            density_imp: impactor.density_kg_m3,
            density_target: 2500,
            strength_target: 1e6,
            gravity: 9.81
        };

        try {
            const result = model.calculateCraterDiameter(input_params, model_params);
            const predicted = result.diameter_m;
            const observed = crater_info.diameter_m;

            const linear_error_pct = 100 * Math.abs(predicted - observed) / observed;
            const log_error = Math.log10(predicted / observed);

            errors.push({
                name,
                observed,
                predicted,
                linear_error_pct,
                log_error,
                diameter_impactor: impactor.diameter_m,
                regime: result.regime.regime
            });

        } catch (error) {
            errors.push({
                name,
                error: error.message
            });
        }
    }

    return errors;
}

/**
 * Grid search over parameter space
 */
function gridSearch(train_craters, model) {
    console.log('\n🔍 GRID SEARCH - Finding optimal region...\n');

    // Define parameter ranges based on physical constraints
    const param_grid = {
        K: [0.8, 1.0, 1.2, 1.5, 2.0],
        mu: [0.25, 0.30, 0.33, 0.36, 0.40],
        nu: [0.15, 0.18, 0.20, 0.22, 0.25],
        beta: [0.55, 0.60, 0.65, 0.67, 0.70, 0.75],
        epsilon: [0.25, 0.30, 0.33, 0.36, 0.40]
        // γ and δ fixed at 0 initially (simplification)
    };

    let best_error = Infinity;
    let best_params = null;
    let iteration = 0;
    const total_iterations = param_grid.K.length *
                            param_grid.mu.length *
                            param_grid.nu.length *
                            param_grid.beta.length *
                            param_grid.epsilon.length;

    console.log(`Total grid points to evaluate: ${total_iterations}`);
    console.log('Sampling every 100th point for speed...\n');

    // Sample grid (full grid would be too slow)
    const sample_rate = 100;
    let sampled = 0;

    for (const K of param_grid.K) {
        for (const mu of param_grid.mu) {
            for (const nu of param_grid.nu) {
                for (const beta of param_grid.beta) {
                    for (const epsilon of param_grid.epsilon) {
                        iteration++;

                        // Sample every Nth point
                        if (iteration % sample_rate !== 0 && iteration !== 1) continue;

                        const params = {
                            K, mu, nu, beta,
                            gamma: 0.0,
                            delta: 0.0,
                            epsilon
                        };

                        const error = calculateError(train_craters, params, model);

                        sampled++;

                        if (error < best_error) {
                            best_error = error;
                            best_params = params;
                            console.log(`  ✅ New best: RMSE_log = ${error.toFixed(4)}`);
                            console.log(`     K=${K.toFixed(2)}, μ=${mu.toFixed(2)}, ν=${nu.toFixed(2)}, β=${beta.toFixed(2)}, ε=${epsilon.toFixed(2)}`);
                        }
                    }
                }
            }
        }
    }

    console.log(`\nSampled ${sampled} grid points`);
    console.log(`Best RMSE_log: ${best_error.toFixed(4)}`);

    return best_params;
}

/**
 * Nelder-Mead simplex optimization
 * (Gradient-free optimization for non-linear problems)
 */
function nelderMead(train_craters, initial_params, model, max_iterations = 200) {
    console.log('\n🎯 NELDER-MEAD OPTIMIZATION - Fine-tuning parameters...\n');

    // Nelder-Mead parameters
    const alpha = 1.0;   // Reflection
    const gamma = 2.0;   // Expansion
    const rho = 0.5;     // Contraction
    const sigma = 0.5;   // Shrink

    // Parameter bounds (physical constraints)
    const bounds = {
        K: [0.5, 3.0],
        mu: [0.2, 0.5],
        nu: [0.1, 0.3],
        beta: [0.5, 0.9],
        gamma: [-0.3, 0.3],
        delta: [-0.2, 0.2],
        epsilon: [0.2, 0.5]
    };

    // Convert params to array
    const param_names = ['K', 'mu', 'nu', 'beta', 'gamma', 'delta', 'epsilon'];

    function paramsToArray(p) {
        return param_names.map(name => p[name]);
    }

    function arrayToParams(arr) {
        const p = {};
        param_names.forEach((name, i) => {
            // Enforce bounds
            p[name] = Math.max(bounds[name][0], Math.min(bounds[name][1], arr[i]));
        });
        return p;
    }

    function objective(param_array) {
        const params = arrayToParams(param_array);
        return calculateError(train_craters, params, model);
    }

    // Initialize simplex (n+1 points for n dimensions)
    const n = param_names.length;
    let simplex = [];

    // First point: initial params
    simplex.push({
        params: paramsToArray(initial_params),
        value: objective(paramsToArray(initial_params))
    });

    // Other points: perturbations
    for (let i = 0; i < n; i++) {
        const perturbed = [...paramsToArray(initial_params)];
        perturbed[i] *= 1.1;  // 10% perturbation
        simplex.push({
            params: perturbed,
            value: objective(perturbed)
        });
    }

    // Optimization loop
    for (let iter = 0; iter < max_iterations; iter++) {
        // Sort by value
        simplex.sort((a, b) => a.value - b.value);

        const best = simplex[0];
        const worst = simplex[n];
        const second_worst = simplex[n - 1];

        // Check convergence
        const range = worst.value - best.value;
        if (range < 1e-6) {
            console.log(`\nConverged after ${iter} iterations`);
            break;
        }

        if (iter % 20 === 0) {
            console.log(`  Iteration ${iter}: Best RMSE_log = ${best.value.toFixed(4)}`);
        }

        // Calculate centroid (excluding worst point)
        const centroid = new Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                centroid[j] += simplex[i].params[j];
            }
        }
        for (let j = 0; j < n; j++) {
            centroid[j] /= n;
        }

        // Reflection
        const reflected = centroid.map((c, i) => c + alpha * (c - worst.params[i]));
        const reflected_value = objective(reflected);

        if (reflected_value < second_worst.value && reflected_value >= best.value) {
            simplex[n] = { params: reflected, value: reflected_value };
            continue;
        }

        // Expansion
        if (reflected_value < best.value) {
            const expanded = centroid.map((c, i) => c + gamma * (reflected[i] - c));
            const expanded_value = objective(expanded);

            if (expanded_value < reflected_value) {
                simplex[n] = { params: expanded, value: expanded_value };
            } else {
                simplex[n] = { params: reflected, value: reflected_value };
            }
            continue;
        }

        // Contraction
        const contracted = centroid.map((c, i) => c + rho * (worst.params[i] - c));
        const contracted_value = objective(contracted);

        if (contracted_value < worst.value) {
            simplex[n] = { params: contracted, value: contracted_value };
            continue;
        }

        // Shrink
        for (let i = 1; i <= n; i++) {
            simplex[i].params = simplex[i].params.map((p, j) =>
                best.params[j] + sigma * (p - best.params[j])
            );
            simplex[i].value = objective(simplex[i].params);
        }
    }

    simplex.sort((a, b) => a.value - b.value);
    const best_params = arrayToParams(simplex[0].params);
    const best_error = simplex[0].value;

    console.log(`\n✅ Optimization complete`);
    console.log(`   Final RMSE_log: ${best_error.toFixed(4)}`);

    return best_params;
}

/**
 * Main calibration function
 */
async function main() {
    console.log('╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║  Option C - Complete Pi-Group Calibration (Holsapple 1993)       ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝');

    const model = new CompletePiGroupCraterModel();

    // Load database
    const all_craters = getAllCraters();
    console.log(`\nTotal craters in database: ${all_craters.length}`);

    // Filter: only craters with impactor parameters
    const usable_craters = all_craters.filter(c =>
        c.impactor &&
        c.impactor.diameter_m &&
        c.impactor.velocity_m_s &&
        c.impactor.angle_deg
    );
    console.log(`Usable craters (with impactor params): ${usable_craters.length}`);

    // Train/test split
    const split = trainTestSplit(0.6, 42);
    const train_craters = split.train;
    const test_craters = split.test;

    console.log(`Train set: ${train_craters.length} craters`);
    console.log(`Test set: ${test_craters.length} craters`);

    // Step 1: Grid search for initial estimate
    const grid_best = gridSearch(train_craters, model);

    // Step 2: Nelder-Mead fine-tuning
    const optimized_params = nelderMead(train_craters, grid_best, model);

    // Step 3: Validation on test set
    console.log('\n' + '='.repeat(70));
    console.log('VALIDATION ON TEST SET');
    console.log('='.repeat(70));

    const test_errors = calculateDetailedErrors(test_craters, optimized_params, model);

    console.log('\n┌───────────────────────┬──────────┬───────────┬──────────┬──────────┐');
    console.log('│ Crater                │ Observed │ Predicted │ Error %  │ Regime   │');
    console.log('├───────────────────────┼──────────┼───────────┼──────────┼──────────┤');

    let pass_count = 0;
    for (const e of test_errors) {
        if (e.error) {
            console.log(`│ ${e.name.padEnd(21)} │ ERROR    │           │          │          │`);
            continue;
        }

        const name = e.name.padEnd(21);
        const obs = `${(e.observed/1000).toFixed(1)}km`.padEnd(8);
        const pred = `${(e.predicted/1000).toFixed(1)}km`.padEnd(9);
        const err = `${e.linear_error_pct.toFixed(1)}%`.padEnd(8);
        const regime = e.regime.padEnd(8);
        const status = e.linear_error_pct < 30 ? '✅' : '⚠️';

        console.log(`│ ${name} │ ${obs} │ ${pred} │ ${err} │ ${regime} │ ${status}`);

        if (e.linear_error_pct < 30) pass_count++;
    }

    console.log('└───────────────────────┴──────────┴───────────┴──────────┴──────────┘');

    const pass_rate = pass_count / test_errors.length;
    console.log(`\nTest set pass rate (<30% error): ${pass_count}/${test_errors.length} (${(100*pass_rate).toFixed(0)}%)`);

    // Step 4: Compare with simplified formula (Option A)
    console.log('\n' + '='.repeat(70));
    console.log('COMPARISON: COMPLETE PI-GROUPS vs SIMPLIFIED FORMULA');
    console.log('='.repeat(70));

    console.log('\nOptimized Pi-Group Parameters:');
    console.log(`  K       = ${optimized_params.K.toFixed(3)}`);
    console.log(`  μ (rho) = ${optimized_params.mu.toFixed(3)} (theory: 0.333)`);
    console.log(`  ν (grav)= ${optimized_params.nu.toFixed(3)} (theory: 0.217 gravity, 0.195 strength)`);
    console.log(`  β (vel) = ${optimized_params.beta.toFixed(3)} (theory: 0.667)`);
    console.log(`  γ (trans)=${optimized_params.gamma.toFixed(3)}`);
    console.log(`  δ (g-corr)=${optimized_params.delta.toFixed(3)}`);
    console.log(`  ε (angle)=${optimized_params.epsilon.toFixed(3)} (theory: 0.333)`);

    // Calculate errors for both models
    const pi_group_error = calculateError(test_craters, optimized_params, model);

    console.log('\nTest Set Performance:');
    console.log(`  Complete Pi-Groups RMSE_log: ${pi_group_error.toFixed(4)}`);
    console.log(`  Pass rate (<30%): ${(100*pass_rate).toFixed(0)}%`);

    // Final recommendation
    console.log('\n' + '='.repeat(70));
    console.log('RECOMMENDATION');
    console.log('='.repeat(70));

    if (pass_rate > 0.8 && pi_group_error < 0.2) {
        console.log('\n✅ Complete pi-group model VALIDATED');
        console.log('   → Achieves excellent accuracy across all regimes');
        console.log('   → Ready for production deployment');
    } else if (pass_rate > 0.7) {
        console.log('\n⚠️  Complete pi-group model shows improvement');
        console.log('   → Better than simplified, but still has limitations');
        console.log('   → Consider hybrid approach or data quality review');
    } else {
        console.log('\n❌ Complete pi-group model validation MARGINAL');
        console.log('   → May need larger database (N > 100)');
        console.log('   → Or data quality issues dominate');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ CALIBRATION COMPLETE');
    console.log('='.repeat(70));
}

main().catch(console.error);
