# 📜 Project History - NEO Asteroid Impact Simulator

Complete chronological history from NASA Space Apps hackathon to v2.0.0 production deployment.

---

## 📅 Timeline Overview

```
Oct 4       │ NASA Space Apps Montreal - LOCAL JURY
            │ ✅ "COUP DE CŒUR" DU JURY 🎉
            │ (Jury's favorite project)
            ▼
Oct 16      │ FINAL DECISION
            │ ❌ NOT SELECTED FOR NASA SUBMISSION
            │ (Despite being "coup de cœur")
            ▼
Oct 11-17   │ Post-Hackathon Analysis & Pivot
            │ → Complete refactoring decision
            │ → Phase 1: Scientific Rigor (v1.7.0-1.7.11)
            │ → Monte Carlo, FCM V2, Physics-based routing
            ▼
Oct 18      │ v2.0.0 Rebrand & Production Deployment
            │ ✅ Live at neo.lueger.fr
            │ Independent scientific tool
```

---

## 🏆 Phase 0: NASA Space Apps Challenge (October 2025)

### Context
- **Event**: NASA Space Apps Challenge 2025 - Montreal
- **Team**: Cyber and Space
- **Challenge**: "Meteor Madness" - Create asteroid impact simulator
- **Repository**: `TawbeBaker/Cyber-and-Space`
- **Version Submitted**: v1.6.x

### Version 1.6 Features
✅ Basic impact physics (energy, crater, blast zones)
✅ NASA NEO API integration
✅ Interactive web interface (React + TypeScript)
✅ Node.js backend with Express
✅ Real-time asteroid data
✅ Population-based casualty estimates (45 cities)
✅ Azure deployment (Container Apps + Static Web Apps)

### Limitations (Known at submission)
⚠️ Linear regressions for some calculations
⚠️ Limited validation dataset (20 craters)
⚠️ No uncertainty quantification
⚠️ MAE: 16-32% depending on regime
⚠️ Simplified physics models
⚠️ No fragmentation modeling

### Hackathon Results Timeline

**October 4, 2025**: ✅ **"COUP DE CŒUR" DU JURY** 🎉
- Selected as jury's favorite project
- Recognized for innovation and technical implementation
- Expected to be submitted to NASA for global competition

**October 16, 2025**: ❌ **NOT SELECTED FOR NASA SUBMISSION**
- Final decision: Project will NOT be submitted to NASA
- Despite initial "coup de cœur", not advanced to global stage
- No official feedback provided by jury

**Impact**:
This reversal (jury favorite → not submitted) was unexpected and drove the decision to completely refactor the project independently of hackathon constraints.

**Hypothesized Reasons for Final Rejection**:
1. Insufficient scientific rigor (regressions vs pure physics)
2. High error margins not well explained
3. Missing uncertainty quantification
4. Limited validation against historical events
5. Simplified atmospheric entry physics
6. Possible: Other Montreal projects deemed more competition-ready

---

## 🔬 Phase 1: Scientific Refactoring (Oct 11-17, 2025)

### Decision Point (October 11-16)

**Emotional Context**:
The reversal from "coup de cœur" (October 4) to "not selected" (October 16) was a pivotal moment. Rather than accepting this as a defeat, the decision was made to transform the project beyond hackathon constraints.

**Strategic Choice**: Complete scientific refactoring instead of iterating on hackathon approach.

**New Philosophy** (Post-Rejection):
- 🎯 Goal: World-class asteroid impact simulator (independent of NASA)
- 📊 Principle: Pure physics, zero regressions
- 🔢 Approach: Rigorous uncertainty quantification
- ✅ Focus: Scientific accuracy > competition compliance
- 💡 Motivation: Prove the jury's initial "coup de cœur" instinct was correct

### Sprint 1.1: Monte Carlo Foundation (v1.7.0 - Oct 13)

**Milestone**: `v1.7.0` - First post-hackathon version

**Commits**:
- `ca8b2a0` - Monte Carlo infrastructure setup
- `b82812c` - Basic Monte Carlo simulation
- `7e4dd90` - Statistical analysis module
- `cb2a0d2` - Variance decomposition
- `c6ae6f8` - PDF/CDF visualization
- `a08354e` - `v1.7.1-mc` tag

**Key Achievements**:
✅ Box-Muller transform for Normal sampling
✅ Sampling utilities (Normal, Uniform, LogNormal)
✅ Statistical analysis (mean, std, percentiles)
✅ Variance decomposition (Sobol indices)
✅ Visualization data generation

