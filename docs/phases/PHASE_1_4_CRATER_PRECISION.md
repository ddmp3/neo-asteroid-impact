# Phase 1.4 - Crater Precision Improvement

**Date Created**: October 19, 2025
**Status**: 🔴 **PRIORITY** - External Expert Analysis
**Goal**: Improve MAE from 32% to <20% by addressing crater calculation weaknesses

---

## 📋 Executive Summary

**External Feedback Received**: Deep technical analysis identified crater calculations as primary MAE contributor.

**Current State**:
- Global MAE: 32%
- Crater MAE: 16-25% (varies by regime)
- Target: <20% global MAE

**Root Cause Analysis**:
The crater formation model is our weakest link. While blast zones achieve ±8% accuracy (Tunguska), crater predictions show higher variance, particularly for:
- Small iron meteorites (Sikhote-Alin: 1.8-10.7m vs 26m observed)
- Oblique impacts (angle effects)
- High-velocity impacts (>25 km/s)

---

## 🎯 Three Priority Axes

### Axis 1: Kinetic Energy & Thermal Effects
**Current Limitation**: Simplified energy conversion model
**Target**: Scientific reference formulas

### Axis 2: Shock Wave Modeling (Rankine-Hugoniot)
**Current Limitation**: Empirical blast scaling
**Target**: Physics-based shock equations

### Axis 3: Atmospheric Density Stratification
**Current Limitation**: Single-layer atmosphere approximation
**Target**: Multi-layer density model with angle dependency

---

## 📊 Current Implementation Analysis

### What We Have (Baseline)

**Energy Calculation** (Current):
```javascript
// asteroid-impact-simulator/api/src/services/physicsEngine.js
const kineticEnergy = 0.5 * mass * velocity * velocity; // Joules
const energyMT = kineticEnergy / 4.184e15; // Megatons TNT
```

**Limitations**:
- ✅ Correct classical formula (½mv²)
- ❌ No thermal energy component
- ❌ No relativistic corrections (v > 0.1c)
- ❌ Assumes 100% energy coupling (unrealistic)

**Atmospheric Model** (Current):
```javascript
// FCM V2 uses simplified density
const rho_air = 1.225 * Math.exp(-altitude / 8500); // kg/m³
```

**Limitations**:
- ✅ Exponential approximation reasonable
- ❌ Single scale height (8.5 km) - reality varies by layer
- ❌ No temperature variation
- ❌ No angle-dependent path length

**Shock Wave** (Current):
```javascript
// Collins et al. (2005) empirical scaling
const overpressure = scaling_factor * (energy / distance^3);
```

**Limitations**:
- ✅ Works well for airbursts (±8% Tunguska)
- ❌ Empirical, not physics-based
- ❌ No Rankine-Hugoniot shock jump conditions

---

## 🔬 Axis 1: Kinetic Energy & Thermal Effects

### Scientific References to Implement

**1. Total Impact Energy**

**Current**:
```
E_kinetic = ½mv²
```

**Target** (Complete energy budget):
```
E_total = E_kinetic + E_thermal + E_rotational + E_deformation

Where:
- E_kinetic = ½mv² (classical)
- E_thermal = c_p × m × ΔT (aerodynamic heating)
- E_rotational = ½Iω² (spin energy)
- E_deformation = work done deforming impactor
```

**References**:
- **Melosh (1989)**: "Impact Cratering: A Geologic Process"
  - Chapter 3: Energy partitioning
  - Equation 3.2.4: Complete energy budget

- **Pierazzo & Melosh (2000)**: "Hydrocode modeling of oblique impacts"
  - Thermal energy from shock heating
  - Temperature-dependent equations of state

**Implementation Priority**: HIGH
**Complexity**: Medium
**Estimated Impact on MAE**: -5 to -8%

---

**2. Energy Coupling Efficiency**

**Current Assumption**:
```
η_coupling = 1.0 (100% energy goes to crater)
```

