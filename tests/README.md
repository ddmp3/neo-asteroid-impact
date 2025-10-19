# Tests

Test suite for NEO Asteroid Impact Simulator v2.0

## Structure

```
tests/
├── calibration/     # Calibration tests for physics parameters
│   ├── blast-comparison.js
│   ├── blast-zone-calibration.js
│   ├── blast-zone-collins-calibration.js
│   └── test-tunguska-calibration.js
└── validation/      # Validation against known impact events
    ├── test-azure-iron-meteorites.js
    ├── test-craters-v1.6.32.js
    └── test-hills-goda-v1.6.31.js
```

## Calibration Tests

Physics parameter calibration against validated datasets:
- **Blast zone calculations** - Collins et al. (2005) calibration
- **Tunguska event** - 1908 airburst baseline

## Validation Tests

Validation against historical impact events:
- **Iron meteorites** - Sikhote-Alin, Barringer
- **Crater scaling** - 20 documented craters
- **Hills-Goda fragmentation** - Atmospheric entry physics

## Running Tests

```bash
cd tests/calibration
node blast-zone-calibration.js

cd tests/validation
node test-craters-v1.6.32.js
```

## Dependencies

Tests require:
- Node.js >= 18.0.0
- Access to API at `http://localhost:7071` or production endpoint

## Current Status (v2.0.0)

- ✅ 20 crater validation dataset
- ✅ Tunguska/Chelyabinsk airburst calibration
- ⚠️ MAE: 32% (target <20%)
- 🔄 Expanding to 75 craters in Phase 2

See [LIMITATIONS.md](../LIMITATIONS.md) for known issues.