**Tests Created**: 5 comprehensive test suites

---

### Sprint 1.2: Physics-Based Routing (v1.7.10 - Oct 14-15)

**Focus**: Eliminate regressions, implement pure physics models

**Commits**:
- `235b491` - FCM V2 fragmentation model (Wheeler et al. 2017)
- `40b7829` - Physics-based routing with σ_typical calibration
- `ae20fc6` - Phase 1.2 COMPLETE - All 3 options analyzed

**Major Changes**:

#### 1. Fragmentation Cloud Model V2 (FCM V2)
**Reference**: Wheeler et al. (2017) - Hills-Goda pancake model

**Physics**:
```
P_ram = ½ × ρ_air × v²
Fragmentation condition: P_ram > σ (material strength)
```

**Implementation**:
- Altitude-dependent atmospheric density
- Velocity-dependent ram pressure
- Material strength database (iron, stone, carbonaceous)
- Energy conservation <7% error all regimes

**Validation**:
- ✅ Tunguska (1908): ±8% blast zones
- ✅ Chelyabinsk (2013): <1% altitude error
- ⚠️ High-altitude airbursts: Under-predicted (L3 limitation)

#### 2. Physics-Based Routing System

**Route 1 - Intact Impact**: σ > 120 MPa (strong iron)
- No fragmentation
- Direct crater formation
- Holsapple pi-group scaling

**Route 2 - Certain Fragmentation**: σ < 50 MPa (weak stone)
- FCM V2 airburst
- Blast zones only
- No crater

**Route 3 - Uncertain Fragmentation**: 50 ≤ σ ≤ 120 MPa
- Monte Carlo over σ range
- Probabilistic crater/airburst
- Full uncertainty propagation

**Result**: ±35% precision improvement on small iron meteorites

#### 3. Holsapple Pi-Group Crater Model

**Formula**:
```
D = C × D_imp × (ρ/ρ_target)^μ × (v/v_ref)^β × sin^ε(θ)
```

**Parameters** (Bootstrapped from 20 craters):
- C = 14.10 ± 1.13 (N=1000 bootstrap samples)
- μ = 1/3 (density exponent - theoretical)
- β = 2/3 (velocity exponent - theoretical)
- ε = 1/3 (angle exponent - theoretical)

**Validation**:
- Barringer: 1.5 km calculated vs 1.2 km observed (±25%)
- Chicxulub: 136.6 km vs 180 km observed (±24%)
- Ries: 20.4 km vs 24 km observed (14.9%)

**Key Insight**: Pure physics, no empirical fitting of exponents.

---

### Sprint 1.3: C Uncertainty Integration (v1.7.11 - Oct 16-17)

**Milestone**: `v1.7.11` - Phase 1.3 Complete

**Commit**: `eee51cc` - C uncertainty integration

**Achievement**: Monte Carlo uncertainty on crater constant C

**Implementation**:
```javascript
// Monte Carlo sampling
const C_samples = boxMullerNormal(14.10, 1.13, N_samples);
const crater_diameters = C_samples.map(C =>
  holsappleCrater(D_imp, rho, v, theta, C)
);
```

**Results**:
- P10, P50, P90 percentiles for all outputs
- Confidence intervals on crater dimensions
- Uncertainty propagation to blast zones
- Seismic magnitude ranges

**Frontend Integration**:
- Uncertainty panel (P10/P50/P90 display)
- Monte Carlo toggle
- Sample size selector (100, 500, 1000)
- Visualization of distributions

---

## 🎯 Phase 2: Post-Hackathon Pivot (Oct 18, 2025)

### Documentation Overhaul (Morning)

**Commits**:
- `d9c6c50` - Complete documentation refactoring
- `6888332` - Session summary

**Actions Taken**:
1. **Archive Created**: 43 files moved from root
   - `archive/hackathon-montreal-2025/` - NASA competition docs
   - `archive/azure-optimization/` - Cost optimization guides
   - `archive/obsolete-analyses/` - Options B/C analyses
   - `archive/old-versions/` - v1.6.x documentation

2. **New Core Documentation**:
   - `CONTEXTE_PROJET_v2.0.md` - Post-hackathon context
   - `PLAN_PROJET_FIABILISATION.md` - 5-phase roadmap (198h)
   - `README.md` - Complete rewrite (630 lines)
   - `INDEX_DOCUMENTATION.md` - Navigation guide

