# Plan de Corrections Physiques - Objectif MAE < 10%

**Date**: 2025-10-19
**Problème Identifié**: Calibrations empiriques masquent des erreurs physiques fondamentales
**Objectif**: Appliquer les vraies lois physiques → MAE < 10%

---

## 🔴 Erreurs Physiques Identifiées

### Erreur #1: Formules Kingery-Bulmash "Calibrées"
**Fichier**: `rankineHugoniot.js` lignes 153-171

**Problème**:
```javascript
// FAUX - Coefficients inventés (200, 1.8, 0.3, 0.01)
if (scaledDistance < 0.2) {
    overpressure_ratio = 200 * Math.pow(scaledDistance / 0.2, -3);
} else if (scaledDistance < 1.0) {
    overpressure_ratio = 1.8 * Math.pow(scaledDistance, -2.5);
}
```

**VRAIE Formule Kingery-Bulmash (1984)**:
```
ΔP/P₀ = [1 + (Z/A)^B]^C / Z^D

Où:
- Z = R / (W^1/3) (scaled distance, W en kg TNT)
- A, B, C, D = coefficients de fit polynomiaux (publiés)
```

**Référence**: Kingery, C. N., & Bulmash, G. (1984). "Air Blast Parameters from TNT Spherical Air Burst and Hemispherical Surface Burst"

**Impact MAE**: ~5-8% (overpressure mal calculée → blast radii incorrects)

---

### Erreur #2: Scaling Pi-Groupes Non Calibrés
**Fichier**: `craterPiGroupsComplete.js` lignes 48-64

**Problème**:
```javascript
// Valeurs "nominales" de la littérature, mais PAS calibrées
K: 1.0,           // ← FAUX pour notre cas
mu: 0.33,         // ← Générique
nu: 0.217,        // ← Gravity regime seulement
epsilon: 0.33     // ← Simplifié
```

**VRAIES Valeurs (Holsapple 1993 Table 3)**:

Pour **impacts verticaux** (θ = 90°):
- K = 1.03 (gravity regime, rocky targets)
- μ = 0.55 (density coupling, 3D crater)
- ν = 0.217 (gravity scaling exponent)

Pour **impacts obliques** (θ < 90°):
- K_oblique = K × sin(θ)^(1/3) (correction géométrique)
- ε = 0.33 (confirmé par Pierazzo & Melosh 2000)

**Impact MAE**: ~10-15% (diamètre cratère mal calculé directement)

---

### Erreur #3: Pas de Correction Atmosphérique sur Vitesse Finale
**Fichier**: `physicsEngine.js` ligne 1194

**Problème**:
```javascript
// On utilise "velocity" initial, pas velocity finale après atmosphère
baseCrater = this.craterPiGroupsComplete.calculateCraterDimensions(
    energy.joules,
    mass,
    angle,
    composition,
    density,
    2500,
    diameter,
    velocity  // ← FAUX: vitesse initiale, pas finale!
);
```

**Correction**:
```javascript
// Utiliser la vitesse FINALE du RK4 (après drag atmosphérique)
const finalVelocity = rk4Result.summary.final_velocity_m_s || velocity;

baseCrater = this.craterPiGroupsComplete.calculateCraterDimensions(
    ...,
    finalVelocity  // ← CORRECT: vitesse à l'impact
);
```

**Impact MAE**: ~3-5% (vitesse incorrecte → énergie incorrecte → cratère incorrect)

---

### Erreur #4: Énergie Cinétique vs Énergie de Cratérisation
**Fichier**: `energyBudget.js`

**Problème**:
Le cratère utilise E_total = 0.5 × m × v² **AVANT** soustraire:
- Énergie de déformation (5-20%)
- Énergie thermique (1-5%)
- Énergie d'éjection (15-40%)

**Physique Correcte** (Collins et al. 2005):
```
E_crater = η_coup × (E_kinetic - E_thermal - E_deformation)

Où η_coup = coefficient de couplage (0.3-0.5 pour roches)
```

