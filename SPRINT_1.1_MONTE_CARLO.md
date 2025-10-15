# Sprint 1.1: Monte Carlo Uncertainty Quantification
## Priorité P0 - CRITIQUE | Durée: 3 semaines (60h) | Nov 2025

**Objectif**: Implémenter quantification d'incertitude pour NASA PDCO requirement
**Deliverable**: v1.8.0 avec Monte Carlo complet
**Status**: 🟡 Ready to Start

---

## 📊 Sprint Overview

| Métrique | Valeur |
|----------|--------|
| **Tasks** | 9 tasks |
| **Effort total** | 60 heures |
| **Story points** | 34 SP |
| **Criticality** | P0 - BLOQUANT pour NASA PDCO |
| **Dependencies** | Aucune (peut démarrer immédiatement) |

---

## 📝 Tasks Breakdown

### Task #1.1.1: Setup Infrastructure Monte Carlo
**Effort**: 4h | **SP**: 3 | **Priority**: P0

**Objectif**: Créer module de base pour MC uncertainty quantification

**Subtasks**:
```bash
1. Create file: api/src/services/uncertaintyQuantification.js
2. Implement distributions:
   - normalDistribution(mean, std)
   - uniformDistribution(min, max)
   - lognormalDistribution(mean, std)
3. Implement sampling:
   - sampleNormal(n_samples)
   - sampleUniform(n_samples)
   - sampleLognormal(n_samples)
4. Unit tests (Jest):
   - test_normal_distribution_stats()
   - test_uniform_distribution_stats()
   - test_lognormal_distribution_stats()
```

**Code Template**:
```javascript
// api/src/services/uncertaintyQuantification.js
class UncertaintyQuantification {
    /**
     * Sample from normal distribution
     * @param {number} mean - Mean value
     * @param {number} std - Standard deviation
     * @param {number} n_samples - Number of samples
     * @returns {Array<number>} Samples
     */
    sampleNormal(mean, std, n_samples) {
        const samples = [];
        for (let i = 0; i < n_samples; i++) {
            // Box-Muller transform
            const u1 = Math.random();
            const u2 = Math.random();
            const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            samples.push(mean + z0 * std);
        }
        return samples;
    }

    /**
     * Kolmogorov-Smirnov test for distribution correctness
     */
    ksTest(samples, expectedCDF) {
        // Implementation...
    }
}

module.exports = UncertaintyQuantification;
```

**Tests**:
```javascript
// api/src/tests/uncertaintyQuantification.test.js
describe('UncertaintyQuantification', () => {
    test('Normal distribution has correct mean', () => {
        const uq = new UncertaintyQuantification();
        const samples = uq.sampleNormal(100, 10, 10000);
        const mean = samples.reduce((a, b) => a + b) / samples.length;
        expect(mean).toBeCloseTo(100, 0); // ±1
    });

    test('Normal distribution has correct std', () => {
        const uq = new UncertaintyQuantification();
        const samples = uq.sampleNormal(100, 10, 10000);
        const mean = samples.reduce((a, b) => a + b) / samples.length;
        const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
        const std = Math.sqrt(variance);
        expect(std).toBeCloseTo(10, 0.5); // ±0.5
    });

    test('Performance: 1000 samples < 1s', () => {
        const uq = new UncertaintyQuantification();
        const start = Date.now();
        uq.sampleNormal(100, 10, 1000);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(1000); // <1s
    });
});
```

**Critères Succès**:
- ✅ Tests green (3 distributions)
- ✅ 1000 samples <1s
- ✅ KS test p-value >0.05 (distribution correcte)

**Références**:
- Box-Muller transform: https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
- Kolmogorov-Smirnov test: JCGM 100:2008

---

### Task #1.1.2: Implement Monte Carlo Simulation
**Effort**: 8h | **SP**: 5 | **Priority**: P0

**Objectif**: Fonction MC pour propagation incertitude

