/**
 * Statistical Sampling Utilities
 *
 * Provides functions for sampling from various probability distributions
 * for Monte Carlo uncertainty quantification.
 *
 * Phase 1.3 - Monte Carlo with Complete Uncertainties
 * v1.7.11
 */

/**
 * Box-Muller transform for Normal (Gaussian) distribution
 *
 * Generates samples from N(mean, std²) using uniform random numbers
 *
 * @param {number} mean - Mean (μ) of distribution
 * @param {number} std - Standard deviation (σ) of distribution
 * @returns {number} Sample from Normal distribution
 *
 * References:
 * - Box & Muller (1958) - "A Note on the Generation of Random Normal Deviates"
 */
function normalRandom(mean = 0, std = 1) {
    // Generate two independent uniform random numbers [0, 1)
    const u1 = Math.random();
    const u2 = Math.random();

    // Box-Muller transform
    // z ~ N(0, 1)
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Scale and shift to N(mean, std²)
    return mean + z * std;
}

/**
 * Uniform distribution
 *
 * Generates samples from Uniform(min, max)
 *
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Sample from Uniform distribution
 */
function uniformRandom(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Clamp sample to bounds
 *
 * Ensures sampled value stays within physical/reasonable bounds
 *
 * @param {number} sample - Sampled value
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 */
function clampedSample(sample, min, max) {
    return Math.max(min, Math.min(max, sample));
}

/**
 * Generate multiple samples from Normal distribution
 *
 * @param {number} N - Number of samples
 * @param {number} mean - Mean of distribution
 * @param {number} std - Standard deviation
 * @param {Object} bounds - Optional bounds {min, max}
 * @returns {Array<number>} Array of samples
 */
function normalSamples(N, mean, std, bounds = null) {
    const samples = [];

    for (let i = 0; i < N; i++) {
        let sample = normalRandom(mean, std);

        if (bounds) {
            sample = clampedSample(sample, bounds.min, bounds.max);
        }

        samples.push(sample);
    }

    return samples;
}

/**
 * Generate multiple samples from Uniform distribution
 *
 * @param {number} N - Number of samples
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Array<number>} Array of samples
 */
function uniformSamples(N, min, max) {
    const samples = [];

    for (let i = 0; i < N; i++) {
        samples.push(uniformRandom(min, max));
    }

    return samples;
}

/**
 * Calculate percentile from sorted array
 *
 * @param {Array<number>} sorted_array - Sorted array of values
 * @param {number} percentile - Percentile (0-100)
 * @returns {number} Value at percentile
 */
function percentile(sorted_array, percentile) {
    if (sorted_array.length === 0) return null;

    const index = (percentile / 100) * (sorted_array.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
        return sorted_array[lower];
    }

    return sorted_array[lower] * (1 - weight) + sorted_array[upper] * weight;
}

/**
 * Compute statistics from sample array
 *
 * @param {Array<number>} samples - Array of sampled values
 * @returns {Object} Statistics object
 */
function computeStatistics(samples) {
    if (samples.length === 0) {
        return null;
    }

    // Sort for percentiles
    const sorted = [...samples].sort((a, b) => a - b);

    // Mean
    const mean = samples.reduce((sum, x) => sum + x, 0) / samples.length;

    // Standard deviation
    const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / samples.length;
    const std = Math.sqrt(variance);

    // Percentiles
    const P05 = percentile(sorted, 5);
    const P10 = percentile(sorted, 10);
    const P25 = percentile(sorted, 25);
    const P50 = percentile(sorted, 50);  // median
    const P75 = percentile(sorted, 75);
    const P90 = percentile(sorted, 90);
    const P95 = percentile(sorted, 95);

    // Min/max
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Confidence intervals
    const CI_80 = [P10, P90];
    const CI_90 = [P05, P95];
    const CI_50 = [P25, P75];  // Interquartile range

    return {
        N: samples.length,
        mean,
        std,
        median: P50,
        min,
        max,
        percentiles: {
            P05,
            P10,
            P25,
            P50,
            P75,
            P90,
            P95
        },
        confidence_intervals: {
            CI_50: CI_50,   // [P25, P75]
            CI_80: CI_80,   // [P10, P90]
            CI_90: CI_90    // [P05, P95]
        },
        // Coefficient of variation (relative uncertainty)
        CV: std / mean
    };
}

/**
 * Test if value is within confidence interval
 *
 * @param {number} value - Value to test
 * @param {Array<number>} CI - Confidence interval [lower, upper]
 * @returns {boolean} True if value is in CI
 */
function inConfidenceInterval(value, CI) {
    return value >= CI[0] && value <= CI[1];
}

module.exports = {
    normalRandom,
    uniformRandom,
    clampedSample,
    normalSamples,
    uniformSamples,
    percentile,
    computeStatistics,
    inConfidenceInterval
};
