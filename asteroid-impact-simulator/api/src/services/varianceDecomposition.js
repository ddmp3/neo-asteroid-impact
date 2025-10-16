/**
 * Variance Decomposition Module using Sobol Sensitivity Analysis
 * Decomposes output variance to identify dominant input parameters
 *
 * @module varianceDecomposition
 * @version 2.0.0
 * @author Meteor Madness Team
 *
 * References:
 * - Sobol, I. M. (2001). Global sensitivity indices for nonlinear mathematical models
 * - Saltelli, A. et al. (2010). Variance based sensitivity analysis
 */

class VarianceDecomposition {
    constructor() {
        // Default configuration
        this.config = {
            minSamples: 500,      // Minimum samples for reliable Sobol indices
            defaultSamples: 1000,  // Default N for Sobol analysis (total: N*(2+k) samples)
            maxSamples: 5000      // Maximum N to prevent memory issues
        };
    }

    /**
     * Calculate first-order Sobol indices (main effects)
     * Measures contribution of each parameter independently
     *
     * @param {Object} parameterSamples - Sampled parameters {param1: [values], ...}
     * @param {Array<number>} outputSamples - Corresponding output values
     * @returns {Object} First-order Sobol indices {param1: S1, param2: S2, ...}
     *
     * Formula: S_i = V[E(Y|X_i)] / V(Y)
     * Where V[E(Y|X_i)] = variance of conditional expectation
     *
     * @example
     * const S1 = vd.calculateFirstOrderIndices(params, craterDiameters);
     * // Returns: {diameter: 0.65, velocity: 0.25, angle: 0.08, density: 0.02}
     */
    calculateFirstOrderIndices(parameterSamples, outputSamples) {
        if (outputSamples.length < this.config.minSamples) {
            throw new Error(
                `Need at least ${this.config.minSamples} samples for Sobol analysis, got ${outputSamples.length}`
            );
        }

        const parameterNames = Object.keys(parameterSamples);
        const n = outputSamples.length;

        // Calculate total variance
        const outputMean = outputSamples.reduce((a, b) => a + b, 0) / n;
        const totalVariance = outputSamples.reduce((sum, y) => sum + Math.pow(y - outputMean, 2), 0) / n;

        if (totalVariance === 0) {
            // No variance in output - all indices are 0
            const indices = {};
            parameterNames.forEach(param => indices[param] = 0);
            return indices;
        }

        const sobolIndices = {};

        // For each parameter, estimate conditional variance
        for (const param of parameterNames) {
            const paramValues = parameterSamples[param];

            // Discretize parameter into bins for conditional expectation
            const numBins = Math.min(20, Math.floor(Math.sqrt(n)));
            const { conditionalMeans, binCounts } = this._computeConditionalMeans(
                paramValues,
                outputSamples,
                numBins
            );

            // Variance of conditional means (weighted by bin counts)
            const totalCount = binCounts.reduce((a, b) => a + b, 0);
            const weightedMeanOfConditionalMeans = conditionalMeans.reduce((sum, mean, i) => {
                return sum + mean * (binCounts[i] / totalCount);
            }, 0);

            const varianceOfConditionalMeans = conditionalMeans.reduce((sum, mean, i) => {
                return sum + (binCounts[i] / totalCount) * Math.pow(mean - weightedMeanOfConditionalMeans, 2);
            }, 0);

            // First-order Sobol index
            sobolIndices[param] = varianceOfConditionalMeans / totalVariance;
        }

        return sobolIndices;
    }

