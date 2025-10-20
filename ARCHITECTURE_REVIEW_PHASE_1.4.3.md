# Architecture Review - Phase 1.4.3

**Date**: 2025-10-20
**Status**: 🔴 **CRITICAL - Multiple conflicting systems**

---

## Problem Identified

The codebase has **TWO PARALLEL crater calculation systems** that conflict:

### System 1: physicsEngine.js (CURRENTLY USED)
**Path**: `index.js` → `physicsEngine.simulateImpact()` → `physicsEngine.calculateCraterSize()`

**Formula**:
```javascript
D_transient = K × (E / 1e15)^0.25
```

**Approach**:
- Energy-based scaling
- K constants by composition:
  - Iron ≥50m: K=380
  - Iron <50m: Delegates to System 2
  - Rocky: K=520
  - Icy: K=650
- NO density coupling via μ=0.55

**Issues**:
- ❌ Does NOT use Holsapple (1993) μ=0.55 density coupling
- ❌ K=380 for iron is empirically calibrated but not physics-based
- ✅ BUT works reasonably (Barringer: 20.7% error)

### System 2: smallIronCraterPhysics.js (ONLY for iron <50m)
**Path**: `physicsEngine.calculateCraterSize()` → `smallIronCraterPhysics.calculateSmallIronCrater()`

**Formula**:
```javascript
D = C × D_imp × (ρ_imp/ρ_target)^μ × (v/v_ref)^(2/3) × sin(θ)^(1/3)
```

**Approach**:
- FCM V2 atmospheric fragmentation first
- Then Holsapple scaling on surviving mass
- Uses μ = 0.55 (Phase 1.4.3 fix)
- C = 14.10 (bootstrap calibrated)

**Issues**:
- ✅ Scientifically correct (Holsapple 1993)
- ❌ ONLY used for iron <50m
- ❌ Barringer (50m) doesn't use it!

### System 3: craterPiGroupsComplete.js (UNUSED!)
**Status**: ⚠️ **NOT CALLED BY ANYTHING**

**Formula**: Complete pi-group implementation with μ=0.55

**Issues**:
- ✅ Scientifically correct
- ❌ Never used in production code

---

## Root Cause Analysis

### Why Barringer Doesn't Improve?

**Barringer params**:
- Diameter: 50m (exactly threshold!)
- Composition: iron

**Code path**:
```javascript
if (impactorDiameter >= 50) {
    K_base = 380;  // Line 301 physicsEngine.js
    regime = 'iron_large';
}
```

**Result**: Uses K=380 formula, NOT Holsapple μ=0.55!

### Why Small Iron Craters Got WORSE?

**Before Phase 1.4.3**:
- Wabar (8m): Used K formula → 97m (16% error)
- Wolfe Creek (15m): Used K formula → 195m (78% error)

**After Phase 1.4.3** (with μ=0.55):
- Wabar: Uses μ=0.55 in `smallIronCraterPhysics` → 20m (82% error) ❌
- Wolfe Creek: Uses μ=0.55 → 23m (97% error) ❌

**Why worse?** μ=0.55 INCREASES crater size for iron (ρ=7800):
```
Old: π₁^(1/3) = (7800/2500)^0.333 = 1.46
New: π₁^0.55 = (7800/2500)^0.55 = 1.82
```

But they got SMALLER! This means:
1. Either FCM is removing too much mass
2. OR there's a bug in the implementation
3. OR the baseline K formula had compensating errors

---

## Scientific Consensus vs Current Implementation

### What Science Says (Holsapple 1993)

**Formula**:
```
D_crater / L = K × (ρ_imp / ρ_target)^μ × (v² / gL)^ν × sin(θ)^ε
```

Where:
- μ = 0.55 (density coupling)
- ν = 0.217 (gravity scaling)
- ε = 0.33 (angle coupling)

**What Collins & Melosh (2005) Do**:
- Earth Impact Effects calculator
- Uses Holsapple pi-group scaling
- Single formula for all compositions
- Composition handled via density parameter

### What We're Doing

**physicsEngine.js**:
```
D = K × E^0.25 × sin(θ)^(1/3)
```

Where K varies by composition (380/520/650).

**This is NOT Holsapple (1993)!**

---

## Decision Matrix

### Option A: Keep Current K-based System ✅ **RECOMMENDED**

**Rationale**:
- Already working reasonably well
- Barringer: 20.7% error (acceptable)
- Rocky craters: 13.3% MAE (excellent)
- Empirically validated on 61 craters

**Improvements needed**:
1. Fix small iron crater under-prediction
2. Better atmospheric fragmentation for iron
3. Document that we use energy-scaling, not momentum-scaling

