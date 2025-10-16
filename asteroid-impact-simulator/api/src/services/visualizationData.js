/**
 * Visualization Data Generator for Monte Carlo Results
 * Generates data structures for PDF, CDF, box plots, and scatter plots
 * Backend-agnostic - returns JSON data for frontend charting libraries
 *
 * @module visualizationData
 * @version 2.0.0
 * @author Meteor Madness Team
 */

class VisualizationData {
    constructor() {
        // Default configuration
        this.config = {
            defaultBins: 50,        // Number of bins for histograms/PDF
            minBins: 10,
            maxBins: 200,
            cdfPoints: 200,         // Number of points for smooth CDF
            defaultWidth: 800,      // Default chart dimensions
            defaultHeight: 400
        };
    }

    /**
     * Calculate histogram bins using Sturges' rule or specified number
     *
     * @param {Array<number>} samples - Data samples
     * @param {number} numBins - Number of bins (optional, will calculate if not provided)
     * @returns {Object} Histogram data {bins, counts, edges, width}
     *
     * @example
     * const hist = viz.calculateHistogram([1, 2, 3, 4, 5], 10);
     * // Returns: {bins: [...], counts: [...], edges: [...], width: 0.5}
     */
    calculateHistogram(samples, numBins = null) {
        if (!samples || samples.length === 0) {
            throw new Error('Samples array is empty');
        }

        // Determine number of bins
        const n = samples.length;
        const calculatedBins = numBins || Math.min(
            this.config.maxBins,
            Math.max(this.config.minBins, Math.ceil(1 + 3.322 * Math.log10(n))) // Sturges' rule
        );

        // Find min/max
        const minVal = Math.min(...samples);
        const maxVal = Math.max(...samples);
        const range = maxVal - minVal;

        if (range === 0) {
            // All values are the same
            return {
                bins: [minVal],
                counts: [n],
                edges: [minVal - 0.5, minVal + 0.5],
                width: 1,
                total: n
            };
        }

        const binWidth = range / calculatedBins;

        // Initialize bins
        const bins = [];
        const counts = Array(calculatedBins).fill(0);
        const edges = [];

        for (let i = 0; i <= calculatedBins; i++) {
            edges.push(minVal + i * binWidth);
        }

        for (let i = 0; i < calculatedBins; i++) {
            bins.push(minVal + (i + 0.5) * binWidth); // Bin center
        }

        // Count samples in each bin
        for (const value of samples) {
            let binIndex = Math.floor((value - minVal) / binWidth);
            if (binIndex >= calculatedBins) binIndex = calculatedBins - 1; // Handle edge case
            if (binIndex < 0) binIndex = 0;
            counts[binIndex]++;
        }

        return {
            bins: bins,           // Bin centers
            counts: counts,       // Count in each bin
            edges: edges,         // Bin edges
            width: binWidth,      // Bin width
            total: n              // Total samples
        };
    }

    /**
     * Generate Probability Density Function (PDF) data
     * Normalizes histogram to probability density
     *
     * @param {Array<number>} samples - Data samples
     * @param {number} numBins - Number of bins
     * @returns {Object} PDF data {x, y, bins, density}
     *
     * @example
     * const pdf = viz.generatePDF(craterDiameters, 50);
     * // Returns: {x: [bin centers], y: [densities], ...}
     */
    generatePDF(samples, numBins = null) {
        const histogram = this.calculateHistogram(samples, numBins);

        // Normalize to probability density: density = count / (total × binWidth)
        const densities = histogram.counts.map(count =>
            count / (histogram.total * histogram.width)
        );

        return {
            x: histogram.bins,           // Bin centers (x-axis)
            y: densities,                 // Probability densities (y-axis)
            bins: histogram.bins.length,
            edges: histogram.edges,
            type: 'probability_density',
            integral: densities.reduce((sum, d) => sum + d * histogram.width, 0) // Should be ≈ 1
        };
    }

    /**
     * Generate Cumulative Distribution Function (CDF) data
     * Smooth empirical CDF from sorted samples
     *
     * @param {Array<number>} samples - Data samples
     * @param {number} numPoints - Number of points for smooth curve
     * @returns {Object} CDF data {x, y, type}
     *
     * @example
     * const cdf = viz.generateCDF(craterDiameters, 200);
     * // Returns: {x: [values], y: [cumulative probabilities], ...}
     */
    generateCDF(samples, numPoints = null) {
        if (!samples || samples.length === 0) {
            throw new Error('Samples array is empty');
        }

        const sorted = [...samples].sort((a, b) => a - b);
        const n = sorted.length;
        const points = numPoints || this.config.cdfPoints;

        // Generate evenly spaced points in the data range
        const minVal = sorted[0];
        const maxVal = sorted[sorted.length - 1];
        const range = maxVal - minVal;

        const x = [];
        const y = [];

        // Add point before minimum (CDF = 0)
        x.push(minVal - 0.01 * range);
        y.push(0);

        // Generate intermediate points
        for (let i = 0; i <= points; i++) {
            const value = minVal + (i / points) * range;
            x.push(value);

            // Count samples ≤ value (empirical CDF)
            const count = sorted.filter(s => s <= value).length;
            y.push(count / n);
        }

        // Add point after maximum (CDF = 1)
        x.push(maxVal + 0.01 * range);
        y.push(1);

        return {
            x: x,
            y: y,
            type: 'cumulative_distribution',
            numSamples: n
        };
    }

