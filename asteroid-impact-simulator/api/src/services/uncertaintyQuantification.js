/**
 * Uncertainty Quantification Module
 * Implements Monte Carlo simulation for asteroid impact parameter uncertainty
 *
 * @module uncertaintyQuantification
 * @version 2.0.0
 * @author Meteor Madness Team
 */

class UncertaintyQuantification {
    constructor() {
        // Default configuration
        this.config = {
            defaultSamples: 1000,
            minSamples: 100,
            maxSamples: 10000,
            randomSeed: null // For reproducibility if needed
        };
    }

    /**
     * Box-Muller transform for normal distribution sampling
     * Generates two independent standard normal random variables
     *
     * @private
     * @returns {Array<number>} [z0, z1] - Two independent N(0,1) samples
     */
    _boxMuller() {
        const u1 = Math.random();
        const u2 = Math.random();

        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

        return [z0, z1];
    }

    /**
     * Sample from normal distribution N(μ, σ²)
     *
     * @param {number} mean - Mean value μ
     * @param {number} std - Standard deviation σ (must be > 0)
     * @param {number} n_samples - Number of samples to generate
     * @returns {Array<number>} Array of n_samples drawn from N(μ, σ²)
     *
     * @example
     * const uq = new UncertaintyQuantification();
     * const samples = uq.sampleNormal(100, 10, 1000); // 1000 samples from N(100, 10²)
     */
    sampleNormal(mean, std, n_samples) {
        if (std <= 0) {
            throw new Error(`Standard deviation must be positive, got ${std}`);
        }
        if (n_samples < 1) {
            throw new Error(`n_samples must be >= 1, got ${n_samples}`);
        }

        const samples = [];

        // Generate pairs for efficiency
        for (let i = 0; i < Math.ceil(n_samples / 2); i++) {
            const [z0, z1] = this._boxMuller();
            samples.push(mean + z0 * std);
            if (samples.length < n_samples) {
                samples.push(mean + z1 * std);
            }
        }

        return samples.slice(0, n_samples);
    }

    /**
     * Sample from uniform distribution U(a, b)
     *
     * @param {number} min - Minimum value a
     * @param {number} max - Maximum value b (must be > min)
     * @param {number} n_samples - Number of samples to generate
     * @returns {Array<number>} Array of n_samples drawn from U(a, b)
     *
     * @example
     * const uq = new UncertaintyQuantification();
     * const samples = uq.sampleUniform(5, 75, 1000); // 1000 samples from U(5, 75)
     */
    sampleUniform(min, max, n_samples) {
        if (max <= min) {
            throw new Error(`max must be > min, got min=${min}, max=${max}`);
        }
        if (n_samples < 1) {
            throw new Error(`n_samples must be >= 1, got ${n_samples}`);
        }

        const samples = [];
        const range = max - min;

        for (let i = 0; i < n_samples; i++) {
            samples.push(min + Math.random() * range);
        }

        return samples;
    }

    /**
     * Sample from log-normal distribution LN(μ, σ²)
     * If X ~ N(μ, σ²), then exp(X) ~ LN(μ, σ²)
     *
     * @param {number} mu - Location parameter μ (log-space mean)
     * @param {number} sigma - Scale parameter σ (log-space std, must be > 0)
     * @param {number} n_samples - Number of samples to generate
     * @returns {Array<number>} Array of n_samples drawn from LN(μ, σ²)
     *
     * @example
     * const uq = new UncertaintyQuantification();
     * // For median=1000, want μ = log(1000) ≈ 6.91
     * const samples = uq.sampleLogNormal(6.91, 0.5, 1000);
     */
    sampleLogNormal(mu, sigma, n_samples) {
        if (sigma <= 0) {
            throw new Error(`sigma must be positive, got ${sigma}`);
        }
        if (n_samples < 1) {
            throw new Error(`n_samples must be >= 1, got ${n_samples}`);
        }

        const normalSamples = this.sampleNormal(mu, sigma, n_samples);
        return normalSamples.map(x => Math.exp(x));
    }

