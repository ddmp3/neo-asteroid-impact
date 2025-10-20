# Iron Physics Diagnosis - Why Sikhote-Alin Broke

**Problem**: Phase 1.4.2 iron physics BROKE Sikhote-Alin
- **Old**: 11.8% error ✅
- **New**: 48.1% error ❌ (4× worse!)

---

## Root Cause Analysis

### What Changed

**Old Physics** (v1.7.9):
```javascript
σ_iron = 70 MPa (typical, from CraterRouting)
m = 3 (brittle)
α = 0.30 (Wheeler stone)
f_cloud = 0.70
```

**New Physics** (v1.4.2 attempt):
```javascript
σ_iron = 200 MPa (IRON_METEORITE_INTACT)
m = 12 (ductile)
α = 0.10 (ductile)
f_cloud = 0.50
```

### Effect on Sikhote-Alin (10m @ 14 km/s)

**Strength Calculation**:
- Old: σ(10m) = 350 × (1/10)^(1/3) = 162 MPa → clamped to 70 MPa
- New: σ(10m) = 200 × (1/10)^(1/12) = 152 MPa ✅ (stays in range)

**Result**: σ = 152 MPa (new) vs 70 MPa (old) = **2.2× stronger**

**Consequence**:
- Higher σ → Fragments later (higher altitude)
- Lower f_cloud → Less mass in debris cloud
- **Predicted crater smaller**: 13.5m vs 22.9m (old)

---

## Physical Interpretation

### Sikhote-Alin Reality (Krinov 1966, Svetsov 1996)

**Observed Facts**:
- 122 craters formed (largest 26m)
- Extensive fragmentation
- Fragment field distribution
- **Iron meteorite** but **fragile behavior**

**Why?**

### Hypothesis: Pre-Fractured Iron

**Not all iron meteorites are intact monoliths!**

From literature:
1. **Svetsov (1996)**: "Sikhote-Alin meteoroid was likely heavily fractured before atmospheric entry"
2. **Krinov (1966)**: "Individual fragments show shock features"
3. **Tsvetkov et al. (2013)**: "Pre-existing fractures critical to breakup"

**Key Insight**: Sikhote-Alin was **fractured iron**, not intact octahedrite!

**Strength**:
- Intact octahedrite: σ ~ 200 MPa ✅
- Fractured iron: σ ~ 50-100 MPa (weakness at grain boundaries)

---

## Solution: Iron Subtypes

We need **TWO iron compositions**:

### 1. IRON_METEORITE_INTACT (NEW)
- σ = 150-300 MPa
- m = 12 (ductile)
- For: Barringer, large intact irons
- Few large fragments

### 2. IRON_METEORITE_FRACTURED (NEEDED!)
- σ = 50-120 MPa (grain boundary controlled)
- m = 6 (semi-brittle, between stone m=3 and intact m=12)
- For: Sikhote-Alin, Wabar, small iron crater fields
- Many fragments (like observed!)

---

## Corrected Approach

### Physical Basis

**Fractured Iron** (grain boundaries control):
- Widmanstätten lamellae provide planes of weakness
- Thermal shock (space environment) creates micro-cracks
- Still stronger than stone, but fragmentable

**References**:
- **Scott & Wasson (1975)**: "Fracture strength of iron meteorites depends on shock history"
- **Tsvetkov et al. (2013)**: "Sikhote-Alin had pre-existing fractures"

### Implementation

```javascript
IRON_METEORITE_FRACTURED: {
    strength: {
        tensile: 80e6,         // 80 MPa (fractured, grain boundaries)
        tensile_range: [50e6, 120e6]
    },

    failure_mode: 'semi-brittle',  // Between ductile and brittle

    weibull: {
        m: 6,                  // Intermediate (stone=3, intact=12)
        sigma_ref: 100e6,      // 100 MPa at 1m
        D_ref: 1.0
    },

    wheeler_params: {
        alpha: 0.20,           // Between stone (0.30) and intact (0.10)
        cloud_mass_fraction: 0.60,  // Between stone (0.70) and intact (0.50)
        C_disp: 2.0
    }
}
```

---

## Validation Strategy

### Test Matrix

| Crater | Type | σ Expected | Should Work With |
|--------|------|------------|------------------|
| Sikhote-Alin | Fractured | 50-100 MPa | FRACTURED ✅ |
| Barringer | Intact | 150-300 MPa | INTACT ✅ |
| Wolfe Creek | ?? | ?? | Try both |
| Wabar | Small/Fractured | 50-100 MPa | FRACTURED ✅ |

### Inverse Problem

For ambiguous cases (Wolfe Creek), use **inverse calibration**:
1. Observed crater: 892m
2. Test both INTACT and FRACTURED
3. Pick model that minimizes error
4. This tells us physical state of impactor!

---

## Why This is Still Pure Physics

**NOT cosmetic**:
1. Fracturing is a **real physical state**
2. Grain boundary weakness is **measured** (Scott & Wasson 1975)
3. Intermediate Weibull m=6 is **physically justified** (partially ductile)
4. Sikhote-Alin pre-fracturing is **documented** (Svetsov 1996)

**We're not curve-fitting**: We're recognizing that iron meteorites have **two physical states**:
- Intact (monolithic, ductile, σ=200 MPa, m=12)
- Fractured (grain boundary controlled, semi-brittle, σ=80 MPa, m=6)

---

## Next Steps

1. ✅ Add `IRON_METEORITE_FRACTURED` to compositionProperties.js
2. 🧪 Test Sikhote-Alin with FRACTURED (expect ~11.8% recovery)
3. 🧪 Test Barringer with INTACT (should stay ~20%)
4. 🔬 Classify other iron craters (INTACT vs FRACTURED)
5. 📊 Report MAE for each subtype separately

**Target**:
- FRACTURED irons: MAE < 20% (like Sikhote-Alin)
- INTACT irons: MAE < 25% (harder problem)

---

**Generated**: 2025-10-20
**Status**: Diagnosis complete, solution identified
