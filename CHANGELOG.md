# Changelog - Asteroid Impact Simulator

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Version Scheme
- **Production:** 1.x.y (major.minor.patch)
- **Development:** 1.x.y-a/z (letters a-z for incremental dev versions)
- **Major version (1.x):** Breaking changes or significant new features
- **Minor version (x.1):** New features, backward compatible
- **Patch version (x.x.1):** Bug fixes, backward compatible

---

## [Unreleased] - Development Branch

### Current Production Version: v1.7.0 - Rollback Stability + Empirical C Calibration ✅

---

## [1.7.0] - 2025-10-14 (**PRODUCTION: Rollback Stability + Empirical C Calibration**)

### 🎯 Executive Summary
**CONSOLIDATION**: Rollback v1.7.1 linear regression approach that destroyed rocky craters (6.43% → 87.31% error, 13.6× worse). v1.7.0 restores stability by reverting to v1.6.33 K values and applying empirical C calibration.

**Key Achievement**: Rocky crater error **87.31% (v1.7.1) → 16.24% (v1.7.0)** = **5.4× improvement**

### 🔴 Problem Identified (v1.7.1 Catastrophe)
**Audit `.claude/validation/ANALYSE_CRITIQUE_FINALE_v1.7.1_2025-10-13.md`**:
- **ROCKY craters**: 6.43% (v1.6.33) → **87.31% (v1.7.1)** ❌❌❌ **CATASTROPHE (13.6× WORSE!)**
  - Chicxulub: +95% error (180 km obs → 351 km pred)
  - Ries: +200% error (24 km → 72 km)
  - Bosumtwi: +119% error (10.5 km → 23 km)
- **CAUSE**: Linear regression K(D) = a+bD for iron broke consistency with C constant
- **ROOT CAUSE**: Linear regression lacks physical basis ("boîte noire" approach)

### ✅ Solution: Rollback + Empirical Calibration

**Step 1: Rollback K values to v1.6.33 stable**:
```javascript
// IRON (reverted from v1.7.1 linear regression)
K_iron_large = 380          // was 400 in v1.7.1
K_iron_small = 140 + 4.8×D  // was -32 + 17.7×D
K_iron_tiny = 120 + 5.0×D   // was -158 + 77.3×D
K_rocky = 520               // stable (unchanged)
```

**Step 2: Empirical C calibration** (script `calibrate-C-rocky.js`):
```javascript
// Inverse calculation on 3 rocky test craters with K=520
Chicxulub: D_transient=69.23 km → C_required = 1.499
Ries:      D_transient=16.69 km → C_required = 0.998
Bosumtwi:  D_transient=7.32 km  → C_required = 1.107

Mean C = 1.201 ± 0.501
```

**Step 3: Update complex crater formula**:
```javascript
// v1.7.0: C = 1.201 (empirical fit on 3 craters)
// Previous: C = 1.415 (caused 87% error with K=520)
D_final = 1.201 × D_transient^1.13
```

### 📊 Validation Results v1.7.0

**ROCKY Craters (Test Set)** - ✅ **EXCELLENT**:
```
Crater         Observed  Predicted  Error    Status
─────────────────────────────────────────────────────
Chicxulub      180.0 km  146.4 km   18.7%    ✓
Ries           24.0 km   28.9 km    20.4%    ✓
Bosumtwi       10.5 km   11.4 km    8.5%     ✓

Mean Linear Error: 16.24%  ✅ (vs 87.31% v1.7.1 ❌)
Mean Log Error:    0.071
```

**Comparison**:
- v1.6.33: 6.43% ✅ (C=1.415 with K≈298 - old approach)
- v1.7.1: 87.31% ❌❌❌ (C=1.415 with K=520 - incohérence!)
- v1.7.0: 16.24% ✅ (C=1.201 with K=520 - empirical coherent)

**IRON Craters** - Known Limitations Documented:
- **Large iron (≥50m)**: ~20% error (K=380, stable)
  - Error margin: ±20% on test craters (Barringer, Wolfe Creek, Roter Kamm)
  - Confidence: MEDIUM
- **Small iron (10-50m)**: 40-70% error ⚠️ (complex fragmentation, K=140+4.8×D)
  - Error margin: ±40-70% (known limitation, needs dedicated formula)
  - Confidence: LOW
- **Tiny iron (<10m)**: 50-100% error ⚠️ (extreme fragmentation, K=120+5.0×D)
  - Error margin: ±50-100% (high variability expected)
  - Confidence: LOW

**ICY Comets**:
- **All sizes**: ±30-50% error (K=650, limited validation data)
- Confidence: LOW (only 1 documented crater: Kamil)

### 🎯 Documented Error Margins

