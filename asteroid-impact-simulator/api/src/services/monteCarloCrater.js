/**
 * Monte Carlo Crater Simulation
 *
 * OBJECTIF: Quantifier incertitude sur cratère due à variabilité physique
 *
 * PARAMÈTRES INCERTAINS (Physique Fondamentale):
 * - C (constante cratère): 14.10 ± 1.13 (Bootstrap N=1000, Phase 1.2)
 * - σ (résistance): 20-120 MPa pour fer, 5-40 MPa pour rocheux
 * - θ (angle): ±10° incertitude orbitale
 * - v (vitesse): ±10% incertitude orbitale
 *
 * MÉTHODE:
 * 1. Générer N=100 échantillons depuis distributions
 * 2. Simuler cratère pour chaque échantillon
 * 3. Agréger: médiane, P10, P90, distribution complète
 *
 * PHYSIQUE PURE - Pas de régression, seulement propagation incertitude
 *
 * v1.7.11 - Phase 1.3: Ajout incertitude C (paramètre fondamental)
 */

class MonteCarloCrater {
    constructor() {
        this.RNG_SEED = 42;
        this.rng_state = this.RNG_SEED;
    }

    /**
     * Simple Linear Congruential Generator (LCG) for reproducible random numbers
     */
    random() {
        this.rng_state = (this.rng_state * 1103515245 + 12345) % 2147483648;
        return this.rng_state / 2147483648;
    }

    /**
     * Reset RNG to initial seed (for reproducibility)
     */
    resetRNG(seed = 42) {
        this.RNG_SEED = seed;
        this.rng_state = seed;
    }

    /**
     * Sample from Uniform(min, max) distribution
     */
    sampleUniform(min, max) {
        return min + this.random() * (max - min);
    }

    /**
     * Sample from Normal(mean, std) distribution (Box-Muller transform)
     */
    sampleNormal(mean, std) {
        // Box-Muller transform
        const u1 = this.random();
        const u2 = this.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + z0 * std;
    }

    /**
     * Generate N samples from distribution spec
     */
    generateSamples(distribution, N) {
        const samples = [];

        for (let i = 0; i < N; i++) {
            let sample;

            if (distribution.type === 'uniform') {
                sample = this.sampleUniform(distribution.min, distribution.max);
            } else if (distribution.type === 'normal') {
                sample = this.sampleNormal(distribution.mean, distribution.std);
                // Clip to physical bounds if specified
                if (distribution.min !== undefined) {
                    sample = Math.max(sample, distribution.min);
                }
                if (distribution.max !== undefined) {
                    sample = Math.min(sample, distribution.max);
                }
            } else {
                throw new Error(`Unknown distribution type: ${distribution.type}`);
            }

            samples.push(sample);
        }

        return samples;
    }

    /**
     * Run Monte Carlo simulation
     *
     * @param {Object} base_params - Base parameters
     * @param {Object} monte_carlo_config - Monte Carlo configuration from CraterRouting
     * @param {Function} crater_function - Function to calculate crater (params) => diameter
     * @returns {Object} Monte Carlo results with statistics
     */
    async runMonteCarlo(base_params, monte_carlo_config, crater_function) {
        this.resetRNG(42);  // Reproducible results

        const N = monte_carlo_config.N_samples;
        const param_names = monte_carlo_config.parameters;

        console.log(`\n[Monte Carlo] Running ${N} simulations...`);
        console.log(`[Monte Carlo] Varying parameters: ${param_names.join(', ')}`);

        // Generate samples for each varying parameter
        const samples = {};

        for (const param of param_names) {
            if (param === 'C') {
                samples.C = this.generateSamples(
                    monte_carlo_config.C_distribution,
                    N
                );
                const C_min = Math.min(...samples.C);
                const C_max = Math.max(...samples.C);
                console.log(`[Monte Carlo] C range: ${C_min.toFixed(2)} - ${C_max.toFixed(2)} (mean: ${monte_carlo_config.C_distribution.mean})`);
            } else if (param === 'strength') {
                samples.strength = this.generateSamples(
                    monte_carlo_config.strength_distribution,
                    N
                );
                console.log(`[Monte Carlo] σ range: ${(samples.strength[0]/1e6).toFixed(1)} - ${(samples.strength[N-1]/1e6).toFixed(1)} MPa`);
            } else if (param === 'angle') {
                samples.angle = this.generateSamples(
                    monte_carlo_config.angle_distribution,
                    N
                );
            } else if (param === 'velocity') {
                samples.velocity = this.generateSamples(
                    monte_carlo_config.velocity_distribution,
                    N
                );
            }
        }

        // Run crater simulation for each sample
        const results = [];
        const progress_interval = Math.max(1, Math.floor(N / 10));

        for (let i = 0; i < N; i++) {
            // Build parameter set for this iteration
            const iter_params = { ...base_params };

            if (samples.C) {
                iter_params.C_override = samples.C[i];
            }
            if (samples.strength) {
                iter_params.strength_override = samples.strength[i];
            }
            if (samples.angle) {
                iter_params.angle = samples.angle[i];
            }
            if (samples.velocity) {
                iter_params.velocity = samples.velocity[i];
            }

            // Calculate crater for this parameter set
            try {
                const crater_result = await crater_function(iter_params);

                results.push({
                    iteration: i,
                    diameter: crater_result.crater_diameter || crater_result.diameter,
                    depth: crater_result.crater_depth || crater_result.depth,
                    params_used: {
                        C: iter_params.C_override,
                        strength: iter_params.strength_override,
                        angle: iter_params.angle,
                        velocity: iter_params.velocity
                    },
                    full_result: crater_result
                });

                if ((i + 1) % progress_interval === 0) {
                    console.log(`[Monte Carlo] Progress: ${i+1}/${N} (${((i+1)/N*100).toFixed(0)}%)`);
                }
            } catch (error) {
                console.warn(`[Monte Carlo] Iteration ${i} failed: ${error.message}`);
                // Continue with next iteration
            }
        }

        console.log(`[Monte Carlo] Completed ${results.length}/${N} successful simulations`);

        // Statistical analysis
        const diameters = results.map(r => r.diameter).sort((a, b) => a - b);
        const depths = results.map(r => r.depth).sort((a, b) => a - b);

        const stats = this.calculateStatistics(diameters);
        const depth_stats = this.calculateStatistics(depths);

        return {
            N_samples: N,
            N_successful: results.length,
            diameter: {
                median: stats.median,
                mean: stats.mean,
                std: stats.std,
                P10: stats.P10,
                P90: stats.P90,
                min: stats.min,
                max: stats.max,
                distribution: diameters
            },
            depth: {
                median: depth_stats.median,
                mean: depth_stats.mean,
                std: depth_stats.std,
                P10: depth_stats.P10,
                P90: depth_stats.P90,
                min: depth_stats.min,
                max: depth_stats.max
            },
            all_results: results
        };
    }

