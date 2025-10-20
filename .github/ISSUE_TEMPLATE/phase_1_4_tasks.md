---
name: Phase 1.4 - Crater Precision Tasks
about: Technical tasks for improving MAE from 32% to <20%
title: '[PHASE 1.4] '
labels: enhancement, priority-high, phase-1.4
assignees: ''
---

# Phase 1.4: Crater Precision Improvement

**External Expert Feedback**: Crater calculations identified as MAE bottleneck
**Target**: Improve MAE from 32% to <20%

---

## 🎯 Axis 1: Kinetic Energy & Thermal Effects

### Task 1.1: Energy Coupling Efficiency ⏳
**Priority**: HIGH | **Time**: 4h | **Complexity**: LOW

**Objective**: Implement angle and velocity-dependent energy coupling

**Files to Create**:
- [ ] `api/src/services/energyCoupling.js`

**Implementation**:
```javascript
function calculateCouplingEfficiency(impactAngle, velocity, composition) {
  // Pierazzo & Melosh (2000) - Figure 4
  // η = 0.85 × sin^0.8(θ) × velocity_factor
}
```

**Tests**:
- [ ] Vertical impact (90°): η ≈ 0.85
- [ ] 45° impact: η ≈ 0.65
- [ ] 30° grazing: η ≈ 0.35
- [ ] Validation vs Pierazzo & Melosh (2000) Figure 4

**References**:
- Pierazzo & Melosh (2000): "Hydrocode modeling of oblique impacts"
- Collins et al. (2004): Earth Impact Effects Program

**Expected MAE Impact**: -3 to -5%

---

### Task 1.2: Complete Energy Budget ⏳
**Priority**: HIGH | **Time**: 6h | **Complexity**: MEDIUM

**Objective**: Account for thermal, rotational, and deformation energy

**Files to Create**:
- [ ] `api/src/services/energyBudget.js`

**Components**:
- [ ] E_kinetic: ½mv² (existing)
- [ ] E_rotational: ½Iω² (estimate from tumbling)
- [ ] E_deformation: Work against yield strength
- [ ] E_thermal: Aerodynamic heating (basic estimate)

**Formula**:
```javascript
E_total = E_kinetic + E_rotational + E_deformation
E_crater = E_total × η_coupling(angle)
```

**Validation**:
- [ ] Total energy > kinetic energy (sanity check)
- [ ] Rotational <10% of total (typical)
- [ ] Deformation <5% of total (unless fragmentation)

**Expected MAE Impact**: -5 to -8%

---

### Task 1.3: Thermal Energy from Atmospheric Entry ⏳
**Priority**: MEDIUM | **Time**: 10h | **Complexity**: HIGH

**Objective**: Calculate ablation mass loss and effective impact mass

**Files to Modify**:
- [ ] `api/src/services/atmosphericTrajectory.js`

**Implementation**:
```javascript
// Stagnation heating
Q_stagnation = 0.5 × ρ_air × v³ × A × Δt

// Mass loss from ablation
Δm = Q_stagnation / L_vaporization

// Effective crater mass
m_effective = m_initial - Δm
```

**Integration**:
- [ ] Link with FCM V2 atmospheric trajectory
- [ ] Calculate heat flux at each altitude step
- [ ] Update final impact mass for crater calculation

**Validation**:
- [ ] Small asteroids (<10m): >50% ablation
- [ ] Medium (10-100m): 10-30% ablation
- [ ] Large (>100m): <10% ablation

**References**:
- Wheeler et al. (2017): FCM V2 Section 2.3
- ReVelle (2005): Entry and explosion of meteoroids

**Expected MAE Impact**: -2 to -4%

---

## 🎯 Axis 2: Rankine-Hugoniot Shock Equations

### Task 2.1: Rankine-Hugoniot Module ⏳
**Priority**: HIGH | **Time**: 8h | **Complexity**: MEDIUM

**Objective**: Replace empirical blast scaling with physics-based shocks

**Files to Create**:
- [ ] `api/src/services/rankineHugoniot.js`

