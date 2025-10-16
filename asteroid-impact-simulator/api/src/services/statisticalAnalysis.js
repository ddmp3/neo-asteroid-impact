/**
 * Statistical Analysis Module for Monte Carlo Results
 * Computes descriptive statistics, confidence intervals, and percentiles
 *
 * @module statisticalAnalysis
 * @version 2.0.0
 * @author Meteor Madness Team
 */

class StatisticalAnalysis {
    constructor() {
        // Default configuration
        this.config = {
            defaultConfidenceLevel: 0.95, // 95% confidence interval
            defaultPercentiles: [5, 25, 50, 75, 95] // Quartiles + 5th/95th
        };
    }

    /**
     * Calculate mean (average) of samples
     *
     * @param {Array<number>} samples - Array of numeric samples
     * @returns {number} Mean value
     *
     * @example
     * const mean = stats.calculateMean([1, 2, 3, 4, 5]); // 3.0
     */
    calculateMean(samples) {
        if (!samples || samples.length === 0) {
            throw new Error('Samples array is empty');
        }

        const sum = samples.reduce((acc, val) => acc + val, 0);
        return sum / samples.length;
    }

    /**
     * Calculate variance of samples
     *
     * @param {Array<number>} samples - Array of numeric samples
     * @param {number} mean - Pre-computed mean (optional, will calculate if not provided)
     * @returns {number} Variance (σ²)
     *
     * @example
     * const variance = stats.calculateVariance([1, 2, 3, 4, 5]); // 2.0
     */
    calculateVariance(samples, mean = null) {
        if (!samples || samples.length === 0) {
            throw new Error('Samples array is empty');
        }

        const sampleMean = mean !== null ? mean : this.calculateMean(samples);
        const squaredDiffs = samples.map(x => Math.pow(x - sampleMean, 2));
        const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / samples.length;

        return variance;
    }

    /**
     * Calculate standard deviation of samples
     *
     * @param {Array<number>} samples - Array of numeric samples
     * @param {number} mean - Pre-computed mean (optional)
     * @returns {number} Standard deviation (σ)
     *
     * @example
     * const std = stats.calculateStd([1, 2, 3, 4, 5]); // 1.414
     */
    calculateStd(samples, mean = null) {
        const variance = this.calculateVariance(samples, mean);
        return Math.sqrt(variance);
    }

    /**
     * Calculate percentiles of samples
     *
     * @param {Array<number>} samples - Array of numeric samples
     * @param {Array<number>} percentiles - Array of percentiles to calculate [0-100]
     * @returns {Object} Percentile values {p5: value, p25: value, ...}
     *
     * @example
     * const percentiles = stats.calculatePercentiles([1, 2, 3, 4, 5], [25, 50, 75]);
     * // Returns: {p25: 2, p50: 3, p75: 4}
     */
    calculatePercentiles(samples, percentiles = [5, 25, 50, 75, 95]) {
        if (!samples || samples.length === 0) {
            throw new Error('Samples array is empty');
        }

        // Sort samples
        const sorted = [...samples].sort((a, b) => a - b);
        const n = sorted.length;

        const result = {};

        for (const p of percentiles) {
            if (p < 0 || p > 100) {
                throw new Error(`Percentile must be between 0 and 100, got ${p}`);
            }

            // Linear interpolation method (R-7, default in NumPy and R)
            const rank = (p / 100) * (n - 1);
            const lowerIndex = Math.floor(rank);
            const upperIndex = Math.ceil(rank);
            const fraction = rank - lowerIndex;

            let value;
            if (lowerIndex === upperIndex) {
                value = sorted[lowerIndex];
            } else {
                value = sorted[lowerIndex] + fraction * (sorted[upperIndex] - sorted[lowerIndex]);
            }

            result[`p${p}`] = value;
        }

        return result;
    }

    /**
     * Calculate confidence interval for mean using t-distribution
     *
     * @param {Array<number>} samples - Array of numeric samples
     * @param {number} confidenceLevel - Confidence level (default: 0.95 for 95% CI)
     * @returns {Object} Confidence interval {lower, upper, margin}
     *
     * @example
     * const ci = stats.calculateConfidenceInterval([1, 2, 3, 4, 5], 0.95);
     * // Returns: {lower: 1.76, upper: 4.24, margin: 1.24}
     */
    calculateConfidenceInterval(samples, confidenceLevel = 0.95) {
        if (!samples || samples.length === 0) {
            throw new Error('Samples array is empty');
        }

        const n = samples.length;
        const mean = this.calculateMean(samples);
        const std = this.calculateStd(samples, mean);

        // Degrees of freedom
        const df = n - 1;

        // t-value for given confidence level (approximation using normal for df > 30)
        const alpha = 1 - confidenceLevel;
        const tValue = this._getTValue(df, alpha / 2);

        // Standard error of mean
        const sem = std / Math.sqrt(n);

        // Margin of error
        const margin = tValue * sem;

        return {
            lower: mean - margin,
            upper: mean + margin,
            margin: margin
        };
    }

