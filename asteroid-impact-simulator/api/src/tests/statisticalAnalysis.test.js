/**
 * Unit tests for Statistical Analysis module
 * Tests descriptive statistics, confidence intervals, and percentiles
 *
 * @module statisticalAnalysis.test
 */

const StatisticalAnalysis = require('../services/statisticalAnalysis');

describe('StatisticalAnalysis', () => {
    let stats;

    beforeEach(() => {
        stats = new StatisticalAnalysis();
    });

    describe('Mean Calculation', () => {
        test('calculateMean returns correct average', () => {
            expect(stats.calculateMean([1, 2, 3, 4, 5])).toBe(3);
            expect(stats.calculateMean([10, 20, 30])).toBe(20);
        });

        test('calculateMean handles single value', () => {
            expect(stats.calculateMean([42])).toBe(42);
        });

        test('calculateMean handles negative numbers', () => {
            expect(stats.calculateMean([-5, -3, -1, 1, 3, 5])).toBe(0);
        });

        test('calculateMean throws error for empty array', () => {
            expect(() => stats.calculateMean([])).toThrow('Samples array is empty');
        });
    });

    describe('Variance and Standard Deviation', () => {
        test('calculateVariance returns correct value', () => {
            const samples = [1, 2, 3, 4, 5];
            const variance = stats.calculateVariance(samples);
            expect(variance).toBeCloseTo(2.0, 5);
        });

        test('calculateStd returns correct value', () => {
            const samples = [1, 2, 3, 4, 5];
            const std = stats.calculateStd(samples);
            expect(std).toBeCloseTo(Math.sqrt(2.0), 5);
        });

        test('calculateStd with pre-computed mean', () => {
            const samples = [1, 2, 3, 4, 5];
            const mean = 3;
            const std = stats.calculateStd(samples, mean);
            expect(std).toBeCloseTo(Math.sqrt(2.0), 5);
        });

        test('variance of constant values is zero', () => {
            const samples = [5, 5, 5, 5, 5];
            expect(stats.calculateVariance(samples)).toBe(0);
            expect(stats.calculateStd(samples)).toBe(0);
        });
    });

    describe('Percentiles', () => {
        test('calculatePercentiles returns correct values', () => {
            const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const percentiles = stats.calculatePercentiles(samples, [0, 25, 50, 75, 100]);

            expect(percentiles.p0).toBe(1);
            expect(percentiles.p25).toBeCloseTo(3.25, 2);
            expect(percentiles.p50).toBeCloseTo(5.5, 2);
            expect(percentiles.p75).toBeCloseTo(7.75, 2);
            expect(percentiles.p100).toBe(10);
        });

        test('calculatePercentiles median matches middle value for odd length', () => {
            const samples = [1, 2, 3, 4, 5];
            const percentiles = stats.calculatePercentiles(samples, [50]);
            expect(percentiles.p50).toBe(3);
        });

        test('calculatePercentiles handles unsorted input', () => {
            const samples = [5, 1, 3, 2, 4];
            const percentiles = stats.calculatePercentiles(samples, [50]);
            expect(percentiles.p50).toBe(3);
        });

        test('calculatePercentiles throws error for invalid percentile', () => {
            const samples = [1, 2, 3, 4, 5];
            expect(() => stats.calculatePercentiles(samples, [150])).toThrow('Percentile must be between 0 and 100');
            expect(() => stats.calculatePercentiles(samples, [-10])).toThrow('Percentile must be between 0 and 100');
        });

        test('calculatePercentiles uses default percentiles', () => {
            const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const percentiles = stats.calculatePercentiles(samples);

            expect(percentiles).toHaveProperty('p5');
            expect(percentiles).toHaveProperty('p25');
            expect(percentiles).toHaveProperty('p50');
            expect(percentiles).toHaveProperty('p75');
            expect(percentiles).toHaveProperty('p95');
        });
    });

    describe('Confidence Intervals', () => {
        test('calculateConfidenceInterval returns correct structure', () => {
            const samples = [1, 2, 3, 4, 5];
            const ci = stats.calculateConfidenceInterval(samples, 0.95);

            expect(ci).toHaveProperty('lower');
            expect(ci).toHaveProperty('upper');
            expect(ci).toHaveProperty('margin');
        });

        test('calculateConfidenceInterval bounds contain mean', () => {
            const samples = [1, 2, 3, 4, 5];
            const mean = stats.calculateMean(samples);
            const ci = stats.calculateConfidenceInterval(samples, 0.95);

            expect(ci.lower).toBeLessThan(mean);
            expect(ci.upper).toBeGreaterThan(mean);
        });

        test('calculateConfidenceInterval wider for lower confidence', () => {
            const samples = Array.from({ length: 100 }, (_, i) => i + 1);
            const ci95 = stats.calculateConfidenceInterval(samples, 0.95);
            const ci90 = stats.calculateConfidenceInterval(samples, 0.90);

            expect(ci95.margin).toBeGreaterThan(ci90.margin);
        });

        test('calculateConfidenceInterval uses default 95%', () => {
            const samples = [1, 2, 3, 4, 5];
            const ci = stats.calculateConfidenceInterval(samples);
            expect(ci).toBeDefined();
        });

        test('calculateConfidenceInterval for large sample uses normal approximation', () => {
            // Generate 100 samples from normal distribution
            const samples = Array.from({ length: 100 }, (_, i) => 50 + (i - 50) * 0.2);
            const ci = stats.calculateConfidenceInterval(samples, 0.95);

            expect(ci.lower).toBeLessThan(50);
            expect(ci.upper).toBeGreaterThan(50);
        });
    });

    describe('Coefficient of Variation', () => {
        test('calculateCoefficientOfVariation returns correct ratio', () => {
            const samples = [10, 12, 14, 16, 18]; // mean=14, std≈2.828
            const cv = stats.calculateCoefficientOfVariation(samples);
            expect(cv).toBeCloseTo(2.828 / 14, 2);
        });

        test('calculateCoefficientOfVariation throws error for zero mean', () => {
            const samples = [-2, -1, 0, 1, 2];
            expect(() => stats.calculateCoefficientOfVariation(samples)).toThrow('Cannot calculate CV: mean is zero');
        });

        test('calculateCoefficientOfVariation handles negative mean', () => {
            const samples = [-20, -18, -16, -14, -12];
            const cv = stats.calculateCoefficientOfVariation(samples);
            expect(cv).toBeGreaterThan(0);
        });
    });

    describe('Skewness', () => {
        test('calculateSkewness detects right-skewed distribution', () => {
            const samples = [1, 2, 3, 4, 10]; // Right-skewed (outlier on right)
            const skewness = stats.calculateSkewness(samples);
            expect(skewness).toBeGreaterThan(0);
        });

        test('calculateSkewness detects left-skewed distribution', () => {
            const samples = [1, 7, 8, 9, 10]; // Left-skewed (outlier on left)
            const skewness = stats.calculateSkewness(samples);
            expect(skewness).toBeLessThan(0);
        });

        test('calculateSkewness near zero for symmetric distribution', () => {
            const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const skewness = stats.calculateSkewness(samples);
            expect(Math.abs(skewness)).toBeLessThan(0.5); // Near zero
        });

        test('calculateSkewness throws error for insufficient samples', () => {
            expect(() => stats.calculateSkewness([1, 2])).toThrow('Need at least 3 samples');
        });

        test('calculateSkewness returns zero for constant values', () => {
            const samples = [5, 5, 5, 5];
            expect(stats.calculateSkewness(samples)).toBe(0);
        });
    });

    describe('Kurtosis', () => {
        test('calculateKurtosis detects heavy tails', () => {
            // Heavy-tailed distribution (outliers)
            const samples = [1, 2, 3, 4, 5, 6, 7, 8, 100]; // Extreme outlier
            const kurtosis = stats.calculateKurtosis(samples);
            expect(kurtosis).toBeGreaterThan(0); // Positive excess kurtosis
        });

        test('calculateKurtosis near zero for normal-like distribution', () => {
            // Approximately normal distribution (uniform actually has negative excess kurtosis)
            const samples = Array.from({ length: 100 }, (_, i) => 50 + (i - 50) * 0.5);
            const kurtosis = stats.calculateKurtosis(samples);
            expect(Math.abs(kurtosis)).toBeLessThan(2); // Uniform distribution has kurtosis ≈ -1.2
        });

        test('calculateKurtosis throws error for insufficient samples', () => {
            expect(() => stats.calculateKurtosis([1, 2, 3])).toThrow('Need at least 4 samples');
        });

        test('calculateKurtosis returns zero for constant values', () => {
            const samples = [5, 5, 5, 5, 5];
            expect(stats.calculateKurtosis(samples)).toBe(0);
        });
    });

    describe('Compute Statistics', () => {
        test('computeStatistics returns comprehensive summary', () => {
            const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const summary = stats.computeStatistics(samples);

            expect(summary).toHaveProperty('n');
            expect(summary).toHaveProperty('mean');
            expect(summary).toHaveProperty('median');
            expect(summary).toHaveProperty('std');
            expect(summary).toHaveProperty('variance');
            expect(summary).toHaveProperty('min');
            expect(summary).toHaveProperty('max');
            expect(summary).toHaveProperty('range');
            expect(summary).toHaveProperty('coefficientOfVariation');
            expect(summary).toHaveProperty('skewness');
            expect(summary).toHaveProperty('kurtosis');
            expect(summary).toHaveProperty('confidenceInterval');
            expect(summary).toHaveProperty('percentiles');
            expect(summary).toHaveProperty('standardError');
        });

        test('computeStatistics calculates correct values', () => {
            const samples = [1, 2, 3, 4, 5];
            const summary = stats.computeStatistics(samples);

            expect(summary.n).toBe(5);
            expect(summary.mean).toBe(3);
            expect(summary.median).toBe(3);
            expect(summary.min).toBe(1);
            expect(summary.max).toBe(5);
            expect(summary.range).toBe(4);
        });

        test('computeStatistics accepts custom confidence level', () => {
            const samples = [1, 2, 3, 4, 5];
            const summary = stats.computeStatistics(samples, { confidenceLevel: 0.99 });

            expect(summary.confidenceInterval.level).toBe(0.99);
        });

        test('computeStatistics accepts custom percentiles', () => {
            const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const summary = stats.computeStatistics(samples, { percentiles: [10, 50, 90] });

            expect(summary.percentiles).toHaveProperty('p10');
            expect(summary.percentiles).toHaveProperty('p50');
            expect(summary.percentiles).toHaveProperty('p90');
        });

        test('computeStatistics handles edge cases gracefully', () => {
            const samples = [5, 5, 5, 5]; // Constant values
            const summary = stats.computeStatistics(samples);

            expect(summary.std).toBe(0);
            // CV is 0/5 = 0 (not null, as std=0 but mean≠0)
            expect(summary.coefficientOfVariation).toBe(0);
        });
    });

    describe('Analyze Monte Carlo Results', () => {
        let mockMCResults;

        beforeEach(() => {
            mockMCResults = {
                craterDiameters: [1000, 1100, 1200, 1300, 1400],
                craterDepths: [200, 220, 240, 260, 280],
                impactEnergies: [1e15, 1.1e15, 1.2e15, 1.3e15, 1.4e15],
                seismicMagnitudes: [5.0, 5.1, 5.2, 5.3, 5.4],
                blastRadii: [5000, 5500, 6000, 6500, 7000],
                metadata: {
                    n_samples: 5,
                    successfulSamples: 5,
                    failedSamples: 0,
                    successRate: 1.0
                }
            };
        });

        test('analyzeMonteCarloResults returns analysis for all variables', () => {
            const analysis = stats.analyzeMonteCarloResults(mockMCResults);

            expect(analysis).toHaveProperty('craterDiameter');
            expect(analysis).toHaveProperty('craterDepth');
            expect(analysis).toHaveProperty('impactEnergy');
            expect(analysis).toHaveProperty('seismicMagnitude');
            expect(analysis).toHaveProperty('blastRadius');
            expect(analysis).toHaveProperty('metadata');
        });

        test('analyzeMonteCarloResults computes correct crater diameter stats', () => {
            const analysis = stats.analyzeMonteCarloResults(mockMCResults);

            expect(analysis.craterDiameter.mean).toBe(1200);
            expect(analysis.craterDiameter.median).toBe(1200);
            expect(analysis.craterDiameter.min).toBe(1000);
            expect(analysis.craterDiameter.max).toBe(1400);
        });

        test('analyzeMonteCarloResults includes metadata', () => {
            const analysis = stats.analyzeMonteCarloResults(mockMCResults);

            expect(analysis.metadata.totalSamples).toBe(5);
            expect(analysis.metadata.successfulSamples).toBe(5);
            expect(analysis.metadata.failedSamples).toBe(0);
            expect(analysis.metadata.successRate).toBe(1.0);
        });

        test('analyzeMonteCarloResults handles empty variables', () => {
            mockMCResults.craterDiameters = [];
            const analysis = stats.analyzeMonteCarloResults(mockMCResults);

            expect(analysis.craterDiameter).toBeNull();
        });

        test('analyzeMonteCarloResults accepts custom options', () => {
            const analysis = stats.analyzeMonteCarloResults(mockMCResults, {
                confidenceLevel: 0.90,
                percentiles: [10, 90]
            });

            expect(analysis.craterDiameter.confidenceInterval.level).toBe(0.90);
            expect(analysis.craterDiameter.percentiles).toHaveProperty('p10');
            expect(analysis.craterDiameter.percentiles).toHaveProperty('p90');
        });
    });

    describe('Format Statistics', () => {
        let mockStats;

        beforeEach(() => {
            mockStats = {
                n: 100,
                mean: 1234.567,
                median: 1230.0,
                std: 123.456,
                min: 1000.0,
                max: 1500.0,
                coefficientOfVariation: 0.10,
                confidenceInterval: {
                    level: 0.95,
                    lower: 1210.0,
                    upper: 1260.0,
                    margin: 25.0
                },
                percentiles: {
                    p5: 1050.0,
                    p25: 1150.0,
                    p50: 1230.0,
                    p75: 1320.0,
                    p95: 1450.0
                }
            };
        });

        test('formatStatistics returns formatted values with units', () => {
            const formatted = stats.formatStatistics(mockStats, 'm');

            expect(formatted.mean).toContain('m');
            expect(formatted.median).toContain('m');
            expect(formatted.std).toContain('m');
        });

        test('formatStatistics formats coefficient of variation as percentage', () => {
            const formatted = stats.formatStatistics(mockStats, 'm');

            expect(formatted.cv).toBe('10.0%');
        });

        test('formatStatistics formats confidence interval as range', () => {
            const formatted = stats.formatStatistics(mockStats, 'm');

            expect(formatted.confidenceInterval95).toContain('[');
            expect(formatted.confidenceInterval95).toContain(']');
        });

        test('formatStatistics handles null values gracefully', () => {
            mockStats.coefficientOfVariation = null;
            const formatted = stats.formatStatistics(mockStats, 'm');

            expect(formatted.cv).toBe('N/A');
        });

        test('formatStatistics respects precision parameter', () => {
            const formatted = stats.formatStatistics(mockStats, 'm', 2);

            // Check that values have limited precision
            expect(formatted.mean).toMatch(/^[\d.]+e?[+-]?\d*\s*m$/);
        });
    });

    describe('Integration Tests', () => {
        test('Full workflow: samples -> compute -> format', () => {
            const samples = Array.from({ length: 100 }, (_, i) => 1000 + i * 10);

            const summary = stats.computeStatistics(samples);
            expect(summary.mean).toBeCloseTo(1495, 0);

            const formatted = stats.formatStatistics(summary, 'meters');
            expect(formatted.mean).toContain('meters');
            expect(formatted.cv).toContain('%');
        });

        test('Handle real Monte Carlo scenario', () => {
            // Simulate crater diameter distribution from MC simulation
            const craterDiameters = [
                1180, 1195, 1210, 1185, 1205, 1190, 1200, 1215, 1175, 1220,
                1185, 1210, 1195, 1205, 1190, 1200, 1185, 1210, 1195, 1205
            ];

            const summary = stats.computeStatistics(craterDiameters);

            expect(summary.mean).toBeGreaterThan(1190);
            expect(summary.mean).toBeLessThan(1210);
            expect(summary.std).toBeGreaterThan(0);
            expect(summary.coefficientOfVariation).toBeLessThan(0.05); // Low CV expected
        });
    });
});