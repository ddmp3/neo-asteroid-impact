/**
 * Unit tests for Visualization Data Generator
 * Tests PDF, CDF, box plots, KDE, and scatter plots
 *
 * @module visualizationData.test
 */

const VisualizationData = require('../services/visualizationData');

describe('VisualizationData', () => {
    let viz;

    beforeEach(() => {
        viz = new VisualizationData();
    });

    describe('Histogram Calculation', () => {
        test('calculateHistogram returns correct structure', () => {
            const samples = Array.from({ length: 100 }, (_, i) => i);
            const hist = viz.calculateHistogram(samples, 10);

            expect(hist).toHaveProperty('bins');
            expect(hist).toHaveProperty('counts');
            expect(hist).toHaveProperty('edges');
            expect(hist).toHaveProperty('width');
            expect(hist).toHaveProperty('total');
        });

        test('calculateHistogram bins sum to total samples', () => {
            const samples = Array.from({ length: 100 }, () => Math.random() * 100);
            const hist = viz.calculateHistogram(samples, 20);

            const sum = hist.counts.reduce((a, b) => a + b, 0);
            expect(sum).toBe(samples.length);
        });

        test('calculateHistogram uses Sturges rule when bins not specified', () => {
            const samples = Array.from({ length: 1000 }, () => Math.random());
            const hist = viz.calculateHistogram(samples);

            // Sturges: k = 1 + 3.322 * log10(1000) ≈ 11
            expect(hist.bins.length).toBeGreaterThan(10);
            expect(hist.bins.length).toBeLessThan(20);
        });

        test('calculateHistogram handles constant values', () => {
            const samples = Array(100).fill(50);
            const hist = viz.calculateHistogram(samples);

            expect(hist.bins.length).toBe(1);
            expect(hist.counts[0]).toBe(100);
        });

        test('calculateHistogram throws error for empty array', () => {
            expect(() => viz.calculateHistogram([])).toThrow('Samples array is empty');
        });
    });

    describe('PDF Generation', () => {
        test('generatePDF returns probability density', () => {
            const samples = Array.from({ length: 1000 }, () => Math.random() * 100);
            const pdf = viz.generatePDF(samples, 50);

            expect(pdf).toHaveProperty('x');
            expect(pdf).toHaveProperty('y');
            expect(pdf).toHaveProperty('type');
            expect(pdf.type).toBe('probability_density');
        });

        test('generatePDF integral approximately equals 1', () => {
            const samples = Array.from({ length: 1000 }, () => Math.random() * 100);
            const pdf = viz.generatePDF(samples, 50);

            expect(pdf.integral).toBeCloseTo(1, 1); // Within 0.1
        });

        test('generatePDF x and y arrays have same length', () => {
            const samples = Array.from({ length: 500 }, () => Math.random() * 50);
            const pdf = viz.generatePDF(samples);

            expect(pdf.x.length).toBe(pdf.y.length);
        });

        test('generatePDF all densities are non-negative', () => {
            const samples = Array.from({ length: 500 }, () => Math.random() * 50);
            const pdf = viz.generatePDF(samples);

            pdf.y.forEach(density => {
                expect(density).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('CDF Generation', () => {
        test('generateCDF returns cumulative distribution', () => {
            const samples = Array.from({ length: 500 }, () => Math.random() * 100);
            const cdf = viz.generateCDF(samples);

            expect(cdf).toHaveProperty('x');
            expect(cdf).toHaveProperty('y');
            expect(cdf).toHaveProperty('type');
            expect(cdf.type).toBe('cumulative_distribution');
        });

        test('generateCDF starts at 0 and ends at 1', () => {
            const samples = Array.from({ length: 500 }, () => Math.random() * 100);
            const cdf = viz.generateCDF(samples);

            expect(cdf.y[0]).toBe(0);
            expect(cdf.y[cdf.y.length - 1]).toBe(1);
        });

        test('generateCDF is monotonically increasing', () => {
            const samples = Array.from({ length: 500 }, () => Math.random() * 100);
            const cdf = viz.generateCDF(samples);

            for (let i = 1; i < cdf.y.length; i++) {
                expect(cdf.y[i]).toBeGreaterThanOrEqual(cdf.y[i - 1]);
            }
        });

        test('generateCDF median occurs at probability 0.5', () => {
            const samples = Array.from({ length: 1000 }, () => Math.random() * 100);
            const cdf = viz.generateCDF(samples, 200);

            // Find x value where y ≈ 0.5
            const medianIndex = cdf.y.findIndex(p => p >= 0.5);
            const cdfMedian = cdf.x[medianIndex];

            // Calculate actual median
            const sorted = [...samples].sort((a, b) => a - b);
            const actualMedian = sorted[Math.floor(samples.length / 2)];

            // Should be close (within 5%)
            expect(Math.abs(cdfMedian - actualMedian) / actualMedian).toBeLessThan(0.05);
        });

        test('generateCDF throws error for empty array', () => {
            expect(() => viz.generateCDF([])).toThrow('Samples array is empty');
        });
    });

    describe('Box Plot Generation', () => {
        test('generateBoxPlot returns 5-number summary', () => {
            const samples = Array.from({ length: 100 }, (_, i) => i);
            const box = viz.generateBoxPlot(samples);

            expect(box).toHaveProperty('min');
            expect(box).toHaveProperty('q1');
            expect(box).toHaveProperty('median');
            expect(box).toHaveProperty('q3');
            expect(box).toHaveProperty('max');
        });

        test('generateBoxPlot quartiles are ordered correctly', () => {
            const samples = Array.from({ length: 1000 }, () => Math.random() * 100);
            const box = viz.generateBoxPlot(samples);

            expect(box.min).toBeLessThanOrEqual(box.q1);
            expect(box.q1).toBeLessThanOrEqual(box.median);
            expect(box.median).toBeLessThanOrEqual(box.q3);
            expect(box.q3).toBeLessThanOrEqual(box.max);
        });

        test('generateBoxPlot median at 50th percentile', () => {
            const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const box = viz.generateBoxPlot(samples);

            expect(box.median).toBe(5.5); // Average of 5 and 6
        });

        test('generateBoxPlot calculates IQR correctly', () => {
            const samples = Array.from({ length: 100 }, (_, i) => i);
            const box = viz.generateBoxPlot(samples);

            const expectedIQR = box.q3 - box.q1;
            expect(box.iqr).toBeCloseTo(expectedIQR, 5);
        });

        test('generateBoxPlot identifies outliers', () => {
            const samples = [...Array(100).fill(50), 150, 200]; // Two outliers
            const box = viz.generateBoxPlot(samples);

            expect(box.outliers.length).toBeGreaterThan(0);
        });

        test('generateBoxPlot throws error for empty array', () => {
            expect(() => viz.generateBoxPlot([])).toThrow('Samples array is empty');
        });
    });

    describe('Kernel Density Estimation', () => {
        test('estimateKDE returns smooth density curve', () => {
            const samples = Array.from({ length: 500 }, () => Math.random() * 100);
            const kde = viz.estimateKDE(samples, 100);

            expect(kde).toHaveProperty('x');
            expect(kde).toHaveProperty('y');
            expect(kde).toHaveProperty('bandwidth');
            expect(kde.type).toBe('kernel_density_estimate');
        });

        test('estimateKDE has correct number of points', () => {
            const samples = Array.from({ length: 500 }, () => Math.random() * 100);
            const kde = viz.estimateKDE(samples, 150);

            expect(kde.x.length).toBe(150);
            expect(kde.y.length).toBe(150);
        });

        test('estimateKDE all densities are non-negative', () => {
            const samples = Array.from({ length: 500 }, () => Math.random() * 100);
            const kde = viz.estimateKDE(samples);

            kde.y.forEach(density => {
                expect(density).toBeGreaterThanOrEqual(0);
            });
        });

        test('estimateKDE throws error for empty array', () => {
            expect(() => viz.estimateKDE([])).toThrow('Samples array is empty');
        });
    });

    describe('Violin Plot Generation', () => {
        test('generateViolinPlot combines box plot and KDE', () => {
            const samples = Array.from({ length: 500 }, () => Math.random() * 100);
            const violin = viz.generateViolinPlot(samples);

            expect(violin).toHaveProperty('boxPlot');
            expect(violin).toHaveProperty('kde');
            expect(violin.type).toBe('violin_plot');
        });

        test('generateViolinPlot box plot has correct structure', () => {
            const samples = Array.from({ length: 500 }, () => Math.random() * 100);
            const violin = viz.generateViolinPlot(samples);

            expect(violin.boxPlot).toHaveProperty('median');
            expect(violin.boxPlot).toHaveProperty('q1');
            expect(violin.boxPlot).toHaveProperty('q3');
        });

        test('generateViolinPlot KDE has smooth curve', () => {
            const samples = Array.from({ length: 500 }, () => Math.random() * 100);
            const violin = viz.generateViolinPlot(samples, 100);

            expect(violin.kde.x.length).toBe(100);
            expect(violin.kde.y.length).toBe(100);
        });
    });

    describe('Scatter Plot Generation', () => {
        test('generateScatterPlot returns correct structure', () => {
            const x = Array.from({ length: 100 }, () => Math.random() * 100);
            const y = Array.from({ length: 100 }, () => Math.random() * 100);
            const scatter = viz.generateScatterPlot(x, y);

            expect(scatter).toHaveProperty('x');
            expect(scatter).toHaveProperty('y');
            expect(scatter).toHaveProperty('correlation');
            expect(scatter).toHaveProperty('type');
            expect(scatter.type).toBe('scatter_plot');
        });

        test('generateScatterPlot detects positive correlation', () => {
            const x = Array.from({ length: 500 }, () => Math.random() * 100);
            const y = x.map(xi => 2 * xi + Math.random() * 5); // Strong positive

            const scatter = viz.generateScatterPlot(x, y);

            expect(scatter.correlation).toBeGreaterThan(0.9);
        });

        test('generateScatterPlot detects negative correlation', () => {
            const x = Array.from({ length: 500 }, () => Math.random() * 100);
            const y = x.map(xi => -2 * xi + 200 + Math.random() * 5); // Strong negative

            const scatter = viz.generateScatterPlot(x, y);

            expect(scatter.correlation).toBeLessThan(-0.9);
        });

        test('generateScatterPlot downsamples large datasets', () => {
            const x = Array.from({ length: 5000 }, () => Math.random());
            const y = Array.from({ length: 5000 }, () => Math.random());
            const scatter = viz.generateScatterPlot(x, y, 1000);

            expect(scatter.numPoints).toBeLessThanOrEqual(1000);
            expect(scatter.totalSamples).toBe(5000);
        });

        test('generateScatterPlot throws error for mismatched lengths', () => {
            const x = [1, 2, 3];
            const y = [4, 5];

            expect(() => viz.generateScatterPlot(x, y)).toThrow('Sample arrays must have same length');
        });
    });

    describe('Visualization Package', () => {
        test('generateVisualizationPackage returns complete package', () => {
            const samples = Array.from({ length: 1000 }, () => Math.random() * 100);
            const pkg = viz.generateVisualizationPackage(samples, 'Test Variable', 'units');

            expect(pkg).toHaveProperty('variable');
            expect(pkg).toHaveProperty('unit');
            expect(pkg).toHaveProperty('pdf');
            expect(pkg).toHaveProperty('cdf');
            expect(pkg).toHaveProperty('boxPlot');
            expect(pkg).toHaveProperty('kde');
            expect(pkg).toHaveProperty('histogram');
            expect(pkg).toHaveProperty('metadata');
        });

        test('generateVisualizationPackage includes correct variable name', () => {
            const samples = Array.from({ length: 500 }, () => Math.random() * 100);
            const pkg = viz.generateVisualizationPackage(samples, 'Crater Diameter', 'meters');

            expect(pkg.variable).toBe('Crater Diameter');
            expect(pkg.unit).toBe('meters');
        });

        test('generateVisualizationPackage tracks sample count', () => {
            const samples = Array.from({ length: 1234 }, () => Math.random());
            const pkg = viz.generateVisualizationPackage(samples);

            expect(pkg.numSamples).toBe(1234);
        });
    });

    describe('Multi-Variable Visualization', () => {
        let mockMCResults;

        beforeEach(() => {
            const n = 1000;
            mockMCResults = {
                craterDiameters: Array.from({ length: n }, () => 1000 + Math.random() * 200),
                craterDepths: Array.from({ length: n }, () => 200 + Math.random() * 40),
                impactEnergies: Array.from({ length: n }, () => 1e15 + Math.random() * 2e14),
                seismicMagnitudes: Array.from({ length: n }, () => 5 + Math.random()),
                blastRadii: Array.from({ length: n }, () => 5000 + Math.random() * 1000),
                metadata: { n_samples: n }
            };
        });

        test('generateMultiVariableVisualization returns all outputs', () => {
            const multiViz = viz.generateMultiVariableVisualization(mockMCResults);

            expect(multiViz).toHaveProperty('visualizations');
            expect(multiViz).toHaveProperty('correlations');
            expect(multiViz).toHaveProperty('metadata');

            expect(multiViz.visualizations).toHaveProperty('craterDiameter');
            expect(multiViz.visualizations).toHaveProperty('craterDepth');
            expect(multiViz.visualizations).toHaveProperty('impactEnergy');
        });

        test('generateMultiVariableVisualization includes correlation matrix', () => {
            const multiViz = viz.generateMultiVariableVisualization(mockMCResults);

            expect(multiViz.correlations).toBeDefined();
            expect(Object.keys(multiViz.correlations).length).toBeGreaterThan(0);
        });

        test('generateMultiVariableVisualization each output has complete package', () => {
            const multiViz = viz.generateMultiVariableVisualization(mockMCResults);

            const craterViz = multiViz.visualizations.craterDiameter;
            expect(craterViz).toHaveProperty('pdf');
            expect(craterViz).toHaveProperty('cdf');
            expect(craterViz).toHaveProperty('boxPlot');
        });
    });

    describe('Edge Cases', () => {
        test('handles single sample', () => {
            const samples = [42];
            const pdf = viz.generatePDF(samples);
            const cdf = viz.generateCDF(samples);

            expect(pdf.x.length).toBeGreaterThan(0);
            expect(cdf.y[0]).toBe(0);
            expect(cdf.y[cdf.y.length - 1]).toBe(1);
        });

        test('handles two identical samples', () => {
            const samples = [50, 50];
            const box = viz.generateBoxPlot(samples);

            expect(box.min).toBe(50);
            expect(box.max).toBe(50);
            expect(box.median).toBe(50);
        });

        test('handles very skewed distribution', () => {
            const samples = [...Array(95).fill(10), ...Array(5).fill(1000)];
            const box = viz.generateBoxPlot(samples);
            const pdf = viz.generatePDF(samples);

            expect(box.outliers.length).toBeGreaterThan(0);
            expect(pdf.x.length).toBeGreaterThan(0);
        });
    });
});