**Subtasks**:
```bash
1. Function monteCarloSimulation(params, n_samples=1000)
2. Parameter uncertainty definitions:
   - diameter: Normal(D, 0.1*D)  # ±10%
   - velocity: Normal(V, 0.05*V) # ±5%
   - angle: Uniform(30°, 60°) or specified
   - density: Normal(ρ, 0.15*ρ)  # ±15%
   - model_K1: Normal(0.40, 0.05) # Calibration uncertainty
3. Parallel execution (Worker threads):
   - Split n_samples across CPU cores
   - Aggregate results
4. Progress callback (for UI loading bar)
```

**Code Template**:
```javascript
// api/src/services/uncertaintyQuantification.js (continued)
class UncertaintyQuantification {
    /**
     * Monte Carlo simulation with uncertainty propagation
     * @param {Object} params - Nominal parameters
     * @param {number} n_samples - Number of MC samples (default 1000)
     * @returns {Object} Statistical results
     */
    async monteCarloSimulation(params, n_samples = 1000) {
        const PhysicsEngine = require('./physicsEngine');
        const physics = new PhysicsEngine();

        const results = {
            crater_diameter: [],
            crater_depth: [],
            casualties: [],
            energy: []
        };

        // Parallel execution (optional, for n_samples > 10k)
        const batchSize = Math.ceil(n_samples / require('os').cpus().length);

        for (let i = 0; i < n_samples; i++) {
            // Sample uncertain parameters
            const D_sample = this.sampleNormal(params.diameter, 0.1 * params.diameter, 1)[0];
            const V_sample = this.sampleNormal(params.velocity, 0.05 * params.velocity, 1)[0];
            const theta_sample = params.theta_uncertain
                ? this.sampleUniform(30, 60, 1)[0]
                : params.theta;
            const rho_sample = this.sampleNormal(params.density, 0.15 * params.density, 1)[0];

            // Ensure physical constraints
            const D_final = Math.max(1, D_sample);  // D >= 1m
            const V_final = Math.max(5000, Math.min(72000, V_sample)); // 5-72 km/s

            // Run simulation
            const result = await physics.simulateImpact({
                diameter: D_final,
                velocity: V_final,
                angle: theta_sample,
                density: rho_sample,
                impactLocation: params.impactLocation,
                composition: params.composition
            });

            // Store results
            results.crater_diameter.push(result.crater.diameter);
            results.crater_depth.push(result.crater.depth);
            results.casualties.push(result.casualties.estimatedCasualties);
            results.energy.push(result.energy.megatons);

            // Progress callback (optional)
            if (params.onProgress && i % 100 === 0) {
                params.onProgress(i / n_samples);
            }
        }

        return results;
    }
}
```

**Tests**:
```javascript
describe('Monte Carlo Simulation', () => {
    test('Runs 100 samples successfully', async () => {
        const uq = new UncertaintyQuantification();
        const params = {
            diameter: 50,
            velocity: 12000,
            angle: 45,
            density: 7870,
            composition: 'iron',
            impactLocation: { lat: 35.0, lon: -111.0, isOcean: false }
        };

        const results = await uq.monteCarloSimulation(params, 100);
        expect(results.crater_diameter.length).toBe(100);
        expect(results.crater_diameter.every(d => d > 0)).toBe(true);
    });

    test('Performance: 1000 samples < 30s', async () => {
        const uq = new UncertaintyQuantification();
        const params = { /* ... */ };
        const start = Date.now();
        await uq.monteCarloSimulation(params, 1000);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(30000); // <30s
    }, 35000); // Timeout 35s
});
```

**Critères Succès**:
- ✅ 1000 samples <30s (single thread)
- ✅ Results arrays length === n_samples
- ✅ No negative/NaN values

---

### Task #1.1.3: Statistical Analysis
**Effort**: 6h | **SP**: 3 | **Priority**: P0