**Functions to Implement**:
```javascript
// Jump conditions across shock
function shockJumpConditions(P1, rho1, u1, gamma) {
  // Returns: { P2, rho2, u2, shock_velocity }
}

// Overpressure from energy release
function strongShockOverpressure(energy_J, distance_m, altitude_m) {
  // Uses R-H equations
}

// Shock velocity
function shockVelocity(overpressure, rho_ambient) {
  // U_s = sqrt[(P2-P1)/(rho1-rho2)]
}
```

**Equations**:
- [ ] Conservation of mass: ρ₁u₁ = ρ₂u₂
- [ ] Conservation of momentum: P₁ + ρ₁u₁² = P₂ + ρ₂u₂²
- [ ] Conservation of energy: h₁ + ½u₁² = h₂ + ½u₂²
- [ ] Strong shock limit: ρ₂/ρ₁ = (γ+1)/(γ-1) = 6

**Validation**:
- [ ] Compare with nuclear test data (Trinity, Hiroshima)
- [ ] Verify against Glasstone & Dolan (1977) charts

**References**:
- Zel'dovich & Raizer (1966): "Physics of Shock Waves"
- Landau & Lifshitz (1987): "Fluid Mechanics" Chapter IX

**Expected MAE Impact**: -2 to -3% (blast zones)

---

### Task 2.2: Integration with Blast Calculation ⏳
**Priority**: HIGH | **Time**: 6h | **Complexity**: MEDIUM

**Objective**: Replace empirical Collins scaling with R-H physics

**Files to Modify**:
- [ ] `api/src/services/physicsEngine.js`

**Changes**:
```javascript
// OLD (empirical)
const overpressure = 3.14e11 * Math.pow(energy_MT / distance_km^3, 1.3);

// NEW (Rankine-Hugoniot)
const overpressure = strongShockOverpressure(
  energy_J,
  distance_m,
  altitude_m // for ambient conditions
);
```

**Add**:
- [ ] Altitude-dependent ambient pressure
- [ ] Altitude-dependent ambient density
- [ ] Temperature effects on shock speed

**Compatibility**:
- [ ] Ensure backward compatibility option (flag for old vs new)
- [ ] A/B testing mode

---

### Task 2.3: Validation Suite ⏳
**Priority**: HIGH | **Time**: 6h | **Complexity**: LOW

**Objective**: Validate R-H against known explosions

**Files to Create**:
- [ ] `api/src/tests/validateRankineHugoniot.js`

**Test Cases**:
1. **Tunguska (1908)**:
   - Energy: 15 MT
   - Altitude: 8 km
   - Expected blast radius: ~40 km (tree fall)
   - Target MAE: <10%

2. **Chelyabinsk (2013)**:
   - Energy: 0.5 MT
   - Altitude: 23.3 km
   - Expected: Lower overpressures (high altitude)
   - Target MAE: <15%

3. **Trinity Test (1945)**:
   - Energy: 22 kt
   - Altitude: Ground level
   - Documented overpressures vs distance
   - Target MAE: <8%

4. **Hiroshima (1945)**:
   - Energy: 15 kt
   - Altitude: 600 m
   - Well-documented damage zones
   - Target MAE: <10%

**Success Criteria**:
- [ ] All 4 cases within target MAE
- [ ] No regression on Tunguska (must stay <10%)

---

## 🎯 Axis 3: Atmospheric Density Stratification

### Task 3.1: USSA 1976 Atmosphere Module ⏳
**Priority**: HIGH | **Time**: 8h | **Complexity**: MEDIUM

**Objective**: Replace single-exponential with multi-layer USSA 1976

**Files to Create**:
- [ ] `api/src/services/atmosphere/ussa1976.js`

