# API Documentation - Asteroid Impact Simulator

## 📚 Documentation Index

### Scientific Documentation

- **[Crater Model Limitations](CRATER_MODEL_LIMITATIONS.md)** ⭐ NEW v1.6.6
  - Comprehensive limitations of Collins et al. (2005) crater scaling
  - Validation results (21.4% avg error)
  - Usage recommendations and uncertainty quantification
  - 8 major limitations explained

### General Documentation

- **[Main Scientific Documentation](/docs/SCIENTIFIC_DOCUMENTATION.md)**
  - All physics formulas and data sources
  - Complete validation against real impacts
  - Orbital mechanics models
  - Scientific references

---

## 🔬 Model Validation Summary (v1.6.6)

### Crater Formation

| Test Case | Error | Status |
|-----------|-------|--------|
| Barringer (simple) | 25.0% | ✅ GOOD |
| Ries (complex) | 14.9% | ✅ EXCELLENT |
| Chicxulub (complex) | 24.1% | ✅ GOOD |
| **Average** | **21.4%** | ✅ **EXCELLENT** |

### Energy Calculation

| Test Case | Error | Status |
|-----------|-------|--------|
| Chelyabinsk (2013) | 19% | ✅ GOOD |
| Tunguska (1908) | ~15% | ✅ GOOD |

### Seismic Magnitude

| Test Case | Error | Status |
|-----------|-------|--------|
| Chelyabinsk | 0.6 mag | ✅ GOOD |
| Tunguska | 0.3 mag | ✅ EXCELLENT |

---

## 📦 API Version History

### v1.6.6 (2025-10-11) - CURRENT
- ✅ Implemented Collins et al. (2005) two-step crater scaling
- ✅ Simple vs complex crater distinction (3.2 km threshold)
- ✅ Fixed catastrophic crater formula error (99.6% → 21.4%)
- ✅ Comprehensive scientific documentation

### v1.6.5 (2025-10-11)
- ✅ Fixed Paris duplication (arrondissements merged)
- ✅ Fixed "NaNK" display bug in casualties
- ✅ City deduplication in populationCityService

### v1.6.4 and earlier
- ⚠️ Crater formula had 99.6% error (FIXED in v1.6.6)

---

## 🎯 Key Scientific Improvements

### What Changed in v1.6.6

**Before** (v1.6.5):
```javascript
// Single formula, no crater type distinction
const D = 1.8 × (E / 10^15)^0.25
// Barringer error: 99.6% ❌
```

**After** (v1.6.6):
```javascript
// Step 1: Transient crater
const D_transient = 472 × (E / 10^15)^0.25

// Step 2: Simple vs Complex
if (D_transient < 3.2 km) {
    D_final = 1.25 × D_transient  // SIMPLE
} else {
    D_final = 1.17 × D_transient^1.13  // COMPLEX
}
// Barringer error: 25% ✅
```

---

## 📖 How to Use This Documentation

### For Developers

1. Read [CRATER_MODEL_LIMITATIONS.md](CRATER_MODEL_LIMITATIONS.md) first
2. Understand uncertainty ranges (±20-30% typical)
3. Check [Main Scientific Documentation](/docs/SCIENTIFIC_DOCUMENTATION.md) for formulas
4. Review validation results before making claims

### For Scientists/Judges

1. See validation tables (section above)
2. Read limitations document for model boundaries
3. Check scientific references in main documentation
4. Compare with NASA/ESA standards (Collins et al. 2005)

### For Users

1. Interpret results as ranges, not exact values
2. Understand model assumes sedimentary rock target
3. Fresh craters (before erosion) are calculated
4. Model valid for Earth only (not Moon, Mars, etc.)

---

## 🔗 Related Documentation

- **[/docs/SCIENTIFIC_DOCUMENTATION.md](/docs/SCIENTIFIC_DOCUMENTATION.md)** - Main scientific doc
- **[/docs/README.md](/docs/README.md)** - Project overview
- **[/terraform/README.md](/terraform/README.md)** - Infrastructure
- **API Code**: [/api/src/services/physicsEngine.js](/asteroid-impact-simulator/api/src/services/physicsEngine.js)

---

## 📧 Contact & Contributions

**Questions about scientific accuracy?**
- Open GitHub issue: https://github.com/ddmp3/neo-asteroid-impact/issues
- Tag with: `scientific`, `documentation`, `crater-model`

**Found a limitation not documented?**
- Add to [CRATER_MODEL_LIMITATIONS.md](CRATER_MODEL_LIMITATIONS.md)
- Cite scientific source
- Quantify impact if possible

---

## ⚖️ License & Attribution

**Data Sources**:
- NASA/JPL (Near-Earth Object data)
- USGS (Elevation, seismic data)
- GeoNames (Population data)

**Scientific References**:
- Collins et al. (2005) - Crater scaling
- Holsapple & Schmidt (1982) - Pi-scaling theory
- Melosh (1989) - Impact cratering textbook

**Model**:
- Educational use ✓
- Research citations required
- Not for operational planetary defense

---

**Last Updated**: 2025-10-11
**API Version**: v1.6.6
**Status**: Production (DEV environment)