    /**
     * Generate box plot data (5-number summary + outliers)
     *
     * @param {Array<number>} samples - Data samples
     * @returns {Object} Box plot data {min, q1, median, q3, max, outliers, whiskers}
     *
     * @example
     * const boxPlot = viz.generateBoxPlot(craterDiameters);
     * // Returns: {q1: 1150, median: 1200, q3: 1250, ...}
     */
    generateBoxPlot(samples) {
        if (!samples || samples.length === 0) {
            throw new Error('Samples array is empty');
        }

        const sorted = [...samples].sort((a, b) => a - b);
        const n = sorted.length;

        // Calculate quartiles using linear interpolation (R-7 method)
        const q1Index = (n - 1) * 0.25;
        const medianIndex = (n - 1) * 0.50;
        const q3Index = (n - 1) * 0.75;

        const q1 = this._interpolate(sorted, q1Index);
        const median = this._interpolate(sorted, medianIndex);
        const q3 = this._interpolate(sorted, q3Index);

        const iqr = q3 - q1;

        // Whiskers: 1.5 × IQR rule
        const lowerWhisker = q1 - 1.5 * iqr;
        const upperWhisker = q3 + 1.5 * iqr;

        // Find actual whisker values (closest data points within bounds)
        const lowerWhiskerValue = sorted.find(x => x >= lowerWhisker) || sorted[0];
        const upperWhiskerValue = sorted.reverse().find(x => x <= upperWhisker) || sorted[0];
        sorted.reverse(); // Restore order

        // Identify outliers
        const outliers = sorted.filter(x => x < lowerWhisker || x > upperWhisker);

        return {
            min: sorted[0],
            q1: q1,
            median: median,
            q3: q3,
            max: sorted[n - 1],
            whiskerLower: lowerWhiskerValue,
            whiskerUpper: upperWhiskerValue,
            outliers: outliers,
            iqr: iqr,
            type: 'box_plot'
        };
    }

    /**
     * Helper function for linear interpolation
     * @private
     */
    _interpolate(sorted, index) {
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const fraction = index - lower;

        if (lower === upper) {
            return sorted[lower];
        }

        return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
    }

    /**
     * Generate violin plot data (combination of box plot and KDE)
     *
     * @param {Array<number>} samples - Data samples
     * @param {number} numPoints - Number of points for KDE curve
     * @returns {Object} Violin plot data {boxPlot, kde}
     */
    generateViolinPlot(samples, numPoints = 100) {
        const boxPlot = this.generateBoxPlot(samples);
        const kde = this.estimateKDE(samples, numPoints);

        return {
            boxPlot: boxPlot,
            kde: kde,
            type: 'violin_plot'
        };
    }

    /**
     * Estimate Kernel Density Estimate (KDE) using Gaussian kernel
     * Simplified bandwidth selection using Silverman's rule
     *
     * @param {Array<number>} samples - Data samples
     * @param {number} numPoints - Number of evaluation points
     * @returns {Object} KDE data {x, y, bandwidth}
     */
    estimateKDE(samples, numPoints = 100) {
        if (!samples || samples.length === 0) {
            throw new Error('Samples array is empty');
        }

        const n = samples.length;
        const sorted = [...samples].sort((a, b) => a - b);

        // Calculate std for bandwidth
        const mean = samples.reduce((a, b) => a + b) / n;
        const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
        const std = Math.sqrt(variance);

        // Silverman's rule of thumb: h = 1.06 * σ * n^(-1/5)
        const bandwidth = 1.06 * std * Math.pow(n, -0.2);

        // Generate evaluation points
        const minVal = sorted[0];
        const maxVal = sorted[sorted.length - 1];
        const range = maxVal - minVal;
        const padding = 0.1 * range;

        const x = [];
        const y = [];

        for (let i = 0; i < numPoints; i++) {
            const xi = (minVal - padding) + (i / (numPoints - 1)) * (range + 2 * padding);
            x.push(xi);

            // Kernel density estimate at xi
            let density = 0;
            for (const sample of samples) {
                const u = (xi - sample) / bandwidth;
                density += this._gaussianKernel(u);
            }
            density /= (n * bandwidth);

            y.push(density);
        }

        return {
            x: x,
            y: y,
            bandwidth: bandwidth,
            type: 'kernel_density_estimate'
        };
    }

    /**
     * Gaussian kernel function for KDE
     * @private
     */
    _gaussianKernel(u) {
        return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
    }

