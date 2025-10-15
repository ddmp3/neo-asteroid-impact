/**
 * Unit tests for Uncertainty Quantification module
 * Tests distribution sampling, statistical properties, and performance
 *
 * @module uncertaintyQuantification.test
 */

const UncertaintyQuantification = require('../services/uncertaintyQuantification');

describe('UncertaintyQuantification', () => {
    let uq;

    beforeEach(() => {
        uq = new UncertaintyQuantification();
    });

    describe('Normal Distribution', () => {
        test('sampleNormal generates correct number of samples', () => {
            const samples = uq.sampleNormal(100, 10, 1000);
            expect(samples).toHaveLength(1000);
        });

        test('sampleNormal mean converges to expected value', () => {
            const mean = 100;
            const std = 10;
            const samples = uq.sampleNormal(mean, std, 10000);

            const sampleMean = samples.reduce((a, b) => a + b) / samples.length;

            // Within 3 standard errors: 3σ/√n = 3*10/√10000 = 0.3
            expect(Math.abs(sampleMean - mean)).toBeLessThan(0.5);
        });

        test('sampleNormal std converges to expected value', () => {
            const mean = 100;
            const std = 10;
            const samples = uq.sampleNormal(mean, std, 10000);

            const sampleMean = samples.reduce((a, b) => a + b) / samples.length;
            const variance = samples.reduce((sum, x) => sum + Math.pow(x - sampleMean, 2), 0) / samples.length;
            const sampleStd = Math.sqrt(variance);

            // Within reasonable tolerance
            expect(Math.abs(sampleStd - std)).toBeLessThan(0.5);
        });

        test('sampleNormal throws error for invalid std', () => {
            expect(() => uq.sampleNormal(100, 0, 1000)).toThrow('Standard deviation must be positive');
            expect(() => uq.sampleNormal(100, -5, 1000)).toThrow('Standard deviation must be positive');
        });

        test('sampleNormal throws error for invalid n_samples', () => {
            expect(() => uq.sampleNormal(100, 10, 0)).toThrow('n_samples must be >= 1');
            expect(() => uq.sampleNormal(100, 10, -1)).toThrow('n_samples must be >= 1');
        });
    });

    describe('Uniform Distribution', () => {
        test('sampleUniform generates correct number of samples', () => {
            const samples = uq.sampleUniform(5, 75, 1000);
            expect(samples).toHaveLength(1000);
        });

        test('sampleUniform samples are within bounds', () => {
            const min = 5;
            const max = 75;
            const samples = uq.sampleUniform(min, max, 1000);

            samples.forEach(sample => {
                expect(sample).toBeGreaterThanOrEqual(min);
                expect(sample).toBeLessThanOrEqual(max);
            });
        });

        test('sampleUniform mean converges to (min+max)/2', () => {
            const min = 5;
            const max = 75;
            const samples = uq.sampleUniform(min, max, 10000);

            const sampleMean = samples.reduce((a, b) => a + b) / samples.length;
            const expectedMean = (min + max) / 2;

            // Uniform std = (max-min)/√12, SE = std/√n
            const expectedStd = (max - min) / Math.sqrt(12);
            const standardError = expectedStd / Math.sqrt(samples.length);

            expect(Math.abs(sampleMean - expectedMean)).toBeLessThan(3 * standardError);
        });

        test('sampleUniform throws error for invalid bounds', () => {
            expect(() => uq.sampleUniform(75, 5, 1000)).toThrow('max must be > min');
            expect(() => uq.sampleUniform(50, 50, 1000)).toThrow('max must be > min');
        });

        test('sampleUniform throws error for invalid n_samples', () => {
            expect(() => uq.sampleUniform(5, 75, 0)).toThrow('n_samples must be >= 1');
        });
    });

    describe('Log-Normal Distribution', () => {
        test('sampleLogNormal generates correct number of samples', () => {
            const samples = uq.sampleLogNormal(6.91, 0.5, 1000);
            expect(samples).toHaveLength(1000);
        });

        test('sampleLogNormal samples are positive', () => {
            const samples = uq.sampleLogNormal(4.0, 1.0, 1000);

            samples.forEach(sample => {
                expect(sample).toBeGreaterThan(0);
            });
        });

        test('sampleLogNormal median converges to exp(μ)', () => {
            const mu = 6.91; // log(1000) ≈ 6.91
            const sigma = 0.3;
            const samples = uq.sampleLogNormal(mu, sigma, 10000);

            // Median of LN(μ, σ²) is exp(μ)
            const sortedSamples = samples.sort((a, b) => a - b);
            const median = sortedSamples[Math.floor(samples.length / 2)];
            const expectedMedian = Math.exp(mu);

            // Within 5% tolerance
            expect(Math.abs(median - expectedMedian) / expectedMedian).toBeLessThan(0.05);
        });

        test('sampleLogNormal throws error for invalid sigma', () => {
            expect(() => uq.sampleLogNormal(6.91, 0, 1000)).toThrow('sigma must be positive');
            expect(() => uq.sampleLogNormal(6.91, -0.5, 1000)).toThrow('sigma must be positive');
        });
    });

    describe('Truncated Normal Distribution', () => {
        test('sampleTruncatedNormal generates correct number of samples', () => {
            const samples = uq.sampleTruncatedNormal(45, 15, 0, 90, 1000);
            expect(samples).toHaveLength(1000);
        });

        test('sampleTruncatedNormal samples are within bounds', () => {
            const mean = 45;
            const std = 15;
            const min = 0;
            const max = 90;
            const samples = uq.sampleTruncatedNormal(mean, std, min, max, 1000);

            samples.forEach(sample => {
                expect(sample).toBeGreaterThanOrEqual(min);
                expect(sample).toBeLessThanOrEqual(max);
            });
        });

        test('sampleTruncatedNormal mean is biased toward bounds when heavily truncated', () => {
            // Truncate N(60, 15²) to [0, 50] - moderately left-truncated
            const samples = uq.sampleTruncatedNormal(60, 15, 0, 50, 10000);

            const sampleMean = samples.reduce((a, b) => a + b) / samples.length;

            // Mean should be below 60 due to truncation (cutting off right tail)
            expect(sampleMean).toBeLessThan(60);
            expect(sampleMean).toBeGreaterThan(20);
        });

        test('sampleTruncatedNormal throws error for unreasonable bounds', () => {
            // Try to sample N(100, 1²) truncated to [0, 10] - almost impossible
            expect(() => {
                uq.sampleTruncatedNormal(100, 1, 0, 10, 1000);
            }).toThrow(/Truncated normal sampling failed/);
        });

        test('sampleTruncatedNormal throws error for invalid parameters', () => {
            expect(() => uq.sampleTruncatedNormal(45, 0, 0, 90, 1000)).toThrow('Standard deviation must be positive');
            expect(() => uq.sampleTruncatedNormal(45, 15, 90, 0, 1000)).toThrow('max must be > min');
        });
    });

    describe('Parameter Distribution Definition', () => {
        test('defineParameterDistributions creates correct structure', () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870
            };

            const uncertaintyConfig = {
                diameter: { type: 'normal', std: 5 },
                velocity: { type: 'uniform', min: 12, max: 18 },
                angle: { type: 'truncatedNormal', std: 10, min: 0, max: 90 },
                density: { type: 'normal', std: 100 }
            };

            const distributions = uq.defineParameterDistributions(nominalParams, uncertaintyConfig);

            expect(distributions.diameter).toEqual({
                nominal: 50,
                type: 'normal',
                std: 5
            });

            expect(distributions.velocity).toEqual({
                nominal: 15,
                type: 'uniform',
                min: 12,
                max: 18
            });
        });

        test('defineParameterDistributions throws error for missing parameter', () => {
            const nominalParams = { diameter: 50 };
            const uncertaintyConfig = {
                diameter: { type: 'normal', std: 5 },
                velocity: { type: 'normal', std: 2 } // velocity not in nominalParams
            };

            expect(() => {
                uq.defineParameterDistributions(nominalParams, uncertaintyConfig);
            }).toThrow('Parameter velocity not found in nominalParams');
        });
    });

    describe('Parameter Sampling', () => {
        test('sampleParameters generates correct structure', () => {
            const distributions = {
                diameter: { nominal: 50, type: 'normal', std: 5 },
                velocity: { nominal: 15, type: 'uniform', min: 12, max: 18 }
            };

            const samples = uq.sampleParameters(distributions, 1000);

            expect(samples.diameter).toHaveLength(1000);
            expect(samples.velocity).toHaveLength(1000);
        });

        test('sampleParameters respects distribution types', () => {
            const distributions = {
                diameter: { nominal: 50, type: 'normal', std: 5 },
                velocity: { nominal: 15, type: 'uniform', min: 12, max: 18 },
                angle: { nominal: 45, type: 'truncatedNormal', std: 10, min: 0, max: 90 }
            };

            const samples = uq.sampleParameters(distributions, 1000);

            // Velocity samples should all be in [12, 18]
            samples.velocity.forEach(v => {
                expect(v).toBeGreaterThanOrEqual(12);
                expect(v).toBeLessThanOrEqual(18);
            });

            // Angle samples should all be in [0, 90]
            samples.angle.forEach(a => {
                expect(a).toBeGreaterThanOrEqual(0);
                expect(a).toBeLessThanOrEqual(90);
            });
        });

        test('sampleParameters throws error for unknown distribution type', () => {
            const distributions = {
                diameter: { nominal: 50, type: 'weibull', shape: 2 } // Unsupported
            };

            expect(() => {
                uq.sampleParameters(distributions, 1000);
            }).toThrow('Unknown distribution type: weibull');
        });
    });

    describe('Performance Validation', () => {
        test('validatePerformance completes in < 1 second', () => {
            const result = uq.validatePerformance();

            expect(result.success).toBe(true);
            expect(result.duration_ms).toBeLessThan(1000);
            expect(result.samples_per_sec).toBeGreaterThan(1000);
        });

        test('validatePerformance returns correct structure', () => {
            const result = uq.validatePerformance();

            expect(result).toHaveProperty('duration_ms');
            expect(result).toHaveProperty('samples_per_sec');
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('message');
            expect(typeof result.duration_ms).toBe('number');
            expect(typeof result.samples_per_sec).toBe('number');
            expect(typeof result.success).toBe('boolean');
            expect(typeof result.message).toBe('string');
        });
    });

    describe('Integration Tests', () => {
        test('Full workflow: define distributions -> sample -> validate statistics', () => {
            // 1. Define nominal parameters
            const nominalParams = {
                diameter: 50, // meters
                velocity: 15, // km/s
                angle: 45,    // degrees
                density: 7870 // kg/m³ (iron)
            };

            // 2. Define uncertainties
            const uncertaintyConfig = {
                diameter: { type: 'normal', std: 5 },           // ±10% uncertainty
                velocity: { type: 'uniform', min: 12, max: 18 }, // ±20% range
                angle: { type: 'truncatedNormal', std: 10, min: 0, max: 90 },
                density: { type: 'normal', std: 100 }            // ±1.3% uncertainty
            };

            // 3. Create distributions
            const distributions = uq.defineParameterDistributions(nominalParams, uncertaintyConfig);

            // 4. Sample parameters
            const samples = uq.sampleParameters(distributions, 5000);

            // 5. Validate statistics
            // Diameter mean should be close to 50
            const diameterMean = samples.diameter.reduce((a, b) => a + b) / samples.diameter.length;
            expect(Math.abs(diameterMean - 50)).toBeLessThan(0.5);

            // Velocity should be uniformly distributed in [12, 18]
            const velocityMean = samples.velocity.reduce((a, b) => a + b) / samples.velocity.length;
            expect(Math.abs(velocityMean - 15)).toBeLessThan(0.2);

            // All angles should be in [0, 90]
            samples.angle.forEach(a => {
                expect(a).toBeGreaterThanOrEqual(0);
                expect(a).toBeLessThanOrEqual(90);
            });

            // Density mean should be close to 7870
            const densityMean = samples.density.reduce((a, b) => a + b) / samples.density.length;
            expect(Math.abs(densityMean - 7870)).toBeLessThan(10);
        });
    });
});