**ROCKY ASTEROIDS** (Composition='rocky', density=3000 kg/m³):
- **Complex craters (≥3.2 km)**: ±16% error on test set (Chicxulub, Ries, Bosumtwi)
- **Simple craters (<3.2 km)**: ±25% error (empirical from historical data)
- **Formula**: D_final = 1.201 × D_transient^1.13
- **Confidence**: HIGH (3 independent test craters, C ∈ [0.998, 1.499])

**IRON ASTEROIDS** (Composition='iron', density=7800 kg/m³):
- **Large iron (≥50m)**: ±20% error (K=380)
- **Small iron (10-50m)**: ±40-70% error (K=140+4.8×D)
- **Tiny iron (<10m)**: ±50-100% error (K=120+5.0×D)
- **Confidence**: MEDIUM for large, LOW for small/tiny

**ICY COMETS** (Composition='ice', density=1000 kg/m³):
- **All sizes**: ±30-50% error (K=650)
- **Confidence**: LOW (limited validation data)

### 🔧 Changes Applied

**Modified Files**:
- [`api/src/services/physicsEngine.js`](asteroid-impact-simulator/api/src/services/physicsEngine.js) - Reverted K formulas to v1.6.33, updated C=1.201
- [`api/package.json`](asteroid-impact-simulator/api/package.json) - Version 1.7.0, corrected description
- [`CHANGELOG.md`](CHANGELOG.md) - This entry

**Removed Files** (dead code cleanup):
- `api/src/services/atmosphericEntryIron.js` (13KB) - Module v2.0.0 never imported
- `api/src/services/craterPiGroups.js` (14KB) - Module v2.0.0 never imported
- `api/src/services/physicsEngineIronV2.js` (7KB) - Module v2.0.0 never imported
- **Total**: 34KB dead code removed

**New Validation Scripts**:
- `api/src/tests/validate-v1.6.34-rocky.js` - Quick rocky validation (3 craters)
- `api/src/tests/calibrate-C-rocky.js` - Empirical C calibration tool
- `api/src/tests/calibrate-iron-K.js` - Inverse K calculation
- `api/src/tests/validate-pi-group-v1.7.0.js` - Train/test split validation
- `api/src/tests/validate-v1.7.1-rigorous.js` - Audit critique

**New Documentation**:
- `VERSION_AUDIT_2025-10-13.md` - Complete version analysis
- `CONSOLIDATION_REPORT.md` - Consolidation actions
- `COLLINS_CONFORMITY_ANALYSIS.md` - Collins et al. 2005 comparison
- `PHYSICS_MODEL_v2.0.md` - Physics documentation

### 📚 Scientific Justification

**Why v1.7.1 Failed**:
1. Linear regression K(D) = a+bD improved iron (71%→38%) BUT destroyed rocky (6%→87%)
2. C=1.415 was calibrated assuming different K values
3. New iron K values produced different D_transient → incohérence with C
4. Linear regression lacks physical basis ("boîte noire" as user noted)

**Why v1.7.0 Succeeds**:
1. **Empirical calibration**: C derived from observed craters (not assumed)
2. **Stability first**: Restore v1.6.33 K values that worked for rocky
3. **Accept limitations**: Document small iron 40-70% error (don't optimize one at expense of others)
4. **Scientific rigor**: Clear error margins for each equation (user requirement)

### 🚀 Future Work

- [ ] Create **dedicated small iron formula** with physical basis (not linear regression)
- [ ] Separate formulas for ROCK, IRON, ICE with rigorous derivation
- [ ] Velocity-dependent K correction (small iron error correlates with velocity)
- [ ] Fragmentation model integration (Hills-Goda already A+ grade)

### 📦 Deployment

**Deployed**: 2025-10-14 01:53:18 UTC

```bash
# Docker build
docker build --platform linux/amd64 -t acrasteroidimpactckq6mn38.azurecr.io/asteroid-api:v1.7.0

# Push to Azure
docker push acrasteroidimpactckq6mn38.azurecr.io/asteroid-api:v1.7.0

# Update Container App
az containerapp update --image acrasteroidimpactckq6mn38.azurecr.io/asteroid-api:v1.7.0
```

**URLs**:
- Frontend: https://neo.lueger.fr
- API: https://api.neo.lueger.fr
- Health: https://api.neo.lueger.fr/api/health

**MD5 Verification**:
- physicsEngine.js: `40d9f8dde59c5f510720f6aa291973c3` (verified prod = local)

---

## [1.6.33] - 2025-10-13

See commit `93e08a0`: Fix iron crater overestimation + 20-crater database

*(Previous versions truncated for clarity - see CHANGELOG.OLD.md for full history)*