3. **Philosophy Shift**:
   - ❌ Removed: "NASA Compliance 19/19 (100%)" badges
   - ✅ Added: "NOT selected by jury" transparency
   - ✅ Added: Explicit limitations section
   - ✅ Added: MAE metrics and targets

**Root Directory**: 55 → 6 files (-89%)

---

### Frontend Cleanup (Afternoon)

**Commit**: `531df8c` - Navigation cleanup and Learn tab improvement

**Removed Components**:
- ❌ Game tab (DefendEarthGame.tsx)
- ❌ 3D Visualization tab (poor quality)
- ❌ Mitigation panel (out of scope)
- ❌ Info panel (not maintained)
- ❌ Uncertainty tab (integrated into main view)

**Navigation**: 8 tabs → 3 tabs + 1 external link
- ✅ Simulation (main view)
- ✅ Scenarios (historical events)
- ✅ Learn (physics + limitations)
- ✅ Docs (GitHub README link)

**Learn Tab Overhaul** (296 lines):

**4 Categories**:
1. **Physics Models** (6 items):
   - Holsapple Pi-Group with actual formulas
   - FCM V2 fragmentation criteria
   - Monte Carlo methodology
   - Seismic magnitude calculations

2. **Limitations** (9 items with color coding):
   - 🔴 L1-L3: Critical (v_ref, Sikhote-Alin, high-altitude)
   - ⚠️ L4-L6: Important (MAE, dataset, populations)
   - 🟢 L7-L9: Acceptable (geometry, target, Earth-only)

3. **Validation** (4 items):
   - Tunguska: ±8% error
   - Chelyabinsk: <1% altitude, L3 issue
   - Barringer: ±25% error
   - Chicxulub: ±24% error

4. **Historical Events** (3 items):
   - Context and significance

**Footer Stats**:
- MAE: 32% → <20% target
- Dataset: 20 → 75 craters
- Monte Carlo: 2 → 6 parameters

---

### Scenarios Enhancement

**Commit**: `ec6968c` - Reliability indicators and historical context

**Major Redesign** (576 lines):

**Reliability Scoring System** (0-100%):
```typescript
interface Scenario {
  category: 'validated' | 'estimated' | 'hypothetical';
  reliability: {
    score: number;      // 0-100%
    details: string;    // Accuracy explanation
    ourMAE?: number;    // Measured error
    validated: boolean;
  };
  historicalContext: string; // Full paragraph
  requiresLocationSelection?: boolean; // UX clarity
}
```

**9 Scenarios** (up from 6):

**Validated ✅** (4 scenarios - we tested these):
1. **Tunguska (1908)**: 92% reliability
   - MAE: ±8% blast zones
   - FCM V2 baseline calibration

2. **Chelyabinsk (2013)**: 75% reliability
   - Altitude: <1% error
   - ⚠️ Blast zones under-predicted (L3)

3. **Barringer**: 75% reliability
   - MAE: ±25% (1.5km vs 1.2km)

4. **Chicxulub (66 Ma)**: 76% reliability
   - MAE: ±24% (136.6km vs 180km)

**Estimated 📊** (2 scenarios):
5. **Sikhote-Alin (1947)**: 45% reliability
   - ⚠️ L2 problem (1.8-10.7m vs 26m observed)

6. **Ries**: 85% reliability
   - 14.9% error (20.4km vs 24km)

**Hypothetical 🔮** (4 scenarios):
7. **Apophis (2029)**: 60% reliability
8. **Bennu**: 65% reliability
9. **City Killer (140m)**: 70% reliability
10. **Regional Devastation (1km)**: 65% reliability

**Color Coding**:
- Green (≥75%): Excellent/Good
- Yellow (≥50%): Medium
- Red (<50%): Low/Problematic

**UX Improvements**:
- Clear warning for location selection
- Category filters
- Historical context paragraphs
- Reliability explanations

---

## 🚀 Phase 3: v2.0.0 Rebrand & Deployment (Oct 18, 2025)

### Complete Rebrand

**Commit**: `1723147` - v2.0.0 Complete Rebrand and Project Reorganization

**Tag**: `v2.0.0`

**Name Changes**:
- ❌ "Asteroid Impact Simulator | NASA Space Apps Challenge 2025"
- ✅ "NEO Asteroid Impact Simulator v2.0"
- ✅ "Physics-Based Impact Simulation with Scientific Rigor"

