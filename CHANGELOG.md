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

### Current Development Version: v1.6.1-a

---

## [1.6.1-a] - 2025-10-11

### Fixed
- **CRITICAL:** Frontend crash when rendering casualties zones
  - Added null check before `Object.entries(casualties.zones)`
  - Added TypeScript type annotation for zone parameter
  - File: `web/src/components/ResultsDashboard.tsx`

- **CRITICAL:** Frontend crash on crater property access
  - Changed `crater.diameter` → `crater.modifiedDiameter`
  - Changed `crater.depth` → `crater.modifiedDepth`
  - File: `web/src/components/ResultsDashboard.tsx`

- **MAJOR:** CORS configuration for dev frontend
  - Added `https://jolly-tree-0b50d3d0f.1.azurestaticapps.net` to allowed origins
  - File: `api/src/index.js`

### Changed
- **UI:** Map instruction overlay improved
  - Changed from large centered blocking message to small bottom banner
  - Reduced text size from `text-lg` to `text-xs`
  - Files: `ImpactMapLeaflet.tsx`, `GoogleImpactMap.tsx`, `SimpleImpactMap.tsx`

### Known Issues
- Seismic `radiusKm` calculation needs scientific validation
  - Current formula produces unrealistic values for high magnitudes
  - Requires implementation of Collins & Melosh (2005) formulas
  - See: ERROR_REPORT.md

---

## [1.6.0] - Production (Current)

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