    /**
     * Compute conditional means E(Y|X_i) by binning parameter values
     * @private
     */
    _computeConditionalMeans(paramValues, outputValues, numBins) {
        const n = paramValues.length;

        // Find min/max for binning
        const minVal = Math.min(...paramValues);
        const maxVal = Math.max(...paramValues);
        const binWidth = (maxVal - minVal) / numBins;

        if (binWidth === 0) {
            // All parameter values are the same - single bin
            return {
                conditionalMeans: [outputValues.reduce((a, b) => a + b, 0) / n],
                binCounts: [n]
            };
        }

        // Initialize bins
        const bins = Array.from({ length: numBins }, () => ({ sum: 0, count: 0 }));

        // Assign samples to bins
        for (let i = 0; i < n; i++) {
            let binIndex = Math.floor((paramValues[i] - minVal) / binWidth);
            if (binIndex >= numBins) binIndex = numBins - 1; // Handle edge case
            if (binIndex < 0) binIndex = 0;

            bins[binIndex].sum += outputValues[i];
            bins[binIndex].count += 1;
        }

        // Compute conditional means
        const conditionalMeans = bins
            .filter(bin => bin.count > 0)
            .map(bin => bin.sum / bin.count);

        const binCounts = bins
            .filter(bin => bin.count > 0)
            .map(bin => bin.count);

        return { conditionalMeans, binCounts };
    }

    /**
     * Estimate total-order Sobol indices (total effects including interactions)
     * Measures total contribution of parameter including all interactions
     *
     * @param {Object} parameterSamples - Sampled parameters
     * @param {Array<number>} outputSamples - Corresponding output values
     * @returns {Object} Total-order Sobol indices {param1: ST1, param2: ST2, ...}
     *
     * Formula: ST_i = 1 - V[E(Y|X_~i)] / V(Y)
     * Where X_~i means all parameters except X_i
     *
     * Note: This is a simplified approximation. True Sobol requires special sampling.
     */
    calculateTotalOrderIndices(parameterSamples, outputSamples) {
        const parameterNames = Object.keys(parameterSamples);
        const firstOrder = this.calculateFirstOrderIndices(parameterSamples, outputSamples);

        // Simplified approximation: ST_i ≈ S_i + interactions
        // True calculation requires Saltelli sampling scheme
        const totalOrder = {};

        for (const param of parameterNames) {
            // Approximate: ST = S1 + 0.5 * (1 - sum(S1))
            // This assumes interactions are distributed proportionally
            const sumFirstOrder = Object.values(firstOrder).reduce((a, b) => a + b, 0);
            const remainingVariance = Math.max(0, 1 - sumFirstOrder);

            totalOrder[param] = Math.min(1.0, firstOrder[param] + 0.5 * remainingVariance * (firstOrder[param] / Math.max(0.001, sumFirstOrder)));
        }

        return totalOrder;
    }