**Repository Migration**:
- ❌ Old: `ddmp3/meteormadness`
- ❌ Old: `TawbeBaker/Cyber-and-Space`
- ✅ New: `ddmp3/neo-asteroid-impact`

**Package Renaming**:
- Frontend: `neo-asteroid-impact-web` v2.0.0
- Backend: `neo-asteroid-impact-api` v2.0.0

**Domain Configuration**:
- ✅ Frontend: https://neo.lueger.fr
- ⚠️ Backend: `api.neo.lueger.fr` (needs DNS)

**GitHub References Updated** (26 files):
- All links: `ddmp3/neo-asteroid-impact`
- Removed: TawbeBaker/Cyber-and-Space references
- Updated: Header, Learn tab, API docs

**UI Updates**:
- Header subtitle: "NEO Impact Physics Simulator v2.0"
- HTML title: "NEO Asteroid Impact Simulator | v2.0"
- Removed NASA branding from footer

---

### Code Organization (Best Practices)

**Structure Reorganization**:

```
BEFORE (messy):
├── test-azure-iron-meteorites.js
├── test-craters-v1.6.32.js
├── blast-comparison.js
├── push-now.sh
└── luis_code_reference/

AFTER (clean):
├── tests/
│   ├── calibration/    # 4 physics tests
│   └── validation/     # 11 validation tests
├── scripts/            # 2 deployment scripts
└── archive/
    └── reference-code/ # Luis legacy code
```

**Files Moved**: 11 files
**Directories Created**: 3 new
**Files Deleted**: 1 (.git-commit-message.txt)

**.gitignore Updated**:
```
# Temporary files
*.tmp
*.bak
.git-commit-message.txt
```

---

### Production Deployment

**Commit**: `267e358` - Deployment report for v2.0.0

**Build Stats**:
- HTML: 0.63 kB (gzip: 0.37 kB)
- CSS: 46.17 kB (gzip: 12.57 kB)
- JS: 401.35 kB (gzip: 124.74 kB)
- Build time: 1.30s

**Azure Deployment**:
- Method: Azure Static Web Apps CLI
- Target: `swa-asteroid-impact-ckq6mn38`
- Location: East US 2
- Custom Domain: `neo.lueger.fr` (Ready)
- SSL: Managed by Azure (auto-renewed)

**Backend API**:
- Container App: `ca-api-92nppgw4`
- Location: Canada Central
- CORS: Updated for `neo.lueger.fr`
- Status: ✅ Running

**Deployment Time**: ~45 seconds
**Total Rebrand Duration**: ~2 hours

**URLs Live**:
- ✅ https://neo.lueger.fr
- ✅ https://jolly-tree-0b50d3d0f.1.azurestaticapps.net
- ✅ API endpoint active

---

### Repository Cleanup

**Commits**:
- `94bd42e` - Repository cleanup
- `b8dc732` - Cleanup report

**Files Archived** (19 total):

**Legacy Code** (~914 KB):
- `luis_code_reference/` → `archive/reference-code/`
  - asteroid-visualizer.js (610 KB)
  - kinetic-impactor.js (16 KB)
  - trajectory-simulator.js (17 KB)
  - top200_closest_asteroids_FINAL.json (271 KB)

**Old Analyses** (~514 KB):
- `asteroid-impact-simulator/` → `archive/old-versions/`
  - COLLINS_CONFORMITY_ANALYSIS.md
  - COMPARATIVE_ANALYSIS_10_SAMPLES.md
  - COMPARATIVE_TEST_SAMPLES.json
  - PRECISION_FINAL_REPORT_v1.6.29.md
  - OUR_RESULTS_SUMMARY.json (5 KB)
  - OUR_SIMULATOR_RESULTS.json (451 KB)

**NASA Files**:
- `NASA_COMPARISON_v1.6.29.md` → `archive/hackathon-montreal-2025/`

**Test Files Moved** (4):
- `asteroid-impact-simulator/` → `tests/validation/`
  - extract-our-results.js
  - run-comparative-tests.js
  - test-crater-iron.js
  - test-ocean-detection.js

**Final Root Directory**: 7 essential files
- README.md
- CHANGELOG.md
- LIMITATIONS.md
- INDEX_DOCUMENTATION.md
- PROJET_v2.0_REFONTE_COMPLETE.md
- DEPLOYMENT_v2.0.0.md
- DEV_URLS.md

