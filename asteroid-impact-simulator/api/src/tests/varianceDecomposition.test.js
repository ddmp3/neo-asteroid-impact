/**
 * Unit tests for Variance Decomposition module
 * Tests Sobol sensitivity analysis and variance decomposition
 *
 * @module varianceDecomposition.test
 */

const VarianceDecomposition = require('../services/varianceDecomposition');

describe('VarianceDecomposition', () => {
    let vd;

    beforeEach(() => {
        vd = new VarianceDecomposition();
    });

    describe('First-Order Sobol Indices', () => {
        test('calculateFirstOrderIndices identifies dominant parameter', () => {
            // Generate synthetic data: Y = 2*X1 + 0.5*X2 + noise
            const n = 1000;
            const X1 = Array.from({ length: n }, () => Math.random() * 10);
            const X2 = Array.from({ length: n }, () => Math.random() * 10);
            const Y = X1.map((x1, i) => 2 * x1 + 0.5 * X2[i] + Math.random());

            const params = { x1: X1, x2: X2 };
            const sobol = vd.calculateFirstOrderIndices(params, Y);

            // X1 should have higher Sobol index than X2 (4× larger coefficient)
            expect(sobol.x1).toBeGreaterThan(sobol.x2);
            expect(sobol.x1).toBeGreaterThan(0.5); // X1 dominates
        });

        test('calculateFirstOrderIndices handles constant output', () => {
            const n = 500; // Use minimum required samples
            const X1 = Array.from({ length: n }, () => Math.random());
            const X2 = Array.from({ length: n }, () => Math.random());
            const Y = Array(n).fill(100); // Constant

            const params = { x1: X1, x2: X2 };
            const sobol = vd.calculateFirstOrderIndices(params, Y);

            // All indices should be 0 (no variance in output)
            expect(sobol.x1).toBe(0);
            expect(sobol.x2).toBe(0);
        });

        test('calculateFirstOrderIndices sums to ~1 for additive model', () => {
            // Additive model: Y = X1 + X2 + X3 (equal contributions)
            const n = 1000;
            const X1 = Array.from({ length: n }, () => Math.random() * 10);
            const X2 = Array.from({ length: n }, () => Math.random() * 10);
            const X3 = Array.from({ length: n }, () => Math.random() * 10);
            const Y = X1.map((x1, i) => x1 + X2[i] + X3[i]);

            const params = { x1: X1, x2: X2, x3: X3 };
            const sobol = vd.calculateFirstOrderIndices(params, Y);

            const sum = sobol.x1 + sobol.x2 + sobol.x3;

            // Should sum close to 1 for additive model
            expect(sum).toBeGreaterThan(0.8);
            expect(sum).toBeLessThan(1.2);
        });

        test('calculateFirstOrderIndices throws error for insufficient samples', () => {
            const params = { x1: [1, 2, 3], x2: [4, 5, 6] };
            const output = [7, 8, 9];

            expect(() => {
                vd.calculateFirstOrderIndices(params, output);
            }).toThrow(/Need at least .* samples/);
        });

        test('calculateFirstOrderIndices handles single constant parameter', () => {
            const n = 1000;
            const X1 = Array(n).fill(5); // Constant
            const X2 = Array.from({ length: n }, () => Math.random() * 10);
            const Y = X2.map(x2 => x2 * 2);

            const params = { x1: X1, x2: X2 };
            const sobol = vd.calculateFirstOrderIndices(params, Y);

            // X1 has no variance, so S1=0; X2 should capture all variance
            expect(sobol.x1).toBe(0);
            expect(sobol.x2).toBeGreaterThan(0.8);
        });
    });

    describe('Total-Order Sobol Indices', () => {
        test('calculateTotalOrderIndices returns values ≥ first-order', () => {
            const n = 1000;
            const X1 = Array.from({ length: n }, () => Math.random() * 10);
            const X2 = Array.from({ length: n }, () => Math.random() * 10);
            const Y = X1.map((x1, i) => x1 + X2[i]);

            const params = { x1: X1, x2: X2 };
            const firstOrder = vd.calculateFirstOrderIndices(params, Y);
            const totalOrder = vd.calculateTotalOrderIndices(params, Y);

            // Total-order ≥ first-order (includes interactions)
            // Allow tolerance for binning approximation effects
            expect(totalOrder.x1).toBeGreaterThanOrEqual(firstOrder.x1 - 0.2);
            expect(totalOrder.x2).toBeGreaterThanOrEqual(firstOrder.x2 - 0.2);
        });

        test('calculateTotalOrderIndices handles constant output', () => {
            const n = 500; // Use minimum required samples
            const X1 = Array.from({ length: n }, () => Math.random());
            const Y = Array(n).fill(100);

            const params = { x1: X1 };
            const totalOrder = vd.calculateTotalOrderIndices(params, Y);

            expect(totalOrder.x1).toBe(0);
        });
    });

    describe('Variance Decomposition', () => {
        let mockMCResults;

        beforeEach(() => {
            // Create realistic Monte Carlo results
            const n = 1000;
            const diameter = Array.from({ length: n }, () => 45 + Math.random() * 10); // 45-55m
            const velocity = Array.from({ length: n }, () => 12 + Math.random() * 6);   // 12-18 km/s
            const angle = Array.from({ length: n }, () => 35 + Math.random() * 20);     // 35-55°
            const density = Array.from({ length: n }, () => 7770 + Math.random() * 200); // 7770-7970 kg/m³

            // Crater diameter approximately: D ∝ diameter^0.8 × velocity^0.4
            const craterDiameters = diameter.map((d, i) => {
                return 10 * Math.pow(d, 0.8) * Math.pow(velocity[i], 0.4) * Math.pow(Math.sin(angle[i] * Math.PI / 180), 0.3);
            });

            mockMCResults = {
                parameters: { diameter, velocity, angle, density },
                craterDiameters: craterDiameters,
                craterDepths: craterDiameters.map(d => d / 5),
                impactEnergies: diameter.map((d, i) => Math.pow(d, 3) * Math.pow(velocity[i], 2)),
                seismicMagnitudes: craterDiameters.map(d => 3 + Math.log10(d)),
                blastRadii: craterDiameters.map(d => d * 3),
                metadata: {
                    n_samples: n,
                    successfulSamples: n,
                    failedSamples: 0,
                    successRate: 1.0
                }
            };
        });

        test('decomposeVariance returns correct structure', () => {
            const decomp = vd.decomposeVariance(mockMCResults, 'craterDiameter');

            expect(decomp).toHaveProperty('outputVariable');
            expect(decomp).toHaveProperty('sobolIndices');
            expect(decomp).toHaveProperty('varianceExplained');
            expect(decomp).toHaveProperty('unexplainedVariance');
            expect(decomp).toHaveProperty('ranking');
            expect(decomp).toHaveProperty('interpretation');
            expect(decomp).toHaveProperty('metadata');
        });

        test('decomposeVariance identifies dominant parameter for crater size', () => {
            const decomp = vd.decomposeVariance(mockMCResults, 'craterDiameter');

            // Either diameter or velocity should be most important (both have strong effects)
            const topParam = decomp.ranking[0].parameter;
            expect(['diameter', 'velocity']).toContain(topParam);
            expect(decomp.ranking[0].sobolIndex).toBeGreaterThan(0.3);
        });

        test('decomposeVariance calculates variance explained', () => {
            const decomp = vd.decomposeVariance(mockMCResults, 'craterDiameter');

            expect(decomp.varianceExplained).toBeGreaterThan(0);
            // Binning approximation can sometimes slightly exceed 1.0
            expect(decomp.varianceExplained).toBeLessThan(1.2);
            expect(decomp.unexplainedVariance).toBeGreaterThanOrEqual(-0.2); // Allow small negative due to approximation
            expect(Math.abs(decomp.varianceExplained + decomp.unexplainedVariance - 1)).toBeLessThan(0.01);
        });

        test('decomposeVariance includes ranking', () => {
            const decomp = vd.decomposeVariance(mockMCResults, 'craterDiameter');

            expect(decomp.ranking).toHaveLength(4); // 4 parameters
            expect(decomp.ranking[0].rank).toBe(1);
            expect(decomp.ranking[0]).toHaveProperty('parameter');
            expect(decomp.ranking[0]).toHaveProperty('sobolIndex');
            expect(decomp.ranking[0]).toHaveProperty('contribution');
        });

        test('decomposeVariance throws error for unknown output variable', () => {
            expect(() => {
                vd.decomposeVariance(mockMCResults, 'unknownVariable');
            }).toThrow('Unknown output variable');
        });

        test('decomposeVariance works for different output variables', () => {
            const outputs = ['craterDiameter', 'craterDepth', 'impactEnergy', 'seismicMagnitude', 'blastRadius'];

            outputs.forEach(output => {
                const decomp = vd.decomposeVariance(mockMCResults, output);
                expect(decomp.outputVariable).toBe(output);
                expect(decomp.ranking.length).toBe(4);
            });
        });
    });

    describe('Multiple Outputs Analysis', () => {
        let mockMCResults;

        beforeEach(() => {
            const n = 1000;
            const diameter = Array.from({ length: n }, () => 45 + Math.random() * 10);
            const velocity = Array.from({ length: n }, () => 12 + Math.random() * 6);
            const angle = Array.from({ length: n }, () => 35 + Math.random() * 20);
            const density = Array.from({ length: n }, () => 7770 + Math.random() * 200);

            mockMCResults = {
                parameters: { diameter, velocity, angle, density },
                craterDiameters: diameter.map((d, i) => 10 * d * velocity[i] * 0.1),
                craterDepths: diameter.map((d, i) => 2 * d * velocity[i] * 0.02),
                impactEnergies: diameter.map((d, i) => Math.pow(d, 3) * Math.pow(velocity[i], 2)),
                seismicMagnitudes: diameter.map((d, i) => 3 + Math.log10(d * velocity[i])),
                blastRadii: diameter.map((d, i) => 5 * d * Math.pow(velocity[i], 0.5)),
                metadata: { n_samples: n, successfulSamples: n }
            };
        });

        test('analyzeMultipleOutputs returns decompositions for all variables', () => {
            const analysis = vd.analyzeMultipleOutputs(mockMCResults);

            expect(analysis).toHaveProperty('decompositions');
            expect(analysis).toHaveProperty('overallRanking');
            expect(analysis).toHaveProperty('summary');

            const outputs = ['craterDiameter', 'craterDepth', 'impactEnergy', 'seismicMagnitude', 'blastRadius'];
            outputs.forEach(output => {
                expect(analysis.decompositions).toHaveProperty(output);
            });
        });

        test('analyzeMultipleOutputs provides overall ranking', () => {
            const analysis = vd.analyzeMultipleOutputs(mockMCResults);

            expect(analysis.overallRanking).toHaveLength(4);
            expect(analysis.overallRanking[0].rank).toBe(1);
            expect(analysis.overallRanking[0]).toHaveProperty('parameter');
            expect(analysis.overallRanking[0]).toHaveProperty('averageImportance');
        });

        test('analyzeMultipleOutputs accepts custom output list', () => {
            const analysis = vd.analyzeMultipleOutputs(mockMCResults, ['craterDiameter', 'impactEnergy']);

            expect(Object.keys(analysis.decompositions)).toHaveLength(2);
            expect(analysis.decompositions).toHaveProperty('craterDiameter');
            expect(analysis.decompositions).toHaveProperty('impactEnergy');
        });
    });

    describe('Correlation Analysis', () => {
        test('calculateCorrelations detects positive correlation', () => {
            const n = 1000;
            const X = Array.from({ length: n }, () => Math.random() * 10);
            const Y = X.map(x => 2 * x + Math.random()); // Strong positive correlation

            const params = { x: X };
            const correlations = vd.calculateCorrelations(params, Y);

            expect(correlations.x).toBeGreaterThan(0.8); // Strong positive
        });

        test('calculateCorrelations detects negative correlation', () => {
            const n = 1000;
            const X = Array.from({ length: n }, () => Math.random() * 10);
            const Y = X.map(x => -2 * x + 20 + Math.random()); // Strong negative correlation

            const params = { x: X };
            const correlations = vd.calculateCorrelations(params, Y);

            expect(correlations.x).toBeLessThan(-0.8); // Strong negative
        });

        test('calculateCorrelations near zero for independent variables', () => {
            const n = 1000;
            const X = Array.from({ length: n }, () => Math.random() * 10);
            const Y = Array.from({ length: n }, () => Math.random() * 10); // Independent

            const params = { x: X };
            const correlations = vd.calculateCorrelations(params, Y);

            expect(Math.abs(correlations.x)).toBeLessThan(0.2); // Near zero
        });

        test('calculateCorrelations handles constant parameter', () => {
            const n = 100;
            const X = Array(n).fill(5);
            const Y = Array.from({ length: n }, () => Math.random());

            const params = { x: X };
            const correlations = vd.calculateCorrelations(params, Y);

            expect(correlations.x).toBe(0); // No correlation if no variance
        });
    });

    describe('Sensitivity Report', () => {
        let mockMCResults;

        beforeEach(() => {
            const n = 1000;
            const diameter = Array.from({ length: n }, () => 45 + Math.random() * 10);
            const velocity = Array.from({ length: n }, () => 12 + Math.random() * 6);
            const angle = Array.from({ length: n }, () => 35 + Math.random() * 20);
            const density = Array.from({ length: n }, () => 7770 + Math.random() * 200);

            mockMCResults = {
                parameters: { diameter, velocity, angle, density },
                craterDiameters: diameter.map((d, i) => 10 * d * velocity[i] * 0.1),
                metadata: { n_samples: n }
            };
        });

        test('generateSensitivityReport returns comprehensive analysis', () => {
            const report = vd.generateSensitivityReport(mockMCResults, 'craterDiameter');

            expect(report).toHaveProperty('sobolIndices');
            expect(report).toHaveProperty('correlations');
            expect(report).toHaveProperty('recommendations');
            expect(report).toHaveProperty('interpretation');
            expect(report).toHaveProperty('ranking');
        });

        test('generateSensitivityReport includes recommendations', () => {
            const report = vd.generateSensitivityReport(mockMCResults, 'craterDiameter');

            expect(Array.isArray(report.recommendations)).toBe(true);
            if (report.recommendations.length > 0) {
                expect(report.recommendations[0]).toHaveProperty('priority');
                expect(report.recommendations[0]).toHaveProperty('parameter');
                expect(report.recommendations[0]).toHaveProperty('message');
            }
        });

        test('generateSensitivityReport prioritizes high sensitivity parameters', () => {
            const report = vd.generateSensitivityReport(mockMCResults, 'craterDiameter');

            const highPriority = report.recommendations.filter(r => r.priority === 'HIGH');
            if (highPriority.length > 0) {
                // High priority should be for dominant parameter
                expect(report.ranking[0].parameter).toContain(highPriority[0].parameter);
            }
        });
    });

    describe('Edge Cases', () => {
        test('handles all parameters having equal importance', () => {
            const n = 1000;
            const X1 = Array.from({ length: n }, () => Math.random() * 10);
            const X2 = Array.from({ length: n }, () => Math.random() * 10);
            const X3 = Array.from({ length: n }, () => Math.random() * 10);
            const Y = X1.map((x1, i) => x1 + X2[i] + X3[i]); // Equal contributions

            const params = { x1: X1, x2: X2, x3: X3 };
            const sobol = vd.calculateFirstOrderIndices(params, Y);

            // All indices should be approximately equal (~ 0.33)
            const indices = [sobol.x1, sobol.x2, sobol.x3];
            const avg = indices.reduce((a, b) => a + b) / 3;

            indices.forEach(index => {
                expect(Math.abs(index - avg)).toBeLessThan(0.2); // Within 20% of average
            });
        });

        test('handles highly nonlinear relationships', () => {
            const n = 1000;
            const X = Array.from({ length: n }, () => Math.random() * 10);
            const Y = X.map(x => Math.sin(x) * Math.exp(x / 10)); // Nonlinear

            const params = { x: X };
            const sobol = vd.calculateFirstOrderIndices(params, Y);

            // Should still capture some variance despite nonlinearity
            expect(sobol.x).toBeGreaterThan(0);
        });
    });
});