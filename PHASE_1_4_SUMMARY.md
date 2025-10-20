# 🎯 Phase 1.4 - Quick Reference

**Status**: 📋 **PLANNED** - Ready to implement
**Priority**: 🔴 **HIGH** - External expert feedback
**Duration**: 76 hours (~4-6 weeks part-time)

---

## 🎪 The Big Picture

```
Current MAE: 32%  →  Target MAE: <20%  →  Expected: 18-22%
        ↓                    ↓                     ↓
  Not ideal         Competition       Publication
                      ready            quality
```

**Problem Identified**: Crater calculations are our weak point
**Solution**: 3 scientific improvements based on expert analysis

---

## 🔬 Three Axes of Improvement

### 1️⃣ Energy & Thermal Effects (20h)
**What's wrong**: We assume 100% energy goes to crater
**Reality**: Depends on angle, velocity, and thermal losses

**Improvements**:
- ✅ Energy coupling: η(θ,v) = 0.35 to 0.85
- ✅ Thermal ablation: Mass loss during atmospheric entry
- ✅ Complete budget: Kinetic + thermal + rotational

**Expected**: -5 to -8% MAE improvement

---

### 2️⃣ Rankine-Hugoniot Shocks (20h)
**What's wrong**: Empirical blast scaling (works, but not physics)
**Reality**: Shock waves follow conservation laws

**Improvements**:
- ✅ R-H jump conditions (mass, momentum, energy)
- ✅ Physics-based overpressure calculation
- ✅ Validated vs nuclear test data

**Expected**: -2 to -3% MAE improvement

---

### 3️⃣ Atmospheric Stratification (24h)
**What's wrong**: Single exponential atmosphere (too simple)
**Reality**: 7 layers with different properties

**Improvements**:
- ✅ USSA 1976 standard atmosphere (7 layers)
- ✅ Angle-dependent path length (oblique impacts)
- ✅ Chapman function (grazing entries)

**Expected**: -3 to -5% MAE improvement

---

## 📊 Expected Results

### Before Phase 1.4:
| Metric | Current | Problem |
|--------|---------|---------|
| **Global MAE** | 32% | Too high |
| **Crater MAE** | 16-25% | Varies too much |
| **Sikhote-Alin** | 1.8-10.7m vs 26m | Off by 60%+ |
| **Oblique impacts** | Over-predicted | No path length |

### After Phase 1.4:
| Metric | Target | Improvement |
|--------|--------|-------------|
| **Global MAE** | 18-22% | ✅ <20% goal |
| **Crater MAE** | 10-15% | -6 to -10% |
| **Sikhote-Alin** | Within ±30% | Usable |
| **Oblique impacts** | ≥10% better | Realistic |

---

## 📅 4-Week Sprint Plan

```
WEEK 1: Energy & Coupling
├─ Task 1.1: Energy coupling (4h) ⭐ Start here
├─ Task 1.2: Energy budget (6h)
└─ Task 1.3: Thermal ablation (10h)
   └─ Deliverable: energyCoupling.js

WEEK 2: Rankine-Hugoniot
├─ Task 2.1: R-H module (8h)
├─ Task 2.2: Integration (6h)
└─ Task 2.3: Validation (6h)
   └─ Deliverable: rankineHugoniot.js

WEEK 3: Atmosphere
├─ Task 3.1: USSA 1976 (8h)
├─ Task 3.2: Path length (4h)
├─ Task 3.3: FCM V2 integration (8h)
└─ Task 3.4: Crater update (4h)
   └─ Deliverable: atmosphere/ussa1976.js

WEEK 4: Validation
├─ Task 4.1: Expand dataset (4h) - Add 10 craters
├─ Task 4.2: Run validation (4h) - Calculate new MAE
└─ Task 4.3: MAE report (4h) - Document progress
   └─ Deliverable: PHASE_1_4_MAE_REPORT.md
```

---

## 🎯 Success Criteria

### ✅ Minimum (Must Achieve):
- [ ] Global MAE < 25%
- [ ] No regressions on Tunguska/Barringer/Chicxulub
- [ ] All 3 axes implemented

### 🎯 Target (Main Goal):
- [ ] **Global MAE < 20%** ⭐
- [ ] Crater MAE < 15%
- [ ] Sikhote-Alin within ±30%

### 🌟 Stretch (Bonus):
- [ ] Global MAE < 18%
- [ ] R-H model <5% vs nuclear data
- [ ] Publication-ready accuracy

---

## 📚 Must-Read References

**Before Starting**:
1. ✅ Melosh (1989) - Chapters 3-5 (energy partitioning)
2. ✅ Pierazzo & Melosh (2000) - Figure 4 (coupling efficiency)
3. ✅ USSA 1976 - Tables (atmospheric layers)
4. ✅ Zel'dovich & Raizer (1966) - Chapter 1 (R-H equations)