**Improvement**: -42% files in root

---

## 📊 Current State (v2.0.0)

### Technical Stack

**Frontend**:
- React 18.2 + TypeScript 5.3
- Vite 5.0 (build tool)
- Tailwind CSS 3.4
- Leaflet maps
- Zustand (state management)

**Backend**:
- Node.js 18+
- Express 4.18
- NASA NEO API integration
- USGS Elevation API

**Physics Engine**:
- Holsapple Pi-Group Scaling (1993)
- FCM V2 Fragmentation (Wheeler 2017)
- Monte Carlo Uncertainty Quantification
- Box-Muller Normal Sampling
- Energy Conservation (<7% error)

**Infrastructure**:
- Azure Static Web Apps (frontend)
- Azure Container Apps (backend API)
- Azure Application Insights (monitoring)
- GitHub Actions (CI/CD)
- Terraform (IaC - available)

---

### Performance Metrics

**Accuracy** (Current - v2.0.0):
- Global MAE: 32%
- Crater scaling: 16-25% (good)
- Blast zones: ±8% (excellent)
- Target v2.1: <20% MAE

**Validation Dataset**:
- Current: 20 documented craters
- Target: 75 craters (Phase 2)

**Monte Carlo**:
- Parameters: 2 (C, σ)
- Target: 6 (D, V, θ, ρ, σ, C)
- Samples: 100-1000 configurable

**Known Limitations** (9 total):
- 🔴 **Critical** (3): v_ref, Sikhote-Alin, high-altitude airbursts
- ⚠️ **Important** (3): MAE, dataset size, population data
- 🟢 **Acceptable** (3): geometry, target uniformity, Earth-only

---

### Repository Statistics

**Structure**:
```
neo-asteroid-impact/
├── asteroid-impact-simulator/  # Main app
│   ├── web/                    # 147 modules
│   └── api/                    # 50+ services
├── tests/                      # 15 test files
├── scripts/                    # 2 deployment scripts
├── docs/                       # 10+ documentation files
├── archive/                    # 50+ archived files
└── terraform/                  # Infrastructure code
```

**Code Metrics**:
- Frontend: ~401 KB bundled JS
- Backend: 50+ API endpoints
- Test Coverage: Comprehensive validation suite
- Documentation: 60+ markdown files

**Git History**:
- Total commits: 100+
- Tags: v1.7.0, v1.7.1, v1.7.1-mc, v2.0.0
- Branches: main, feature/sprint-1.1-monte-carlo, dev

---

## 🎯 Roadmap v2.1+

### Phase 0: Transparency UI (8 hours)
- [ ] Create `LimitationsDisplay.tsx` component
- [ ] Add disclaimer modal at launch
- [ ] Display 9 limitations in results dashboard
- [ ] localStorage for "don't show again"

### Phase 1: Critical Corrections (10 hours)
- [ ] Resolve L1: v_ref inconsistency (15 vs 12 km/s)
- [ ] Resolve L2: Sikhote-Alin calibration (σ_typical for small irons)
- [ ] Resolve L3: High-altitude airburst correction factors

### Phase 2: Dataset Expansion (80 hours, 2 months)
- [ ] Add 55 new validated craters (20 → 75)
- [ ] Expand composition database
- [ ] Statistical power: 60% → 95%

### Phase 3: Complete Monte Carlo (60 hours, 2 months)
- [ ] Add D, V, θ, ρ uncertainty propagation
- [ ] Full 6-parameter Monte Carlo
- [ ] Correlation analysis

### Phase 4: Publication (40 hours, 1 month)
- [ ] Write peer-reviewed article
- [ ] Submit to planetary science journal
- [ ] Public API v2 with uncertainties

**Total Roadmap**: 198 hours over 5 months

---

## 📈 Key Learnings

### What Worked

1. **Pure Physics Approach**:
   - Holsapple pi-group > empirical regressions
   - Conservation laws give <7% error
   - Theoretical exponents (μ, β, ε) robust

2. **Monte Carlo Integration**:
   - Rigorous uncertainty quantification
   - Box-Muller gives exact Normal samples
   - Bootstrap calibration for C parameter

3. **Modular Architecture**:
   - Clean separation: frontend/backend
   - Reusable physics services
   - Comprehensive test suite

