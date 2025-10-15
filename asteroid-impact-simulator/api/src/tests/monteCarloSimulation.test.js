/**
 * Unit tests for Monte Carlo Simulation module
 * Tests simulation execution, uncertainty propagation, and validation
 *
 * @module monteCarloSimulation.test
 */

const MonteCarloSimulation = require('../services/monteCarloSimulation');

describe('MonteCarloSimulation', () => {
    let mc;

    beforeEach(() => {
        mc = new MonteCarloSimulation();
    });

    describe('Constructor', () => {
        test('initializes with correct configuration', () => {
            expect(mc.config.defaultSamples).toBe(1000);
            expect(mc.config.minSamples).toBe(100);
            expect(mc.config.maxSamples).toBe(10000);
            expect(mc.uq).toBeDefined();
            expect(mc.physicsEngine).toBeDefined();
        });
    });

    describe('Default Uncertainty Definition', () => {
        test('defineDefaultUncertainties creates distributions for all parameters', () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron'
            };

            const distributions = mc.defineDefaultUncertainties(nominalParams);

            expect(distributions.diameter).toBeDefined();
            expect(distributions.velocity).toBeDefined();
            expect(distributions.angle).toBeDefined();
            expect(distributions.density).toBeDefined();
        });

        test('diameter uncertainty is ±10% by default', () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron'
            };

            const distributions = mc.defineDefaultUncertainties(nominalParams);

            expect(distributions.diameter.type).toBe('normal');
            expect(distributions.diameter.std).toBe(5); // 10% of 50
        });

        test('velocity uncertainty uses uniform distribution by default', () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron'
            };

            const distributions = mc.defineDefaultUncertainties(nominalParams);

            expect(distributions.velocity.type).toBe('uniform');
            expect(distributions.velocity.min).toBe(12); // 80% of 15
            expect(distributions.velocity.max).toBe(18); // 120% of 15
        });

        test('angle uses truncated normal bounded to [0, 90]', () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron'
            };

            const distributions = mc.defineDefaultUncertainties(nominalParams);

            expect(distributions.angle.type).toBe('truncatedNormal');
            expect(distributions.angle.min).toBe(0);
            expect(distributions.angle.max).toBe(90);
            expect(distributions.angle.std).toBe(10);
        });

        test('density uncertainty varies by composition', () => {
            const ironParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron'
            };

            const rockyParams = { ...ironParams, density: 3000, composition: 'rocky' };

            const ironDist = mc.defineDefaultUncertainties(ironParams);
            const rockyDist = mc.defineDefaultUncertainties(rockyParams);

            expect(ironDist.density.std).toBe(100);  // ±100 kg/m³ for iron
            expect(rockyDist.density.std).toBe(200); // ±200 kg/m³ for rocky
        });

        test('custom uncertainties override defaults', () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron'
            };

            const customUncertainties = {
                diameter: { type: 'uniform', min: 45, max: 55 }
            };

            const distributions = mc.defineDefaultUncertainties(nominalParams, customUncertainties);

            expect(distributions.diameter.type).toBe('uniform');
            expect(distributions.diameter.min).toBe(45);
            expect(distributions.diameter.max).toBe(55);
        });
    });

    describe('Simulation Execution', () => {
        test('simulate runs successfully with valid parameters', async () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron',
                latitude: 35,
                longitude: -111
            };

            const results = await mc.simulate(nominalParams, 100);

            expect(results).toBeDefined();
            expect(results.metadata.n_samples).toBe(100);
            expect(results.craterDiameters.length).toBeGreaterThan(0);
        }, 30000); // 30s timeout for simulation

        test('simulate returns correct structure', async () => {
            const nominalParams = {
                diameter: 30,
                velocity: 20,
                angle: 60,
                density: 3000,
                composition: 'rocky',
                latitude: 0,
                longitude: 0
            };

            const results = await mc.simulate(nominalParams, 100);

            expect(results).toHaveProperty('samples');
            expect(results).toHaveProperty('craterDiameters');
            expect(results).toHaveProperty('craterDepths');
            expect(results).toHaveProperty('impactEnergies');
            expect(results).toHaveProperty('seismicMagnitudes');
            expect(results).toHaveProperty('blastRadii');
            expect(results).toHaveProperty('parameters');
            expect(results).toHaveProperty('metadata');
        }, 30000);

        test('simulate stores parameter samples', async () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron'
            };

            const results = await mc.simulate(nominalParams, 100);

            expect(results.parameters.diameter).toHaveLength(100);
            expect(results.parameters.velocity).toHaveLength(100);
            expect(results.parameters.angle).toHaveLength(100);
            expect(results.parameters.density).toHaveLength(100);
        }, 30000);

        test('simulate respects n_samples parameter', async () => {
            const nominalParams = {
                diameter: 40,
                velocity: 18,
                angle: 30,
                density: 3500,
                composition: 'rocky'
            };

            const results = await mc.simulate(nominalParams, 150);

            expect(results.metadata.n_samples).toBe(150);
            expect(results.parameters.diameter).toHaveLength(150);
        }, 30000);

        test('simulate throws error for n_samples out of range', async () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron'
            };

            await expect(mc.simulate(nominalParams, 50)).rejects.toThrow('n_samples must be between');
            await expect(mc.simulate(nominalParams, 20000)).rejects.toThrow('n_samples must be between');
        });

        test('simulate calls progress callback', async () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron'
            };

            const progressCalls = [];
            const progressCallback = (current, total, results) => {
                progressCalls.push({ current, total });
            };

            await mc.simulate(nominalParams, 100, {}, progressCallback);

            expect(progressCalls.length).toBeGreaterThan(0);
            expect(progressCalls[progressCalls.length - 1].current).toBe(100);
            expect(progressCalls[progressCalls.length - 1].total).toBe(100);
        }, 30000);
    });

    describe('Variable Extraction', () => {
        let sampleResults;

        beforeAll(async () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron'
            };
            sampleResults = await mc.simulate(nominalParams, 100);
        }, 30000);

        test('extractVariable returns crater diameter samples', () => {
            const craterDiameters = mc.extractVariable(sampleResults, 'craterDiameter');
            expect(craterDiameters).toBe(sampleResults.craterDiameters);
        });

        test('extractVariable returns crater depth samples', () => {
            const craterDepths = mc.extractVariable(sampleResults, 'craterDepth');
            expect(craterDepths).toBe(sampleResults.craterDepths);
        });

        test('extractVariable returns impact energy samples', () => {
            const impactEnergies = mc.extractVariable(sampleResults, 'impactEnergy');
            expect(impactEnergies).toBe(sampleResults.impactEnergies);
        });

        test('extractVariable throws error for unknown variable', () => {
            expect(() => {
                mc.extractVariable(sampleResults, 'unknownVariable');
            }).toThrow('Unknown variable');
        });
    });

    describe('Output Statistics', () => {
        test('crater diameter has reasonable variance', async () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron'
            };

            const results = await mc.simulate(nominalParams, 200);

            const craterDiameters = results.craterDiameters;
            const mean = craterDiameters.reduce((a, b) => a + b) / craterDiameters.length;
            const variance = craterDiameters.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / craterDiameters.length;
            const std = Math.sqrt(variance);
            const cv = std / mean; // Coefficient of variation

            // Crater diameter should have some variance (CV > 5%)
            expect(cv).toBeGreaterThan(0.05);

            // But not excessive variance (CV < 50%)
            expect(cv).toBeLessThan(0.50);
        }, 30000);

        test('all output values are positive', async () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 45,
                density: 7870,
                composition: 'iron'
            };

            const results = await mc.simulate(nominalParams, 100);

            results.craterDiameters.forEach(d => expect(d).toBeGreaterThan(0));
            results.craterDepths.forEach(d => expect(d).toBeGreaterThan(0));
            results.impactEnergies.forEach(e => expect(e).toBeGreaterThan(0));
            results.blastRadii.forEach(r => expect(r).toBeGreaterThan(0));
        }, 30000);
    });

    describe('Validation', () => {
        test('validateImplementation returns correct structure', async () => {
            const validation = await mc.validateImplementation();

            expect(validation).toHaveProperty('samplesGenerated');
            expect(validation).toHaveProperty('successRate');
            expect(validation).toHaveProperty('performanceOk');
            expect(validation).toHaveProperty('craterDiameterReasonable');
            expect(validation).toHaveProperty('allPassed');
        }, 30000);

        test('validateImplementation passes all checks', async () => {
            const validation = await mc.validateImplementation();

            expect(validation.samplesGenerated).toBe(true);
            expect(validation.successRate).toBeGreaterThan(0.95); // Check numeric value
            expect(validation.performanceOk).toBe(true);
            expect(validation.craterDiameterReasonable).toBe(true);
            expect(validation.allPassed).toBe(true);
        }, 30000);

        test('validateImplementation completes in reasonable time', async () => {
            const start = Date.now();
            const validation = await mc.validateImplementation();
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(15000); // <15 seconds
            expect(validation.duration_ms).toBeLessThan(10000); // Internal timing <10s
        }, 30000);
    });

    describe('Edge Cases', () => {
        test('handles very small diameter', async () => {
            const nominalParams = {
                diameter: 1, // 1 meter
                velocity: 20,
                angle: 45,
                density: 3000,
                composition: 'rocky'
            };

            const results = await mc.simulate(nominalParams, 100);

            // Small asteroids may have lower success rate due to extreme parameter combinations
            expect(results.metadata.successRate).toBeGreaterThan(0.75);
            expect(results.craterDiameters.length).toBeGreaterThan(75);
        }, 30000);

        test('handles very large diameter', async () => {
            const nominalParams = {
                diameter: 1000, // 1 km
                velocity: 25,
                angle: 60,
                density: 3000,
                composition: 'rocky'
            };

            const results = await mc.simulate(nominalParams, 100);

            expect(results.metadata.successRate).toBeGreaterThan(0.9);
            expect(results.craterDiameters.length).toBeGreaterThan(90);
        }, 30000);

        test('handles grazing angle', async () => {
            const nominalParams = {
                diameter: 50,
                velocity: 15,
                angle: 15, // Low angle
                density: 7870,
                composition: 'iron'
            };

            const distributions = mc.defineDefaultUncertainties(nominalParams);
            const results = await mc.simulate(nominalParams, 100);

            expect(results.metadata.successRate).toBeGreaterThan(0.8);
        }, 30000);
    });
});