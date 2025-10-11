# Simulator Limitations & Design Decisions

**Project:** Asteroid Impact Simulator - NASA Space Apps Challenge 2025
**Version:** 1.6.1-a (Development)
**Last Updated:** 2025-10-11

---

## Overview

This document outlines the technical limitations, performance constraints, and design decisions made to balance **scientific accuracy**, **performance**, **cost efficiency**, and **user experience**.

---

## 1. Performance Constraints

### 1.1 Azure Hosting Costs
**Constraint:** Must minimize Azure compute costs while maintaining responsive user experience.

**Limitations:**
- **API Response Time:** Target < 3 seconds per simulation
- **Memory Usage:** Container Apps limited to 1GB RAM per instance
- **CPU:** 0.5 vCPU per container instance

**Design Decisions:**
- Simplified grid-based population sampling (vs. high-resolution global datasets)
- Pre-calculated city distances (45 major cities) instead of real-time global population queries
- Disabled scientific casualty model by default (requires 10x more memory)
- Capped maximum simulation iterations to prevent timeouts

### 1.2 User Experience
**Constraint:** Users will abandon the platform if simulations take too long.

**Limitations:**
- Maximum acceptable wait time: ~5 seconds
- Mobile users have lower tolerance for delays
- Educational context requires immediate feedback for learning

**Design Decisions:**
- Prioritize speed over extreme precision for edge cases
- Use analytical formulas instead of numerical integration where possible
- Cache NASA NEO data (daily refresh vs. real-time queries)

---

## 2. Scientific Accuracy Tradeoffs

### 2.1 Seismic Effects Calculation

**Current Status (v1.6.1-a):** UNDER REVIEW

**Production Formula (v1.6.0):**
```javascript
radiusKm = Math.pow(10, magnitude - 1)
```
**Problem:** Produces physically impossible values
- M11.9 → 7,943,282,347 km (impossible - Earth diameter is 12,742 km)

**Dev Formula (v1.6.1-a - TEMPORARY):**
```javascript
radiusKm = Math.min(10000, 1500 * Math.pow(10, (magnitude - 8) / 3))
```
**Problem:** Too aggressive capping, underestimates global impacts
- M11.9 → 10,000 km (too low for extinction-level event)

**Target:** Implement Collins & Melosh (2005) scientific formula
- Reference: "Earth Impact Effects Program" (Meteoritics & Planetary Science)
- Expected range: M7→400km, M8→1000km, M9→3000km, M10+→8000-20000km

**Limitation Rationale:**
- Seismic wave attenuation in Earth's mantle limits global propagation
- Maximum realistic felt radius ≈ half Earth's circumference (20,000 km)
- Must account for wave type (P-waves, S-waves, surface waves) and attenuation

### 2.2 Population Density Data

**Current Approach:** 45 pre-loaded major cities with fixed populations

**Limitations:**
- Does not use real-time census data
- Missing rural populations between cities
- City populations are 2023 estimates (static)

**Alternatives Considered:**
1. ✅ **NASA SEDAC GPW (Gridded Population of the World)**
   - Pro: High resolution (30 arc-seconds)
   - Con: Requires 8GB+ dataset download, slow queries
   - **Decision:** Too memory-intensive for Azure budget

2. ✅ **WorldPop API**
   - Pro: Real-time global data
   - Con: Rate-limited, requires internet for each query
   - **Decision:** Unreliable for user-facing application

3. ✅ **Current System (45 cities)**
   - Pro: Fast, predictable, covers major population centers
   - Con: Underestimates rural casualties
   - **Decision:** Acceptable for educational purposes

**Documentation:**
- Casualty estimates marked as "approximate"
- Note displayed: "Based on major urban centers within blast radius"

### 2.3 Crater Formation

**Current Approach:** Modified Collins et al. (2005) scaling laws

**Simplifications:**
- Assumes uniform terrain density (2500 kg/m³)
- Limited terrain types (ocean, land, altitude categories)
- No subsurface geology modeling