**Class Structure**:
```javascript
class USStandardAtmosphere {
  constructor() {
    this.layers = [
      { h_base: 0,     h_top: 11000,  T_base: 288.15, lapse: -0.0065 },
      { h_base: 11000, h_top: 25000,  T_base: 216.65, lapse: 0.0 },
      { h_base: 25000, h_top: 47000,  T_base: 216.65, lapse: 0.0028 },
      { h_base: 47000, h_top: 53000,  T_base: 282.66, lapse: 0.0 },
      { h_base: 53000, h_top: 79000,  T_base: 282.66, lapse: -0.0045 },
      { h_base: 79000, h_top: 90000,  T_base: 165.66, lapse: 0.0 },
      { h_base: 90000, h_top: 150000, T_base: 165.66, lapse: 0.004 }
    ];
  }

  getDensity(altitude_m) { /* ... */ }
  getPressure(altitude_m) { /* ... */ }
  getTemperature(altitude_m) { /* ... */ }
}
```

**Validation**:
- [ ] Compare with USSA 1976 official tables
- [ ] Test all 7 atmospheric layers
- [ ] Accuracy: <1% vs published values

**References**:
- U.S. Standard Atmosphere (1976): NOAA-S/T 76-1562

---

### Task 3.2: Atmospheric Path Length ⏳
**Priority**: HIGH | **Time**: 4h | **Complexity**: LOW

**Objective**: Calculate angle-dependent atmospheric path

**Files to Create**:
- [ ] `api/src/services/atmosphere/pathLength.js`

**Implementation**:
```javascript
function calculateAtmosphericPath(altitude_km, entry_angle_deg) {
  // Simple case: vertical
  if (angle >= 70) return altitude_km;

  // Oblique: geometric
  const path = altitude_km / sin(angle);

  // Grazing (<30°): Chapman function
  if (angle < 30) {
    const X = (R_earth + altitude) / (R_earth * sin(angle));
    return path * sqrt(π * X / 2);
  }

  return path;
}
```

**Tests**:
- [ ] Vertical (90°): path = altitude
- [ ] 45°: path = altitude × √2
- [ ] 30°: path ≈ 2× altitude
- [ ] 15° grazing: path ≈ 4-5× altitude

**Expected Impact**: Oblique impacts will show more deceleration → smaller craters

---

### Task 3.3: FCM V2 Integration ⏳
**Priority**: HIGH | **Time**: 8h | **Complexity**: HIGH

**Objective**: Use USSA 1976 in fragmentation model

**Files to Modify**:
- [ ] `api/src/services/fragmentCloudModelV2.js`

**Changes**:
```javascript
// OLD
const rho_air = 1.225 * exp(-h/8500);

// NEW
const atmosphere = new USStandardAtmosphere();
const rho_air = atmosphere.getDensity(altitude_m);
const P_air = atmosphere.getPressure(altitude_m);
const T_air = atmosphere.getTemperature(altitude_m);
```

**Integration Points**:
- [ ] Ram pressure calculation: P_ram = 0.5 × ρ(h) × v²
- [ ] Fragmentation altitude (more accurate with real ρ profile)
- [ ] Deceleration force: F_drag ∝ ρ(h) × v²
- [ ] Path length: Use angle-dependent calculation

**Validation**:
- [ ] Chelyabinsk: Fragmentation at 23.3 km (real atmosphere)
- [ ] Compare old vs new atmospheric model
- [ ] Ensure energy conservation still <7%

---

### Task 3.4: Crater Model Update ⏳
**Priority**: MEDIUM | **Time**: 4h | **Complexity**: LOW

**Objective**: Use atmospheric-corrected velocity for crater

**Files to Modify**:
- [ ] `api/src/services/physicsEngine.js`

**Change**:
```javascript
// OLD: Use initial velocity
const E_kinetic = 0.5 * mass * v_initial^2;

// NEW: Use post-atmosphere velocity
const v_impact = calculateImpactVelocity(v_initial, angle, altitude, mass);
const E_kinetic = 0.5 * mass * v_impact^2;
```

**Effect**:
- Oblique impacts: v_impact < v_initial (more deceleration)
- Vertical impacts: v_impact ≈ v_initial (minimal change)
- Expected: 10-15% reduction in oblique crater predictions

---

## 📊 Validation & MAE Re-Evaluation

### Task 4.1: Expand Test Dataset ⏳
**Priority**: HIGH | **Time**: 4h

**Objective**: Add 10 new well-documented impact cases

