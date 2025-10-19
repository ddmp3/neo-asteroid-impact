# Phase 1.3 - Design Document
## Monte Carlo avec Incertitudes Complètes

**Date**: 2025-10-17
**Version**: v1.7.11 (proposée)
**Status**: 🚀 EN DÉVELOPPEMENT

---

## 🎯 Objectifs Phase 1.3

### Objectif Principal
Intégrer **toutes les sources d'incertitude** dans le Monte Carlo pour fournir des **intervalles de confiance robustes** (P10-P90) sur les prédictions de cratères.

### Sources d'Incertitude Identifiées

1. **σ (Strength)**: 20-120 MPa pour fer ✅ **DÉJÀ IMPLÉMENTÉ** (Phase 1.2)
2. **C (Crater scaling constant)**: 14.10 ± 1.13 (8% incertitude) ⚠️ **À AJOUTER**
3. **Angle (θ)**: ±10-15° incertitude typique ⚠️ **À AJOUTER**
4. **Velocity (v)**: ±10-20% incertitude (sauf cas documentés) ⚠️ **À AJOUTER**
5. **Diameter (D)**: ±10-30% (variable selon cas) ⏸️ **OPTIONNEL**
6. **Density (ρ)**: ±5-10% (composition connue) ⏸️ **OPTIONNEL**

### Priorités
- **Haute**: C, σ (impact direct sur résultat)
- **Moyenne**: angle, vitesse (impact modéré)
- **Basse**: diamètre, densité (généralement mieux connus)

---

## 🔬 Architecture Actuelle (v1.7.10)

### Monte Carlo Existant

**Fichier**: `api/src/services/monteCarloCrater.js`

**Paramètres actuellement variés**:
- ✅ **σ (strength)**: Uniform(σ_min, σ_max)
- ✅ **angle**: Uniform(θ - Δθ, θ + Δθ) [si spécifié]
- ✅ **velocity**: Uniform(v - Δv, v + Δv) [si spécifié]

**Limitations**:
- ❌ **C n'est pas varié** (fixé à 14.10)
- ❌ **Incertitude C (±1.13) ignorée**
- ❌ **Corrélations angle-velocity ignorées**

---

## 🏗️ Design Phase 1.3

### 1. Ajout Incertitude C

**Approche**: Distribution Normale

```javascript
// C ~ Normal(μ=14.10, σ=1.13)
// Représente bootstrap uncertainty de Phase 1.2

const C_samples = [];
for (let i = 0; i < N_samples; i++) {
    // Box-Muller transform pour Normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    const C_sample = C_mean + z * C_std;  // 14.10 + z * 1.13

    // Clamp to reasonable range [11, 17] (±3σ)
    const C_clamped = Math.max(11, Math.min(17, C_sample));

    C_samples.push(C_clamped);
}
```

**Justification**:
- Bootstrap donne distribution approximately Normale (N=1000 iterations)
- μ = 14.10, σ = 1.13 from Phase 1.2 calibration
- Clamp à ±3σ pour éviter valeurs extrêmes non physiques

### 2. Amélioration Incertitudes Angle & Vitesse

**Problème actuel**: Uniform distribution indépendante

**Amélioration**: Distributions plus réalistes

#### Angle θ

```javascript
// Angle typiquement Normal autour de valeur observée
// θ ~ Normal(θ_obs, σ_θ)

const ANGLE_UNCERTAINTY = {
    HIGH: 5,      // ±5° (très bien contraint)
    MEDIUM: 10,   // ±10° (modérément contraint)
    LOW: 15       // ±15° (peu contraint)
};

// Pour Sikhote-Alin (MEDIUM confidence)
const theta_mean = 45;  // degrees
const theta_std = ANGLE_UNCERTAINTY.MEDIUM;

const theta_sample = normalRandom(theta_mean, theta_std);
const theta_clamped = Math.max(10, Math.min(90, theta_sample));
```

#### Velocity v

