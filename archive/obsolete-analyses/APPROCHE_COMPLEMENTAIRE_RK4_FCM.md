# Approche Complémentaire RK4 + FCM

**Date:** 2025-10-16
**Analyse:** Comment RK4 et FCM peuvent travailler ensemble

---

## COMPARAISON DES DEUX APPROCHES

### RK4 + Weibull (v1.7.0 actuel)

**Forces:**
- ✅ **Rapide** (~0.1s par simulation)
- ✅ **Énergie excellente** (Chelyabinsk: 1% erreur)
- ✅ **Simple à calibrer**
- ✅ **Production-ready** (actuellement utilisé)
- ✅ **Conservation énergie** vérifiée

**Faiblesses:**
- ❌ **Fragmentation instantanée** (Hills-Goda)
- ❌ **Altitude biaisée HAUTE** (Chelyabinsk: +45%, Tunguska: +253%)
- ❌ **Pas de fragmentation progressive**
- ❌ **Pancake unique** (pas de distribution fragments)

**Cas d'usage:**
- Simulations rapides (risk assessment, Monte Carlo)
- Calcul énergie impact
- Crater scaling
- Dashboard interactif (temps réel)

---

### FCM (v1.7.4 nouveau)

**Forces:**
- ✅ **Fragmentation progressive** (réaliste)
- ✅ **Distribution fragments** + debris clouds
- ✅ **Physique Wheeler 2017** (peer-reviewed)
- ✅ **Multiple debris clouds** (energy deposition features)
- ✅ **Potentiel meilleure altitude** (si calibré)

**Faiblesses:**
- ❌ **Plus lent** (~1-2s par simulation)
- ❌ **Non calibré** encore
- ❌ **Plus complexe** (7+ paramètres)
- ❌ **Debugging en cours**

**Cas d'usage:**
- Analyses scientifiques détaillées
- Matching observed light curves
- Études fragmentation mechanisms
- Publications scientifiques

---

## 🎯 APPROCHE COMPLÉMENTAIRE: SYSTÈME HYBRIDE

### IDÉE: Utiliser les deux selon le contexte

```javascript
function chooseModel(context) {
    if (context.need_speed || context.monte_carlo) {
        return 'RK4';  // Fast, reliable
    }

    if (context.need_detail || context.scientific_analysis) {
        return 'FCM';  // Detailed, progressive
    }

    if (context.uncertain_parameters) {
        // RK4 for Monte Carlo sampling
        // FCM for best-fit detailed analysis
        return 'BOTH';
    }
}
```

---

## STRATÉGIE 1: RK4 COMME "FAST PROXY" DE FCM

### Workflow:

1. **RK4 pour exploration rapide:**
   ```
   Monte Carlo (N=1000) avec RK4
   → Identifier configurations prometteuses
   → Filtrer top 10% matches
   ```

2. **FCM pour analyse détaillée:**
   ```
   Prendre top 10% configurations RK4
   → Raffiner avec FCM (N=100)
   → Analyse détaillée fragmentation
   ```

**Bénéfices:**
- Vitesse: RK4 filtre rapidement (1000 simulations = 100s)
- Précision: FCM affine les meilleurs candidats (100 simulations = 200s)
- **Total: 300s au lieu de 2000s** (FCM seul)

**Exemple Tunguska:**
```javascript
// Phase 1: RK4 exploration (rapide)
const rk4_results = await runMonteCarloRK4({
    n_samples: 1000,
    parameter_space: TUNGUSKA_SPACE
});

// Filtrer top 10% matches énergie
const top_candidates = rk4_results
    .filter(r => r.energy_match_pct < 20)
    .slice(0, 100);

// Phase 2: FCM refinement (précis)
const fcm_results = await Promise.all(
    top_candidates.map(params => runFCM(params))
);

// Analyser altitude + fragmentation détaillée
const best_fit = fcm_results.find(r =>
    r.altitude_match_pct < 30 &&
    r.energy_match_pct < 15
);
```

---

## STRATÉGIE 2: RK4 POUR DASHBOARD, FCM POUR SCIENCE

### Architecture:

```
┌─────────────────────────────────────────┐
│     USER INTERFACE (Dashboard)          │
│  - Real-time simulation                  │
│  - Interactive sliders                   │
│  - Instant results (<1s)                 │
└──────────────┬──────────────────────────┘
               │
               ├── RK4 Engine (fast)
               │   └─> Energy, crater, blast
               │
┌──────────────┴──────────────────────────┐
│   SCIENTIFIC ANALYSIS (Backend)          │
│  - Light curve matching                   │
│  - Fragmentation studies                  │
│  - Detailed reports                       │
└──────────────┬──────────────────────────┘
               │
               └── FCM Engine (detailed)
                   └─> Progressive fragmentation,
                       energy deposition curve,
                       fragment distribution
```