    /**
     * Get t-value for confidence interval (approximation)
     * @private
     */
    _getTValue(df, alpha) {
        // For large df (>30), use normal approximation
        if (df > 30) {
            return this._getZValue(alpha);
        }

        // t-distribution critical values (two-tailed)
        // Table for common confidence levels
        const tTable = {
            1: { 0.025: 12.706, 0.05: 6.314 },
            2: { 0.025: 4.303, 0.05: 2.920 },
            3: { 0.025: 3.182, 0.05: 2.353 },
            4: { 0.025: 2.776, 0.05: 2.132 },
            5: { 0.025: 2.571, 0.05: 2.015 },
            6: { 0.025: 2.447, 0.05: 1.943 },
            7: { 0.025: 2.365, 0.05: 1.895 },
            8: { 0.025: 2.306, 0.05: 1.860 },
            9: { 0.025: 2.262, 0.05: 1.833 },
            10: { 0.025: 2.228, 0.05: 1.812 },
            15: { 0.025: 2.131, 0.05: 1.753 },
            20: { 0.025: 2.086, 0.05: 1.725 },
            25: { 0.025: 2.060, 0.05: 1.708 },
            30: { 0.025: 2.042, 0.05: 1.697 }
        };

        // Find closest df in table
        if (df in tTable && alpha in tTable[df]) {
            return tTable[df][alpha];
        }

        // Interpolate or use closest value
        const dfs = Object.keys(tTable).map(Number).sort((a, b) => a - b);
        const closestDf = dfs.reduce((prev, curr) => {
            return Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev;
        });

        if (closestDf in tTable && alpha in tTable[closestDf]) {
            return tTable[closestDf][alpha];
        }

        // Fallback to normal approximation
        return this._getZValue(alpha);
    }

    /**
     * Get z-value for normal distribution (inverse CDF approximation)
     * @private
     */
    _getZValue(alpha) {
        // Common z-values for confidence intervals
        const zTable = {
            0.005: 2.576,  // 99% CI
            0.01: 2.326,   // 98% CI
            0.025: 1.960,  // 95% CI
            0.05: 1.645,   // 90% CI
            0.10: 1.282    // 80% CI
        };

        if (alpha in zTable) {
            return zTable[alpha];
        }

        // Linear interpolation for intermediate values
        const alphas = Object.keys(zTable).map(Number).sort((a, b) => a - b);
        for (let i = 0; i < alphas.length - 1; i++) {
            if (alpha >= alphas[i] && alpha <= alphas[i + 1]) {
                const t = (alpha - alphas[i]) / (alphas[i + 1] - alphas[i]);
                return zTable[alphas[i]] + t * (zTable[alphas[i + 1]] - zTable[alphas[i]]);
            }
        }

        // Default to 95% CI
        return 1.960;
    }

    /**
     * Calculate coefficient of variation (CV = σ/μ)
     *
     * @param {Array<number>} samples - Array of numeric samples
     * @returns {number} Coefficient of variation (dimensionless)
     *
     * @example
     * const cv = stats.calculateCoefficientOfVariation([10, 12, 14, 16, 18]); // 0.2357
     */
    calculateCoefficientOfVariation(samples) {
        const mean = this.calculateMean(samples);
        const std = this.calculateStd(samples, mean);

        if (mean === 0) {
            throw new Error('Cannot calculate CV: mean is zero');
        }

        return std / Math.abs(mean);
    }

    /**
     * Calculate skewness (measure of asymmetry)
     *
     * @param {Array<number>} samples - Array of numeric samples
     * @returns {number} Skewness (0 = symmetric, >0 = right-skewed, <0 = left-skewed)
     *
     * @example
     * const skew = stats.calculateSkewness([1, 2, 3, 4, 10]); // Positive (right-skewed)
     */
    calculateSkewness(samples) {
        if (!samples || samples.length < 3) {
            throw new Error('Need at least 3 samples to calculate skewness');
        }

        const n = samples.length;
        const mean = this.calculateMean(samples);
        const std = this.calculateStd(samples, mean);

        if (std === 0) {
            return 0; // No skewness if no variance
        }

        const cubedDeviations = samples.map(x => Math.pow((x - mean) / std, 3));
        const sumCubedDeviations = cubedDeviations.reduce((acc, val) => acc + val, 0);

        // Sample skewness (adjusted for bias)
        const skewness = (n / ((n - 1) * (n - 2))) * sumCubedDeviations;

        return skewness;
    }

    /**
     * Calculate kurtosis (measure of tailedness)
     *
     * @param {Array<number>} samples - Array of numeric samples
     * @returns {number} Excess kurtosis (0 = normal, >0 = heavy tails, <0 = light tails)
     *
     * @example
     * const kurt = stats.calculateKurtosis([1, 2, 3, 4, 5]); // ~0 (normal-like)
     */
    calculateKurtosis(samples) {
        if (!samples || samples.length < 4) {
            throw new Error('Need at least 4 samples to calculate kurtosis');
        }

        const n = samples.length;
        const mean = this.calculateMean(samples);
        const std = this.calculateStd(samples, mean);

        if (std === 0) {
            return 0; // No kurtosis if no variance
        }

        const fourthPowerDeviations = samples.map(x => Math.pow((x - mean) / std, 4));
        const sumFourthPowerDeviations = fourthPowerDeviations.reduce((acc, val) => acc + val, 0);

        // Sample kurtosis (adjusted for bias, excess kurtosis)
        const kurtosis = (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * sumFourthPowerDeviations -
                         (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));

        return kurtosis;
    }