**Limitation Rationale:**
- Real crater formation depends on:
  - Subsurface layering (sediment, bedrock, water table)
  - Impact angle in 3D (we use simplified 2D projection)
  - Pre-existing topography
- Full physics simulation would require finite element modeling (hours of computation)

**Accuracy:** ±30% for diameter/depth estimates (acceptable for educational tool)

---

## 3. API Rate Limits

### 3.1 NASA NEO API
**Rate Limit:** 1000 requests/hour (NASA API key)

**Mitigation:**
- Cache NEO feed data for 24 hours
- Pre-load sample asteroids (Bennu, Apophis, Didymos, etc.)
- Fallback to cached data if API unavailable

### 3.2 USGS Elevation API
**Rate Limit:** Unknown (assumed public service limits)

**Mitigation:**
- Batch requests where possible
- Implement exponential backoff retry logic
- Graceful degradation (assume sea level if API fails)

---

## 4. Frontend Performance

### 4.1 3D Visualizations
**Status:** Disabled by default in production (v1.6.0)

**Reason:**
- Three.js bundle size: +500KB
- Mobile devices struggle with WebGL rendering
- Not critical for core simulation functionality

**Future:** Enable as opt-in feature for desktop users

### 4.2 Map Rendering
**Current:** Leaflet (lightweight, 2D)

**Alternatives Considered:**
- Google Maps 3D: Too heavy, requires API billing
- Cesium 3D Globe: 3MB+ bundle, slow on mobile

---

## 5. Known Bugs & Technical Debt

### 5.1 Scientific Casualty Model (Disabled)
**File:** `api/src/services/casualtyModel.js`

**Issue:** Causes out-of-memory crashes for large impacts
- Implements Rumpf et al. (2017) probit lethality functions
- Requires grid sampling at high resolution
- Memory usage: 800MB+ for M10+ impacts

**Status:** Disabled via `USE_SCIENTIFIC_CASUALTIES=false` flag

**Future:** Optimize grid sampling or move to background job

### 5.2 TypeScript Type Safety
**Issue:** Many components use `any` type (e.g., `ResultsDashboard.tsx:72`)

**Impact:** Runtime errors not caught at compile time

**Future:** Full TypeScript refactor for v2.0

---

## 6. Educational vs. Scientific Balance

**Primary Audience:** Students, educators, general public (not PhD seismologists)

**Design Philosophy:**
- **Accuracy:** Good enough to teach correct concepts
- **Precision:** ±20-30% acceptable for order-of-magnitude understanding
- **Pedagogy:** Clear explanations > perfect numbers

**Example:**
- User sees "Fireball: 15.9 km" → Teaches scale of vaporization zone
- Actual scientific range: 14-18 km → Precision less important than concept

---

## 7. Future Improvements (Roadmap)

### v1.7 (Next Minor Release)
- [ ] Implement Collins & Melosh (2005) seismic formulas
- [ ] Add scientific references to each calculation
- [ ] Improve CORS configuration documentation

### v2.0 (Major Release)
- [ ] Real-time population density API integration
- [ ] 3D crater visualization (opt-in)
- [ ] Multi-impact scenarios
- [ ] Climate impact modeling (dust, temperature)

---

## 8. References

### Scientific Papers
1. Collins, G. S., Melosh, H. J., & Marcus, R. A. (2005). *Earth Impact Effects Program*. Meteoritics & Planetary Science, 40(6), 817-840.
2. Rumpf, C. M., Lewis, H. G., & Atkinson, P. M. (2017). *Asteroid impact effects and their immediate hazards for human populations*. Geophysical Research Letters, 44(8), 3433-3440.
3. Schultz, P. H., & Gault, D. E. (1975). Seismic effects from major basin formations on the moon and mercury. *The Moon*, 12(2), 159-177.

### Tools & APIs
- NASA NEO API: https://api.nasa.gov
- Earth Impact Effects Program: https://impact.ese.ic.ac.uk
- USGS Earthquake Hazards: https://earthquake.usgs.gov

---

**Document Maintainer:** Development Team
**Review Frequency:** After each major version release
**Questions/Suggestions:** GitHub Issues