**Use cases:**

| Feature                  | Engine | Justification                    |
|--------------------------|--------|----------------------------------|
| Dashboard simulation     | RK4    | Besoin vitesse (<1s)             |
| Scenario presets         | RK4    | Assez précis pour éducation      |
| Defend Earth game        | RK4    | Temps réel requis                |
| Monte Carlo (N>100)      | RK4    | Volume simulations élevé         |
| Light curve matching     | FCM    | Détails energy deposition        |
| Scientific reports       | FCM    | Peer-review quality              |
| Publication figures      | FCM    | Fragmentation progressive        |
| NASA comparison          | FCM    | Wheeler 2017 standard            |

---

## STRATÉGIE 3: CALIBRATION CROISÉE

### Idée: Utiliser FCM pour améliorer RK4

Wheeler 2017 a passé 2+ ans à calibrer FCM sur observations. On peut **transférer ces calibrations** au RK4!

**Processus:**

1. **Calibrer FCM sur Chelyabinsk** (Wheeler Table 2)
   ```
   Paramètres optimaux FCM:
   - density: 2500 kg/m³ (macro-porosity)
   - C_disp: 2.0
   - alpha: 0.38
   - cloud_mass: 84%
   ```

2. **Extraire leçons pour RK4:**
   ```
   Transférer au RK4:
   - Utiliser ρ = 2500 (pas 3300) → énergie correcte
   - Réduire C_disp pancake → altitude plus basse
   - Ajuster α Weibull → meilleure fragmentation
   ```

3. **Valider RK4 amélioré:**
   ```
   RK4 avec paramètres FCM-derived
   → Espoir: altitude erreur 45% → 25%
   → Garde vitesse RK4
   → Gain précision FCM
   ```

**Code exemple:**
```javascript
// Paramètres RK4 "FCM-informed"
const RK4_FCM_CALIBRATED = {
    // Leçons de Wheeler 2017 FCM
    use_macro_porosity: true,  // ρ_bulk < ρ_meteorite
    porosity_factor: 0.24,     // 24% voids (rubble pile)

    // Pancake dispersion réduite
    pancake_dispersion_factor: 0.57,  // C_disp=2.0/3.5

    // Weibull ajusté
    weibull_alpha: 0.38,  // Wheeler best-fit

    // Ablation clouds
    cloud_ablation_enhanced: 1.5  // Clouds ablate plus
};
```

---

## STRATÉGIE 4: VALIDATION CROISÉE

### Utiliser les deux pour quantifier incertitudes

**Approche:**
```
Pour chaque cas documenté:
  1. RK4 simulation → Résultat A
  2. FCM simulation → Résultat B
  3. Comparer A vs B
  4. Si |A - B| < 20%: Confiance HAUTE
  5. Si |A - B| > 50%: Incertitude physique réelle
```

**Exemple:**
```javascript
async function validateWithBothModels(impact) {
    const rk4 = await runRK4(impact.parameters);
    const fcm = await runFCM(impact.parameters);

    const energy_agreement = Math.abs(
        rk4.energy - fcm.energy
    ) / rk4.energy * 100;

    const altitude_agreement = Math.abs(
        rk4.altitude - fcm.altitude
    ) / rk4.altitude * 100;

    return {
        energy_uncertainty: energy_agreement,
        altitude_uncertainty: altitude_agreement,
        model_confidence: energy_agreement < 20 ? 'HIGH' : 'LOW',
        recommendation: altitude_agreement > 50 ?
            'Use Monte Carlo - high uncertainty' :
            'Both models agree - reliable'
    };
}
```

**Interprétation:**
- **Accord RK4-FCM (<20%):** Confiance physique élevée
- **Désaccord (>50%):** Incertitude physique réelle (pas bug!)
- **Tunguska désaccord attendu:** Paramètres 1908 trop incertains

---

## PROPOSITION D'IMPLÉMENTATION

### Phase 1: Intégration API (1 jour)

```javascript
// api/src/services/physicsEngine.js

class PhysicsEngine {
    async simulate(params, options = {}) {
        const model = options.model || 'RK4';  // Default fast

        if (model === 'RK4') {
            return await this.simulateRK4(params);
        }

        if (model === 'FCM') {
            return await this.simulateFCM(params);
        }

        if (model === 'BOTH') {
            const [rk4, fcm] = await Promise.all([
                this.simulateRK4(params),
                this.simulateFCM(params)
            ]);

            return {
                rk4: rk4,
                fcm: fcm,
                agreement: this.compareModels(rk4, fcm)
            };
        }
    }
}
```