    /**
     * Compute comprehensive statistics for Monte Carlo results
     *
     * @param {Array<number>} samples - Array of numeric samples
     * @param {Object} options - Optional configuration {confidenceLevel, percentiles}
     * @returns {Object} Complete statistical summary
     *
     * @example
     * const stats = analysis.computeStatistics([1, 2, 3, 4, 5], {confidenceLevel: 0.95});
     */
    computeStatistics(samples, options = {}) {
        if (!samples || samples.length === 0) {
            throw new Error('Samples array is empty');
        }

        const confidenceLevel = options.confidenceLevel || this.config.defaultConfidenceLevel;
        const percentiles = options.percentiles || this.config.defaultPercentiles;

        const mean = this.calculateMean(samples);
        const variance = this.calculateVariance(samples, mean);
        const std = Math.sqrt(variance);
        const ci = this.calculateConfidenceInterval(samples, confidenceLevel);
        const pcts = this.calculatePercentiles(samples, percentiles);

        // Calculate additional metrics
        const min = Math.min(...samples);
        const max = Math.max(...samples);
        const range = max - min;

        let cv, skewness, kurtosis;
        try {
            cv = this.calculateCoefficientOfVariation(samples);
        } catch {
            cv = null;
        }

        try {
            skewness = samples.length >= 3 ? this.calculateSkewness(samples) : null;
        } catch {
            skewness = null;
        }

        try {
            kurtosis = samples.length >= 4 ? this.calculateKurtosis(samples) : null;
        } catch {
            kurtosis = null;
        }

        return {
            n: samples.length,
            mean: mean,
            median: pcts.p50,
            mode: null, // Would require binning for continuous data
            std: std,
            variance: variance,
            min: min,
            max: max,
            range: range,
            coefficientOfVariation: cv,
            skewness: skewness,
            kurtosis: kurtosis,
            confidenceInterval: {
                level: confidenceLevel,
                lower: ci.lower,
                upper: ci.upper,
                margin: ci.margin
            },
            percentiles: pcts,
            standardError: std / Math.sqrt(samples.length)
        };
    }

    /**
     * Analyze Monte Carlo results for all output variables
     *
     * @param {Object} mcResults - Results from MonteCarloSimulation.simulate()
     * @param {Object} options - Optional configuration
     * @returns {Object} Statistical analysis for each variable
     *
     * @example
     * const analysis = stats.analyzeMonteCarloResults(mcResults);
     * console.log(analysis.craterDiameter.mean); // Mean crater diameter
     */
    analyzeMonteCarloResults(mcResults, options = {}) {
        const variables = {
            craterDiameter: mcResults.craterDiameters,
            craterDepth: mcResults.craterDepths,
            impactEnergy: mcResults.impactEnergies,
            seismicMagnitude: mcResults.seismicMagnitudes,
            blastRadius: mcResults.blastRadii
        };

        const analysis = {};

        for (const [varName, samples] of Object.entries(variables)) {
            if (samples && samples.length > 0) {
                analysis[varName] = this.computeStatistics(samples, options);
            } else {
                analysis[varName] = null;
            }
        }

        // Add metadata
        analysis.metadata = {
            totalSamples: mcResults.metadata.n_samples,
            successfulSamples: mcResults.metadata.successfulSamples,
            failedSamples: mcResults.metadata.failedSamples,
            successRate: mcResults.metadata.successRate,
            timestamp: new Date().toISOString()
        };

        return analysis;
    }

    /**
     * Format statistics for human-readable display
     *
     * @param {Object} stats - Statistics from computeStatistics()
     * @param {string} unit - Unit of measurement (e.g., 'm', 'km', 'J')
     * @param {number} precision - Number of significant figures
     * @returns {Object} Formatted statistics with units
     */
    formatStatistics(stats, unit = '', precision = 3) {
        const format = (value, prec = precision) => {
            if (value === null || value === undefined) return 'N/A';
            return value.toPrecision(prec) + (unit ? ' ' + unit : '');
        };

        return {
            count: stats.n,
            mean: format(stats.mean),
            median: format(stats.median),
            std: format(stats.std),
            range: `${format(stats.min)} - ${format(stats.max)}`,
            cv: stats.coefficientOfVariation ? (stats.coefficientOfVariation * 100).toFixed(1) + '%' : 'N/A',
            confidenceInterval95: `[${format(stats.confidenceInterval.lower)}, ${format(stats.confidenceInterval.upper)}]`,
            percentiles: {
                p5: format(stats.percentiles.p5),
                p25: format(stats.percentiles.p25),
                p50: format(stats.percentiles.p50),
                p75: format(stats.percentiles.p75),
                p95: format(stats.percentiles.p95)
            }
        };
    }
}

module.exports = StatisticalAnalysis;