**Reality** (angle and velocity dependent):
```
η_coupling = f(θ, v, composition)

For vertical impacts: η ≈ 0.7-0.9
For oblique (45°): η ≈ 0.5-0.7
For grazing (<30°): η ≈ 0.2-0.4
```

**References**:
- **Pierazzo & Melosh (2000)**: Figure 4 - Coupling efficiency vs angle
- **Collins et al. (2004)**: "Earth Impact Effects Program"
  - Empirical η(θ) curve from hydrocode simulations

**Formula to Implement**:
```javascript
function energyCouplingEfficiency(impactAngle, velocity) {
  // Pierazzo & Melosh (2000) - Figure 4 fit
  const theta_rad = impactAngle * Math.PI / 180;
  const sin_theta = Math.sin(theta_rad);

  // Empirical fit (vertical = 0.85, 45° = 0.65, 30° = 0.35)
  const eta = 0.85 * Math.pow(sin_theta, 0.8);

  // Velocity correction (>20 km/s reduces efficiency)
  const v_factor = velocity > 20 ? 0.95 : 1.0;

  return eta * v_factor;
}
```

**Implementation Priority**: HIGH
**Complexity**: Low
**Estimated Impact on MAE**: -3 to -5%

---

**3. Thermal Energy from Atmospheric Entry**

**Current**: Not modeled

**Target** (Stagnation heating):
```
Q_stagnation = ½ρv³ × A_cross_section × t_entry

Where:
- ρ = atmospheric density (altitude-dependent)
- v = velocity (changes during entry)
- A = cross-sectional area
- t_entry = time in atmosphere
```

**References**:
- **Wheeler et al. (2017)**: FCM V2 - Section 2.3
  - Equations 7-9: Aerodynamic heating
  - Temperature rise: ΔT = Q / (m × c_p)

- **ReVelle (2005)**: "Entry and explosion of meteoroids"
  - Stagnation heating formulas
  - Ablation mass loss

**Impact on Crater**:
```
Mass loss from ablation: Δm = f(Q_thermal, L_vaporization)
Effective crater energy: E_crater = ½(m - Δm)v²
```

**Implementation Priority**: MEDIUM
**Complexity**: High (requires atmospheric trajectory integration)
**Estimated Impact on MAE**: -2 to -4%

---

### Implementation Plan - Axis 1

**Task 1.1**: Energy Coupling Efficiency
- File: `api/src/services/energyCoupling.js` (NEW)
- Function: `calculateCouplingEfficiency(angle, velocity, composition)`
- Tests: 10 oblique impact cases
- Validation: Pierazzo & Melosh (2000) Figure 4
- Time: 4 hours

**Task 1.2**: Complete Energy Budget
- File: `api/src/services/energyBudget.js` (NEW)
- Components:
  - Kinetic energy (existing)
  - Rotational energy (spin estimation)
  - Deformation energy (yield strength based)
- Time: 6 hours

**Task 1.3**: Thermal Energy Integration
- File: `api/src/services/atmosphericTrajectory.js` (EXTEND)
- Add: Stagnation heating calculation
- Add: Ablation mass loss
- Integrate: With FCM V2 fragmentation
- Time: 10 hours

**Total Axis 1**: 20 hours

---

## 🔬 Axis 2: Rankine-Hugoniot Shock Equations

### Current vs Target

**Current** (Empirical scaling):
```javascript
// Collins et al. (2005) - empirical fit
const overpressure_kPa = 3.14e11 * Math.pow(
  energy_MT / Math.pow(distance_km, 3),
  1.3
);
```

**Target** (Rankine-Hugoniot physics):

