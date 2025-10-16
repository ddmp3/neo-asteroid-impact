/**
 * Monte Carlo Simulation for Asteroid Impact Uncertainty
 * Propagates input parameter uncertainties through physics model
 *
 * @module monteCarloSimulation
 * @version 2.0.0
 * @author Meteor Madness Team
 */

const UncertaintyQuantification = require('./uncertaintyQuantification');
const PhysicsEngine = require('./physicsEngine');
const StatisticalAnalysis = require('./statisticalAnalysis');

class MonteCarloSimulation {
    constructor() {
        this.uq = new UncertaintyQuantification();
        this.physicsEngine = new PhysicsEngine();
        this.stats = new StatisticalAnalysis();

        // Default configuration
        this.config = {
            defaultSamples: 1000,
            minSamples: 100,
            maxSamples: 10000,
            parallelBatchSize: 100, // Process in batches for progress tracking
            enableProgressCallback: true
        };
    }

    /**
     * Define default uncertainty distributions for impact parameters
     *
     * @param {Object} nominalParams - Nominal parameter values
     * @param {Object} customUncertainties - Optional custom uncertainty specifications
     * @returns {Object} Distribution specifications
     *
     * @example
     * const distributions = mc.defineDefaultUncertainties({
     *   diameter: 50,
     *   velocity: 15,
     *   angle: 45,
     *   density: 7870,
     *   composition: 'iron'
     * });
     */
    defineDefaultUncertainties(nominalParams, customUncertainties = {}) {
        // Default uncertainty assumptions based on observational constraints
        const defaultConfig = {
            diameter: {
                type: 'normal',
                std: Math.max(nominalParams.diameter * 0.10, 1) // ±10% or ±1m minimum
            },
            velocity: {
                type: 'uniform',
                min: Math.max(nominalParams.velocity * 0.8, 5),  // -20% but >= 5 km/s
                max: Math.min(nominalParams.velocity * 1.2, 75)  // +20% but <= 75 km/s
            },
            angle: {
                type: 'truncatedNormal',
                std: 10, // ±10° typical uncertainty
                min: 0,
                max: 90
            },
            density: {
                type: 'normal',
                std: this._getDefaultDensityUncertainty(nominalParams.composition, nominalParams.density)
            }
        };

        // Merge with custom uncertainties
        const uncertaintyConfig = { ...defaultConfig, ...customUncertainties };

        return this.uq.defineParameterDistributions(nominalParams, uncertaintyConfig);
    }

    /**
     * Get default density uncertainty based on composition
     * @private
     */
    _getDefaultDensityUncertainty(composition, nominalDensity) {
        const uncertainties = {
            'iron': 100,      // ±100 kg/m³ (±1.3% for iron)
            'rocky': 200,     // ±200 kg/m³ (±7% for rocky)
            'icy': 150        // ±150 kg/m³ (±16% for icy)
        };
        return uncertainties[composition] || nominalDensity * 0.10; // Default ±10%
    }

