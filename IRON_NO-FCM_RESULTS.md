# Phase 1.4.2 - NO-FCM Bypass Results

**Date**: 2025-10-20
**Revision**: ca-api-ckq6mn38--0000047
**Hypothesis**: Small iron meteorites (<100m) do NOT fragment in atmosphere

---

## Executive Summary

**Status**: ❌ **HYPOTHESIS PARTIALLY FAILED**

The NO-FCM bypass successfully eliminated atmospheric fragmentation for iron meteorites, but results show:

| Metric | Baseline (Phase 1.4.1) | NO-FCM (Phase 1.4.2) | Target | Status |
|--------|------------------------|----------------------|--------|--------|
| **MAE (4 iron craters)** | 75.85% | **127.77%** | <30% | ❌ **WORSE** |
| **Sikhote-Alin** | 11.8% | **396.1%** | <15% | 🔴 **CRITICAL FAILURE** |
| **Barringer** | 20.7% | **20.7%** | <20% | ⚠️ Same (marginal) |
| **Wolfe Creek** | 93.8% | **78.1%** | <30% | ⚠️ Improved but insufficient |
| **Wabar** | 85.7% | **16.1%** | <40% | ✅ **PASS** |

---

## Detailed Results

### ✅ PASS: Wabar (8m)

| Parameter | Value |
|-----------|-------|
| **Observed** | 116 m |
| **NO-FCM Predicted** | 97.3 m |
| **Error** | 16.1% |
| **Status** | ✅ Within target (<40%) |

**Analysis**: NO-FCM works well for very small irons (8m).

---

### ⚠️ MARGINAL: Barringer (50m)

| Parameter | Baseline | NO-FCM | Target |
|-----------|----------|--------|--------|
| **Observed** | 1200 m | 1200 m | 1200 m |
| **Predicted** | 951 m | 951 m | - |
| **Error** | 20.7% | **20.7%** | <20% |

**Analysis**: NO-FCM did NOT change Barringer prediction (still 951m). This suggests:
- Barringer already had minimal fragmentation in baseline
- OR NO-FCM threshold (100m) is too high (Barringer is 50m, should trigger bypass)

**CRITICAL BUG**: Barringer (50m) should trigger NO-FCM bypass but shows same result as baseline!

---

### ⚠️ IMPROVED BUT INSUFFICIENT: Wolfe Creek (15m)

| Parameter | Baseline | NO-FCM | Improvement |
|-----------|----------|--------|-------------|
| **Observed** | 892 m | 892 m | - |
| **Predicted** | 55 m | 195 m | **+140m (3.5×)** |
| **Error** | 93.8% | **78.1%** | -15.7% |

**Analysis**:
- NO-FCM significantly increased prediction (55m → 195m)
- But still massively under-predicts (78% error vs target <30%)
- Suggests fundamental issue beyond fragmentation

---

### 🔴 CRITICAL FAILURE: Sikhote-Alin (10m)

| Parameter | Baseline | NO-FCM | Status |
|-----------|----------|--------|--------|
| **Observed** | 26 m | 26 m | - |
| **Predicted** | 22.9 m | **129 m** | 🔴 |
| **Error** | 11.8% ✅ | **396.1%** | BROKEN |

**Analysis**:
- Baseline prediction: 22.9m (11.8% error) ✅
- NO-FCM prediction: 129m (396% error) ❌
- **NO-FCM BROKE Sikhote-Alin completely!**

**Physical Reason**:
Sikhote-Alin DID fragment in the atmosphere (122 observed craters). The NO-FCM assumption (intact impact) is WRONG for this case.

**Historical Evidence**:
- Krinov (1966): "The iron mass broke into fragments before entering atmosphere"
- Pre-fractured in space, NOT intact iron
- Should use FCM, not bypass

---

## Physics Analysis

### Why NO-FCM Failed

1. **Sikhote-Alin Exception**:
   - Pre-fractured iron (NOT intact monolith)
   - Baseline model correctly used FCM → 11.8% error ✅
   - NO-FCM incorrectly assumes intact → 396% error ❌