**Rankine-Hugoniot Jump Conditions**:
```
Conservation of mass:    ρ₁u₁ = ρ₂u₂
Conservation of momentum: P₁ + ρ₁u₁² = P₂ + ρ₂u₂²
Conservation of energy:   h₁ + ½u₁² = h₂ + ½u₂²

Where:
- ρ = density
- u = particle velocity
- P = pressure
- h = enthalpy
- Subscript 1 = pre-shock, 2 = post-shock
```

**Shock Speed**:
```
U_s = sqrt[(P₂ - P₁) / (ρ₁ - ρ₂)]
```

**Overpressure** (from shock jump):
```
ΔP = ρ₁ × U_s × u_p

Where:
- u_p = particle velocity behind shock
- U_s = shock velocity
```

---

### Scientific References

**1. Zel'dovich & Raizer (1966)**: "Physics of Shock Waves and High-Temperature Hydrodynamic Phenomena"
- Volume II, Chapter 1: Rankine-Hugoniot equations
- Section 1.5: Strong shock approximation

**2. Landau & Lifshitz (1987)**: "Fluid Mechanics"
- Chapter IX: Shock waves
- Equations 86.1-86.3: Jump conditions

**3. Glasstone & Dolan (1977)**: "The Effects of Nuclear Weapons"
- Chapter II: Blast wave physics
- Figure 2.11: Overpressure vs distance (validated)

**4. Kinney & Graham (1985)**: "Explosive Shocks in Air"
- Empirical validation of Rankine-Hugoniot
- Correction factors for non-ideal conditions

---

### Implementation Strategy

**Approach 1: Analytical Rankine-Hugoniot** (Recommended for Phase 1.4)

**Assumptions**:
- Ideal gas: P = ρRT
- Adiabatic process: γ = 1.4 (air)
- Spherical symmetry

**Strong Shock Limit** (Mach number >> 1):
```javascript
function strongShockOverpressure(energy_J, distance_m, altitude_m) {
  // Ambient conditions
  const rho_0 = atmosphericDensity(altitude_m);
  const P_0 = atmosphericPressure(altitude_m);
  const gamma = 1.4; // Air

  // Shock radius at distance
  const R_s = distance_m;

  // Energy per unit volume at shock front
  const E_vol = energy_J / (4/3 * Math.PI * Math.pow(R_s, 3));

  // Rankine-Hugoniot jump (strong shock limit)
  // ρ₂/ρ₁ = (γ+1)/(γ-1) = 6 for γ=1.4
  const density_ratio = (gamma + 1) / (gamma - 1);

  // Pressure jump (from R-H momentum equation)
  const overpressure = (2 / (gamma + 1)) * rho_0 * Math.pow(
    (2 * gamma * E_vol / rho_0),
    2/3
  );

  return overpressure; // Pascals
}
```

**Validation**:
- Test against Tunguska (15 MT @ 8 km altitude)
- Compare with Collins et al. (2005) empirical
- Expected: ±5% agreement for airbursts

---

**Approach 2: Sedov-Taylor Blast Wave** (Future - Phase 2)

For point-source explosion in uniform medium:
```
R(t) = ξ₀ × (E × t² / ρ₀)^(1/5)

Where:
- ξ₀ = similarity constant ≈ 1.0
- E = explosion energy
- t = time after detonation
- ρ₀ = ambient density
```

**Pressure Profile**:
```
P(r,t) = P₀ + ΔP(t) × f(r/R(t))

Where:
- f = similarity function (from Sedov solution)
- R(t) = shock radius at time t
```

**Complexity**: HIGH (requires numerical integration)
**Priority**: Phase 2 (current phase use analytical R-H)

---

### Implementation Plan - Axis 2

**Task 2.1**: Rankine-Hugoniot Module
- File: `api/src/services/rankineHugoniot.js` (NEW)
- Functions:
  - `shockJumpConditions(P1, rho1, u1, gamma)`
  - `strongShockOverpressure(energy, distance, altitude)`
  - `shockVelocity(overpressure, rho_ambient)`
- Tests: 5 nuclear explosion cases (known data)
- Time: 8 hours

