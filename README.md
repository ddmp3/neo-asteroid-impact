# 🌌 Asteroid Impact Simulator - MeteorMadness

<div align="center">

![Version](https://img.shields.io/badge/version-1.7.11-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-Apache%202.0-green?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Development-yellow?style=for-the-badge)
![Scientific](https://img.shields.io/badge/Approach-Pure%20Physics-blueviolet?style=for-the-badge)

**🌍 Live Demo**: [neo.lueger.fr](https://neo.lueger.fr)
**🚀 Interactive API**: [Swagger UI](https://api.neo.lueger.fr/api-docs)
**🔬 Scientific Docs**: [Physics & Formulas](./docs/SCIENTIFIC_DOCUMENTATION.md)
**📊 Project Context**: [Post-Hackathon Refactoring](./CONTEXTE_PROJET_v2.0.md)

</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Project Status](#project-status)
- [Features](#features)
- [Scientific Basis](#scientific-basis)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**MeteorMadness** is an open-source asteroid impact simulator built with **pure fundamental physics** (zero empirical regressions). The project aims to become the **world reference tool** for asteroid impact education and uncertainty quantification.

### Core Objectives

1. **🔬 Scientific Rigor**: Pure physics models (Holsapple pi-groups, Hills-Goda fragmentation)
2. **📊 Uncertainty Quantification**: Monte Carlo for all parameters (D, V, θ, ρ, σ, C)
3. **✅ Extensive Validation**: 75+ historical craters (currently 20)
4. **🎯 High Precision**: <20% Mean Absolute Error (currently 32%)
5. **🌐 Open Educational API**: Public access for researchers, educators, students

### Key Differentiators

- ✅ **Zero linear regressions** - Only fundamental physics equations
- ✅ **Complete uncertainty propagation** - Monte Carlo simulation engine
- ✅ **Transparent limitations** - All assumptions documented
- ✅ **Peer-reviewed models** - Collins, Holsapple, Hills-Goda, Wheeler
- ✅ **Open source** - Full code transparency

---

## 📊 Project Status

### Current Version: v1.7.11 (Phase 1.3 Complete)

**Released**: 2025-10-17

**Major Milestone**: C uncertainty integration into Monte Carlo engine

**Branch**: `feature/sprint-1.1-monte-carlo`

### Historical Context

- **October 2025**: Participated in NASA Space Apps Challenge (Montréal) with v1.6.x
- **Result**: ❌ Not selected by jury
- **Decision**: 🔄 **Complete refactoring** to create world-class scientific tool
- **Base version**: v1.7.11 (robust Monte Carlo foundation)

📖 **Full context**: [CONTEXTE_PROJET_v2.0.md](./CONTEXTE_PROJET_v2.0.md)

###Precision Metrics (v1.7.11)

| Component | Current MAE | Target v2.0 | Status |
|-----------|-------------|-------------|--------|
| **Crater Diameter** | 16-21% | <15% | ⚠️ Good |
| **Blast Zones** | 8% | <5% | ✅ Excellent |
| **Felt Radius** | <1% | <1% | ✅ Perfect |
| **Fragmentation Altitude** | <1% | <1% | ✅ Perfect |
| **Overall MAE** | ~32% | <20% | ⚠️ Needs work |

### Validated Craters

- **Current**: 20 craters (Barringer, Ries, Chicxulub, etc.)
- **Target v2.0**: 75 craters (statistical power 95%)
- **Database**: [CRATER_DATABASE.md](./.claude/validation/CRATER_DATABASE.md)

### Uncertainty Quantification

| Parameter | Distribution | Status |
|-----------|--------------|--------|
| **C (crater constant)** | N(14.10, 1.13) | ✅ Phase 1.3 |
| **σ (material strength)** | U(20, 120) MPa | ✅ Phase 1.2 |
| **D (diameter)** | ±10% | 🚧 Phase 1.4 |
| **V (velocity)** | ±5% | 🚧 Phase 1.4 |
| **θ (angle)** | ±10° | 🚧 Phase 1.4 |
| **ρ (density)** | ±15% | 🚧 Phase 1.4 |

---

## ✨ Features

### 🎯 Impact Simulation Mode

- **Customizable Parameters**:
  - Asteroid diameter: 1m - 100km
  - Impact velocity: 11 - 72 km/s (cosmic velocity range)
  - Impact angle: 0° - 90°
  - Composition: Rocky, Iron, Icy (affects fragmentation)
  - Impact location: Click anywhere on Earth

- **Calculated Results**:
  - Impact energy (Joules and megaton TNT equivalent)
  - **Crater dimensions** with uncertainty bands (Monte Carlo)
  - **Fragmentation analysis** (FCM V2 - Wheeler et al. 2017)
  - Seismic magnitude (Richter scale)
  - Blast zones (fireball, thermal, air blast, ground shock)
  - Population-based casualty estimates

- **Real-World Validated**:
  - Tunguska (1908): 65m, 15 MT @ 8km altitude
  - Chelyabinsk (2013): 20m, 0.5 MT @ 23km altitude
  - Barringer: 50m iron crater
  - Chicxulub (66 Mya): 10km extinction event

### 🌌 3D Orbital Trajectory Mode

- **200 Real Asteroids** from NASA JPL SBDB
- **Interactive 3D Visualization** (Three.js)
- **Keplerian Orbital Mechanics**: High-precision calculations
- **Real-Time Earth Position**: See current locations
- **Asteroid Details**: Orbital elements, diameter, close approaches

### 🛡️ Planetary Defense

- **Deflection Methods**:
  - **Kinetic Impactor** (DART mission validated)
  - **Gravity Tractor** (slow, precise deflection)
  - **Nuclear** (last-resort option)

- **Simulates**:
  - Required delta-V for deflection
  - Mission timeline and warning time
  - Success probability
  - Momentum transfer calculations

### 🎓 Educational Features

- **16 Learning Modules**: Impact physics, orbital mechanics, planetary defense
- **Defend Earth Game**: 6 progressive levels
- **Interactive Tooltips**: Scientific explanations
- **Mobile-Responsive**: Full functionality on all devices
- **WCAG 2.1 Level AA**: Fully accessible (keyboard nav, ARIA, focus management)

---

## 🔬 Scientific Basis

### Physics Models (Peer-Reviewed Only)

#### 1. Holsapple Pi-Group Scaling (1993)

**Crater Diameter**:
```
D = C × D_imp × (ρ/ρ_target)^(1/3) × (v/v_ref)^(2/3) × sin^(1/3)(θ)
```

**Parameters**:
- **C**: Crater constant = 14.10 ± 1.13 (bootstrap calibrated, N=1000)
- **D_imp**: Impactor diameter (m)
- **ρ**: Impactor density (kg/m³)
- **ρ_target**: Target density (2500 kg/m³ for rock, 1000 kg/m³ for water)
- **v**: Impact velocity (m/s)
- **v_ref**: Reference velocity (15 km/s - **⚠️ Under review Phase 1.4**)
- **θ**: Impact angle from horizontal (degrees)

**Exponents** (Holsapple 1993):
- **μ = 1/3** (density scaling)
- **β = 2/3** (velocity scaling)
- **ε = 1/3** (angle scaling)

**Precision**: ±16% MAE (rocky targets, N=20 craters)

#### 2. FCM V2 Atmospheric Fragmentation (Wheeler et al. 2017)

**Progressive Fragmentation Model**:
- **Hills-Goda criterion**: P_ram vs σ (material strength)
- **Energy conservation**: <7% error across all regimes
- **Weibull strength scaling**: σ(m) = σ_0 × (m/m_0)^(-1/6)
- **Debris cloud formation**: Fragment dispersion modeling

**Physics-Based Routing** (Phase 1.2):
- **Route 1 (Intact)**: P_ram < σ_min → No fragmentation
- **Route 2 (Certain Fragmentation)**: P_ram > σ_max → Monte Carlo (C + σ)
- **Route 3 (Uncertain Fragmentation)**: σ_min < P_ram < σ_max → Monte Carlo (C + σ)

**Precision**: <1% error on burst altitude (Chelyabinsk, Tunguska)

#### 3. Monte Carlo Uncertainty Quantification (Phase 1.3)

**Statistical Sampling**:
- **Box-Muller transform**: Exact Normal distribution sampling
- **Reproducible**: RNG seed = 42 for deterministic results
- **Convergence**: N=100 samples sufficient for stable P10/P90 percentiles

**Parameter Distributions**:
```javascript
C ~ Normal(mean=14.10, std=1.13, bounds=[11.0, 17.0])  // 8.04% uncertainty
σ ~ Uniform(min=20 MPa, max=120 MPa)                    // Material strength range
```

**Outputs**:
- Mean, median, std, mode
- Confidence intervals: 68%, 95%, 99.7%
- Percentiles: P5, P10, P25, P50, P75, P90, P95

**Precision**: ~20% CI width for 80% confidence interval

#### 4. Seismic Effects (Schultz & Gault 1975)

**Gutenberg-Richter Relation**:
```
M = (2/3) × log₁₀(E) - 5.87
```

**Felt Radius**: High-precision interpolation (7 anchor points)
- Precision: <1% error (Tunguska, Chelyabinsk, Chicxulub)

**Airburst Correction**: -1.0 magnitude for airbursts (reduced seismic coupling)

### Limitations & Transparency

⚠️ **See [LIMITATIONS.md](./LIMITATIONS.md) for complete technical constraints**

**Model Constraints**:
- Spherical impactors (orientation effects not modeled)
- Uniform target density (no subsurface layering)
- 45 major cities (rural populations underestimated)
- Earth-specific (transition thresholds not valid for Moon, Mars)

**Known Issues** (Phase 1.4 Roadmap):
1. 🔴 **v_ref inconsistency**: Code uses 15 km/s, docs mention 12 km/s
2. ⚠️ **Sikhote-Alin mismatch**: Predicted 2-10m vs observed 26m (σ range too wide)
3. ⚠️ **High-altitude airbursts**: Chelyabinsk (23km) blast zones underestimated

**Accuracy Classification**:
- ✅ **Suitable for**: Education, relative comparisons, concept demonstrations
- ❌ **NOT suitable for**: Operational planetary defense, mission planning, policy decisions

### Scientific References

1. **Holsapple, K. A. (1993).** "The scaling of impact processes in planetary sciences." *Annual Review of Earth and Planetary Sciences*, 21(1), 333-373.

2. **Wheeler, L. F., et al. (2017).** "A Fragment-Cloud Model for asteroid breakup and atmospheric energy deposition." *Icarus*, 295, 149-169. DOI: 10.1016/j.icarus.2017.02.011

3. **Hills, J. G., & Goda, M. P. (1993).** "The fragmentation of small asteroids in the atmosphere." *The Astronomical Journal*, 105(3), 1114-1144.

4. **Collins, G. S., Melosh, H. J., & Marcus, R. A. (2005).** "Earth Impact Effects Program." *Meteoritics & Planetary Science*, 40(6), 817-840.

5. **Schultz, P. H., & Gault, D. E. (1975).** "Seismic effects from major basin formations on the moon and mercury." *The Moon*, 12(2), 159-177.

📚 **Full references**: [SCIENTIFIC_DOCUMENTATION.md](./docs/SCIENTIFIC_DOCUMENTATION.md)

---

## 🚀 Quick Start

### Production (Live)

Visit: **[https://neo.lueger.fr](https://neo.lueger.fr)**

### Local Development

**Prerequisites**:
- Node.js 16+
- npm 8+

**Backend API**:
```bash
cd asteroid-impact-simulator/api
npm install
npm start
# → http://localhost:7071
```

**Frontend**:
```bash
cd asteroid-impact-simulator/web
npm install
npm run dev
# → http://localhost:3000
```

**Environment Variables** (optional):

**API** (`api/.env`):
```bash
PORT=7071
NASA_API_KEY=your_key_here  # Optional (uses DEMO_KEY by default)
```

**Frontend** (`web/.env`):
```bash
VITE_API_URL=http://localhost:7071
```

### Testing

```bash
# API tests
cd asteroid-impact-simulator/api
npm test

# Specific validation tests
node src/tests/testSikhotealinMonteCarlo_Phase1_3.js
node src/tests/testSamplingUtils.js
```

---

## 📡 API Documentation

### Public Educational API

**🌐 Interactive Documentation**: [**Open Swagger UI**](https://api.neo.lueger.fr/api-docs) ⭐

**Base URL**: `https://api.neo.lueger.fr`

**Rate Limit**: 100 requests / 15 minutes (per IP)

**No Authentication Required** (educational use)

### Quick Example

```bash
# Simulate 100m asteroid hitting Paris at 20 km/s
curl -X POST https://api.neo.lueger.fr/api/simulate/impact \
  -H "Content-Type: application/json" \
  -d '{
    "diameter": 100,
    "velocity": 20,
    "composition": "rocky",
    "impactLocation": {"lat": 48.8566, "lon": 2.3522}
  }'
```

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/simulate/impact` | POST | Simulate asteroid impact (with Monte Carlo) |
| `/api/simulate/deflection` | POST | Simulate planetary defense |
| `/api/neo/realtime/upcoming` | GET | Upcoming close approaches (JPL SBDB CAD) |
| `/api/neo/realtime/details/:designation` | GET | Asteroid orbital elements |
| `/api/neo/realtime/phas` | GET | Potentially Hazardous Asteroids |
| `/api/neo/realtime/statistics` | GET | Real-time aggregated statistics |

📚 **Full API Guide**: [docs/API_USAGE.md](./docs/API_USAGE.md)

---

## 🏗️ Architecture

```
dev-meteormadness/
├── asteroid-impact-simulator/
│   ├── api/                              # Backend (Node.js/Express)
│   │   ├── src/
│   │   │   ├── services/
│   │   │   │   ├── smallIronCraterPhysics.js    # Pure Holsapple pi-groups
│   │   │   │   ├── atmosphericFragmentation.js  # FCM V2 (Wheeler 2017)
│   │   │   │   ├── monteCarloCrater.js          # Monte Carlo engine
│   │   │   │   ├── craterRouting.js             # Physics-based routing
│   │   │   │   ├── realTimeNeoService.js        # JPL SBDB CAD API
│   │   │   │   └── populationService.js         # Casualty estimation
│   │   │   ├── utils/
│   │   │   │   └── sampling.js                  # Box-Muller Normal, Uniform
│   │   │   └── tests/
│   │   │       ├── testSamplingUtils.js
│   │   │       ├── testSikhotealinMonteCarlo_Phase1_3.js
│   │   │       └── testSikhotealinDeterministic_Phase1_3.js
│   │   └── swagger.yaml                  # OpenAPI 3.0.3 spec
│   │
│   └── web/                              # Frontend (React + TypeScript)
│       ├── src/
│       │   ├── components/
│       │   │   ├── ParameterPanel.tsx
│       │   │   ├── ResultsDashboard.tsx
│       │   │   ├── ImpactMapLeaflet.tsx
│       │   │   └── OrbitalViewMode.tsx
│       │   └── utils/
│       │       └── orbitalMechanics.ts   # Kepler solver
│       └── public/data/
│           └── asteroids.json            # 200 NEOs from JPL SBDB
│
├── docs/                                 # Documentation
│   ├── SCIENTIFIC_DOCUMENTATION.md
│   ├── API_USAGE.md
│   └── ...
│
├── phases/                               # Technical reports
│   ├── PHASE_1_2_COMPLETE_SUMMARY.md    # Bootstrap C calibration
│   └── PHASE_1_3_SUMMARY.md             # C uncertainty integration
│
├── archive/                              # Archived obsolete docs
│   ├── hackathon-montreal-2025/
│   ├── azure-optimization/
│   └── old-versions/
│
├── CONTEXTE_PROJET_v2.0.md              # Post-hackathon context
├── LIMITATIONS.md                        # Technical constraints
├── CHANGELOG.md                          # Version history
└── README.md                             # This file
```

### Tech Stack

**Backend**:
- Node.js, Express
- Pure JavaScript (no TypeScript compilation overhead)
- Statistical sampling (Box-Muller transform)
- Docker (linux/amd64)

**Frontend**:
- React 18, TypeScript, Vite
- Three.js, React Three Fiber (3D visualization)
- Leaflet (2D maps)
- Tailwind CSS (styling)
- Zustand (state management)

**Hosting**:
- **Frontend**: Azure Static Web Apps
- **Backend API**: Azure Container Apps
- **Custom Domain**: neo.lueger.fr

---

## 🗺️ Roadmap

### Current: Phase 1.4 (November 2025)

**Objective**: Resolve technical inconsistencies

- [ ] **v_ref resolution**: Verify correct value (12 vs 15 km/s)
- [ ] **σ_typical refinement**: Calibrate for small irons (inverse analysis)
- [ ] **FCM V2 validation**: Cross-check on more historical events
- [ ] **Angle/velocity sensitivity**: Separate Monte Carlo analysis

**Duration**: 2-3 weeks (30-40 hours)

### Phase 1.5: Complete Monte Carlo (December 2025 - v1.8.0)

**Objective**: All 6 parameters with uncertainties

- [ ] **Diameter uncertainty**: D ~ Normal(μ, 0.10μ)
- [ ] **Velocity uncertainty**: V ~ Normal(μ, 0.05μ)
- [ ] **Angle uncertainty**: θ ~ Uniform(θ-10°, θ+10°)
- [ ] **Density uncertainty**: ρ ~ Normal(μ, 0.15μ)
- [ ] **Full sensitivity analysis**: Sobol indices for variance decomposition
- [ ] **API endpoint**: `/simulate/uncertainty` with N_samples parameter

**Duration**: 6-8 weeks (80-100 hours)

### Phase 2: Dataset Expansion (January-February 2026 - v2.0.0)

**Objective**: Statistical validation on 75+ craters

- [ ] **Crater database**: Expand from 20 to 75 validated craters
- [ ] **Precision improvement**: MAE 32% → <25%
- [ ] **Statistical power**: 95% confidence (N=75 adequate)
- [ ] **Publication**: Peer-reviewed article submission

**Duration**: 8-10 weeks (120-150 hours)

### Phase 3: RK45 Integration (March-April 2026 - v2.5.0)

**Objective**: High-precision numerical fragmentation

- [ ] **RK45 solver**: Adaptive step-size Runge-Kutta
- [ ] **Full 3D geometry**: Orientation, elliptical shape
- [ ] **Precision target**: MAE <20%
- [ ] **Performance**: <5s per simulation (with N=100 Monte Carlo)

**Duration**: 10-12 weeks (150-180 hours)

📋 **Full roadmap**: [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md)

---

## 🤝 Contributing

Contributions welcome! This is an open-source research project.

### How to Contribute

1. **Report bugs/inaccuracies**: [GitHub Issues](https://github.com/ddmp3/meteormadness/issues)
2. **Improve physics models**: See [SCIENTIFIC_DOCUMENTATION.md](./docs/SCIENTIFIC_DOCUMENTATION.md)
3. **Add features**: Fork, develop, submit PR
4. **Educational use**: Adapt for your curriculum (attribution required)

### Development Workflow

```bash
# Clone the repo
git clone https://github.com/ddmp3/meteormadness.git
cd meteormadness

# Create feature branch
git checkout -b feature/your-feature

# Make changes, commit
git add .
git commit -m "feat: your feature description"

# Push and create PR
git push origin feature/your-feature
```

### Code of Conduct

- **Scientific rigor**: Only peer-reviewed models
- **Zero regressions**: No empirical curve-fitting
- **Document limitations**: Be transparent about assumptions
- **Provide references**: Cite all physics models
- **Educational focus**: Write clear code comments

---

## 📄 License

**Apache 2.0 License (Open Source Educational)**

Copyright (c) 2025 MeteorMadness Project

See [LICENSE](./LICENSE) for full terms.

### Key Points

✅ **Free for educational and non-commercial use**
✅ **Attribution required** (NASA data, scientific references)
✅ **Open source** - modify and share
❌ **No warranty** for accuracy
❌ **Not for operational use** (planetary defense missions)

### Data Attribution

**Required Citation**:
```
MeteorMadness - Asteroid Impact Simulator
Open-source research project (v1.7.11+)
Data sources: NASA/JPL-Caltech (SBDB, CAD API), USGS
https://neo.lueger.fr
```

### Educational Disclaimer

This simulator uses **simplified physics models** for educational purposes. Results should NOT be used for:
- Actual planetary defense planning
- Published scientific research (without independent validation)
- Policy or risk assessment decisions

For real planetary defense:
- **NASA Planetary Defense Coordination Office**: https://www.nasa.gov/planetarydefense
- **ESA Space Safety Programme**: https://www.esa.int/Safety_Security/Space_Safety

---

## 🙏 Acknowledgments

### Scientific Community

- Dr. Gareth Collins (Imperial College London) - Impact Earth calculator
- Dr. Keith Holsapple (University of Washington) - Scaling laws theory
- Dr. Lorien Wheeler (NASA JSC) - FCM V2 fragmentation model
- NASA DART Mission Team - Kinetic impactor validation

### Data Providers

- **NASA/JPL**: NEO API, SBDB CAD API, Horizons System
- **USGS**: Elevation and Earthquake data

### Technologies

- React, Three.js, Leaflet
- Node.js, Express
- Azure (hosting), Docker
- Claude Code (development assistance)

---

## 📞 Contact & Support

- **Live Demo**: https://neo.lueger.fr
- **GitHub**: https://github.com/ddmp3/meteormadness
- **Issues**: https://github.com/ddmp3/meteormadness/issues
- **Documentation**: [docs/](./docs/)
- **Project Context**: [CONTEXTE_PROJET_v2.0.md](./CONTEXTE_PROJET_v2.0.md)

### For Educational Institutions

Interested in collaboration, custom scenarios, or higher API limits?
Open an issue on GitHub.

---

## 🌟 Star Us!

If you find this project useful for education or research, please ⭐ star the repo!

---

<div align="center">

### 🌍 Building the World's Reference Asteroid Impact Simulator 🛡️

**Open-Source Research Project - Pure Physics Approach**

*Built with scientific rigor for planetary defense education*

[![License](https://img.shields.io/badge/License-Apache%202.0-green?style=flat-square)](./LICENSE)
[![Live](https://img.shields.io/badge/Demo-Live-success?style=flat-square)](https://neo.lueger.fr)
[![Version](https://img.shields.io/badge/Version-1.7.11-blue?style=flat-square)](./CHANGELOG.md)
[![Precision](https://img.shields.io/badge/MAE-32%25%20→%2020%25%20target-orange?style=flat-square)](./LIMITATIONS.md)

**Version 1.7.11** | October 2025 | Phase 1.3 Complete

</div>