4. **Transparent Limitations**:
   - Color-coded severity (red/yellow/green)
   - Explicit MAE reporting
   - Reliability scores per scenario

### What Didn't Work (v1.6 Hackathon)

1. **Linear Regressions**:
   - Not scientifically defensible
   - High variance on edge cases
   - Jury likely noticed

2. **No Uncertainty Quantification**:
   - Single-point estimates misleading
   - Should have had confidence intervals from start

3. **Limited Validation**:
   - 20 craters insufficient
   - Should have tested more edge cases

4. **Incomplete Documentation**:
   - Limitations buried in technical docs
   - Should have been front and center

5. **Hackathon-Driven Development**:
   - Focused on "NASA compliance" over scientific rigor
   - Marketing approach ("100% compliance") vs transparent science
   - Underestimated importance of uncertainty quantification for jury

### The "Coup de Cœur" → Rejection Paradox

**October 4**: Jury selects project as favorite
- Recognition of innovation, UI/UX, technical implementation
- Positive feedback on interactivity and NASA data integration

**October 16**: Same jury doesn't select for NASA submission
- No feedback provided on what changed
- Possible scenarios:
  1. Deeper technical review revealed scientific weaknesses
  2. Comparison with other Montreal projects on global competitiveness
  3. Missing features discovered (uncertainty, validation depth)
  4. Jury consensus vs individual preferences

**Lesson Learned**:
"Coup de cœur" recognized the *potential* and *execution*, but NASA-level submission requires *scientific rigor* that v1.6 lacked. The reversal validated the need for complete refactoring, not iteration.

### Technical Challenges Overcome

1. **Fragmentation Modeling**:
   - FCM V2 integration complex
   - Energy conservation tricky
   - Route 3 uncertain regime solved with Monte Carlo

2. **Small Iron Meteorites**:
   - Sikhote-Alin mismatch persistent
   - Likely σ_typical too high for small fragments
   - Phase 1.4 will address

3. **High-Altitude Airbursts**:
   - Blast zones under-predicted >20km
   - Atmospheric coupling poorly modeled
   - Needs altitude-dependent correction

---

## 🏆 Achievements

### Scientific
✅ Pure physics crater model (Holsapple 1993)
✅ FCM V2 fragmentation (Wheeler 2017)
✅ Monte Carlo uncertainty quantification
✅ Energy conservation <7% error all regimes
✅ Physics-based routing (σ-dependent)
✅ Bootstrap parameter calibration
✅ 20-crater validation dataset

### Engineering
✅ Modern React + TypeScript frontend
✅ Scalable Node.js backend
✅ Azure cloud deployment
✅ NASA NEO API integration
✅ Real-time data fetching
✅ Interactive Leaflet maps
✅ Comprehensive test suite

### Documentation
✅ 60+ markdown files
✅ Complete API documentation
✅ Scientific references cited
✅ Limitations transparently documented
✅ Historical context preserved
✅ 5-phase roadmap defined

### Open Source
✅ MIT License
✅ Public GitHub repository
✅ Clean code structure
✅ Educational tooltips
✅ Reproducible science

---

## 📚 References

### Scientific Papers
1. **Holsapple, K.A. (1993)**: "The Scaling of Impact Processes in Planetary Sciences" - Annual Review of Earth and Planetary Sciences
2. **Wheeler et al. (2017)**: "Atmospheric entry analysis of the Chelyabinsk meteor" - Icarus
3. **Collins et al. (2005)**: "Earth Impact Effects Program" - Meteoritics & Planetary Science
4. **Hills & Goda (1993)**: "The fragmentation of small asteroids in the atmosphere" - Astronomical Journal

### Datasets
- NASA NEO API: https://api.nasa.gov
- JPL SBDB: https://ssd.jpl.nasa.gov
- Earth Impact Database: 20 validated craters
- USGS Elevation API: Global DEM

---

## 👥 Team

**Development**: Solo project (post-hackathon refactoring)
**Original Hackathon Team**: Cyber and Space
**Reference Code**: Luis (asteroid visualization)

---

## 📞 Contact

**Project**: https://github.com/ddmp3/neo-asteroid-impact
**Live Site**: https://neo.lueger.fr
**Issues**: https://github.com/ddmp3/neo-asteroid-impact/issues

---

**Last Updated**: October 18, 2025
**Current Version**: v2.0.0
**Status**: ✅ Production - Active Development