**Task 2.2**: Integration with Blast Calculation
- File: `api/src/services/physicsEngine.js` (MODIFY)
- Replace: Empirical scaling → Rankine-Hugoniot
- Add: Altitude-dependent ambient conditions
- Validation: Tunguska, Chelyabinsk, nuclear tests
- Time: 6 hours

**Task 2.3**: Validation Suite
- File: `api/src/tests/validateRankineHugoniot.js` (NEW)
- Cases:
  - Tunguska (15 MT, 8 km altitude)
  - Chelyabinsk (0.5 MT, 23 km altitude)
  - Trinity test (22 kt, ground level)
  - Hiroshima (15 kt, 600m altitude)
- Expected MAE: <10% vs documented overpressures
- Time: 6 hours

**Total Axis 2**: 20 hours

---

## 🔬 Axis 3: Atmospheric Density Stratification

### Current vs Target

**Current** (Single exponential):
```javascript
const rho_air = 1.225 * Math.exp(-altitude / 8500); // kg/m³
```

**Problems**:
- Scale height H = 8.5 km is average only
- Reality: H varies from 6 km (troposphere) to 50+ km (thermosphere)
- No temperature variation
- No composition changes (O₂/N₂ ratio varies)

**Target** (USSA 1976 Standard Atmosphere):

Multi-layer model with temperature gradient:

**Layer 1 - Troposphere** (0-11 km):
```
T(h) = T₀ - L × h
ρ(h) = ρ₀ × (T(h)/T₀)^(g/(R×L) - 1)

Where:
- T₀ = 288.15 K (sea level)
- L = 0.0065 K/m (lapse rate)
- g = 9.81 m/s²
- R = 287 J/(kg·K) (gas constant for air)
```

**Layer 2 - Stratosphere** (11-25 km):
```
T(h) = 216.65 K (isothermal)
ρ(h) = ρ₁₁ × exp(-g(h-11000)/(R×T))
```

**Layer 3 - Stratosphere Upper** (25-47 km):
```
T(h) = 216.65 + 0.0028(h-25000)
ρ(h) = ... (similar temperature-dependent formula)
```

**And so on** up to 86 km (mesopause)

---

### Scientific References

**1. U.S. Standard Atmosphere (1976)**
- NOAA-S/T 76-1562
- Tables: Temperature, pressure, density vs altitude
- Analytical formulas for each atmospheric layer

**2. COSPAR International Reference Atmosphere (CIRA)**
- More recent than USSA 1976
- Includes seasonal variations
- Available: https://www.spaceweatherlive.com/

**3. Justus & Johnson (1999)**: "The NASA/MSFC Global Reference Atmospheric Model"
- Includes winds, turbulence
- Used for spacecraft entry modeling

**4. Trajectory Modeling**

**Angle-Dependent Path Length**:
```
path_length = altitude / sin(entry_angle)

For grazing entries (θ < 30°):
- Path through atmosphere 2-3× longer
- More deceleration
- More ablation
- Lower impact velocity → smaller crater
```

**Current Problem**:
We don't account for this! Oblique impacts assumed same atmospheric effects as vertical.

---

### Implementation Strategy

**Multi-Layer Atmosphere Class**:

```javascript
class USStandardAtmosphere {
  constructor() {
    // Define 7 atmospheric layers (USSA 1976)
    this.layers = [
      { h_base: 0,     h_top: 11000,  T_base: 288.15, lapse: -0.0065 },  // Troposphere
      { h_base: 11000, h_top: 25000,  T_base: 216.65, lapse: 0.0 },      // Lower Strat
      { h_base: 25000, h_top: 47000,  T_base: 216.65, lapse: 0.0028 },   // Upper Strat
      { h_base: 47000, h_top: 53000,  T_base: 282.66, lapse: 0.0 },      // Stratopause
      { h_base: 53000, h_top: 79000,  T_base: 282.66, lapse: -0.0045 },  // Mesosphere
      { h_base: 79000, h_top: 90000,  T_base: 165.66, lapse: 0.0 },      // Mesopause
      { h_base: 90000, h_top: 150000, T_base: 165.66, lapse: 0.004 }     // Thermosphere
    ];

    this.g = 9.80665;  // m/s² (standard gravity)
    this.R = 287.053;  // J/(kg·K) (gas constant for air)
  }

  getDensity(altitude_m) {
    const layer = this.getLayer(altitude_m);
    const T = this.getTemperature(altitude_m, layer);

    if (layer.lapse === 0) {
      // Isothermal layer
      const rho_base = this.getBaseDensity(layer.h_base);
      const exp_term = -this.g * (altitude_m - layer.h_base) / (this.R * T);
      return rho_base * Math.exp(exp_term);
    } else {
      // Gradient layer
      const T_base = layer.T_base;
      const rho_base = this.getBaseDensity(layer.h_base);
      const exp_power = (this.g / (this.R * layer.lapse)) + 1;
      return rho_base * Math.pow(T / T_base, -exp_power);
    }
  }

  getPressure(altitude_m) {
    const rho = this.getDensity(altitude_m);
    const T = this.getTemperature(altitude_m);
    return rho * this.R * T;
  }

  getTemperature(altitude_m, layer = null) {
    if (!layer) layer = this.getLayer(altitude_m);
    return layer.T_base + layer.lapse * (altitude_m - layer.h_base);
  }

  getLayer(altitude_m) {
    return this.layers.find(l =>
      altitude_m >= l.h_base && altitude_m < l.h_top
    ) || this.layers[this.layers.length - 1];
  }

  // Base density calculations (recursive from sea level)
  getBaseDensity(h_base) {
    if (h_base === 0) return 1.225; // kg/m³ at sea level
    // Calculate recursively from previous layer
    // ... implementation
  }
}
```

---

**Angle-Dependent Atmospheric Effects**:

```javascript
function atmosphericPathLength(altitude_km, entry_angle_deg) {
  const theta_rad = entry_angle_deg * Math.PI / 180;
  const sin_theta = Math.sin(theta_rad);

  // Vertical path
  if (entry_angle_deg >= 70) {
    return altitude_km;
  }

  // Oblique path (geometric)
  const path = altitude_km / sin_theta;

  // Atmospheric curvature correction (for grazing entries)
  const R_earth = 6371; // km
  if (entry_angle_deg < 30) {
    // Chapman function for curved atmosphere
    const X = (R_earth + altitude_km) / (R_earth * sin_theta);
    const chapman_correction = Math.sqrt(Math.PI * X / 2);
    return path * chapman_correction;
  }

  return path;
}
```

---

### Impact on Crater Calculations

**Velocity at Impact** (after atmospheric deceleration):

**Current**: Assumes minimal deceleration (high-altitude approximation)

**Target**:
```
v_impact = v_initial - Δv_atmospheric

Where Δv depends on:
- Path length (angle-dependent)
- Atmospheric density (altitude profile)
- Drag coefficient (shape, tumbling)
- Fragmentation (increases drag dramatically)
```

**For oblique impacts** (θ < 45°):
- Longer atmospheric path → more deceleration
- Lower v_impact → less kinetic energy
- Smaller crater (but elongated shape)

**Effect on MAE**:
Current model over-predicts oblique impact craters by ~15-25% because it doesn't account for atmospheric path length.

---

### Implementation Plan - Axis 3

**Task 3.1**: USSA 1976 Atmosphere Module
- File: `api/src/services/atmosphere/ussa1976.js` (NEW)
- Class: `USStandardAtmosphere`
- Methods: `getDensity()`, `getPressure()`, `getTemperature()`
- Validation: Compare with USSA 1976 tables
- Time: 8 hours