```javascript
// Vitesse typiquement mieux connue pour NEOs (orbite tracée)
// v ~ Normal(v_obs, σ_v)

const VELOCITY_UNCERTAINTY_PCT = {
    HIGH: 5,       // ±5% (orbite bien connue)
    MEDIUM: 10,    // ±10% (orbite modérément connue)
    LOW: 20        // ±20% (orbite peu connue)
};

// Pour Sikhote-Alin (MEDIUM confidence)
const v_mean = 14000;  // m/s
const v_std = v_mean * (VELOCITY_UNCERTAINTY_PCT.MEDIUM / 100);

const v_sample = normalRandom(v_mean, v_std);
const v_clamped = Math.max(5000, Math.min(30000, v_sample));
```

### 3. Corrélations (Optionnel Phase 1.3.1)

**Observation**: Angle et vitesse peuvent être corrélés
- Impacts rasants (θ faible) → souvent vitesse plus élevée
- Impacts verticaux (θ élevé) → vitesse plus variable

**Implémentation future**: Matrice de covariance

```javascript
// Phase 1.3.1 (optionnel)
const Sigma = [
    [sigma_v^2,      rho*sigma_v*sigma_theta],
    [rho*sigma_v*sigma_theta, sigma_theta^2]
];

// Cholesky decomposition pour samples corrélés
// For now: SKIP (complexité vs bénéfice limité)
```

**Décision Phase 1.3**: **SKIP corrélations** (simplification acceptable)

---

## 📊 Propagation Incertitude Complète

### Flow Diagram

```
Input Parameters (observés):
  - D_imp = 10m ± 10%
  - v = 14000 m/s ± 10%
  - θ = 45° ± 10°
  - ρ = 7800 kg/m³ (connu)
  - composition = iron

        ↓

Monte Carlo (N=1000 samples):

  FOR i = 1 to 1000:

    1. Sample σ ~ Uniform(20, 120) MPa
    2. Sample C ~ Normal(14.10, 1.13)
    3. Sample θ ~ Normal(45°, 10°)
    4. Sample v ~ Normal(14000, 1400 m/s)
    5. [Sample D ~ Normal(10m, 1m)]  // OPTIONNEL

    6. Run FCM with sampled σ → m_final, v_final

    7. Calculate crater:
       D_crater = C × D_fragment × (ρ/ρ_tgt)^(1/3) × (v_final/v_ref)^(2/3) × sin^(1/3)(θ)

    8. Store D_crater[i]

        ↓

Statistical Analysis:
  - Median: P50
  - Confidence intervals: P10, P90 (80% CI)
  - Mean, Std
  - Distribution shape (histogram)

        ↓

Output:
  D_crater_median = 23m
  80% CI: [15m, 35m]
  95% CI: [12m, 45m]
```

---

## 🧮 Formules Mises à Jour

### Crater Diameter avec C Variable

**Avant (v1.7.10)**:
```javascript
const C = 14.10;  // Fixe
const D_crater = C * D_fragment * rho_ratio * v_ratio * sin_theta;
```

**Après (v1.7.11)**:
```javascript
const C = C_sample;  // Variable (Monte Carlo)
const D_crater = C * D_fragment * rho_ratio * v_ratio * sin_theta;
```

### Angle Impact dans Crater Formula

**Formule actuelle**:
```javascript
const sin_theta = Math.pow(Math.sin(theta), 1/3);
```

**Avec uncertainty**:
```javascript
const theta_rad = theta_sample * Math.PI / 180;
const sin_theta = Math.pow(Math.sin(theta_rad), 1/3);
```

### Velocity dans Crater Formula

**Formule actuelle**:
```javascript
const v_ratio = Math.pow(velocity / V_REF, 2/3);
```

**Avec uncertainty**:
```javascript
const v_ratio = Math.pow(v_sample / V_REF, 2/3);
```

---

## 📈 Validation Phase 1.3

### Test Case: Sikhote-Alin