    /**
     * Generate scatter plot data for correlation analysis
     *
     * @param {Array<number>} xSamples - X-axis samples
     * @param {Array<number>} ySamples - Y-axis samples
     * @param {number} maxPoints - Maximum points to plot (for large datasets)
     * @returns {Object} Scatter plot data {x, y, correlation}
     */
    generateScatterPlot(xSamples, ySamples, maxPoints = 1000) {
        if (!xSamples || !ySamples || xSamples.length !== ySamples.length) {
            throw new Error('Sample arrays must have same length');
        }

        const n = xSamples.length;

        // Downsample if too many points
        let x, y;
        if (n > maxPoints) {
            const stride = Math.ceil(n / maxPoints);
            x = xSamples.filter((_, i) => i % stride === 0);
            y = ySamples.filter((_, i) => i % stride === 0);
        } else {
            x = [...xSamples];
            y = [...ySamples];
        }

        // Calculate correlation
        const xMean = xSamples.reduce((a, b) => a + b) / n;
        const yMean = ySamples.reduce((a, b) => a + b) / n;

        const xStd = Math.sqrt(xSamples.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0) / n);
        const yStd = Math.sqrt(ySamples.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0) / n);

        let covariance = 0;
        for (let i = 0; i < n; i++) {
            covariance += (xSamples[i] - xMean) * (ySamples[i] - yMean);
        }
        covariance /= n;

        const correlation = xStd > 0 && yStd > 0 ? covariance / (xStd * yStd) : 0;

        return {
            x: x,
            y: y,
            correlation: correlation,
            numPoints: x.length,
            totalSamples: n,
            type: 'scatter_plot'
        };
    }

    /**
     * Generate comprehensive visualization data for Monte Carlo results
     *
     * @param {Array<number>} samples - Output samples
     * @param {string} variableName - Variable name for labels
     * @param {string} unit - Unit of measurement
     * @returns {Object} Complete visualization package
     *
     * @example
     * const viz = generator.generateVisualizationPackage(
     *   craterDiameters,
     *   'Crater Diameter',
     *   'meters'
     * );
     */
    generateVisualizationPackage(samples, variableName = 'Output', unit = '') {
        if (!samples || samples.length === 0) {
            throw new Error('Samples array is empty');
        }

        return {
            variable: variableName,
            unit: unit,
            numSamples: samples.length,
            pdf: this.generatePDF(samples),
            cdf: this.generateCDF(samples),
            boxPlot: this.generateBoxPlot(samples),
            kde: this.estimateKDE(samples),
            histogram: this.calculateHistogram(samples),
            metadata: {
                timestamp: new Date().toISOString(),
                chartLibrary: 'any', // Compatible with Chart.js, Recharts, D3, etc.
                format: 'json'
            }
        };
    }

    /**
     * Generate multi-variable visualization data (all outputs from MC)
     *
     * @param {Object} mcResults - Monte Carlo simulation results
     * @returns {Object} Visualization data for all output variables
     */
    generateMultiVariableVisualization(mcResults) {
        const variables = {
            craterDiameter: { name: 'Crater Diameter', unit: 'meters', data: mcResults.craterDiameters },
            craterDepth: { name: 'Crater Depth', unit: 'meters', data: mcResults.craterDepths },
            impactEnergy: { name: 'Impact Energy', unit: 'joules', data: mcResults.impactEnergies },
            seismicMagnitude: { name: 'Seismic Magnitude', unit: 'Richter', data: mcResults.seismicMagnitudes },
            blastRadius: { name: 'Blast Radius', unit: 'meters', data: mcResults.blastRadii }
        };

        const visualizations = {};

        for (const [key, info] of Object.entries(variables)) {
            if (info.data && info.data.length > 0) {
                visualizations[key] = this.generateVisualizationPackage(
                    info.data,
                    info.name,
                    info.unit
                );
            }
        }

        return {
            visualizations: visualizations,
            correlations: this._generateCorrelationMatrix(mcResults),
            metadata: {
                totalSamples: mcResults.metadata?.n_samples || mcResults.craterDiameters.length,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Generate correlation matrix between all output variables
     * @private
     */
    _generateCorrelationMatrix(mcResults) {
        const variables = ['craterDiameters', 'craterDepths', 'impactEnergies', 'seismicMagnitudes', 'blastRadii'];
        const labels = ['Crater Diameter', 'Crater Depth', 'Impact Energy', 'Seismic Magnitude', 'Blast Radius'];

        const matrix = {};

        for (let i = 0; i < variables.length; i++) {
            for (let j = i; j < variables.length; j++) {
                const var1 = variables[i];
                const var2 = variables[j];

                if (mcResults[var1] && mcResults[var2]) {
                    const scatter = this.generateScatterPlot(mcResults[var1], mcResults[var2], 500);
                    const key = `${labels[i]}_vs_${labels[j]}`;
                    matrix[key] = {
                        xVariable: labels[i],
                        yVariable: labels[j],
                        correlation: scatter.correlation
                    };
                }
            }
        }

        return matrix;
    }
}

module.exports = VisualizationData;