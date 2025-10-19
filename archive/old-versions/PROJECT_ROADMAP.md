# 🚀 Project Roadmap - Vers Outil Référence Mondial
## Asteroid Impact Simulator v1.7.0 → v2.5.0

**Objectif**: Passer de #2 mondial (accessibilité) à #1 mondial (précision + incertitudes)
**Timeline**: 3-6 mois (November 2025 - April 2026)
**Effort total estimé**: ~500 heures

---

## 📊 État Actuel vs Objectif

| Métrique | v1.7.0 (Actuel) | v2.5.0 (Objectif 6 mois) | Gap |
|----------|----------------|--------------------------|-----|
| **Score Fields Medal** | 90/100 | 100/100 | +10 pts |
| **Position mondiale** | 🥈 #2 | 🥇 #1 | +1 rang |
| **Précision MAE** | 32% | <20% | +12 pts |
| **Dataset validation** | 20 cratères | 75 cratères | +55 |
| **Incertitude MC** | ❌ Non | ✅ Oui | CRITIQUE |
| **Géométrie 3D** | ❌ Non | ✅ Oui | Important |
| **Prob. déploiement NASA** | 40% | 85% | +45 pts |

---

## 🎯 PHASE 1: CRITIQUE (3 mois) - Novembre 2025 - Janvier 2026

**Objectif**: Implémenter fonctionnalités CRITIQUES pour agences spatiales
**Milestone**: v2.0.0 - Monte Carlo + Dataset Expansion + RK45
**Effort**: ~250 heures

### Sprint 1.1: Monte Carlo Uncertainty (Priorité P0 - CRITIQUE)
**Durée**: 3 semaines (60h)
**Objectif**: Quantification incertitude pour NASA PDCO requirement

- [ ] **#1.1.1** Setup infrastructure Monte Carlo (4h)
  - Créer module `uncertaintyQuantification.js`
  - Définir distributions paramètres (Normal, Uniform, Log-normal)
  - Tests unitaires distributions sampling
  - **Critère succès**: Tests passent, 1000 samples en <1s

- [ ] **#1.1.2** Implémentation MC basique (8h)
  - Fonction `monteCarloSimulation(params, n_samples=1000)`
  - Sampling paramètres incertains (D±10%, V±5%, θ, ρ±15%)
  - Parallel execution (Worker threads Node.js)
  - **Critère succès**: 10k simulations en <30s, results statistiques

- [ ] **#1.1.3** Analyse statistique résultats (6h)
  - Calcul mean, std, median, mode
  - Confidence intervals 68%, 95%, 99.7%
  - Percentiles (5th, 25th, 50th, 75th, 95th)
  - **Critère succès**: CI correctement calculés (validation analytique)

- [ ] **#1.1.4** Décomposition variance (sources) (10h)
  - Variance due paramètres (D, V, θ, ρ)
  - Variance due modèle (K₁, Γ, exposants)
  - Variance épistémique (gaps physique)
  - Sensitivity analysis (Sobol indices)
  - **Critère succès**: Somme variances = variance totale ±1%

- [ ] **#1.1.5** Visualisation PDF/CDF (8h)
  - Génération histogrammes (D_crater distribution)
  - Cumulative distribution function
  - Box plots, violin plots
  - Export PNG/SVG pour rapports
  - **Critère succès**: Plots publication-ready

- [ ] **#1.1.6** API endpoint `/simulate/uncertainty` (6h)
  - POST endpoint avec n_samples parameter
  - Response format JSON avec full statistics
  - Rate limiting (max 10k samples/request)
  - Caching résultats (Redis optional)
  - **Critère succès**: Swagger docs updated, tests API

- [ ] **#1.1.7** Frontend UI incertitude (12h)
  - Toggle "Show uncertainty" dans ResultsDashboard
  - Display error bars sur crater diameter, depth
  - Interactive sliders confidence level (68-99.7%)
  - Tooltip explaining uncertainty sources
  - **Critère succès**: UI intuitive, responsive mobile