    /**
     * Sample from truncated normal distribution TN(μ, σ², a, b)
     * Normal distribution bounded to [a, b]
     * Uses rejection sampling
     *
     * @param {number} mean - Mean value μ
     * @param {number} std - Standard deviation σ
     * @param {number} min - Lower bound a
     * @param {number} max - Upper bound b
     * @param {number} n_samples - Number of samples to generate
     * @returns {Array<number>} Array of n_samples from TN(μ, σ², a, b)
     *
     * @example
     * const uq = new UncertaintyQuantification();
     * // Sample angles ~45° but bounded to [0°, 90°]
     * const samples = uq.sampleTruncatedNormal(45, 15, 0, 90, 1000);
     */
    sampleTruncatedNormal(mean, std, min, max, n_samples) {
        if (std <= 0) {
            throw new Error(`Standard deviation must be positive, got ${std}`);
        }
        if (max <= min) {
            throw new Error(`max must be > min, got min=${min}, max=${max}`);
        }
        if (n_samples < 1) {
            throw new Error(`n_samples must be >= 1, got ${n_samples}`);
        }

        const samples = [];
        const maxAttempts = n_samples * 100; // Prevent infinite loop
        let attempts = 0;

        while (samples.length < n_samples && attempts < maxAttempts) {
            const [z0, z1] = this._boxMuller();

            const candidate1 = mean + z0 * std;
            if (candidate1 >= min && candidate1 <= max) {
                samples.push(candidate1);
            }

            if (samples.length < n_samples) {
                const candidate2 = mean + z1 * std;
                if (candidate2 >= min && candidate2 <= max) {
                    samples.push(candidate2);
                }
            }

            attempts += 2;
        }

        if (samples.length < n_samples) {
            throw new Error(
                `Truncated normal sampling failed: only generated ${samples.length}/${n_samples} samples. ` +
                `Check if bounds [${min}, ${max}] are reasonable for N(${mean}, ${std}²)`
            );
        }

        return samples.slice(0, n_samples);
    }

    /**
     * Define parameter distributions for Monte Carlo simulation
     *
     * @param {Object} nominalParams - Nominal parameter values
     * @param {Object} uncertaintyConfig - Uncertainty configuration for each parameter
     * @returns {Object} Distribution specification for each parameter
     *
     * @example
     * const distributions = uq.defineParameterDistributions(
     *   { diameter: 50, velocity: 15, angle: 45, density: 7870 },
     *   {
     *     diameter: { type: 'normal', std: 5 },
     *     velocity: { type: 'uniform', min: 12, max: 18 },
     *     angle: { type: 'truncatedNormal', std: 10, min: 0, max: 90 },
     *     density: { type: 'normal', std: 100 }
     *   }
     * );
     */
    defineParameterDistributions(nominalParams, uncertaintyConfig) {
        const distributions = {};

        for (const [param, config] of Object.entries(uncertaintyConfig)) {
            const nominal = nominalParams[param];

            if (nominal === undefined) {
                throw new Error(`Parameter ${param} not found in nominalParams`);
            }

            distributions[param] = {
                nominal: nominal,
                type: config.type,
                ...config
            };
        }

        return distributions;
    }

    /**
     * Sample parameter set from distributions
     *
     * @param {Object} distributions - Distribution specifications from defineParameterDistributions
     * @param {number} n_samples - Number of parameter sets to sample
     * @returns {Object} Object with arrays of sampled values for each parameter
     *
     * @example
     * const samples = uq.sampleParameters(distributions, 1000);
     * // Returns: { diameter: [48.2, 51.3, ...], velocity: [14.5, 16.1, ...], ... }
     */
    sampleParameters(distributions, n_samples) {
        const samples = {};

        for (const [param, dist] of Object.entries(distributions)) {
            switch (dist.type) {
                case 'normal':
                    samples[param] = this.sampleNormal(dist.nominal, dist.std, n_samples);
                    break;

                case 'uniform':
                    samples[param] = this.sampleUniform(dist.min, dist.max, n_samples);
                    break;

                case 'logNormal':
                    samples[param] = this.sampleLogNormal(dist.mu, dist.sigma, n_samples);
                    break;

                case 'truncatedNormal':
                    samples[param] = this.sampleTruncatedNormal(
                        dist.nominal,
                        dist.std,
                        dist.min,
                        dist.max,
                        n_samples
                    );
                    break;

                default:
                    throw new Error(`Unknown distribution type: ${dist.type}`);
            }
        }

        return samples;
    }

    /**
     * Validate sampling performance
     * Tests that 1000 samples can be generated in < 1 second
     *
     * @returns {Object} Performance metrics { duration_ms, samples_per_sec, success }
     */
    validatePerformance() {
        const n_samples = 1000;
        const start = Date.now();

        // Test all distribution types
        this.sampleNormal(100, 10, n_samples);
        this.sampleUniform(5, 75, n_samples);
        this.sampleLogNormal(6.91, 0.5, n_samples);
        this.sampleTruncatedNormal(45, 15, 0, 90, n_samples);

        const duration_ms = Date.now() - start;
        const samples_per_sec = Math.round((n_samples * 4) / (duration_ms / 1000));
        const success = duration_ms < 1000;

        return {
            duration_ms,
            samples_per_sec,
            success,
            message: success
                ? `✓ Performance OK: ${samples_per_sec} samples/sec`
                : `✗ Performance FAIL: ${duration_ms}ms > 1000ms`
        };
    }
}

module.exports = UncertaintyQuantification;