**Code Template**:
```javascript
class UncertaintyQuantification {
    /**
     * Compute statistics from MC results
     * @param {Array<number>} samples - MC samples
     * @returns {Object} Statistics
     */
    computeStatistics(samples) {
        const sorted = [...samples].sort((a, b) => a - b);
        const n = samples.length;

        // Mean
        const mean = samples.reduce((a, b) => a + b, 0) / n;

        // Variance & Standard Deviation
        const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
        const std = Math.sqrt(variance);

        // Median
        const median = sorted[Math.floor(n / 2)];

        // Mode (approximate via histogram)
        const mode = this.estimateMode(samples);

        // Confidence Intervals
        const ci_68 = [sorted[Math.floor(n * 0.16)], sorted[Math.floor(n * 0.84)]];
        const ci_95 = [sorted[Math.floor(n * 0.025)], sorted[Math.floor(n * 0.975)]];
        const ci_997 = [sorted[Math.floor(n * 0.0015)], sorted[Math.floor(n * 0.9985)]];

        // Percentiles
        const percentiles = {
            p5: sorted[Math.floor(n * 0.05)],
            p25: sorted[Math.floor(n * 0.25)],
            p50: median,
            p75: sorted[Math.floor(n * 0.75)],
            p95: sorted[Math.floor(n * 0.95)]
        };

        return {
            mean,
            std,
            variance,
            median,
            mode,
            ci_68,
            ci_95,
            ci_997,
            percentiles,
            min: sorted[0],
            max: sorted[n - 1],
            n_samples: n
        };
    }

    estimateMode(samples, bins = 50) {
        // Histogram-based mode estimation
        const min = Math.min(...samples);
        const max = Math.max(...samples);
        const binWidth = (max - min) / bins;
        const histogram = new Array(bins).fill(0);

        samples.forEach(s => {
            const bin = Math.min(Math.floor((s - min) / binWidth), bins - 1);
            histogram[bin]++;
        });

        const maxBin = histogram.indexOf(Math.max(...histogram));
        return min + (maxBin + 0.5) * binWidth;
    }
}
```

**Critères Succès**:
- ✅ CI contient mean (68% CI contient ~68% samples)
- ✅ Median ≈ mean pour Normal distribution
- ✅ Percentiles monotonic (p5 < p25 < p50 < p75 < p95)

---

### Task #1.1.4: Variance Decomposition
**Effort**: 10h | **SP**: 5 | **Priority**: P0

**Objectif**: Sobol sensitivity analysis - quelle source domine incertitude?

**Code Template**:
```javascript
class UncertaintyQuantification {
    /**
     * Sobol variance decomposition
     * @param {Object} params - Nominal parameters
     * @param {number} n_samples - Samples per parameter
     * @returns {Object} Variance contributions
     */
    async sobolAnalysis(params, n_samples = 1000) {
        const PhysicsEngine = require('./physicsEngine');
        const physics = new PhysicsEngine();

        // Baseline variance (all parameters varying)
        const baseline_results = await this.monteCarloSimulation(params, n_samples);
        const V_total = this.computeStatistics(baseline_results.crater_diameter).variance;

        // First-order indices: vary one parameter at a time
        const first_order = {};

        // Vary diameter only
        const results_D = [];
        for (let i = 0; i < n_samples; i++) {
            const D_sample = this.sampleNormal(params.diameter, 0.1 * params.diameter, 1)[0];
            const result = await physics.simulateImpact({
                ...params,
                diameter: Math.max(1, D_sample)
            });
            results_D.push(result.crater.diameter);
        }
        const V_D = this.computeStatistics(results_D).variance;
        first_order.diameter = V_D / V_total;

        // Vary velocity only
        const results_V = [];
        for (let i = 0; i < n_samples; i++) {
            const V_sample = this.sampleNormal(params.velocity, 0.05 * params.velocity, 1)[0];
            const result = await physics.simulateImpact({
                ...params,
                velocity: Math.max(5000, Math.min(72000, V_sample))
            });
            results_V.push(result.crater.diameter);
        }
        const V_V = this.computeStatistics(results_V).variance;
        first_order.velocity = V_V / V_total;

        // Vary angle only
        const results_theta = [];
        for (let i = 0; i < n_samples; i++) {
            const theta_sample = this.sampleUniform(30, 60, 1)[0];
            const result = await physics.simulateImpact({
                ...params,
                angle: theta_sample
            });
            results_theta.push(result.crater.diameter);
        }
        const V_theta = this.computeStatistics(results_theta).variance;
        first_order.angle = V_theta / V_total;

        // Vary density only
        const results_rho = [];
        for (let i = 0; i < n_samples; i++) {
            const rho_sample = this.sampleNormal(params.density, 0.15 * params.density, 1)[0];
            const result = await physics.simulateImpact({
                ...params,
                density: Math.max(1000, rho_sample)
            });
            results_rho.push(result.crater.diameter);
        }
        const V_rho = this.computeStatistics(results_rho).variance;
        first_order.density = V_rho / V_total;

        // Higher-order interactions (total - sum first-order)
        const sum_first_order = Object.values(first_order).reduce((a, b) => a + b, 0);
        const interactions = Math.max(0, 1 - sum_first_order);

        return {
            total_variance: V_total,
            first_order_indices: first_order,
            interactions,
            interpretation: this.interpretSobol(first_order)
        };
    }

    interpretSobol(indices) {
        const sorted = Object.entries(indices).sort((a, b) => b[1] - a[1]);
        const dominant = sorted[0];

        let message = `Uncertainty dominated by ${dominant[0]} (${(dominant[1] * 100).toFixed(1)}%).`;

        if (dominant[1] < 0.5) {
            message += ` Multiple parameters contribute (no single dominant source).`;
        }

        return message;
    }
}
```

