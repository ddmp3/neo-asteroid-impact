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

### Current Development Version: v1.6.8

---

## [1.6.8] - 2025-10-11

### Fixed
- **CRITICAL:** Added `craterType` and `transientDiameter` to API response
  - Properties were calculated but not returned in modified crater object
  - Now returns "simple" or "complex" crater type
  - File: `api/src/services/physicsEngine.js:480-482`

- **CRITICAL:** Implemented hybrid ocean detection system for accurate tsunami simulations
  - Primary: USGS Elevation API (elevation < 0 = ocean)
  - Fallback: Geographic heuristics for major oceans (Pacific, Atlantic, Indian, Arctic, Southern)
  - Addresses USGS API timeout issues and ensures tsunami calculations work globally
  - File: `api/src/services/physicsEngine.js:380-441`

- Improved Atlantic Ocean heuristic detection (excludes Caribbean region)

### Added
- Comprehensive tsunami model documentation (Ward & Asphaug 2000 formula)
- API documentation index with validation summary
- Hybrid ocean detection with intelligent fallback system

### Validation
- Tsunami model: 2.4% average error (Apophis 1.2%, Chicxulub 3.6%)
- Crater model: 21.4% average error (Barringer 25%, Ries 14.9%, Chicxulub 24.1%)

---

## [1.6.7] - 2025-10-10

### Added
- **Tsunami Physics Model:** Implemented Ward & Asphaug (2000) scientific formula
  - Transient cavity calculation with angle correction
  - Initial wave height based on cavity radius: H_initial = 0.28 × (D_transient/2)
  - Distance-based attenuation (R⁻⁰·⁵ decay)
  - Affected radius: 45 × waterDepth × Y_kilotons^0.25
  - File: `api/src/services/physicsEngine.js:288-378`

### Changed
- Replaced simplified tsunami model with peer-reviewed scientific formula
- Tsunami calculations now based on transient crater dimensions
- Wave height capped at water depth for physical realism

---

## [1.6.6] - 2025-10-10

### Added
- **Crater Physics Model:** Implemented Collins et al. (2005) crater scaling law
  - Transient crater: D_transient = K × E^0.25 (K = 472, calibrated on Barringer)
  - Simple crater (D < 3.2 km): Final diameter = 1.25 × D_transient
  - Complex crater (D ≥ 3.2 km): Final diameter = 1.17 × (D_transient/1000)^1.13 × 1000
  - Depth-to-diameter ratio: 0.2 (simple), 0.143 (complex)
  - File: `api/src/services/physicsEngine.js:131-169`

- Crater type distinction (simple vs complex) based on 3.2 km threshold
- Comprehensive crater model limitations documentation

### Validation
- Barringer: 25% error (1193m predicted vs 1186m actual)
- Ries: 14.9% error (23.4km predicted vs 24km actual)
- Chicxulub: 24.1% error (149km predicted vs 180km actual)
- **Average: 21.4% error** ✅

### Documentation
- Added `docs/crater_model_limitations.md`
- Updated `docs/SCIENTIFIC_DOCUMENTATION.md` for v1.6.6

---

## [1.6.5] - 2025-10-09

### Fixed
- **City Deduplication:** Implemented intelligent deduplication for cities with arrondissements
  - Paris arrondissements (20 districts) now counted as single city
  - Marseille, Lyon, and other multi-district cities deduplicated
  - Prevents double-counting of populations in affected cities lists
  - File: `api/src/services/populationCityService.js`

---

## [1.6.4] - 2025-10-09

### Added
- **GeoNames City Database:** Replaced population grid with optimized city database
  - 32,686 cities worldwide (population > 15,000 each)
  - Fast bounding box filtering + Haversine distance calculation
  - Exponential decay casualty model (95% center → 10% edge):
    - 0-10% radius: 95% casualty rate
    - 10-40% radius: 95% → 70% (linear decay)
    - 40-70% radius: 70% → 40% (linear decay)
    - 70-100% radius: 40% → 10% (linear decay)
  - File: `api/src/services/populationCityService.js`

### Changed
- Replaced PopulationGridService with GeoNames-based PopulationCityService
- Improved performance: ~2 seconds for global city analysis

---

## [1.6.3] - 2025-10-08

### Fixed
- Added loading state to Simulate button to prevent multiple clicks
- Increased frontend API timeout from 30s to 60s for Azure cold starts
- Added 800ms timeout to USGS Elevation API with intelligent fallback

---

## [1.6.2] - 2025-10-08

### Added
- Global population grid model for casualty estimation
- Integrated population density data for accurate regional impact

### Fixed
- CORS configuration: Added localhost:3001 to allowed origins for dev frontend

---

## [1.6.1] - 2025-10-08

### Fixed
- **Seismic Accuracy Improvement:** Corrected Gutenberg-Richter constant
  - Changed from -4.8 to -5.87 (empirically calibrated)
  - Implemented scientific seismic felt radius formula
  - Corrected seismic radiusKm calculation with realistic values
  - File: `api/src/services/physicsEngine.js`

---

## [1.6.0] - 2025-10-07 (Production)

### Status
- **Production URL:** https://meteormadness.earth
- **GitHub:** https://github.com/TawbeBaker/Cyber-and-Space
- **Known Issue:** Seismic radiusKm calculation gives absurd values (7+ billion km for M11+)

### Features
- Complete asteroid impact simulation
- NASA NEO API integration
- Real-time casualty calculations
- Interactive Leaflet maps
- Swagger API documentation
- Educational tooltips and scenarios
- Defend Earth game mode

---

## Development Guidelines

### When to increment versions:
1. **After each working modification in dev:** Increment letter (a→b→c...→z)
2. **When merging to production:**
   - Major changes (new features, breaking changes) → v1.7.0
   - Minor fixes only → v1.6.1

### Commit Message Format:
```
<type>: <description>

[optional body]

Version: v1.6.1-<letter>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### Testing Requirements:
- All changes must be tested in dev before version increment
- API changes require endpoint validation
- Frontend changes require browser testing
- Performance impact must be documented in LIMITATIONS.md