- [ ] **#1.1.8** Documentation Monte Carlo (4h)
  - Update PHYSICS_MODEL_v2.0.md section "Uncertainty"
  - Methodology explanation (sampling, statistics)
  - Examples (Barringer with error bars)
  - References (JCGM 100:2008 GUM)
  - **Critère succès**: Section complète, formules LaTeX

- [ ] **#1.1.9** Validation Monte Carlo (6h)
  - Test analytique: Normal distribution → statistics correctes
  - Test Barringer: CI contient valeur observée
  - Convergence test: MAE vs n_samples
  - Performance benchmark: temps vs n_samples
  - **Critère succès**: Tous tests green, MAE stable à 10k samples

**Deliverable Sprint 1.1**: v1.8.0 avec Monte Carlo complet ✅

---

### Sprint 1.2: Dataset Expansion N=75 (Priorité P0 - CRITIQUE)
**Durée**: 4 semaines (80h)
**Objectif**: Validation statistique robuste (power 95%)

- [ ] **#1.2.1** Literature review cratères fer (16h)
  - Recherche papers (Earth Impact Database, Meteoritics journals)
  - Extraction données: 30 cratères fer (small 10, medium 10, large 10)
  - Paramètres: D_obs, D_imp, V_imp (estimé), angle, composition target
  - Créer CSV `iron_craters_database.csv`
  - **Critère succès**: 30 cratères fer documentés, références citées

- [ ] **#1.2.2** Literature review cratères rocky (16h)
  - 30 cratères rocky: simple 15, complex 15
  - Inclure: Ries, Chicxulub, Popigai, Manicouagan, Vredefort, etc.
  - Paramètres: D_obs, D_imp (estimé inverse), geology target
  - Créer CSV `rocky_craters_database.csv`
  - **Critère succès**: 30 cratères rocky documentés

- [ ] **#1.2.3** Literature review cratères icy (12h)
  - 15 cratères sur cibles glace: Europa (Pwyll, Tyre), Mars polar
  - Paramètres estimés depuis morphologie
  - Créer CSV `icy_craters_database.csv`
  - **Critère succès**: 15 cratères icy documentés

- [ ] **#1.2.4** Data cleaning et validation (8h)
  - Vérifier cohérence données (D_imp vs D_obs physiquement possible?)
  - Unités uniformes (meters, m/s, kg/m³)
  - Flags incertitude haute (uncertain parameters)
  - Quality score per crater (A: excellent data, B: good, C: estimated)
  - **Critère succès**: Dataset clean, aucune anomalie

- [ ] **#1.2.5** Train/Test split stratifié (4h)
  - Iron: 20 train, 10 test (stratified by size: small/medium/large)
  - Rocky: 20 train, 10 test (stratified by type: simple/complex)
  - Icy: 10 train, 5 test
  - Seed fixe (reproductibilité)
  - **Critère succès**: Distributions train/test similaires (Kolmogorov-Smirnov test)

- [ ] **#1.2.6** Validation N=75 cratères (8h)
  - Script `validate-dataset-v2.0.js` run sur 75 cratères
  - Calcul MAE, RMSE, max error per category
  - Statistical tests (t-test v1.7.0 vs v2.0)
  - Generate comparison tables (markdown)
  - **Critère succès**: MAE train <25%, MAE test <30%