**Paramètres d'entrée**:
- D = 10m (HIGH confidence: ±1m)
- v = 14000 m/s (MEDIUM: ±10%)
- θ = 45° (MEDIUM: ±10°)
- ρ = 7800 kg/m³ (iron, bien connu)
- σ = ? (20-120 MPa range)
- C = 14.10 ± 1.13

**Résultat attendu v1.7.10** (déterministe, σ=35 MPa):
- D_crater = 23.2m
- Observé = 26m
- Erreur = 10.6%

**Résultat attendu v1.7.11** (Monte Carlo complet):
- D_crater_median ≈ 23-25m (proche observé)
- 80% CI: [18m, 32m] (devrait inclure 26m observé ✅)
- 95% CI: [15m, 38m]

**Critère succès**: Observé (26m) dans 80% CI ✅

---

## 🔧 Modifications Code Requises

### 1. `monteCarloCrater.js` - Ajout C Sampling

```javascript
// NOUVEAU: Sample C avec distribution Normale
sampleC(mean, std) {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    const C_sample = mean + z * std;

    // Clamp to [11, 17] (±3σ from 14.10)
    return Math.max(11, Math.min(17, C_sample));
}

// MODIFIÉ: Run Monte Carlo
async runMonteCarlo(base_params, monte_carlo_config, crater_function) {
    const N = monte_carlo_config.N_samples;

    // Sample distributions
    const C_samples = [];
    const sigma_samples = [];
    const theta_samples = [];
    const v_samples = [];

    for (let i = 0; i < N; i++) {
        // C ~ Normal(14.10, 1.13)
        C_samples.push(this.sampleC(14.10, 1.13));

        // σ ~ Uniform(20e6, 120e6) MPa
        sigma_samples.push(this.sampleUniform(20e6, 120e6));

        // θ ~ Normal(θ_mean, 10°) for MEDIUM confidence
        theta_samples.push(this.sampleNormal(base_params.angle, 10));

        // v ~ Normal(v_mean, 10%) for MEDIUM confidence
        const v_std = base_params.velocity * 0.10;
        v_samples.push(this.sampleNormal(base_params.velocity, v_std));
    }

    // Run simulations
    const results = [];
    for (let i = 0; i < N; i++) {
        const iter_params = {
            ...base_params,
            strength_override: sigma_samples[i],
            C_override: C_samples[i],           // NOUVEAU
            angle: theta_samples[i],
            velocity: v_samples[i]
        };

        const result = await crater_function(iter_params);
        results.push({
            iteration: i,
            diameter: result.crater_diameter,
            C: C_samples[i],
            sigma: sigma_samples[i],
            angle: theta_samples[i],
            velocity: v_samples[i]
        });
    }

    return this.computeStatistics(results);
}
```

### 2. `smallIronCraterPhysics.js` - Support C_override

```javascript
// MODIFIÉ: calculateDeterministic
async calculateDeterministic(params) {
    // ...

    // Support C override from Monte Carlo
    const C = params.C_override || 14.10;  // NOUVEAU

    // Calculate crater with variable C
    const D_crater = C * D_fragment * rho_ratio * v_ratio * sin_theta;

    // ...
}
```

### 3. Nouvelles Fonctions Helper

```javascript
// api/src/utils/sampling.js (NOUVEAU FICHIER)

/**
 * Box-Muller transform for Normal distribution
 */
function normalRandom(mean = 0, std = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
}

/**
 * Uniform distribution
 */
function uniformRandom(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Sample with bounds checking
 */
function clampedSample(sample, min, max) {
    return Math.max(min, Math.min(max, sample));
}

module.exports = { normalRandom, uniformRandom, clampedSample };
```

---

## 📊 Output Format Phase 1.3

### JSON Response