**Task 3.2**: Atmospheric Path Length
- File: `api/src/services/atmosphere/pathLength.js` (NEW)
- Function: `calculateAtmosphericPath(altitude, angle)`
- Include: Chapman function for grazing entries
- Tests: 10 angle cases (0° to 90°)
- Time: 4 hours

**Task 3.3**: Integration with FCM V2
- File: `api/src/services/fragmentCloudModelV2.js` (MODIFY)
- Replace: Simple exponential → USSA 1976
- Add: Path length calculation
- Add: Deceleration integration along path
- Impact: More realistic v_impact for oblique entries
- Time: 8 hours

**Task 3.4**: Crater Model Update
- File: `api/src/services/physicsEngine.js` (MODIFY)
- Input: v_impact (from atmospheric trajectory)
- Instead of: v_initial
- Oblique angle correction: Already in Holsapple sin^(1/3)(θ)
- Time: 4 hours

**Total Axis 3**: 24 hours

---

## 📊 Validation & MAE Re-Evaluation

### Validation Strategy

**Test Suite Expansion**:

**Current**: 20 documented craters
**Add for Phase 1.4**: 10 additional well-documented cases

**Focus on edge cases**:
1. **Oblique impacts**:
   - Ries (Germany): θ ≈ 30-45°
   - Wolfe Creek (Australia): θ ≈ 45°

2. **High-velocity**:
   - Vredefort (South Africa): v ≈ 40-60 km/s
   - Sudbury (Canada): v ≈ 30-50 km/s

3. **Small irons** (our current weak point):
   - Sikhote-Alin: 26m observed
   - Campo del Cielo: Multiple small craters
   - Henbury: 12 craters, 5-180m

4. **Airbursts** (high altitude):
   - Chelyabinsk: 23.3 km (currently under-predicts)
   - Tunguska: 8 km (our baseline, ±8%)

---

### MAE Calculation Methodology

**Before Phase 1.4** (Baseline):
```javascript
function calculateMAE(predictions, observations) {
  const errors = predictions.map((pred, i) =>
    Math.abs(pred - observations[i]) / observations[i]
  );
  return errors.reduce((a,b) => a+b) / errors.length;
}

// Current results:
// Global MAE: 32%
// Crater MAE: 16-25%
// Blast MAE: 8-12%
```

**After Phase 1.4** (Re-evaluation):

Run complete test suite on:
- 30 craters (20 existing + 10 new)
- 10 airbursts (Tunguska, Chelyabinsk, + 8 nuclear tests)

**Expected Improvements**:

| Component | Current MAE | Expected After 1.4 | Improvement |
|-----------|-------------|-------------------|-------------|
| **Crater diameter** | 16-25% | 10-15% | -6 to -10% |
| **Blast overpressure** | 8-12% | 6-10% | -2% |
| **Impact velocity** | 10-15% | 5-8% | -5 to -7% |
| **Energy coupling** | N/A (100%) | 15-20% variance | New metric |
| **Global MAE** | **32%** | **18-22%** | **-10 to -14%** |

**Target Achievement**: ✅ <20% MAE if all three axes successful

---

### Regression Testing

**Critical**: Ensure improvements don't break existing accuracy

**Test cases that MUST NOT regress**:
1. **Tunguska**: ±8% blast zones (our best validation)
2. **Barringer**: ±25% crater (acceptable for ancient crater)
3. **Chicxulub**: ±24% crater (excellent for 66 Ma impact)

**Regression Thresholds**:
- Tunguska: MAE must stay <10%
- Barringer: MAE must stay <30%
- Chicxulub: MAE must stay <30%

**If regression detected**:
→ Review implementation
→ Possibly hybrid approach (new physics for some cases, old for others)
→ Document trade-offs

---

## 📅 Implementation Timeline