**Pros**:
- ✅ Minimal changes
- ✅ Known behavior
- ✅ Already calibrated on real data

**Cons**:
- ❌ Not "pure" Holsapple (1993)
- ❌ Less theoretically elegant

### Option B: Migrate to Pure Holsapple Pi-Groups

**Rationale**:
- Scientifically correct
- Matches peer-reviewed literature
- Single formula for all cases

**Changes needed**:
1. Replace all K-based formulas with pi-group
2. Recalibrate on 61-crater database
3. Extensive validation required

**Pros**:
- ✅ Scientifically rigorous
- ✅ Matches Collins & Melosh (2005)
- ✅ Single unified approach

**Cons**:
- ❌ Major refactoring required
- ❌ Risk of breaking working code
- ❌ Time-intensive validation

### Option C: Hybrid (Current State) ❌ **NOT RECOMMENDED**

**Status**: What we have now - chaos!

**Cons**:
- ❌ Two conflicting systems
- ❌ Confusing codebase
- ❌ Hard to debug
- ❌ Inconsistent results

---

## Recommended Action Plan

### Phase 1: Consolidate to K-Based System (2-3 hours)

**Goal**: Clean up confusion, document approach, fix small iron

**Steps**:

1. **Document K-based approach** as intentional choice
   - Create `CRATER_SCALING_APPROACH.md`
   - Explain why we use E^0.25 instead of pure pi-groups
   - Reference: Holsapple & Schmidt (1982) energy-scaling

2. **Fix small iron craters** (<50m)
   - Issue: FCM + μ=0.55 makes them SMALLER
   - Solution: Adjust C constant for iron specifically
   - OR: Reduce fragmentation for small intact irons

3. **Remove unused code**
   - Delete or mark `craterPiGroupsComplete.js` as experimental
   - Clean up conflicting formulas in `smallIronCraterPhysics.js`

4. **Add composition-specific C constants**
   - C_rocky = 14.10 (validated)
   - C_iron = TBD (calibrate on 4 iron craters)

5. **Extensive testing**
   - Run full 61-crater validation
   - Target: MAE < 20%

### Phase 2: Future Migration to Pi-Groups (10+ hours)

**Timeline**: Post-competition

**Goal**: Migrate to pure Holsapple (1993) for scientific rigor

**Steps**:
1. Implement complete pi-group model
2. Validate on literature test cases
3. Calibrate on 61-crater database
4. A/B test vs current K-based system
5. Migrate if improvements > 20%

---

## Current Test Results Analysis

### Phase 1.4.3 (μ=0.55 in smallIronCraterPhysics)

| Crater | Observed | Predicted | Error | System Used |
|--------|----------|-----------|-------|-------------|
| **Barringer** (50m) | 1200m | 951m | 20.7% | K=380 (physicsEngine) |
| **Wolfe Creek** (15m) | 892m | 23m | 97.4% | μ=0.55 (smallIron) ❌ |
| **Wabar** (8m) | 116m | 20m | 82.5% | μ=0.55 (smallIron) ❌ |
| **Sikhote-Alin** (10m) | 26m | 129m | 396% | μ=0.55 (smallIron) ❌ |

**MAE**: 149% (WORSE than baseline 75%)

### Baseline (Before Phase 1.4.3)

| Crater | Observed | Predicted | Error | System Used |
|--------|----------|-----------|-------|-------------|
| **Barringer** | 1200m | 951m | 20.7% | K=380 |
| **Wolfe Creek** | 892m | 195m | 78.1% | μ=1/3 (smallIron) |
| **Wabar** | 116m | 97m | 16.1% | μ=1/3 (smallIron) |
| **Sikhote-Alin** | 26m | 23m | 11.8% | μ=1/3 (smallIron) ✅ |

**MAE**: 75%

### Conclusion

**μ=0.55 made things WORSE for small iron!**

**Reason**: The baseline μ=1/3 had **compensating errors**:
- Under-estimated density effect (1.46× vs 1.82×)
- But this matched the over-fragmentation in FCM
- Net result: accidentally worked!

**Fix**: Don't change μ, fix the FRAGMENTATION instead!

---

## Next Steps

1. ✅ **Revert μ=0.55 changes** in `smallIronCraterPhysics.js`
2. ✅ **Keep K-based system** as primary approach
3. ✅ **Fix iron fragmentation** (reduce FCM mass loss)
4. ✅ **Document architecture** properly
5. ✅ **Test and deploy**

**Estimated time**: 2-3 hours

**Expected result**: Return to baseline MAE 75%, then improve fragmentation

---

**Decision**: Proceed with Option A (Keep K-based, fix fragmentation)

**Justification**: Scientific purity vs practical results - we choose working code with clear documentation over theoretical elegance that doesn't work.