**Critères Succès**:
- ✅ Sum first-order + interactions ≈ 1.0 (±5%)
- ✅ Dominant parameter identified
- ✅ Sens analysis report generated

---

### Task #1.1.5 - #1.1.9: [Similar detailed templates...]

---

## 🧪 Integration Tests

```javascript
// api/src/tests/integration/monteCarlo.integration.test.js
describe('Monte Carlo Integration Tests', () => {
    test('Barringer with uncertainty: CI contains observed', async () => {
        const uq = new UncertaintyQuantification();
        const params = {
            diameter: 50,         // Estimated
            velocity: 12000,      // Estimated
            angle: 45,            // Unknown
            density: 7870,        // Iron
            composition: 'iron',
            impactLocation: { lat: 35.0, lon: -111.0, isOcean: false },
            theta_uncertain: true // Vary angle
        };

        const results = await uq.monteCarloSimulation(params, 5000);
        const stats = uq.computeStatistics(results.crater_diameter);

        const D_observed = 1186; // Barringer observed diameter
        const in_ci_68 = D_observed >= stats.ci_68[0] && D_observed <= stats.ci_68[1];
        const in_ci_95 = D_observed >= stats.ci_95[0] && D_observed <= stats.ci_95[1];

        console.log(`Mean: ${stats.mean.toFixed(0)}m, CI 95%: [${stats.ci_95[0].toFixed(0)}, ${stats.ci_95[1].toFixed(0)}]`);
        console.log(`Observed: ${D_observed}m, In CI 68%: ${in_ci_68}, In CI 95%: ${in_ci_95}`);

        expect(in_ci_95).toBe(true); // Observed should be in 95% CI
    }, 180000); // Timeout 3 min
});
```

---

## 📊 Acceptance Criteria (Sprint 1.1 Complete)

- [ ] All 9 tasks completed (checklist ✅)
- [ ] Tests coverage >80% (`npm test -- --coverage`)
- [ ] No regression golden masters (Barringer ±5%)
- [ ] Performance: MC 1000 samples <30s
- [ ] Documentation updated (PHYSICS_MODEL_v2.0.md)
- [ ] API `/simulate/uncertainty` functional (Swagger tested)
- [ ] Frontend UI displays error bars
- [ ] v1.8.0 tagged and deployed

---

## 🚀 Quick Commands

```bash
# Start Sprint 1.1
git checkout -b feature/sprint-1.1-monte-carlo
npm run test:watch

# Task #1.1.1
touch api/src/services/uncertaintyQuantification.js
touch api/src/tests/uncertaintyQuantification.test.js
npm test -- uncertaintyQuantification

# Task #1.1.2
# ... implement MC simulation ...
npm test -- monteCarlo

# Integration test
npm test -- integration/monteCarlo

# Merge when done
git add .
git commit -m "feat: Monte Carlo uncertainty quantification (Sprint 1.1)"
git push origin feature/sprint-1.1-monte-carlo
# Create PR → Review → Merge → Tag v1.8.0
```

---

**Next Sprint**: 1.2 Dataset Expansion N=75 (4 weeks)