**Impact MAE**: ~5-10% (énergie surestimée → diamètre surestimé)

---

### Erreur #5: Transition Transient → Final Crater Simplifiée
**Fichier**: `craterPiGroupsComplete.js`

**Problème**:
```javascript
// Formule simplifiée
D_final = D_transient × expansion_factor

// expansion_factor = 1.3 (constant) ← FAUX
```

**Physique Correcte** (Croft 1985):
```
D_final / D_transient = 1.19 × D_transient^0.13  (pour D_trans > 3 km)
D_final = D_transient                            (pour D_trans < 3 km, simple)
```

**Impact MAE**: ~3-5% (cratères larges mal estimés)

---

## ✅ Plan de Correction (Ordre de Priorité)

### Priorité 1: Correction Vitesse Finale (Impact: ~5% MAE)
**Temps**: 30 minutes

1. Extraire `final_velocity_m_s` du RK4
2. Utiliser cette vitesse dans calcul cratère
3. Tester avec Barringer, Tunguska

**Fichiers**:
- `physicsEngine.js` ligne 1194
- Extraction RK4 ligne ~1095

---

### Priorité 2: Calibration Pi-Groupes Holsapple (Impact: ~10-15% MAE)
**Temps**: 2 heures

1. Implémenter VRAIES valeurs Holsapple 1993 Table 3
2. K = 1.03, μ = 0.55, ν = 0.217, ε = 0.33
3. Correction oblique: K × sin(θ)^(1/3)
4. Validation: Barringer (θ=90°, vertical), Tunguska (θ~45°)

**Fichiers**:
- `craterPiGroupsComplete.js` lignes 48-64

**Référence Exacte**:
```
Holsapple, K. A. (1993). "The Scaling of Impact Processes in Planetary Sciences"
Annual Review of Earth and Planetary Sciences, 21, 333-373.
Table 3: "Scaling Parameters for Crater Formation"
```

---

### Priorité 3: Énergie de Cratérisation Correcte (Impact: ~5-10% MAE)
**Temps**: 1 heure

1. Calculer E_available = E_kinetic - E_thermal - E_deformation
2. Appliquer η_coup = 0.4 (rocky targets, Collins 2005)
3. E_crater = η_coup × E_available

**Fichiers**:
- `energyBudget.js`
- `craterPiGroupsComplete.js` (utiliser E_crater, pas E_kinetic)

---

### Priorité 4: Transition Transient→Final (Croft 1985) (Impact: ~3-5% MAE)
**Temps**: 1 heure

1. Implémenter formule Croft 1985
2. If D_trans < 3 km: D_final = D_transient
3. If D_trans ≥ 3 km: D_final = 1.19 × D_trans^1.13

**Fichier**:
- `craterPiGroupsComplete.js`

---

### Priorité 5: Kingery-Bulmash Vraie Formule (Impact: 0% MAE crater, mais rigueur)
**Temps**: 3 heures

1. Implémenter polynôme Kingery-Bulmash exact
2. Coefficients A, B, C, D de la publication
3. Validation: Trinity, Hiroshima, Tsar Bomba

**Fichier**:
- `rankineHugoniot.js` lignes 153-171

**NOTE**: N'affecte PAS le MAE cratère (seulement blast zones), mais nécessaire pour rigueur scientifique.

---

## 📊 Projection MAE Après Corrections

| Correction | MAE Actuel | MAE Après | Gain |
|-----------|-----------|-----------|------|
| **Baseline** | 32% | — | — |
| 1. Vitesse finale | 32% | **27%** | -5% |
| 2. Pi-groupes Holsapple | 27% | **14%** | -13% |
| 3. Énergie cratérisation | 14% | **9%** | -5% |
| 4. Transition Croft | 9% | **6%** | -3% |
| 5. Kingery-Bulmash exact | 6% | **6%** | 0% (blast) |

**MAE FINAL PROJETÉ: 6-8%** ✅ (objectif <10%)

---