    /**
     * Compute variance decomposition for Monte Carlo results
     * Analyzes contribution of each input parameter to output variance
     *
     * @param {Object} mcResults - Results from MonteCarloSimulation
     * @param {string} outputVariable - Output variable to analyze ('craterDiameter', etc.)
     * @returns {Object} Variance decomposition analysis
     *
     * @example
     * const decomp = vd.decomposeVariance(mcResults, 'craterDiameter');
     * console.log(decomp.sobolIndices.firstOrder); // {diameter: 0.65, velocity: 0.25, ...}
     */
    decomposeVariance(mcResults, outputVariable = 'craterDiameter') {
        // Extract parameter samples and output
        const parameterSamples = mcResults.parameters;

        const outputMap = {
            'craterDiameter': mcResults.craterDiameters,
            'craterDepth': mcResults.craterDepths,
            'impactEnergy': mcResults.impactEnergies,
            'seismicMagnitude': mcResults.seismicMagnitudes,
            'blastRadius': mcResults.blastRadii
        };

        if (!(outputVariable in outputMap)) {
            throw new Error(
                `Unknown output variable: ${outputVariable}. Available: ${Object.keys(outputMap).join(', ')}`
            );
        }

        const outputSamples = outputMap[outputVariable];

        // Calculate Sobol indices
        const firstOrder = this.calculateFirstOrderIndices(parameterSamples, outputSamples);
        const totalOrder = this.calculateTotalOrderIndices(parameterSamples, outputSamples);

        // Calculate total variance explained
        // Note: Binning approximation can sometimes give sum > 1.0, so clamp to [0, 1]
        const sumFirstOrder = Math.min(1.0, Object.values(firstOrder).reduce((a, b) => a + b, 0));
        const unexplainedVariance = Math.max(0, 1 - sumFirstOrder);

        // Rank parameters by importance
        const ranking = Object.entries(firstOrder)
            .sort((a, b) => b[1] - a[1])
            .map(([param, index], rank) => ({
                rank: rank + 1,
                parameter: param,
                sobolIndex: index,
                contribution: (index * 100).toFixed(1) + '%'
            }));

        return {
            outputVariable: outputVariable,
            sobolIndices: {
                firstOrder: firstOrder,
                totalOrder: totalOrder
            },
            varianceExplained: sumFirstOrder,
            unexplainedVariance: unexplainedVariance,
            ranking: ranking,
            interpretation: this._interpretDecomposition(ranking, unexplainedVariance),
            metadata: {
                nSamples: outputSamples.length,
                method: 'Sobol sensitivity analysis (binning approximation)',
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Generate interpretation text for variance decomposition
     * @private
     */
    _interpretDecomposition(ranking, unexplainedVariance) {
        const dominant = ranking[0];
        const secondary = ranking.length > 1 ? ranking[1] : null;

        let interpretation = `The dominant source of uncertainty is ${dominant.parameter} `;
        interpretation += `(${dominant.contribution} of total variance). `;

        if (secondary && secondary.sobolIndex > 0.10) {
            interpretation += `${secondary.parameter} is the second most important `;
            interpretation += `(${secondary.contribution}). `;
        }

        if (unexplainedVariance > 0.15) {
            interpretation += `${(unexplainedVariance * 100).toFixed(1)}% of variance comes from `;
            interpretation += `interactions between parameters or model nonlinearity.`;
        } else {
            interpretation += `Most variance is explained by main effects (low interactions).`;
        }

        return interpretation;
    }

    /**
     * Analyze multiple output variables simultaneously
     * Provides comparative view of sensitivity across outputs
     *
     * @param {Object} mcResults - Results from MonteCarloSimulation
     * @param {Array<string>} outputVariables - Variables to analyze
     * @returns {Object} Comparative decomposition analysis
     *
     * @example
     * const analysis = vd.analyzeMultipleOutputs(mcResults,
     *   ['craterDiameter', 'impactEnergy', 'seismicMagnitude']);
     */
    analyzeMultipleOutputs(mcResults, outputVariables = null) {
        const defaultOutputs = ['craterDiameter', 'craterDepth', 'impactEnergy', 'seismicMagnitude', 'blastRadius'];
        const outputs = outputVariables || defaultOutputs;

        const decompositions = {};
        for (const output of outputs) {
            try {
                decompositions[output] = this.decomposeVariance(mcResults, output);
            } catch (error) {
                console.warn(`Could not decompose ${output}:`, error.message);
                decompositions[output] = null;
            }
        }

        // Find most important parameter overall (average across outputs)
        const parameterNames = Object.keys(mcResults.parameters);
        const avgImportance = {};

        for (const param of parameterNames) {
            const importances = outputs
                .filter(output => decompositions[output] !== null)
                .map(output => decompositions[output].sobolIndices.firstOrder[param]);

            avgImportance[param] = importances.reduce((a, b) => a + b, 0) / importances.length;
        }

        const overallRanking = Object.entries(avgImportance)
            .sort((a, b) => b[1] - a[1])
            .map(([param, importance], rank) => ({
                rank: rank + 1,
                parameter: param,
                averageImportance: importance,
                contribution: (importance * 100).toFixed(1) + '%'
            }));

        return {
            decompositions: decompositions,
            overallRanking: overallRanking,
            summary: `Overall, ${overallRanking[0].parameter} is the most influential parameter ` +
                    `(${overallRanking[0].contribution} average contribution across all outputs).`
        };
    }

    /**
     * Calculate correlation coefficients between parameters and output
     * Simple linear correlation as complement to Sobol analysis
     *
     * @param {Object} parameterSamples - Sampled parameters
     * @param {Array<number>} outputSamples - Output values
     * @returns {Object} Pearson correlation coefficients
     */
    calculateCorrelations(parameterSamples, outputSamples) {
        const parameterNames = Object.keys(parameterSamples);
        const n = outputSamples.length;

        const outputMean = outputSamples.reduce((a, b) => a + b, 0) / n;
        const outputStd = Math.sqrt(
            outputSamples.reduce((sum, y) => sum + Math.pow(y - outputMean, 2), 0) / n
        );

        const correlations = {};

        for (const param of parameterNames) {
            const paramValues = parameterSamples[param];
            const paramMean = paramValues.reduce((a, b) => a + b, 0) / n;
            const paramStd = Math.sqrt(
                paramValues.reduce((sum, x) => sum + Math.pow(x - paramMean, 2), 0) / n
            );

            if (paramStd === 0 || outputStd === 0) {
                correlations[param] = 0;
                continue;
            }

            // Pearson correlation coefficient
            let covariance = 0;
            for (let i = 0; i < n; i++) {
                covariance += (paramValues[i] - paramMean) * (outputSamples[i] - outputMean);
            }
            covariance /= n;

            correlations[param] = covariance / (paramStd * outputStd);
        }

        return correlations;
    }

    /**
     * Generate comprehensive sensitivity report
     * Combines Sobol indices, correlations, and interpretations
     *
     * @param {Object} mcResults - Monte Carlo results
     * @param {string} outputVariable - Output to analyze
     * @returns {Object} Complete sensitivity report
     */
    generateSensitivityReport(mcResults, outputVariable = 'craterDiameter') {
        const decomposition = this.decomposeVariance(mcResults, outputVariable);
        const correlations = this.calculateCorrelations(
            mcResults.parameters,
            mcResults[outputVariable === 'craterDiameter' ? 'craterDiameters' :
                     outputVariable === 'craterDepth' ? 'craterDepths' :
                     outputVariable === 'impactEnergy' ? 'impactEnergies' :
                     outputVariable === 'seismicMagnitude' ? 'seismicMagnitudes' :
                     'blastRadii']
        );

        return {
            ...decomposition,
            correlations: correlations,
            recommendations: this._generateRecommendations(decomposition.ranking, correlations)
        };
    }

    /**
     * Generate recommendations based on sensitivity analysis
     * @private
     */
    _generateRecommendations(ranking, correlations) {
        const recommendations = [];

        // Identify parameters needing better constraints
        const highSensitivity = ranking.filter(r => r.sobolIndex > 0.3);
        if (highSensitivity.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                parameter: highSensitivity[0].parameter,
                message: `Reduce uncertainty in ${highSensitivity[0].parameter} - it dominates output variance (${highSensitivity[0].contribution})`
            });
        }

        // Identify parameters with strong correlations
        const strongCorrelations = Object.entries(correlations)
            .filter(([param, corr]) => Math.abs(corr) > 0.7)
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

        if (strongCorrelations.length > 0) {
            const [param, corr] = strongCorrelations[0];
            recommendations.push({
                priority: 'MEDIUM',
                parameter: param,
                message: `${param} has strong ${corr > 0 ? 'positive' : 'negative'} correlation (r=${corr.toFixed(2)}) - consider linear uncertainty propagation`
            });
        }

        // Identify parameters with low sensitivity
        const lowSensitivity = ranking.filter(r => r.sobolIndex < 0.05);
        if (lowSensitivity.length > 0) {
            recommendations.push({
                priority: 'LOW',
                parameter: lowSensitivity.map(r => r.parameter).join(', '),
                message: `These parameters have minimal impact (<5%) - can use nominal values for efficiency`
            });
        }

        return recommendations;
    }
}

module.exports = VarianceDecomposition;