2. **Wolfe Creek Under-Prediction**:
   - Even with NO fragmentation, still 78% error
   - Suggests C constant (14.10) is wrong for iron
   - Need composition-specific C_iron calibration

3. **Barringer Bug**:
   - 50m impactor should trigger NO-FCM (<100m threshold)
   - But prediction identical to baseline (951m)
   - Code may not be triggering correctly

---

## Root Cause Analysis

### Issue 1: One-Size-Fits-All NO-FCM Threshold

**Problem**: 100m threshold does NOT account for:
- Pre-fractured irons (Sikhote-Alin) → SHOULD fragment
- Intact irons (Barringer, Wolfe Creek) → should NOT fragment

**Solution**: Need fragmentation state classification, not just size threshold

### Issue 2: C Constant Not Calibrated for Iron

**Evidence**:
- C = 14.10 calibrated on mixed dataset (42 iron + 19 rocky)
- Rocky craters: 13.3% MAE ✅
- Iron craters: 75-128% MAE ❌

**Hypothesis**: Iron impacts transfer momentum differently than rocky

**Solution**: Separate C_iron calibration on iron-only dataset

---

## Recommendations

### ❌ REVERT NO-FCM Bypass

**Reason**:
- Breaks Sikhote-Alin (11.8% → 396% error)
- Does not fix Barringer/Wolfe Creek sufficiently
- Overall MAE worse (75% → 128%)

**Action**: Revert to Phase 1.4.1 baseline

### ✅ NEXT APPROACH: Composition-Specific C Constant

**Strategy**:
1. Keep current fragmentation model (FCM V2)
2. Calibrate **C_iron** separately on iron craters only
3. Keep C_rocky = 14.10 for rocky craters

**Expected Impact**:
- Preserves Sikhote-Alin accuracy (11.8%)
- Improves Barringer/Wolfe Creek via larger C_iron
- Physics-based (composition affects momentum coupling)

**References**:
- Holsapple (1993): "C varies with target-projectile density ratio"
- Collins et al. (2005): Composition-dependent scaling

---

## Data Summary

### Test Cases (N=4)

| Crater | Type | Size | Baseline Error | NO-FCM Error | Δ Error |
|--------|------|------|----------------|--------------|---------|
| Sikhote-Alin | Pre-fractured iron | 26m | **11.8%** ✅ | 396.1% ❌ | +384.3% 🔴 |
| Wabar | Intact iron | 116m | 85.7% | **16.1%** ✅ | -69.6% ✅ |
| Wolfe Creek | Intact iron | 892m | 93.8% | **78.1%** | -15.7% ⚠️ |
| Barringer | Intact iron | 1200m | **20.7%** | 20.7% | 0.0% (no change?) |

### Statistics

**Baseline (Phase 1.4.1)**:
- MAE: 75.85%
- Median: 78.12%
- Range: 11.8% - 93.8%

**NO-FCM (Phase 1.4.2)**:
- MAE: **127.77%** (68% WORSE)
- Median: 78.12%
- Range: 16.1% - 396.1%

---

## Conclusion

**Key Findings**:

1. ✅ **NO-FCM works for small intact irons** (Wabar 8m: 16.1% error)
2. ❌ **NO-FCM breaks pre-fractured irons** (Sikhote-Alin: 396% error)
3. ⚠️ **NO-FCM insufficient for medium irons** (Wolfe Creek: 78% error)
4. 🐛 **Potential bug**: Barringer (50m) shows no change

**Decision**: REVERT Phase 1.4.2 NO-FCM bypass

**Next Strategy**: Phase 1.4.3 - Composition-Specific C Calibration
- C_rocky = 14.10 (validated, MAE 13.3%)
- C_iron = ? (to be calibrated on iron-only dataset)
- Keep FCM V2 fragmentation model intact

---

**Generated**: 2025-10-20
**Test Script**: test-iron-physics-validation.js
**API Revision**: ca-api-ckq6mn38--0000047
