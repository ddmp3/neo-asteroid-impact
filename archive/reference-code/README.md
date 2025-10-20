# Reference Code

Legacy reference code from early project development.

## Contents

### luis_code_reference/
Original code reference from Luis (NASA Space Apps Challenge preparation).

**Files:**
- `asteroid-visualizer.js` (610 KB) - 3D asteroid visualization
- `kinetic-impactor.js` - Kinetic impactor deflection simulation
- `trajectory-simulator.js` - Orbital trajectory calculations
- `top200_closest_asteroids_FINAL.json` (271 KB) - NASA NEO dataset
- `index.html` - Demo HTML interface
- `test-kinetic-impactor.js` - Test suite

**Status:** ⚠️ **Not used in v2.0.0**

This code was used as reference during initial development but has been replaced by:
- Modern physics models (Holsapple, FCM V2)
- NASA NEO API integration (real-time data)
- TypeScript + React frontend
- Node.js backend with Express

**Purpose:** Historical reference only. Do not use in production.

## Migration Notes

This code was archived on October 18, 2025 during v2.0.0 cleanup.
Original location: `luis_code_reference/` (project root)

If you need orbital mechanics code, see instead:
- `asteroid-impact-simulator/api/src/services/realTimeNeoService.js`
- `asteroid-impact-simulator/web/src/services/nasaDataLoader.ts`
