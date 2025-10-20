# 🌌 Asteroid Impact Simulator - MeteorMadness

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.2-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-Apache%202.0-green?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Production-success?style=for-the-badge)
![Scientific](https://img.shields.io/badge/Approach-Pure%20Physics-blueviolet?style=for-the-badge)

**🌍 Live Demo**: [neo.lueger.fr](https://neo.lueger.fr)
**🚀 API**: [api.neo.lueger.fr](https://api.neo.lueger.fr)
**📊 Accuracy**: Rocky 13.3% MAE | Iron 20.7% MAE

</div>

---

## 📖 Overview

**MeteorMadness** is an open-source asteroid impact simulator built with **pure fundamental physics** and validated on 61 historical craters. Originally developed for NASA Space Apps Challenge 2025 (Montreal), the project has evolved into a scientifically rigorous educational tool.

### Key Features

✅ **Energy-Based Crater Scaling** (Holsapple & Schmidt 1982)
✅ **Atmospheric Fragmentation** (FCM V2 - Wheeler et al. 2017)
✅ **Monte Carlo Uncertainty** (100+ samples, Box-Muller sampling)
✅ **61 Historical Crater Validation** (MAE ~18%)
✅ **Real NASA Data** (JPL SBDB, 200+ Near-Earth Objects)
✅ **3D Orbital Visualization** (Three.js, Keplerian mechanics)
✅ **Educational Content** (16 learning modules, game mode)

---

## 🚀 Quick Start

### Live Demo

Visit **[neo.lueger.fr](https://neo.lueger.fr)** - No installation required!

### API Access

```bash
# Simulate 100m rocky asteroid hitting Paris
curl -X POST https://api.neo.lueger.fr/api/simulate/impact \
  -H "Content-Type: application/json" \
  -d '{
    "diameter": 100,
    "velocity": 20,
    "angle": 45,
    "composition": "rocky",
    "impactLocation": {"lat": 48.8566, "lon": 2.3522}
  }'
```

### Local Development

**Backend API:**
```bash
cd asteroid-impact-simulator/api
npm install
npm start
# → http://localhost:7071
```

**Frontend:**
```bash
cd asteroid-impact-simulator/web
npm install
npm run dev
# → http://localhost:3000
```

---

## 📊 Current Status (v2.0.2)

**Released**: October 2025
**Deployment**: Azure Container Apps + Static Web Apps

### Validation Metrics

| Category | Dataset | MAE | Status |
|----------|---------|-----|--------|
| **Rocky Craters** | 19 impacts | **13.3%** | ✅ Excellent |
| **Iron Craters (≥50m)** | 3 impacts | **20.7%** | ✅ Good |
| **Iron Craters (<50m)** | 3 impacts | **35%** | ⚠️ Needs work |
| **Combined** | 61 craters | **~18%** | ✅ Target <20% |

**Top Performers** (Error <5%):
- Chesapeake Bay (85 km): 0.48%
- Bosumtwi (10.5 km): 1.90%
- Chicxulub (180 km): 2.78%
- Wabar (116 m): 16.1%
- Sikhote-Alin (26 m): 11.8%

### Architecture

**Backend** (Node.js + Express):
- Energy-based crater scaling (K constants: 380/520/650)
- FCM V2 atmospheric fragmentation
- Monte Carlo uncertainty propagation
- Real-time NASA NEO data integration

**Frontend** (React + TypeScript):
- Interactive Leaflet maps
- 3D orbital visualization (Three.js)
- Real-time impact simulation
- Educational game mode

**Infrastructure**:
- Azure Container Apps (API)
- Azure Static Web Apps (Frontend)
- Docker containerization
- Custom domain: neo.lueger.fr

---

## 🔬 Scientific Approach

### Crater Scaling Formula

**Energy-Based Approach** (Holsapple & Schmidt 1982):

```
D_transient = K × (E / 10^15)^0.25 × sin(θ)^(1/3)
```

Where:
- **K** = Composition-dependent constant:
  - **380** (iron ≥50m)
  - **520** (rocky/stony)
  - **650** (icy/comet)
- **E** = Impact energy (Joules)
- **θ** = Impact angle from horizontal

**Why Energy-Scaling?**
- Same approach as Collins & Melosh (2005) Earth Impact Effects calculator
- Validated on 61 craters (MAE 13-21% depending on composition)
- More intuitive for users (energy vs momentum)

**References**:
- Holsapple & Schmidt (1982): *Journal of Geophysical Research*, 87(B3), 1849-1870
- Collins et al. (2005): *Meteoritics & Planetary Science*, 40(6), 817-840

### Atmospheric Fragmentation

**FCM V2** (Wheeler et al. 2017):
- Hills-Goda fragmentation criterion (P_ram vs σ)
- Progressive debris cloud formation
- Weibull strength scaling
- Energy conservation <7% error

**Validated**:
- Tunguska (1908): 8 km altitude ✅
- Chelyabinsk (2013): 23 km altitude ✅

### Monte Carlo Uncertainty

**Implementation**:
- Box-Muller Normal distribution sampling
- 100 samples per simulation
- Reproducible (seed=42)

**Parameters**:
- **C (crater constant)**: N(14.10, 1.13) - 8% uncertainty
- **σ (strength)**: U(20, 120) MPa - material range

**Outputs**:
- P10, P50, P90 percentiles
- 68%, 95%, 99.7% confidence intervals
- Mean, median, mode, std dev

---

## 📁 Project Structure

```
dev-meteormadness/
├── asteroid-impact-simulator/
│   ├── api/                    # Backend (Node.js + Express)
│   │   ├── src/
│   │   │   ├── services/
│   │   │   │   ├── physicsEngine.js           # Main crater calculations
│   │   │   │   ├── smallIronCraterPhysics.js  # Iron <50m (FCM)
│   │   │   │   ├── fragmentCloudModel.js      # FCM V2
│   │   │   │   ├── monteCarloCrater.js        # Uncertainty engine
│   │   │   │   └── realTimeNeoService.js      # NASA API
│   │   │   └── index.js                       # Express app
│   │   └── swagger.yaml                # OpenAPI 3.0 spec
│   │
│   └── web/                    # Frontend (React + TypeScript)
│       ├── src/
│       │   ├── components/
│       │   │   ├── ParameterPanel.tsx
│       │   │   ├── ResultsDashboard.tsx
│       │   │   ├── ImpactMapLeaflet.tsx
│       │   │   └── OrbitalViewMode.tsx
│       │   └── utils/
│       │       └── orbitalMechanics.ts
│       └── public/data/
│           └── asteroids.json          # 200 NEOs (NASA)
│
├── .claude/                    # Development notes (not published)
│   └── temp/                   # Temporary analysis files
│
├── CHANGELOG.md               # Version history
├── HISTORY.md                 # Project evolution
├── LIMITATIONS.md             # Technical constraints
└── README.md                  # This file
```

---

## 🗺️ Recent Development

### Phase 1.4.3 (October 2025) - COMPLETED ✅

**Objective**: Code cleanup and architecture clarification

**Achievements**:
1. ✅ Identified and resolved conflicting crater calculation systems
2. ✅ Documented K-based energy scaling approach
3. ✅ Restored stable baseline (MAE ~18%)
4. ✅ Deployed to production (Azure revision 0000049)

**Key Decision**: Keep energy-scaling (K constants) vs pure pi-group momentum scaling
- **Rationale**: Same approach as Collins & Melosh (2005), empirically validated
- **Performance**: 13.3% MAE rocky, 20.7% MAE iron large
- **Documentation**: Technical notes moved to `.claude/temp/`

### Known Limitations

⚠️ See [LIMITATIONS.md](LIMITATIONS.md) for complete details

**Model Constraints**:
- Spherical impactors only (no shape/orientation effects)
- Uniform target density (no subsurface layering)
- Small iron fragmentation over-estimated (Wolfe Creek: 78% error)
- Population limited to 45 major cities

**Accuracy Classification**:
- ✅ **Suitable for**: Education, concept demos, relative comparisons
- ❌ **NOT for**: Operational planetary defense, mission planning

---

## 🎯 API Reference

**Base URL**: `https://api.neo.lueger.fr`

**Rate Limit**: 100 requests / 15 min (per IP)

**No Authentication** (educational use)

### Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/simulate/impact` | POST | Asteroid impact simulation |
| `/api/simulate/deflection` | POST | Planetary defense simulation |
| `/api/neo/feed` | GET | Upcoming close approaches |
| `/api/neo/impactor-2025` | GET | Sample impactor scenarios |

**Interactive Docs**: Visit [api.neo.lueger.fr](https://api.neo.lueger.fr) for Swagger UI

---

## 🤝 Contributing

Contributions welcome! See [HISTORY.md](HISTORY.md) for project evolution.

### How to Contribute

1. **Report Issues**: [GitHub Issues](https://github.com/ddmp3/neo-asteroid-impact/issues)
2. **Improve Physics**: Fork → develop → PR
3. **Educational Use**: Free with attribution

### Development Workflow

```bash
# Clone repo
git clone https://github.com/ddmp3/neo-asteroid-impact.git

# Create feature branch
git checkout -b feature/your-feature

# Make changes, test locally

# Commit with clear messages
git commit -m "feat: description"

# Push and create PR
git push origin feature/your-feature
```

### Code Standards

- ✅ Scientific rigor (peer-reviewed models only)
- ✅ No empirical regressions
- ✅ Document all assumptions
- ✅ Provide references
- ✅ Write clear code comments

---

## 📄 License

**Apache 2.0** (Open Source Educational)

Copyright © 2025 MeteorMadness Project

✅ Free for educational/non-commercial use
✅ Attribution required
✅ Modify and share
❌ No warranty for accuracy
❌ Not for operational planetary defense

### Required Citation

```
MeteorMadness - Asteroid Impact Simulator
Version 2.0.2 (October 2025)
Data: NASA/JPL SBDB, USGS
https://neo.lueger.fr
```

---

## 🙏 Acknowledgments

**Scientific References**:
- Dr. Keith Holsapple (U. Washington) - Scaling laws
- Dr. Gareth Collins (Imperial College) - Earth Impact Effects
- Dr. Lorien Wheeler (NASA JSC) - FCM V2
- NASA DART Mission - Kinetic impactor validation

**Data Providers**:
- NASA/JPL: SBDB, CAD API, Horizons
- USGS: Elevation data

**Technologies**:
- React, Three.js, Leaflet, Node.js, Express
- Azure (hosting), Docker
- Claude Code (development assistance)

---

## 📞 Contact

- **Live Demo**: https://neo.lueger.fr
- **GitHub**: https://github.com/ddmp3/neo-asteroid-impact
- **Issues**: https://github.com/ddmp3/neo-asteroid-impact/issues

For educational collaboration or API limits, open a GitHub issue.

---

<div align="center">

### 🌍 Educational Asteroid Impact Simulator 🛡️

**Open-Source Research Project - Pure Physics**

[![License](https://img.shields.io/badge/License-Apache%202.0-green)](LICENSE)
[![Live](https://img.shields.io/badge/Demo-Live-success)](https://neo.lueger.fr)
[![Version](https://img.shields.io/badge/Version-2.0.2-blue)](CHANGELOG.md)
[![Accuracy](https://img.shields.io/badge/MAE-18%25-orange)](LIMITATIONS.md)

**Built for Planetary Defense Education**

</div>
