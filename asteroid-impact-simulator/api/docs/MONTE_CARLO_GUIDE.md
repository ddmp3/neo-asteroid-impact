# Guide Utilisateur - Quantification des Incertitudes Monte Carlo

**Version**: 1.0.0
**Date**: 2025-10-15
**Pour**: NASA Space Apps Challenge 2025 - Meteor Madness

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Pourquoi Monte Carlo ?](#pourquoi-monte-carlo)
3. [Guide d'Utilisation](#guide-dutilisation)
4. [Interprétation des Résultats](#interprétation-des-résultats)
5. [Cas d'Usage](#cas-dusage)
6. [FAQ](#faq)
7. [Références Techniques](#références-techniques)

---

## 1. Introduction

Le module de **Quantification des Incertitudes** transforme le simulateur d'impact d'astéroïdes en un outil d'aide à la décision professionnel qui :

✅ **Reconnaît les limites** - Les mesures astronomiques ne sont jamais parfaites
✅ **Quantifie les risques** - Fournit des intervalles de confiance, pas juste une valeur
✅ **Identifie les priorités** - Montre quels paramètres mesurer en priorité
✅ **Communique clairement** - Visualisations interactives pour tous publics

---

## 2. Pourquoi Monte Carlo ?

### Le Problème : Incertitudes de Mesure

Quand NASA détecte un astéroïde, les paramètres sont **toujours incertains** :

| Paramètre | Valeur Nominale | Incertitude Réaliste |
|-----------|----------------|----------------------|
| Diamètre | 100 m | ±10-30% (albédo inconnu) |
| Vitesse | 20 km/s | ±5-15% (erreurs orbitales) |
| Angle | 45° | ±10-20° (trajectoire incertaine) |
| Densité | 3000 kg/m³ | ±20-40% (composition inconnue) |

### La Solution : Simulation Monte Carlo

Au lieu de calculer **1 résultat** avec valeurs fixes, on calcule **1000 résultats** avec valeurs variant selon leurs incertitudes.

**Résultat** : Une plage de prédictions au lieu d'un chiffre unique.

**Exemple** :
- ❌ Sans MC : "Cratère de 485 m"
- ✅ Avec MC : "Cratère de 350-650 m (95% de confiance), valeur moyenne 485 m"

---

## 3. Guide d'Utilisation

### 3.1 Interface Web (Frontend)

#### Étape 1 : Naviguez vers l'onglet "Uncertainty"

Dans l'interface web, cliquez sur **"Uncertainty"** dans le menu de navigation.

#### Étape 2 : Configurez les Paramètres

**a) Nombre d'Échantillons (Samples)**

Utilisez le slider pour choisir entre 100 et 10,000 échantillons :

- **100 samples** : Test rapide (~5-10 secondes) - Précision ±5%
- **1000 samples** : Recommandé (~30-60 secondes) - Précision ±2%
- **5000 samples** : Haute précision (~3-5 minutes) - Précision ±1%
- **10,000 samples** : Maximum (~8-12 minutes) - Précision ±0.5%

**Recommandation** : Utilisez 1000 pour un bon compromis précision/temps.

**b) Options Avancées**

☑ **Include Visualization Data** : Génère PDF, CDF et box plots (recommandé)
☑ **Include Sensitivity Analysis** : Calcule les indices de Sobol (recommandé)

**Note** : Désactiver ces options réduit le temps de calcul de ~20% mais perd des informations précieuses.

#### Étape 3 : Vérifiez les Paramètres Nominaux

Le panneau affiche les paramètres actuels de l'astéroïde et la localisation d'impact.

**Important** : Assurez-vous d'avoir :
1. Défini les paramètres de l'astéroïde (onglet Simulation)
2. Sélectionné un point d'impact sur la carte

#### Étape 4 : Lancez la Simulation

Cliquez sur **"Run Monte Carlo Simulation"**.

Une barre de chargement apparaît. Le temps d'attente dépend de `nSamples` :
- 100 samples : ~5-10 secondes
- 1000 samples : ~30-60 secondes
- 10,000 samples : ~8-12 minutes

#### Étape 5 : Analysez les Résultats

Après exécution, 4 panneaux s'affichent :

1. **Metadata** : Informations de simulation
2. **Statistics** : Tableau statistique complet
3. **Sensitivity Analysis** : Indices de Sobol
4. **Distribution Visualization** : Box plot interactif

---

### 3.2 API REST (Backend)

#### Endpoint

```
POST /api/simulate/uncertainty
```

#### Request Example

```json
{
  "diameter": 100,
  "velocity": 20,
  "angle": 45,
  "density": 3000,
  "composition": "rocky",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "nSamples": 1000,
  "customUncertainties": {
    "diameter": { "mean": 100, "stdDev": 15 }
  },
  "includeVisualization": true,
  "includeDecomposition": true
}
```

#### Paramètres Requis

| Champ | Type | Description | Plage Valide |
|-------|------|-------------|--------------|
| `diameter` | number | Diamètre (m) | 1 - 10,000 |
| `velocity` | number | Vitesse (km/s) | 5 - 75 |
| `angle` | number | Angle (°) | 0 - 90 |
| `density` | number | Densité (kg/m³) | 1000 - 10,000 |
| `composition` | string | Type | "rocky", "iron", "icy" |
| `latitude` | number | Latitude | -90 - 90 |
| `longitude` | number | Longitude | -180 - 180 |
| `nSamples` | number | Échantillons | 100 - 10,000 |

#### Paramètres Optionnels

| Champ | Type | Défaut | Description |
|-------|------|--------|-------------|
| `customUncertainties` | object | null | Incertitudes personnalisées |
| `includeVisualization` | boolean | true | Générer PDF/CDF/Box plots |
| `includeDecomposition` | boolean | true | Calculer indices de Sobol |

#### Response Structure

```json
{
  "nominalParams": {
    "diameter": 100,
    "velocity": 20,
    "angle": 45,
    "density": 3000,
    "composition": "rocky",
    "latitude": 48.8566,
    "longitude": 2.3522
  },
  "statistics": {
    "craterDiameter": {
      "mean": 484.6,
      "median": 485.2,
      "stdDev": 81.8,
      "variance": 6691.24,
      "min": 280.5,
      "max": 720.8,
      "percentile_5": 340.2,
      "percentile_25": 425.3,
      "percentile_75": 545.1,
      "percentile_95": 645.3,
      "skewness": 0.15,
      "kurtosis": -0.08,
      "confidenceInterval_95": {
        "lower": 335.1,
        "upper": 650.4
      }
    },
    "impactEnergy": { ... },
    "seismicMagnitude": { ... }
  },
  "sensitivity": {
    "craterDiameter": {
      "diameter": { "firstOrder": 0.75, "totalOrder": 0.82 },
      "velocity": { "firstOrder": 0.18, "totalOrder": 0.25 },
      "angle": { "firstOrder": 0.05, "totalOrder": 0.08 },
      "density": { "firstOrder": 0.02, "totalOrder": 0.03 }
    }
  },
  "visualization": {
    "craterDiameter": {
      "pdf": {
        "bins": [280, 310, 340, ... 720],
        "frequencies": [0.002, 0.012, 0.035, ... 0.001]
      },
      "cdf": {
        "values": [280, 290, 300, ... 720],
        "probabilities": [0.0, 0.01, 0.03, ... 1.0]
      },
      "boxPlot": {
        "min": 280.5,
        "q1": 425.3,
        "median": 485.2,
        "q3": 545.1,
        "max": 720.8,
        "outliers": [750.2, 765.8]
      }
    }
  },
  "metadata": {
    "nSamples": 1000,
    "successfulSamples": 987,
    "successRate": 0.987,
    "computationTime": 16234,
    "timestamp": "2025-10-15T14:32:18.456Z"
  }
}
```

---

## 4. Interprétation des Résultats

### 4.1 Panel Metadata

```
Samples: 1000
Success Rate: 98.7%
Computation Time: 16.23s
Timestamp: 14:32:18
```

**Interprétation** :
- **Samples** : Nombre de simulations exécutées
- **Success Rate** : % de simulations valides (>95% = OK, <90% = revoir paramètres)
- **Computation Time** : Durée totale (attendu : ~15-20ms par sample)

### 4.2 Panel Statistics

| Statistique | Valeur | Signification |
|-------------|--------|---------------|
| **Mean** | 485 m | Valeur **moyenne** attendue |
| **Median** | 485 m | Valeur **centrale** (50-50) |
| **Std. Deviation** | 82 m | **Incertitude** typique (±1σ) |
| **Min / Max** | 280 / 720 m | Cas **extrêmes** rencontrés |
| **P5 / P95** | 340 / 645 m | **90% des cas** dans cette plage |
| **95% CI** | [335, 650] m | **95% de confiance** dans cette plage |

#### Comment Lire les Percentiles ?

**P5 = 340m** : "Dans 95% des scénarios, le cratère sera **plus grand** que 340m"
**P95 = 645m** : "Dans 95% des scénarios, le cratère sera **plus petit** que 645m"

**P5-P95 = [340, 645]** : "90% des cas sont dans cette plage"

#### Skewness (Asymétrie)

- **Skewness > 0.5** : Distribution étalée vers la **droite** (événements extrêmes fréquents vers le haut)
- **Skewness < -0.5** : Distribution étalée vers la **gauche**
- **-0.5 < Skewness < 0.5** : Distribution **symétrique** (Gaussienne)

**Exemple** : Skewness = 0.15 → Légère asymétrie vers la droite, quasi-symétrique.

#### Kurtosis (Aplatissement)

- **Kurtosis > 1** : **Queues lourdes** (événements extrêmes plus fréquents qu'une normale)
- **Kurtosis < -1** : **Queues légères** (peu d'événements extrêmes)
- **-1 < Kurtosis < 1** : Proche d'une **distribution normale**

**Exemple** : Kurtosis = -0.08 → Distribution très proche d'une normale.

---

### 4.3 Panel Sensitivity Analysis (Sobol Indices)

```
Parameter    First Order    Total Order
-----------------------------------------
Diameter     ████████░░ 75%  ████████░░ 82%
Velocity     ████░░░░░░ 18%  ███░░░░░░░ 25%
Angle        ██░░░░░░░░  5%  ██░░░░░░░░  8%
Density      █░░░░░░░░░  2%  █░░░░░░░░░  3%
```

#### Que Signifient ces Indices ?

**First Order (S_i)** : Contribution **directe** du paramètre à la variance totale

**Total Order (ST_i)** : Contribution **totale** (directe + interactions avec autres paramètres)

**Interaction** : `ST_i - S_i`
- Si `ST_i ≈ S_i` → Pas d'interactions
- Si `ST_i >> S_i` → Fortes interactions (effet combiné avec autres paramètres)

#### Interprétation Pratique

**Exemple ci-dessus** :

1. **Diamètre = 75%** : Le diamètre contribue à **75% de l'incertitude totale**
   - C'est le paramètre **dominant**
   - Améliorer sa mesure réduira **drastiquement** l'incertitude globale

2. **Vitesse = 18%** : Contribution modérée
   - Interaction = 25% - 18% = **7%** (modérée)
   - Effet combiné avec diamètre

3. **Angle = 5%** : Faible influence
   - Peu d'intérêt à améliorer sa mesure

4. **Densité = 2%** : Influence négligeable
   - Sauf si composition inconnue (fer vs roche)

**Décision Stratégique** :
> Investir 100M$ dans des télescopes radar pour améliorer la mesure du diamètre de ±10% à ±3%
> → Réduction attendue d'incertitude globale : **75% → 22%** (réduction de 70%)

---

### 4.4 Panel Distribution Visualization (Box Plot)

```
       Min      Q1    Median   Q3       Max
        |       |       |       |        |
    ────┴───────┼───────┼───────┼────────┴────
       280     425     485     545      720
                └───────┴───────┘
                  Boîte IQR (50%)
```

**Composants** :

1. **Boîte centrale** (Q1 → Q3) : Contient **50% des résultats** (intervalle interquartile)
2. **Ligne médiane** : Valeur **médiane** (485m)
3. **Moustaches gauche/droite** : Étendues vers **min/max** (ou 1.5×IQR)
4. **Points outliers** : Valeurs **extrêmes** rares

**Lecture Rapide** :

- **Boîte large** → Grande dispersion (forte incertitude)
- **Boîte étroite** → Faible dispersion (bonne précision)
- **Médiane décalée vers la gauche** → Asymétrie positive (skewness > 0)
- **Outliers fréquents** → Queues lourdes (kurtosis > 0)

---

## 5. Cas d'Usage

### Cas 1 : Planification d'Évacuation

**Contexte** : Un astéroïde de 150m va impacter une zone urbaine dans 6 mois.

**Paramètres** :
- Diamètre : 150m ± 20%
- Vitesse : 25 km/s ± 10%
- Angle : 45° ± 15°
- Impact : New York City

**Simulation Monte Carlo (N=5000)** :

```
CRATER DIAMETER:
  Mean: 1,850 m
  95% CI: [1,250 m, 2,600 m]
  P99 (worst 1%): 3,200 m

CASUALTIES:
  Mean: 285,000
  95% CI: [180,000, 420,000]
  P99: 650,000
```

**Décision** :
- Évacuation obligatoire : **3 km** (couvre 95% des scénarios)
- Zone de sécurité étendue : **5 km** (couvre 99% des scénarios)
- Budget évacuation : 180,000 - 650,000 personnes (plage de planification)

---

### Cas 2 : Stratégie d'Observation

**Contexte** : Détection précoce d'un astéroïde potentiellement dangereux (PHA).

**Question** : Où investir pour réduire l'incertitude ?

**Simulation Monte Carlo + Sobol** :

```
SOBOL INDICES:
  Diameter: 82% (dominant)
  Velocity: 13%
  Angle: 4%
  Density: 1%
```

**Recommandation** :
1. **Priorité 1** : Mission radar dédiée pour mesure précise du diamètre (±10% → ±2%)
   - Coût : 50M€
   - Réduction incertitude : 82% → 12% (réduction de 85%)

2. **Priorité 2** : Spectroscopie pour densité (±40% → ±10%)
   - Coût : 5M€
   - Réduction incertitude : 1% → 0.1% (faible impact)

**ROI** : Mission radar justifiée (50M€ pour réduction 85% incertitude).

---

### Cas 3 : Comparaison de Scénarios

**Contexte** : 3 astéroïdes détectés, lequel surveiller en priorité ?

**Simulation Monte Carlo pour chaque astéroïde** :

| Astéroïde | Diamètre Nominal | 95% CI Casualties | Priorité |
|-----------|------------------|-------------------|----------|
| 2025 XY1 | 80m | [5,000 - 25,000] | Basse |
| 2025 AB2 | 200m | [150,000 - 800,000] | **HAUTE** |
| 2025 CD3 | 120m | [30,000 - 120,000] | Moyenne |

**Décision** : Concentrer ressources sur **2025 AB2** (potentiel catastrophique même dans scénario optimiste).

---

## 6. FAQ

### Q1 : Combien d'échantillons (samples) dois-je utiliser ?

**Réponse** :
- **Test rapide** : 100 samples (~5-10s) - Précision ±5%
- **Usage normal** : 1000 samples (~30-60s) - Précision ±2% **(RECOMMANDÉ)**
- **Haute précision** : 5000 samples (~3-5min) - Précision ±1%
- **Publication scientifique** : 10,000 samples (~8-12min) - Précision ±0.5%

**Règle empirique** : L'erreur diminue en `1/√N`. Pour diviser l'erreur par 2, multiplier N par 4.

---

### Q2 : Que faire si Success Rate < 90% ?

**Causes possibles** :
1. Paramètres nominaux trop extrêmes (ex: angle = 5°, vitesse = 5 km/s)
2. Incertitudes personnalisées trop larges (ex: σ = 50% du nominal)
3. Contraintes physiques violées (ex: densité négative après sampling)

**Solutions** :
1. Vérifier que les paramètres nominaux sont réalistes
2. Réduire les incertitudes personnalisées
3. Augmenter N pour compenser les rejets

**Note** : Un taux 95-99% est normal et acceptable.

---

### Q3 : Pourquoi Total Order > First Order ?

**Réponse** : La différence `ST_i - S_i` mesure les **interactions** entre paramètres.

**Exemple** :
```
Diameter: S_i=75%, ST_i=82% → Interaction=7%
```

Cela signifie :
- 75% : Effet **direct** du diamètre seul
- 7% : Effet **combiné** du diamètre avec d'autres paramètres (ex: diamètre × vitesse)
- 82% : Effet **total** (direct + interactions)

**Interprétation** : Le diamètre a un effet principalement direct, avec quelques interactions modérées.

---

### Q4 : Comment interpréter Skewness et Kurtosis ?

**Skewness (Asymétrie)** :
- **Skewness ≈ 0** : Distribution **symétrique** (Gaussienne)
- **Skewness > 0** : Queue lourde à **droite** (événements extrêmes élevés plus fréquents)
- **Skewness < 0** : Queue lourde à **gauche**

**Exemple** : Skewness = 0.15 → Presque symétrique, légèrement biaisée vers les grandes valeurs.

**Kurtosis (Aplatissement)** :
- **Kurtosis ≈ 0** : Distribution **normale**
- **Kurtosis > 0** : Queues **lourdes** (événements extrêmes fréquents)
- **Kurtosis < 0** : Queues **légères** (peu d'extrêmes)

**Exemple** : Kurtosis = -0.08 → Distribution très proche d'une normale.

---

### Q5 : Puis-je utiliser des incertitudes personnalisées ?

**Oui !** Utilisez le paramètre `customUncertainties` :

```json
{
  "diameter": 100,
  "velocity": 20,
  "customUncertainties": {
    "diameter": { "mean": 100, "stdDev": 5 },
    "velocity": { "mean": 20, "stdDev": 2 }
  }
}
```

**Cas d'usage** :
- Mesures précises par radar : `stdDev = 2%` au lieu de `10%` par défaut
- Composition connue (spectroscopie) : `density.stdDev = 5%` au lieu de `15%`

---

### Q6 : Quelle est la différence entre Mean et Median ?

**Mean (Moyenne)** : `Σ x_i / N`
- Sensible aux valeurs extrêmes
- Peut être biaisée si distribution asymétrique

**Median (Médiane)** : Valeur centrale (P50)
- Robuste aux outliers
- Meilleure représentation si distribution asymétrique

**Exemple** :
- Distribution symétrique : Mean ≈ Median
- Distribution asymétrique (skewness > 0) : Mean > Median

**Recommandation** : Utiliser **Median** pour planification (plus robuste).

---

### Q7 : Combien de temps dure une simulation ?

**Temps approximatifs** (serveur Azure Container Apps, 2 vCPU) :

| N Samples | Temps Moyen | Temps Max |
|-----------|-------------|-----------|
| 100 | 5-10s | 15s |
| 500 | 15-30s | 45s |
| 1000 | 30-60s | 90s |
| 5000 | 3-5min | 8min |
| 10,000 | 8-12min | 20min |

**Note** : Cold start Azure ajoute 10-12s la première fois.

---

## 7. Références Techniques

### Documentation Complète

Voir **[PHYSICS_MODEL_v2.0.md](../PHYSICS_MODEL_v2.0.md)** Section 3 pour :
- Formules mathématiques complètes
- Détails algorithmes Sobol
- Validation scientifique
- Architecture logicielle

### Articles Scientifiques Clés

1. **Metropolis & Ulam (1949)** - The Monte Carlo Method
2. **Sobol (1993)** - Sensitivity Estimates for Nonlinear Mathematical Models
3. **Saltelli et al. (2010)** - Variance based sensitivity analysis
4. **Chesley & Spahr (2004)** - Earth Impactors: Orbital Characteristics

### Code Source

- Backend : [`api/src/services/monteCarlo*.js`](../src/services/)
- Frontend : [`web/src/components/UncertaintyPanel.tsx`](../../web/src/components/UncertaintyPanel.tsx)
- API : [`api/src/index.js`](../src/index.js) (ligne 463-578)

---

## 📞 Support

**Problèmes ?** Ouvrir une issue GitHub
**Questions ?** Contact : NASA Space Apps Challenge 2025 - Meteor Madness Team

---

**Version**: 1.0.0
**Dernière mise à jour**: 2025-10-15
**Auteur**: Claude Code & David Baker
**Licence**: MIT (NASA Space Apps Challenge 2025)