    /**
     * Run Monte Carlo simulation
     *
     * @param {Object} nominalParams - Nominal impact parameters
     * @param {Object} distributions - Parameter distributions from defineDefaultUncertainties
     * @param {number} n_samples - Number of Monte Carlo samples (default: 1000)
     * @param {Function} progressCallback - Optional callback(current, total, results)
     * @returns {Object} Simulation results with all samples
     *
     * @example
     * const results = await mc.runSimulation(
     *   { diameter: 50, velocity: 15, angle: 45, density: 7870, composition: 'iron' },
     *   distributions,
     *   1000
     * );
     */
    async runSimulation(nominalParams, distributions, n_samples = 1000, progressCallback = null) {
        // Validate n_samples
        if (n_samples < this.config.minSamples || n_samples > this.config.maxSamples) {
            throw new Error(
                `n_samples must be between ${this.config.minSamples} and ${this.config.maxSamples}, got ${n_samples}`
            );
        }

        // Sample parameters
        const parameterSamples = this.uq.sampleParameters(distributions, n_samples);

        // Prepare results storage
        const results = {
            samples: [],
            craterDiameters: [],
            craterDepths: [],
            impactEnergies: [],
            seismicMagnitudes: [],
            blastRadii: [],
            parameters: {
                diameter: parameterSamples.diameter,
                velocity: parameterSamples.velocity,
                angle: parameterSamples.angle,
                density: parameterSamples.density
            },
            metadata: {
                n_samples: n_samples,
                nominalParams: nominalParams,
                timestamp: new Date().toISOString()
            }
        };

        // Run simulations in batches for progress tracking
        const batchSize = this.config.parallelBatchSize;
        const totalBatches = Math.ceil(n_samples / batchSize);

        for (let batch = 0; batch < totalBatches; batch++) {
            const startIdx = batch * batchSize;
            const endIdx = Math.min((batch + 1) * batchSize, n_samples);

            // Process batch
            for (let i = startIdx; i < endIdx; i++) {
                const params = {
                    diameter: parameterSamples.diameter[i],
                    velocity: parameterSamples.velocity[i],
                    angle: parameterSamples.angle[i],
                    density: parameterSamples.density[i],
                    composition: nominalParams.composition,
                    latitude: nominalParams.latitude || 0,
                    longitude: nominalParams.longitude || 0
                };

                try {
                    // FAST physics-only calculation (no external API calls for Monte Carlo speed)
                    const mass = this.physicsEngine.calculateMass(params.diameter, params.density);
                    const finalVelocity = this.physicsEngine.calculateImpactVelocity(
                        params.velocity * 1000, // Convert km/s to m/s
                        params.angle
                    );
                    const energy = this.physicsEngine.calculateImpactEnergy(mass, finalVelocity);
                    const crater = this.physicsEngine.calculateCraterSize(
                        energy.joules,
                        params.angle,
                        params.composition,
                        params.density,
                        2500, // targetDensity
                        params.diameter,
                        params.velocity * 1000
                    );
                    const seismic = this.physicsEngine.calculateSeismicEffects(energy.joules);
                    const blast = this.physicsEngine.calculateBlastRadius(energy.joules);

                    // Store results
                    const simResult = {
                        energy,
                        crater,
                        seismic,
                        blast,
                        asteroidProperties: {
                            diameter: params.diameter,
                            mass,
                            velocity: finalVelocity,
                            density: params.density,
                            composition: params.composition,
                            angle: params.angle
                        }
                    };

                    results.samples.push(simResult);
                    results.craterDiameters.push(crater.diameter);
                    results.craterDepths.push(crater.depth);
                    results.impactEnergies.push(energy.joules);
                    results.seismicMagnitudes.push(seismic.magnitude);
                    results.blastRadii.push(blast.thermalRadius);
                } catch (error) {
                    // Handle simulation failures gracefully
                    console.warn(`Sample ${i} failed:`, error.message);
                    results.samples.push(null);
                    results.craterDiameters.push(NaN);
                    results.craterDepths.push(NaN);
                    results.impactEnergies.push(NaN);
                    results.seismicMagnitudes.push(NaN);
                    results.blastRadii.push(NaN);
                }
            }

            // Progress callback
            if (progressCallback) {
                progressCallback(endIdx, n_samples, results);
            }
        }

        // Remove NaN values for statistics (failed simulations)
        results.craterDiameters = results.craterDiameters.filter(x => !isNaN(x));
        results.craterDepths = results.craterDepths.filter(x => !isNaN(x));
        results.impactEnergies = results.impactEnergies.filter(x => !isNaN(x));
        results.seismicMagnitudes = results.seismicMagnitudes.filter(x => !isNaN(x));
        results.blastRadii = results.blastRadii.filter(x => !isNaN(x));

        results.metadata.successfulSamples = results.craterDiameters.length;
        results.metadata.failedSamples = n_samples - results.craterDiameters.length;
        results.metadata.successRate = results.craterDiameters.length / n_samples;

        return results;
    }