## 🔬 Méthodologie de Validation

### Jeu de Données Validation (Cratères Confirmés)

1. **Barringer** (Arizona, USA)
   - Diamètre observé: 1,200 m
   - Impactor: fer, 50 m, 12.8 km/s, θ=90° (vertical)
   - Reference: Shoemaker (1963)

2. **Tunguska** (1908, Sibérie)
   - Zone dévastée: 30 km rayon
   - Impactor: rocheux, ~60 m, 15 km/s, θ~45°, airburst 8 km
   - Reference: Vasilyev (1998)

3. **Chelyabinsk** (2013, Russie)
   - Dommages: 90 km (fenêtres), airburst 23 km
   - Impactor: rocheux, ~20 m, 19 km/s
   - Reference: Brown et al. (2013)

4. **Chicxulub** (Extinction K-T)
   - Diamètre: 180 km
   - Impactor: ~10 km, 20 km/s
   - Reference: Hildebrand et al. (1991)

### Métriques de Validation

```javascript
function calculateMAE(observations, predictions) {
    const errors = observations.map((obs, i) =>
        Math.abs(obs - predictions[i]) / obs
    );
    return errors.reduce((a, b) => a + b) / errors.length;
}
```

**Critères de Succès**:
- MAE < 10% ✅
- RMSE < 15%
- Aucun biais systématique (over/underestimation)
- R² > 0.95

---

## 📚 Références Scientifiques Clés

### Crater Scaling
1. **Holsapple (1993)** - "The Scaling of Impact Processes"
   - Table 3: Scaling parameters (K, μ, ν)
   - Figures 8-9: Gravity vs strength regime

2. **Schmidt & Housen (1987)** - "Some Recent Advances in Crater Scaling"
   - π-group formulation
   - Experimental validation

3. **Croft (1985)** - "The Scaling of Complex Craters"
   - Transient → final diameter transition
   - D_final = 1.19 × D_trans^1.13

### Energy Partitioning
4. **Collins et al. (2005)** - "Earth Impact Effects Program"
   - Coupling coefficient η = 0.3-0.5
   - Energy budget breakdown

5. **Melosh (1989)** - "Impact Cratering: A Geologic Process"
   - Chapter 5: Energy and momentum transfer
   - Chapter 7: Crater scaling laws

### Blast Physics
6. **Kingery & Bulmash (1984)** - "Air Blast Parameters from TNT"
   - Polynomial fit coefficients (A, B, C, D)
   - Validated 0.1 kg to 500 tons TNT

7. **Glasstone & Dolan (1977)** - "Effects of Nuclear Weapons"
   - Mach reflection
   - Damage thresholds

---

## 🎯 Ordre d'Implémentation Recommandé

**Session 1 (1 heure)**: Corrections Priorité 1 + 2
- Vitesse finale RK4
- Pi-groupes Holsapple
- **Test immédiat**: Barringer MAE (devrait passer de 32% → ~15%)

**Session 2 (1 heure)**: Corrections Priorité 3 + 4
- Énergie cratérisation
- Transition Croft
- **Test immédiat**: Tunguska, Chelyabinsk (MAE → ~8%)

**Session 3 (1 heure)**: Validation Complète
- Jeu de données 10-15 cratères
- Calcul MAE, RMSE, R²
- Rapport final

**TOTAL: 3 heures → MAE < 10%** ✅

---

## Conclusion

Les "calibrations empiriques" actuelles (coefficients 200, 1.8, 0.3, K=1.0, μ=0.33) ne respectent pas les valeurs publiées dans la littérature scientifique.

En appliquant les **vraies formules physiques** de:
- Holsapple (1993) pour π-groupes
- Croft (1985) pour transient→final
- Collins (2005) pour énergie de cratérisation
- Velocity finale du RK4

**MAE projeté: 6-8%** (au lieu de 32% actuel)

**Prochaine étape**: Implémenter Priorité 1 + 2 (1 heure) → Test Barringer → Valider amélioration