    /**
     * Calculate statistics from array of values
     */
    calculateStatistics(values) {
        if (values.length === 0) {
            return {
                median: 0, mean: 0, std: 0,
                P10: 0, P90: 0, min: 0, max: 0
            };
        }

        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;

        const mean = sorted.reduce((a, b) => a + b, 0) / n;
        const variance = sorted.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
        const std = Math.sqrt(variance);

        const median = sorted[Math.floor(n / 2)];
        const P10 = sorted[Math.floor(n * 0.10)];
        const P90 = sorted[Math.floor(n * 0.90)];
        const min = sorted[0];
        const max = sorted[n - 1];

        return { median, mean, std, P10, P90, min, max };
    }

    /**
     * Format Monte Carlo results for display
     */
    formatResults(mc_results, observed_diameter = null) {
        console.log('\n' + '='.repeat(80));
        console.log('MONTE CARLO RESULTS');
        console.log('='.repeat(80));

        console.log(`\nSIMULATIONS: ${mc_results.N_successful}/${mc_results.N_samples} successful`);

        console.log(`\nCRATER DIAMETER STATISTICS:`);
        console.log(`  - Median: ${mc_results.diameter.median.toFixed(1)} m`);
        console.log(`  - Mean: ${mc_results.diameter.mean.toFixed(1)} m`);
        console.log(`  - Std Dev: ${mc_results.diameter.std.toFixed(1)} m`);
        console.log(`  - 80% Confidence Interval: [${mc_results.diameter.P10.toFixed(1)}, ${mc_results.diameter.P90.toFixed(1)}] m`);
        console.log(`  - Range: [${mc_results.diameter.min.toFixed(1)}, ${mc_results.diameter.max.toFixed(1)}] m`);

        if (observed_diameter !== null) {
            const error_median = Math.abs(mc_results.diameter.median - observed_diameter) / observed_diameter * 100;
            const in_CI = (observed_diameter >= mc_results.diameter.P10 && observed_diameter <= mc_results.diameter.P90);

            console.log(`\nVALIDATION:`);
            console.log(`  - Observed: ${observed_diameter} m`);
            console.log(`  - Median prediction: ${mc_results.diameter.median.toFixed(1)} m`);
            console.log(`  - Error (median): ${error_median.toFixed(1)}%`);
            console.log(`  - In 80% CI: ${in_CI ? '✅ YES' : '❌ NO'}`);
        }

        console.log('='.repeat(80));

        return {
            summary: `D_crater = ${mc_results.diameter.median.toFixed(1)} m [${mc_results.diameter.P10.toFixed(1)}, ${mc_results.diameter.P90.toFixed(1)}]`,
            median: mc_results.diameter.median,
            confidence_interval: [mc_results.diameter.P10, mc_results.diameter.P90]
        };
    }
}

module.exports = { MonteCarloCrater };