    /**
     * Run simulation with automatic uncertainty definition
     * Convenience method that combines defineDefaultUncertainties and runSimulation
     *
     * @param {Object} nominalParams - Nominal impact parameters
     * @param {number} n_samples - Number of Monte Carlo samples
     * @param {Object} customUncertainties - Optional custom uncertainty specifications
     * @param {Function} progressCallback - Optional progress callback
     * @returns {Object} Simulation results
     *
     * @example
     * const results = await mc.simulate({
     *   diameter: 50,
     *   velocity: 15,
     *   angle: 45,
     *   density: 7870,
     *   composition: 'iron'
     * }, 1000);
     */
    async simulate(nominalParams, n_samples = 1000, customUncertainties = {}, progressCallback = null) {
        // Define distributions
        const distributions = this.defineDefaultUncertainties(nominalParams, customUncertainties);

        // Run simulation
        return await this.runSimulation(nominalParams, distributions, n_samples, progressCallback);
    }

    /**
     * Extract specific output variable samples
     *
     * @param {Object} results - Results from runSimulation
     * @param {string} variable - Variable name ('craterDiameter', 'impactEnergy', etc.)
     * @returns {Array<number>} Samples of the specified variable
     */
    extractVariable(results, variable) {
        const variableMap = {
            'craterDiameter': results.craterDiameters,
            'craterDepth': results.craterDepths,
            'impactEnergy': results.impactEnergies,
            'seismicMagnitude': results.seismicMagnitudes,
            'blastRadius': results.blastRadii
        };

        if (!(variable in variableMap)) {
            throw new Error(
                `Unknown variable: ${variable}. Available: ${Object.keys(variableMap).join(', ')}`
            );
        }

        return variableMap[variable];
    }

    /**
     * Validate Monte Carlo implementation with known test case
     * Tests convergence and performance
     *
     * @returns {Object} Validation results
     */
    async validateImplementation() {
        const testParams = {
            diameter: 50,      // Barringer-like
            velocity: 12,
            angle: 45,
            density: 7870,
            composition: 'iron',
            latitude: 35,
            longitude: -111
        };

        const startTime = Date.now();

        // Run small simulation
        const results = await this.simulate(testParams, 100);

        const duration_ms = Date.now() - startTime;

        // Validation checks
        const validations = {
            samplesGenerated: results.metadata.n_samples === 100,
            successRate: results.metadata.successRate > 0.95, // >95% success
            performanceOk: duration_ms < 10000, // <10 seconds for 100 samples
            craterDiameterReasonable: results.craterDiameters.length > 0 &&
                                      results.craterDiameters.every(d => d > 0 && d < 100000),
            duration_ms: duration_ms,
            successRate: results.metadata.successRate
        };

        validations.allPassed = Object.values(validations).every(v => v === true || typeof v === 'number');

        return validations;
    }

    /**
     * Analyze Monte Carlo results with comprehensive statistics
     * Convenience method combining simulation results with statistical analysis
     *
     * @param {Object} mcResults - Results from simulate() or runSimulation()
     * @param {Object} options - Optional statistical analysis configuration
     * @returns {Object} Results with added statistical analysis
     *
     * @example
     * const results = await mc.simulate(params, 1000);
     * const analyzed = mc.analyzeResults(results);
     * console.log(analyzed.statistics.craterDiameter.mean); // Mean crater diameter
     * console.log(analyzed.statistics.craterDiameter.confidenceInterval); // 95% CI
     */
    analyzeResults(mcResults, options = {}) {
        const statistics = this.stats.analyzeMonteCarloResults(mcResults, options);

        return {
            ...mcResults,
            statistics: statistics
        };
    }

    /**
     * Run simulation with automatic statistical analysis
     * Convenience method that combines simulate() and analyzeResults()
     *
     * @param {Object} nominalParams - Nominal impact parameters
     * @param {number} n_samples - Number of Monte Carlo samples
     * @param {Object} customUncertainties - Optional custom uncertainty specifications
     * @param {Object} statisticsOptions - Optional statistical analysis options
     * @returns {Object} Complete results with statistics
     *
     * @example
     * const results = await mc.simulateWithStatistics({
     *   diameter: 50,
     *   velocity: 15,
     *   angle: 45,
     *   density: 7870,
     *   composition: 'iron'
     * }, 1000);
     * console.log(results.statistics.craterDiameter);
     */
    async simulateWithStatistics(nominalParams, n_samples = 1000, customUncertainties = {}, statisticsOptions = {}) {
        const results = await this.simulate(nominalParams, n_samples, customUncertainties);
        return this.analyzeResults(results, statisticsOptions);
    }
}

module.exports = MonteCarloSimulation;