### Sprint 1.4.1: Energy & Coupling (Week 1)
**Duration**: 20 hours
- Task 1.1: Energy coupling efficiency (4h)
- Task 1.2: Complete energy budget (6h)
- Task 1.3: Thermal energy integration (10h)
- **Deliverable**: `energyCoupling.js`, `energyBudget.js`

### Sprint 1.4.2: Rankine-Hugoniot Shocks (Week 2)
**Duration**: 20 hours
- Task 2.1: R-H module (8h)
- Task 2.2: Integration with blast (6h)
- Task 2.3: Validation suite (6h)
- **Deliverable**: `rankineHugoniot.js`, validated blast model

### Sprint 1.4.3: Atmospheric Modeling (Week 3)
**Duration**: 24 hours
- Task 3.1: USSA 1976 atmosphere (8h)
- Task 3.2: Path length calculations (4h)
- Task 3.3: FCM V2 integration (8h)
- Task 3.4: Crater model update (4h)
- **Deliverable**: `atmosphere/ussa1976.js`, improved trajectories

### Sprint 1.4.4: Validation & MAE Evaluation (Week 4)
**Duration**: 16 hours
- Expand test dataset: 20 → 30 cases (4h)
- Run complete validation suite (4h)
- Calculate new MAE across all metrics (2h)
- Document improvements/regressions (4h)
- Create comparison report (2h)
- **Deliverable**: MAE Report, regression analysis

**Total Phase 1.4**: 80 hours (~2-3 weeks full-time, ~4-6 weeks part-time)

---

## 🎯 Success Criteria

### Minimum Viable Improvement
- ✅ Global MAE < 25% (from 32%)
- ✅ Crater MAE < 18% (from 16-25%)
- ✅ No regressions on Tunguska/Barringer/Chicxulub
- ✅ All three axes implemented

### Target Achievement
- 🎯 Global MAE < 20%
- 🎯 Crater MAE < 15%
- 🎯 Sikhote-Alin prediction within ±30% (currently ±60%)
- 🎯 Oblique impacts improved by ≥10%

### Stretch Goals
- 🌟 Global MAE < 18%
- 🌟 Physical shock model validated to <5% vs nuclear tests
- 🌟 Atmospheric model matches ISA/USSA 1976 to <1%
- 🌟 Publication-ready accuracy

---

## 📚 References to Study

### Priority 1 (Must Read)
1. **Melosh (1989)**: "Impact Cratering" - Chapters 3-5
2. **Collins et al. (2005)**: "Earth Impact Effects Program"
3. **Wheeler et al. (2017)**: FCM V2 paper
4. **USSA 1976**: Standard Atmosphere tables

### Priority 2 (Recommended)
5. **Pierazzo & Melosh (2000)**: Oblique impacts
6. **Zel'dovich & Raizer (1966)**: Shock wave physics
7. **Holsapple (1993)**: Pi-group scaling (already have)

### Priority 3 (Advanced)
8. **Sedov (1959)**: Similarity and Dimensional Methods
9. **Taylor (1950)**: "The formation of a blast wave"
10. **Rankine (1870)**, **Hugoniot (1889)**: Original papers

---

## 🔄 Next Steps

**Immediate Actions**:
1. ✅ Create this Phase 1.4 plan
2. ⏳ Review external analysis feedback (get full report if available)
3. ⏳ Literature review: Melosh, Pierazzo, Zel'dovich
4. ⏳ Set up new test files structure
5. ⏳ Begin Axis 1 implementation (energy coupling - easiest first)

**Communication**:
- Document each axis completion in separate commits
- Create MAE comparison charts (before/after)
- Update CHANGELOG.md with Phase 1.4 progress
- Report back to external analyst with improvements

---

**Status**: 🟡 READY TO START
**Priority**: 🔴 HIGH (External expert feedback)
**Expected Outcome**: MAE 32% → <20%

---

**Created**: October 19, 2025
**Last Updated**: October 19, 2025
**Next Review**: After each sprint completion