**Focus Areas**:
- [ ] Oblique impacts (Ries, Wolfe Creek)
- [ ] High-velocity (Vredefort, Sudbury)
- [ ] Small irons (Campo del Cielo, Henbury)
- [ ] Airbursts (add 3 more nuclear tests)

**Files to Update**:
- [ ] `api/src/data/earthCraterDatabase.js`
- [ ] `api/src/data/documentedImpacts.js`

---

### Task 4.2: Run Complete Validation ⏳
**Priority**: HIGH | **Time**: 4h

**Objective**: Calculate MAE on 30 craters + 10 airbursts

**Tests to Run**:
- [ ] All crater predictions (30 cases)
- [ ] All airburst predictions (10 cases)
- [ ] Component-wise MAE (crater, blast, velocity)
- [ ] Regime-wise MAE (iron vs stone, vertical vs oblique)

**Files to Create**:
- [ ] `api/src/tests/validatePhase1_4_Complete.js`

---

### Task 4.3: MAE Comparison Report ⏳
**Priority**: HIGH | **Time**: 4h

**Objective**: Document improvements and regressions

**Report Sections**:
- [ ] Overall MAE: Before (32%) vs After (target <20%)
- [ ] Component breakdown (crater, blast, velocity)
- [ ] Regime breakdown (oblique, high-v, small, airburst)
- [ ] Regression analysis (Tunguska, Barringer, Chicxulub)
- [ ] Recommendations for Phase 1.5 (if needed)

**Files to Create**:
- [ ] `docs/technical/PHASE_1_4_MAE_REPORT.md`

---

## ✅ Success Criteria

**Minimum Viable**:
- [ ] Global MAE < 25% (improvement from 32%)
- [ ] Crater MAE < 18%
- [ ] No regressions on key validation cases
- [ ] All three axes implemented and tested

**Target**:
- [ ] Global MAE < 20% ⭐
- [ ] Crater MAE < 15%
- [ ] Sikhote-Alin within ±30% (currently ±60%)
- [ ] Oblique impacts improved ≥10%

**Stretch**:
- [ ] Global MAE < 18%
- [ ] R-H shock model <5% vs nuclear data
- [ ] Atmospheric model <1% vs USSA 1976
- [ ] Publication-ready accuracy

---

## 📅 Timeline

**Sprint 1.4.1** (Week 1): Axis 1 - Energy & Coupling
- [ ] Task 1.1: Energy coupling (4h)
- [ ] Task 1.2: Energy budget (6h)
- [ ] Task 1.3: Thermal energy (10h)
- **Total**: 20 hours

**Sprint 1.4.2** (Week 2): Axis 2 - Rankine-Hugoniot
- [ ] Task 2.1: R-H module (8h)
- [ ] Task 2.2: Integration (6h)
- [ ] Task 2.3: Validation (6h)
- **Total**: 20 hours

**Sprint 1.4.3** (Week 3): Axis 3 - Atmosphere
- [ ] Task 3.1: USSA 1976 (8h)
- [ ] Task 3.2: Path length (4h)
- [ ] Task 3.3: FCM V2 integration (8h)
- [ ] Task 3.4: Crater update (4h)
- **Total**: 24 hours

**Sprint 1.4.4** (Week 4): Validation
- [ ] Task 4.1: Expand dataset (4h)
- [ ] Task 4.2: Run validation (4h)
- [ ] Task 4.3: MAE report (4h)
- **Total**: 12 hours

**Grand Total**: 76 hours (~2-3 weeks full-time, ~4-6 weeks part-time)

---

## 📚 References

**Must Read**:
- [ ] Melosh (1989): "Impact Cratering" Chapters 3-5
- [ ] Collins et al. (2005): Earth Impact Effects Program
- [ ] Pierazzo & Melosh (2000): Oblique impacts
- [ ] USSA 1976: Standard Atmosphere

**Recommended**:
- [ ] Zel'dovich & Raizer (1966): Shock wave physics
- [ ] Wheeler et al. (2017): FCM V2 (already have)
- [ ] Holsapple (1993): Pi-group scaling (already have)

---

**Priority**: 🔴 HIGH
**Based On**: External expert analysis feedback
**Expected Outcome**: MAE 32% → <20%