```json
{
    "crater_prediction": {
        "deterministic": {
            "diameter_m": 23.2,
            "depth_m": 4.6,
            "method": "σ_typical=35MPa, C=14.10"
        },
        "monte_carlo": {
            "N_samples": 1000,
            "diameter_m": {
                "median": 24.1,
                "mean": 24.5,
                "std": 5.2,
                "P10": 18.3,
                "P25": 21.0,
                "P50": 24.1,
                "P75": 27.8,
                "P90": 31.5,
                "CI_80_pct": [18.3, 31.5],
                "CI_95_pct": [15.2, 36.8]
            },
            "uncertainty_sources": {
                "C": "Normal(14.10, 1.13)",
                "sigma": "Uniform(20, 120) MPa",
                "angle": "Normal(45, 10)°",
                "velocity": "Normal(14000, 1400) m/s"
            }
        },
        "observed": {
            "diameter_m": 26.0,
            "name": "Sikhote-Alin",
            "in_CI_80": true,
            "in_CI_95": true
        }
    }
}
```

---

## 🎯 Success Criteria Phase 1.3

| Critère | Target | Mesure |
|---------|--------|--------|
| **Observé dans 80% CI** | ≥70% des cas HIGH | Sikhote-Alin in [P10, P90] |
| **CI width reasonable** | Factor 2-3× | (P90 - P10) / P50 ≈ 0.5-1.0 |
| **C uncertainty integrated** | Oui | Samples C ~ N(14.10, 1.13) |
| **Angle uncertainty** | Oui | Samples θ ~ N(θ₀, 10°) |
| **Velocity uncertainty** | Oui | Samples v ~ N(v₀, 10%) |
| **Performance acceptable** | <5s | N=1000 Monte Carlo |

---

## 📅 Plan d'Implémentation

### Étape 1: Sampling Utilities ✅
- Créer `api/src/utils/sampling.js`
- Implémenter Box-Muller Normal
- Implémenter Uniform
- Tests unitaires

### Étape 2: Monte Carlo Update
- Modifier `monteCarloCrater.js`
- Ajouter C sampling
- Améliorer angle/velocity sampling
- Intégrer sampling utilities

### Étape 3: Physics Engine Support
- Modifier `smallIronCraterPhysics.js`
- Support `C_override` parameter
- Passer C aux formules cratère

### Étape 4: Validation
- Test Sikhote-Alin avec MC complet
- Vérifier 26m observé dans 80% CI
- Analyser distribution résultats

### Étape 5: Documentation
- Documenter méthodologie
- Créer visualisations (histograms)
- Rapport Phase 1.3

---

## 🔬 Considérations Scientifiques

### Distribution C: Pourquoi Normale?

**Justification**:
1. Bootstrap (N=1000) → Central Limit Theorem → approximately Normal
2. μ = 14.10, σ = 1.13 from Phase 1.2 calibration empirique
3. Clamp ±3σ évite valeurs non physiques

### Distribution σ: Pourquoi Uniform?

**Justification**:
1. Manque d'informations a priori sur distribution σ réelle
2. Uniform = maximum entropy (least informative prior)
3. Range [20, 120] MPa de la littérature fer

**Alternative future**: Weibull distribution (si données disponibles)

### Distribution angle/velocity: Pourquoi Normale?

**Justification**:
1. Erreurs mesure typiquement Normales
2. Angle impact pour petits corps ~ distribution préférentielle
3. Vitesse orbite bien contrainte (lois Kepler)

---

## 🚀 Roadmap

### Phase 1.3.0 (Cette session)
- ✅ Design document
- ⏳ Implémentation sampling utilities
- ⏳ Intégration Monte Carlo C uncertainty
- ⏳ Validation Sikhote-Alin

### Phase 1.3.1 (Future)
- Corrélations angle-velocity (optionnel)
- Diameter uncertainty (optionnel)
- Density uncertainty (composition-dependent)

### Phase 1.3.2 (Future)
- Visualisation distributions (histograms, violin plots)
- Sensibilité analysis (quelle incertitude domine?)
- Documentation utilisateur

---

**Prêt à implémenter!** 🚀

**Version**: Phase 1.3 Design v1.0
**Auteur**: Claude Code
**Date**: 2025-10-17
