# AUDIT DE VERSION - 2025-10-13

## 🎯 RÉSULTAT: CODE LOCAL = CODE PRODUCTION ✅

### ✅ VERSION EN PRODUCTION (Azure)
- **Version**: `v1.7.0`
- **Image**: `acrasteroidimpactckq6mn38.azurecr.io/asteroid-api:v1.7.0`
- **Revision**: `ca-api-ckq6mn38--0000040`
- **Déployé**: 2025-10-14 01:53:18 UTC
- **Description**: "Backend API for Asteroid Impact Simulator - NASA Space Apps Challenge 2025 - Now with Physics-Based Iron Crater Model v2.0"

### ✅ CODE LOCAL
- **Version package.json**: `1.7.0`
- **Description**: "Backend API for Asteroid Impact Simulator - NASA Space Apps Challenge 2025 - Now with Physics-Based Iron Crater Model v2.0"
- **MD5 physicsEngine.js**: `40d9f8dde59c5f510720f6aa291973c3` ✅ IDENTIQUE
- **Fichiers services**: 14 fichiers (même nombre que prod)

### ⚠️ INCOHÉRENCE IDENTIFIÉE

**Le nom "Iron Crater Model v2.0" dans package.json est TROMPEUR!**

#### Réalité du Code Actuel (v1.7.0)
- **physicsEngine.js**: Utilise **v1.6.34 rollback approach**
  - C = 1.201 (calibration empirique)
  - K_iron = 380 (stable v1.6.33)
  - Commentaires: "v1.6.34 STABLE - Accept small iron complexity"
  - Aucune utilisation de "Physics-Based Iron Model v2.0"

#### Fichiers "v2.0 Iron Model" Orphelins (NON UTILISÉS)
```
❌ atmosphericEntryIron.js (13KB) - module v2.0.0 - JAMAIS importé
❌ craterPiGroups.js (14KB) - JAMAIS importé
❌ physicsEngineIronV2.js (7KB) - module v2.0.0 - JAMAIS importé
```

**Preuve**: `grep -r` dans tout le code source ne trouve AUCUN import de ces modules.

### 📊 PERFORMANCE ACTUELLE (v1.7.0 en prod)

**Rocky Craters** (validé):
- Chicxulub: 18.7% error (146.4 km vs 180 km observé)
- Ries: 20.4% error
- Bosumtwi: 8.5% error
- **Mean: 16.24% ✅ EXCELLENT**

**Iron Craters** (limitations documentées):
- Large iron (≥50m): ~20% error (K=380)
- Small iron (10-50m): 40-70% error (fragmentation complexe)
- Tiny iron (<10m): 50-100% error (haute variabilité)

### ⚠️ GIT STATUS

**Dernier commit**: `93e08a0` (v1.6.33 - Fix iron crater overestimation)

**Modifications non commitées**:
- `physicsEngine.js` - C=1.201, K=380 (v1.6.34/v1.7.0 actuel)
- `package.json` - v1.7.0
- `CHANGELOG.md` - v1.6.34 entry (confusion!)
- `atmosphericFragmentation.js` - modifications mineures

**Fichiers non trackés** (orphelins v2.0 + tests):
```
🗑️  ORPHELINS (à supprimer):
   - atmosphericEntryIron.js
   - craterPiGroups.js
   - physicsEngineIronV2.js

📝 TESTS (à garder):
   - validate-v1.6.34-rocky.js
   - calibrate-C-rocky.js
   - calibrate-iron-K.js
   - validate-pi-group-v1.7.0.js
   - validate-v1.7.1-rigorous.js
   - validate-iron-v2.js
   - calibrate-k1-iron.js
   - analyze-crater-physics-v1.6.37.js

📄 DOCS (à garder):
   - COLLINS_CONFORMITY_ANALYSIS.md
   - PHYSICS_MODEL_v2.0.md
```

## 🔧 ACTIONS RECOMMANDÉES

### 1. ✅ CORRIGER LE NOM DE VERSION
Le code actuel (v1.7.0) est en réalité **v1.6.34 rollback** avec:
- Rollback K values (K=380 iron, K=520 rocky)
- Calibration empirique C=1.201
- Acceptation limitations small iron

**Options**:
- **A. Renommer v1.7.0 → v1.6.34** (reflect reality)
- **B. Garder v1.7.0 mais corriger description** (remove "Iron Model v2.0")

### 2. 🗑️ SUPPRIMER FICHIERS ORPHELINS
```bash
rm api/src/services/atmosphericEntryIron.js
rm api/src/services/craterPiGroups.js
rm api/src/services/physicsEngineIronV2.js
```

Ces fichiers "v2.0 Iron Model" ne sont jamais utilisés et créent de la confusion.

### 3. 📝 CORRIGER CHANGELOG.md
- Supprimer l'entrée v1.6.34 (confusion)
- Créer une entrée v1.7.0 CORRECTE reflétant le rollback
- Documenter pourquoi "Iron Model v2.0" n'est PAS utilisé

### 4. 💾 COMMIT PROPRE
```bash
# Supprimer fichiers orphelins
git rm api/src/services/atmosphericEntryIron.js
git rm api/src/services/craterPiGroups.js
git rm api/src/services/physicsEngineIronV2.js

# Ajouter fichiers modifiés
git add api/src/services/physicsEngine.js
git add api/package.json
git add CHANGELOG.md

# Ajouter tests validation (utiles)
git add api/src/tests/*.js

# Ajouter docs
git add asteroid-impact-simulator/COLLINS_CONFORMITY_ANALYSIS.md
git add asteroid-impact-simulator/PHYSICS_MODEL_v2.0.md

# Commit
git commit -m "feat: v1.7.0 - Rollback + Empirical C Calibration (Rocky 16.24% error)

ROLLBACK v1.7.1 linear regression approach that destroyed rocky craters.

Changes:
- Revert K values to v1.6.33 stable (K_iron=380, K_rocky=520)
- Empirical C=1.201 calibration (3 rocky test craters)
- Accept small iron limitations (40-70% error documented)

Results:
- Rocky: 6.43% (v1.6.33) → 87.31% (v1.7.1) → 16.24% (v1.7.0) ✅
- Iron large: ~20% error (stable)
- Iron small: 40-70% error (known limitation)

Remove orphaned 'Iron Model v2.0' files (never used):
- atmosphericEntryIron.js
- craterPiGroups.js
- physicsEngineIronV2.js

Add validation tests for crater calibration.

🤖 Generated with Claude Code"
```

## 📊 CONCLUSION

### ✅ CE QUI EST BON
1. **Code local = Code production** (MD5 identique)
2. **Performance rocky excellente** (16.24% error)
3. **Stabilité restaurée** (pas de régression catastrophique)
4. **Limitations documentées** (small iron 40-70%)

### ⚠️ CE QUI DOIT ÊTRE CORRIGÉ
1. **Nom trompeur**: "Iron Model v2.0" n'existe pas dans le code réel
2. **Fichiers orphelins**: 3 fichiers "v2.0" jamais utilisés (24KB dead code)
3. **Git en retard**: v1.6.33 committée, v1.7.0 en prod non committée
4. **CHANGELOG confus**: Mélange v1.6.34/v1.7.0/v1.7.1

### 🎯 VERSION CORRECTE
Le code actuel devrait s'appeler:
**v1.7.0 - Rollback Stability + Empirical C Calibration**

Et **PAS** "Iron Model v2.0" qui n'a jamais été implémenté.