**Optional**:
- Collins et al. (2005) - Already familiar
- Wheeler et al. (2017) - Already have FCM V2

---

## 🔧 Files to Create

**New Files** (7):
```
api/src/services/
├── energyCoupling.js          ⭐ Axis 1
├── energyBudget.js            ⭐ Axis 1
├── rankineHugoniot.js         ⭐ Axis 2
└── atmosphere/
    ├── ussa1976.js            ⭐ Axis 3
    └── pathLength.js          ⭐ Axis 3

api/src/tests/
├── validateRankineHugoniot.js ⭐ Validation
└── validatePhase1_4_Complete.js ⭐ Final MAE
```

**Files to Modify** (3):
```
api/src/services/
├── physicsEngine.js           → Use new modules
├── fragmentCloudModelV2.js    → USSA 1976 atmosphere
└── atmosphericTrajectory.js   → Thermal ablation
```

---

## 🚀 Quick Start

**Step 1**: Read this summary ✅
**Step 2**: Review full plan at `docs/phases/PHASE_1_4_CRATER_PRECISION.md`
**Step 3**: Check tasks at `.github/ISSUE_TEMPLATE/phase_1_4_tasks.md`
**Step 4**: Start with easiest task: **Task 1.1 - Energy Coupling** (4h)

**First Implementation** (Task 1.1):
```javascript
// api/src/services/energyCoupling.js
function calculateCouplingEfficiency(impactAngle, velocity) {
  const theta_rad = impactAngle * Math.PI / 180;
  const sin_theta = Math.sin(theta_rad);

  // Pierazzo & Melosh (2000) - Figure 4
  const eta = 0.85 * Math.pow(sin_theta, 0.8);

  // Velocity correction (>20 km/s reduces efficiency)
  const v_factor = velocity > 20 ? 0.95 : 1.0;

  return eta * v_factor;
}
```

**Test It**:
```javascript
console.log(calculateCouplingEfficiency(90, 20));  // 0.85 (vertical)
console.log(calculateCouplingEfficiency(45, 20));  // ~0.65 (45°)
console.log(calculateCouplingEfficiency(30, 20));  // ~0.35 (grazing)
```

---

## 📈 Progress Tracking

**After Each Axis**:
1. Run existing validation tests
2. Calculate interim MAE
3. Check for regressions
4. Document improvements

**Checkpoints**:
- [ ] After Axis 1: MAE < 28%?
- [ ] After Axis 2: MAE < 24%?
- [ ] After Axis 3: MAE < 20%? ⭐

**If MAE not improving**:
→ Review implementation
→ Check validation data
→ Consider hybrid approach (new + old physics)

---

## 💡 Key Insights from Expert Analysis

**What we're good at**:
- ✅ Blast zones (±8% on Tunguska) - **keep this!**
- ✅ Overall physics approach (Holsapple, FCM V2)
- ✅ Monte Carlo uncertainty

**What needs work**:
- ⚠️ Energy coupling (assumed 100%)
- ⚠️ Atmospheric effects (too simple)
- ⚠️ Shock physics (empirical, not fundamental)

**Impact**:
These three weaknesses compound to create our 32% MAE.
Fixing them gets us to publication quality (<20%).

---

## 🎓 Educational Value

**What you'll learn**:
1. **Shock physics**: Rankine-Hugoniot equations (core fluid dynamics)
2. **Atmospheric science**: Standard atmosphere models (aerospace)
3. **Energy partitioning**: Where impact energy actually goes (planetary science)

**Transferable skills**:
- Physics-based modeling vs empirical fitting
- Multi-layer system modeling
- Validation against ground truth data

---

## 🔄 After Phase 1.4

**If MAE < 20%**:
→ Phase 2: Dataset expansion (20 → 75 craters)
→ Peer-reviewed publication
→ v2.1 release

**If MAE still >20%**:
→ Phase 1.5: Deep dive on remaining issues
→ Possibly: RK45 integration for atmospheric trajectory
→ Possibly: 3D impact geometry

---

## 📞 Questions?

**Full Documentation**:
- Planning: `docs/phases/PHASE_1_4_CRATER_PRECISION.md`
- Tasks: `.github/ISSUE_TEMPLATE/phase_1_4_tasks.md`
- Project: `PROJET_v2.0_REFONTE_COMPLETE.md`

**Ready to start?** → Begin with Task 1.1 (energy coupling)

---

**Created**: October 19, 2025
**Status**: Ready for implementation
**Next Action**: Read Pierazzo & Melosh (2000) Figure 4