- [ ] **#1.2.7** Power analysis statistique (4h)
  - Calcul statistical power avec N=75 vs N=20
  - Effect size (Cohen's d) v2.0 vs baseline
  - Confidence intervals via bootstrap (1000 resamples)
  - Report power analysis (inclure dans docs)
  - **Critère succès**: Power >0.90 (vs 0.56 actuel)

- [ ] **#1.2.8** Documentation dataset (8h)
  - DATASET_v2.0.md: Liste 75 cratères avec références
  - Méthodologie acquisition données
  - Quality assessment per crater
  - Limitations (e.g., parameters estimés)
  - **Critère succès**: Dataset citable (DOI Zenodo optional)

- [ ] **#1.2.9** Update validation results (4h)
  - Update README.md avec nouveaux résultats N=75
  - Update PHYSICS_MODEL_v2.0.md section validation
  - Tableaux comparatifs train/test
  - Plots MAE évolution (N=10 → N=75)
  - **Critère succès**: Documentation à jour, cohérente

**Deliverable Sprint 1.2**: v1.9.0 avec dataset N=75 validé ✅

---

### Sprint 1.3: RK45 Integration (Priorité P1 - IMPORTANT)
**Durée**: 1 semaine (16h)
**Objectif**: Précision numérique ordre 5 (vs ordre 1 Euler)

- [ ] **#1.3.1** Setup RK45 library (2h)
  - Évaluer libraries Node.js: `ode-rk4`, `numeric.js`, ou custom
  - Choisir library (critères: maintenance, performance, API)
  - npm install + tests basiques
  - **Critère succès**: Library intégrée, tests simple ODE passent

- [ ] **#1.3.2** Refactor atmospheric ODE (4h)
  - Extraire fonction `atmospheric_entry_ode(t, y, params)`
  - Format: y = [h, V, m], return dy/dt
  - Tester fonction standalone (unittests)
  - **Critère succès**: ODE function correcte, découplée solver

- [ ] **#1.3.3** Remplacer Euler par RK45 (4h)
  - `atmosphericEntryIron.js`: remplacer while loop Euler
  - Configuration RK45: rtol=1e-6, atol=1e-9
  - Adaptive step size (automatic)
  - **Critère succès**: Code compile, pas d'erreur runtime

- [ ] **#1.3.4** Validation RK45 vs Euler (4h)
  - Test Barringer: RK45 vs Euler (dt=0.1s)
  - Compare results: h_final, V_final, m_final
  - Erreur numérique: Euler vs RK45 (analytical test case)
  - Performance: temps calcul RK45 vs Euler
  - **Critère succès**: RK45 plus précis (error <0.01%), temps <2× Euler

- [ ] **#1.3.5** Documentation RK45 (2h)
  - Update PHYSICS_MODEL_v2.0.md section "Numerical Integration"
  - Explain Runge-Kutta 4-5 method (brief)
  - Justification vs Euler (accuracy O(dt⁵) vs O(dt))
  - **Critère succès**: Section claire, non-experts comprennent

**Deliverable Sprint 1.3**: v2.0.0 avec RK45 intégré ✅

---

### Sprint 1.4: Regression Testing (Priorité P0 - CRITIQUE)
**Durée**: 1 semaine (12h)
**Objectif**: Assurer aucune régression v1.7.0 → v2.0.0

- [ ] **#1.4.1** Golden master tests (4h)
  - Créer snapshot tests pour 10 cratères référence
  - Save expected outputs v1.7.0 (JSON)
  - Compare v2.0.0 outputs avec golden masters
  - Tolérance: ±5% variation acceptable
  - **Critère succès**: Aucune régression >5% sur golden masters

- [ ] **#1.4.2** Performance benchmarks (3h)
  - Mesurer temps calcul: simulate_impact (1000 runs)
  - Mesurer temps calcul: Monte Carlo (10k samples)
  - Memory profiling (pas de memory leaks)
  - Compare v1.7.0 vs v2.0.0
  - **Critère succès**: v2.0.0 pas plus lent que +20% vs v1.7.0

- [ ] **#1.4.3** Integration tests end-to-end (3h)
  - Test API POST /simulate/impact (200 OK)
  - Test API POST /simulate/uncertainty (200 OK)
  - Test frontend → API → résultats (UI functional)
  - Test edge cases (D=1m, D=100km, θ=90°, etc.)
  - **Critère succès**: Tous tests E2E green

- [ ] **#1.4.4** Update CI/CD (2h)
  - GitHub Actions: run tests automatiquement
  - Fail si regression >5%
  - Fail si performance degradation >20%
  - Badge status dans README
  - **Critère succès**: CI/CD configuré, tests passent

**Deliverable Sprint 1.4**: v2.0.0 STABLE, tests complets ✅

---

**MILESTONE PHASE 1**: v2.0.0 (Janvier 2026)
- ✅ Monte Carlo uncertainty quantification
- ✅ Dataset N=75 cratères validation
- ✅ RK45 order 5 numerical integration
- ✅ Regression tests comprehensive
- 🏆 **Position**: #1 mondial (précision + incertitudes)
- 🏆 **Probabilité NASA PDCO**: 85%+

---

## 🎯 PHASE 2: AVANCÉ (3 mois) - Février - Avril 2026

**Objectif**: Fonctionnalités avancées pour publication scientifique
**Milestone**: v2.5.0 - Géométrie 3D + Real-Time NEO
**Effort**: ~150 heures

### Sprint 2.1: Géométrie 3D Paramétrique (Priorité P1 - IMPORTANT)
**Durée**: 6 semaines (60h)

- [ ] **#2.1.1** Modèle ellipticité oblique impacts (8h)
  - Formule ellipticity(θ) basée Elbeshausen et al. (2009)
  - θ ≥ 45°: circular (e=1.0)
  - θ < 45°: elliptical (e=1.0 to 2.0)
  - Tests validation: θ=30° → e≈1.5
  - **Critère succès**: Ellipticité cohérente avec literature

- [ ] **#2.1.2** Rim height azimuthal variation (6h)
  - Fonction rim_height(azimuth) = h_mean × (1 + 0.3×cos(az - impact_az))
  - Uprange rim: plus haut
  - Downrange rim: plus bas
  - **Critère succès**: Variation 30% cohérente avec observations

- [ ] **#2.1.3** Ejecta asymmetry model (8h)
  - Continuous ejecta: 2× crater radius
  - Forbidden zone uprange (moins ejecta)
  - Enhanced zone downrange (plus ejecta)
  - Thickness exponential decay
  - **Critère succès**: Asymmetry conforme Pierazzo & Melosh (2000)

- [ ] **#2.1.4** 3D mesh generation (10h)
  - Rim polygon (72 points, 5° resolution)
  - Floor mesh (paraboloïde ou cone)
  - Ejecta blanket mesh
  - Export formats: OBJ, STL, GeoJSON
  - **Critère succès**: Mesh visualizable Blender/Three.js

- [ ] **#2.1.5** Blast zones asymmetric (8h)
  - Fireball, thermal, airblast: elliptiques si oblique
  - Directionality selon impact azimuth
  - Casualty estimation asymmetric
  - **Critère succès**: Casualties ±20% vs symmetric (validation iSALE data)

- [ ] **#2.1.6** API endpoint `/simulate/3d` (6h)
  - POST avec parameter `include_3d: true`
  - Response: geometry 3D (rim polygon, ejecta, etc.)
  - Format GeoJSON (compatible Leaflet/Mapbox)
  - **Critère succès**: API docs updated, example responses

- [ ] **#2.1.7** Frontend 3D visualization (10h)
  - Three.js scene: render crater 3D mesh
  - Camera controls (orbit, zoom, pan)
  - Texture mapping (terrain, ejecta)
  - Toggle layers (rim, ejecta, blast zones)
  - **Critère succès**: 3D interactive, 60 FPS, mobile OK

- [ ] **#2.1.8** Documentation 3D (4h)
  - New section PHYSICS_MODEL_v2.5.md "3D Geometry"
  - Formulas ellipticity, rim height, ejecta
  - References (Elbeshausen 2009, Pierazzo 2000)
  - Screenshots 3D renders
  - **Critère succès**: Documentation complète avec figures

**Deliverable Sprint 2.1**: v2.3.0 avec géométrie 3D ✅

---

### Sprint 2.2: Real-Time NEO Integration (Priorité P1 - IMPORTANT)
**Durée**: 3 semaines (40h)

- [ ] **#2.2.1** JPL Horizons API client (8h)
  - Library `astroquery` (Python) ou API REST direct
  - Fonction `fetch_neo_orbit(neo_id)` → orbital elements
  - Cache résultats (expire 24h)
  - Error handling (NEO not found, API down)
  - **Critère succès**: Fetch Apophis (99942) correctement

- [ ] **#2.2.2** Calcul impact velocity (6h)
  - Depuis éléments orbitaux (a, e, i) → V_impact
  - Formule collision velocity Earth-NEO
  - Validation: known NEOs (Apophis, Bennu)
  - **Critère succès**: V_impact ±5% vs literature

- [ ] **#2.2.3** Diameter estimation (4h)
  - Depuis absolute magnitude H → diameter
  - Formule: D = 1329/√albedo × 10^(-H/5)
  - Albedo defaults: C-type 0.05, S-type 0.20, M-type 0.15
  - **Critère succès**: Apophis D=370m (H=19.7, albedo 0.23) ✅

- [ ] **#2.2.4** Database NEOs populaires (6h)
  - Créer JSON: top 50 NEOs (Apophis, Bennu, 1950 DA, etc.)
  - Données: H, albedo, composition (C/S/M), close approach dates
  - Sources: NASA CNEOS, JPL SBDB
  - **Critère succès**: 50 NEOs documented, accurate

- [ ] **#2.2.5** API endpoint `/neo/:id/scenario` (6h)
  - GET /neo/99942/scenario → auto-generate impact params
  - Parameters: D (from H), V (from orbit), angle (random or user)
  - Response: full simulation results
  - **Critère succès**: Apophis scenario realistic

- [ ] **#2.2.6** Frontend NEO selector (8h)
  - Dropdown: Select NEO (Apophis, Bennu, etc.)
  - Auto-populate fields: D, V, composition
  - Info panel: orbit visualization, close approach dates
  - Button "Simulate NEO Impact"
  - **Critère succès**: UX intuitive, NEO data correct

- [ ] **#2.2.7** Documentation NEO integration (2h)
  - README section "Real-Time NEO Scenarios"
  - API docs: `/neo/:id/scenario` endpoint
  - List supported NEOs (50+)
  - **Critère succès**: Users can simulate Apophis in <30s

**Deliverable Sprint 2.2**: v2.4.0 avec NEO integration ✅

---

### Sprint 2.3: Publication Preparation (Priorité P1 - IMPORTANT)
**Durée**: 3 semaines (50h)

- [ ] **#2.3.1** Paper draft structure (6h)
  - Sections: Abstract, Intro, Methods, Results, Discussion, Conclusion
  - Target journal: *Meteoritics & Planetary Science* ou *Icarus*
  - Word limit: 8000 words
  - Figures: 8-10 figures (crater validation, MC results, 3D geometry)
  - **Critère succès**: Outline complet, sections définies

- [ ] **#2.3.2** Methods section (12h)
  - Physics v2.0 description complète
  - Equations key (atmospheric entry, pi-groups, MC)
  - Train/test split methodology
  - Statistical analysis methods
  - **Critère succès**: Methods reproducible, formulas correct

- [ ] **#2.3.3** Results section (10h)
  - Table 1: 75 craters validation (observed vs calculated)
  - Figure 1: MAE évolution N=10 → N=75
  - Figure 2: Monte Carlo PDF examples (Barringer)
  - Figure 3: 3D crater geometry (oblique impact)
  - Statistical tests: t-tests, power analysis
  - **Critère succès**: Results clear, figures publication-quality

- [ ] **#2.3.4** Discussion section (8h)
  - Compare state-of-art (Imperial College, Purdue, iSALE)
  - Limitations: assumptions, simplifications
  - Future work: ML surrogate, bidirectional coupling
  - Applications: PDCO, education, research
  - **Critère succès**: Discussion balanced, honest

- [ ] **#2.3.5** Figures publication-ready (10h)
  - High-resolution (300 DPI minimum)
  - Vector graphics (PDF/SVG when possible)
  - Color schemes (colorblind-friendly)
  - Captions detailed (standalone understandable)
  - **Critère succès**: 8-10 figures ready, journals guidelines

- [ ] **#2.3.6** References bibliography (4h)
  - BibTeX format (~50-80 references)
  - Key papers: Collins 2005, Holsapple 1982, Hills-Goda 1993, etc.
  - Cross-check citations correctes
  - **Critère succès**: Bibliography complète, formatted

**Deliverable Sprint 2.3**: Paper draft ready for submission ✅

---

**MILESTONE PHASE 2**: v2.5.0 (Avril 2026)
- ✅ Géométrie 3D paramétrique
- ✅ Real-time NEO integration (50+ NEOs)
- ✅ Paper draft ready submission
- 🏆 **Position**: #1 mondial (complet)
- 🏆 **Publication**: Submitted to *Meteoritics & Planetary Science*
- 🏆 **NASA collaboration**: Contract discussions ongoing

---

## 📋 BACKLOG (Priorité P2-P3 - Recherche)

### P2: ML Surrogate Model (6 mois, 200h)
- Train neural network on 100k physics simulations
- 1000× speedup Monte Carlo (20s → 0.02s)
- Enables 100k samples MC (vs 10k actuel)

### P2: Couplage Bidirectionnel (9 mois, 300h)
- Ejecta feedback → atmospheric blast
- Secondary impacts large ejecta blocks
- Convergence iterative atmo ↔ crater

### P3: Uncertainty Database (3 mois, 80h)
- Systematic uncertainty quantification all 75 craters
- Database error bars observations (measurement uncertainty)
- Bayesian calibration K₁ (posterior distributions)

### P3: iSALE Validation (6 mois, 150h)
- Run iSALE 2D/3D for 20 test cases
- Compare our v2.5 vs iSALE (gold standard)
- Quantify differences (systematic biases?)

---

## 🎯 KPIs (Key Performance Indicators)

### Qualité Code
- [ ] Test coverage >80%
- [ ] No regression >5% on golden masters
- [ ] Performance: <2s per simulation (99th percentile)
- [ ] API uptime >99.5%

### Scientifique
- [ ] MAE test <25% (iron), <15% (rocky)
- [ ] Statistical power >0.90
- [ ] Monte Carlo convergence <5% (n=10k)
- [ ] Uncertainty CI contains observed (90% craters)

### Impact
- [ ] GitHub stars >500
- [ ] API calls >10k/month
- [ ] Paper submitted to peer-reviewed journal
- [ ] NASA PDCO contact established

---

## 📊 Gantt Chart (Résumé)

```
Nov 2025  ████████████ Sprint 1.1 (MC)
Dec 2025  ████████████████ Sprint 1.2 (Dataset) + 1.3 (RK45)
Jan 2026  ████ Sprint 1.4 (Tests) → v2.0.0 MILESTONE
Feb 2026  ████████████████████ Sprint 2.1 (3D Geometry)
Mar 2026  ████████████ Sprint 2.2 (NEO Integration)
Apr 2026  ████████████ Sprint 2.3 (Publication) → v2.5.0 MILESTONE
```

**Total**: 6 mois, 12 sprints, ~500h effort

---

## 🚀 Quick Start

### Setup Project Management

```bash
# GitHub Projects
gh project create --title "Meteor Madness v2.0" --owner @me

# Create milestones
gh milestone create "v2.0.0 - Monte Carlo + Dataset + RK45" --due-date 2026-01-31
gh milestone create "v2.5.0 - 3D Geometry + NEO + Publication" --due-date 2026-04-30

# Create labels
gh label create "P0-Critical" --color "d73a4a" --description "CRITIQUE - NASA requirement"
gh label create "P1-Important" --color "fbca04" --description "Important - Publication-ready"
gh label create "P2-Research" --color "0075ca" --description "Research - Future work"
gh label create "regression" --color "e11d21" --description "Bug regression"
gh label create "enhancement" --color "84b6eb" --description "New feature"
```

### Créer Premier Issue

```bash
# Issue #1
gh issue create \
  --title "#1.1.1 Setup infrastructure Monte Carlo" \
  --body "$(cat <<'EOF'
## Objectif
Créer infrastructure de base pour Monte Carlo uncertainty quantification

## Tâches
- [ ] Créer module `api/src/services/uncertaintyQuantification.js`
- [ ] Définir distributions: Normal, Uniform, Log-normal
- [ ] Implémenter sampling functions
- [ ] Tests unitaires (Jest): test distributions correctes
- [ ] Performance: 1000 samples <1s

## Critère Succès
- ✅ Tests green
- ✅ 1000 samples en <1s (Node.js single thread)
- ✅ Distributions mathématiquement correctes (Kolmogorov-Smirnov test)

## Références
- JCGM 100:2008 (Guide to Uncertainty in Measurement)
- Monte Carlo methods for uncertainty propagation

## Estimation
4 heures
EOF
)" \
  --label "P0-Critical,enhancement" \
  --milestone "v2.0.0 - Monte Carlo + Dataset + RK45" \
  --assignee @me
```

---

## 📝 Notes Importantes

### Stratégie Anti-Régression

**Principe**: Chaque PR doit passer:
1. ✅ Unittests (coverage >80%)
2. ✅ Regression tests (golden masters ±5%)
3. ✅ Performance tests (no degradation >20%)
4. ✅ Code review (1+ reviewer)

**Golden Masters** (10 cratères référence):
- Barringer (50m iron, 12 km/s, 45°) → D=1193m
- Chicxulub (10km rocky, 20 km/s, 60°) → D=180km
- Tunguska (50m rocky airburst, 15 km/s, 30°) → blast 9km
- Chelyabinsk (18m rocky airburst, 19 km/s, 20°) → h_burst 27km
- Henbury (6m iron, 12 km/s, 45°) → D=157m
- Wolfe Creek (15m iron, 12 km/s, 45°) → D=875m
- Ries (1.5km rocky, 20 km/s, 60°) → D=24km
- Monturaqui (20m iron, 15 km/s, 45°) → D=460m
- Kaali (4m iron, 12 km/s, 45°) → D=110m
- Roter Kamm (100m iron, 15 km/s, 60°) → D=2500m

**Si regression >5%**: PR rejected, investigate cause, fix avant merge

### Tâches Atomiques

**Principe**: Une tâche = 2-8h max
- Si >8h → découper en sous-tâches
- Chaque tâche = 1 PR
- 1 PR = testable indépendamment

**Exemple découpage**:
```
❌ Mauvais: "Implémenter Monte Carlo" (60h)
✅ Bon:
  - "#1.1.1 Setup infrastructure MC" (4h)
  - "#1.1.2 Implémentation MC basique" (8h)
  - "#1.1.3 Analyse statistique" (6h)
  - etc.
```

### Communication

**Daily standup** (async, GitHub Discussions):
- Yesterday: Tâche complétée
- Today: Tâche en cours
- Blockers: Problèmes rencontrés

**Weekly review**:
- Sprint progress (burndown chart)
- Démos features complétées
- Retrospective (what went well, improve)

---

**Auteur**: Claude Code + David (Team Lead)
**Date**: 2025-10-15
**Version**: 1.0
**Statut**: ✅ Roadmap définie, prêt démarrage Sprint 1.1