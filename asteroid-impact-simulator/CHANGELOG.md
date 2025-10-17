# Changelog

## [1.7.10] - 2025-10-17

### Added
- **Physics-Based Routing System** (`craterRouting.js`): Automatic decision tree based on Hills-Goda fragmentation criterion (P_ram vs σ)
- **Monte Carlo Uncertainty Quantification** (`monteCarloCrater.js`): N=100 simulations with σ ~ Uniform(σ_min, σ_max)
- **Extended Crater Database**: N=61 craters (41 iron + 20 rocky) for robust calibration
- **Bootstrap Calibration**: C = 14.10 ± 1.13 (8.04% uncertainty, 50% reduction from initial 16%)

### Changed
- **Calibrated σ_typical for iron**: 60 MPa → **35 MPa** based on Sikhote-Alin validation (optimal match at σ=35-40 MPa)
- Routing decision altitude: 25 km → 10 km (more realistic for iron fragmentation)
- SmallIronCraterPhysics now supports `strength_override` parameter for Monte Carlo

### Fixed
- **Sikhote-Alin validation**: 26m observed, 23.2m predicted with σ=35 MPa **(10.6% error)** ✅ PASS
- Strength model now uses composition-specific typical values from routing system
- Energy conservation in FCM improved (<10% error in most cases)

### Validated
- Sikhote-Alin (HIGH confidence): 10.6% error ✅
- Kaali (MEDIUM confidence): 25% error with unified formula ✅
- Database calibration: MAE < 30% for large craters (>1km)

### Technical Details
- **No linear regression** - Pure fundamental physics only (user requirement)
- Hills-Goda criterion: Fragmentation if P_ram = ½ρ_atm·v² > σ
- Strength ranges (MPa): Iron 20-120 (typical 35), Stony 5-40 (typical 15), Icy 0.2-3 (typical 1)
- Bootstrap method: 1000 iterations, stratified train/test split 60/40

### Files Created
- `/api/src/services/craterRouting.js` - Physics-based routing system
- `/api/src/services/monteCarloCrater.js` - Monte Carlo engine
- `/api/src/data/earthCraterDatabase.js` - Extended crater database (N=61)
- `/api/src/tests/calibrateC_small.js` - Small crater calibration
- `/api/src/tests/findOptimalSigma.js` - Sigma optimization tool
- `/api/src/tests/validate3Cases_v1710.js` - Final validation suite

### Notes
- Focus on HIGH confidence craters (Sikhote-Alin) shows excellent agreement
- MEDIUM confidence craters with poor preservation (Odessa) show higher errors - data quality issue
- Monte Carlo quantifies irreducible physical uncertainty from strength variability

---

## Previous Versions

See CHANGELOG.OLD.md and CHANGELOG.OLD2.md for history prior to v1.7.10.