### Phase 2: Dashboard Toggle (1 heure)

```javascript
// Frontend: Model selector
<select onChange={setModel}>
  <option value="RK4">Fast (RK4)</option>
  <option value="FCM">Detailed (FCM)</option>
  <option value="BOTH">Compare Both</option>
</select>

// Results display
{model === 'BOTH' && (
  <div>
    <h3>Model Comparison</h3>
    <p>Energy agreement: {results.agreement.energy}%</p>
    <p>Altitude agreement: {results.agreement.altitude}%</p>
    {results.agreement.confidence === 'HIGH' && (
      <Badge color="green">Models agree - high confidence</Badge>
    )}
  </div>
)}
```

### Phase 3: Calibration Workflow (2 jours)

```javascript
// Calibrate FCM on Chelyabinsk
const fcm_calibrated = await calibrateFCM({
    target: CHELYABINSK_OBSERVED,
    optimize: ['alpha', 'C_disp', 'cloud_mass', 'density'],
    method: 'nelder-mead',
    max_iterations: 100
});

// Transfer learnings to RK4
const rk4_improved = applyFCMCalibration(rk4_baseline, fcm_calibrated);

// Validate on all HIGH confidence cases
const validation = await validateAllCases([
    'Chelyabinsk', 'Tagish Lake', 'Carancas', '2008 TC3', 'Botswana'
], rk4_improved);

console.log(`RK4 improved: ${validation.avg_error_before}% → ${validation.avg_error_after}%`);
```

---

## BÉNÉFICES APPROCHE COMPLÉMENTAIRE

### 1. **Performance Optimale**
- Dashboard: RK4 (rapide)
- Science: FCM (précis)
- Monte Carlo: RK4 + FCM hybrid

### 2. **Validation Robuste**
- Deux modèles indépendants
- Quantification incertitudes
- Détection bugs croisée

### 3. **Calibration Mutuelle**
- FCM informe RK4
- RK4 teste hypothèses FCM
- Convergence vers vérité physique

### 4. **Flexibilité Utilisateur**
- Utilisateur casual: RK4 (simple, rapide)
- Scientifique: FCM (détaillé)
- Researcher: BOTH (comparaison)

### 5. **Publication Scientifique**
- "We compared two approaches (RK4 vs FCM)"
- "Models agree within X% for well-documented cases"
- "Discrepancies highlight physical uncertainties"

---

## RECOMMANDATION FINALE

### ✅ GARDER LES DEUX!

**Architecture proposée:**
```
PhysicsEngine (unified interface)
├── RK4Engine (default, fast)
│   ├── Optimized for: Dashboard, game, Monte Carlo
│   └── Strengths: Speed, energy accuracy
│
└── FCMEngine (optional, detailed)
    ├── Optimized for: Scientific analysis, publications
    └── Strengths: Progressive fragmentation, detailed

Configuration:
{
    "default_model": "RK4",
    "enable_fcm": true,
    "auto_compare_threshold": "uncertain_parameters"
}
```

**User experience:**
1. **Par défaut:** RK4 (rapide, familier)
2. **Toggle "Detailed mode":** FCM
3. **Button "Compare models":** RUN BOTH → Show agreement
4. **Automatic:** Si paramètres incertains → Suggest Monte Carlo with RK4

---

## PROCHAINES ÉTAPES

### Semaine 1: Calibration
- [ ] Calibrer FCM sur Chelyabinsk (Wheeler Table 2)
- [ ] Transférer learnings au RK4
- [ ] Valider RK4 amélioré sur 5 cas HIGH

### Semaine 2: Intégration
- [ ] API unifiée PhysicsEngine (RK4 + FCM)
- [ ] Dashboard toggle model selector
- [ ] Comparison mode (run both)

### Semaine 3: Validation
- [ ] Test tous cas documentés (both models)
- [ ] Quantifier agreements/disagreements
- [ ] Documentation scientifique

### Semaine 4: Monte Carlo Hybrid
- [ ] RK4 exploration (N=1000)
- [ ] FCM refinement (N=100)
- [ ] Tunguska analysis

---

**Conclusion:** Les deux approches sont **complémentaires, pas concurrentes**. RK4 = vitesse + production. FCM = précision + science. Ensemble = système robuste!

**Auteur:** Claude Code v1.7.4
**Date:** 2025-10-16
**Recommendation:** IMPLEMENT HYBRID SYSTEM
