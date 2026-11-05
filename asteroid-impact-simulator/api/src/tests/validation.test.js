/**
 * Validation suite (v2.1.0) - guards the numbers published in docs/VALIDATION.md.
 *
 * 1. Atmospheric entry vs JPL/CNEOS fireballs: calibration on events before
 *    2016, scoring on 2016+ only (hold-out). Independent, measured data.
 * 2. Craters: consistency checks only (impactor sizes of natural craters come
 *    mostly from scaling laws, so they cannot validate a scaling law).
 */
const { calibrate } = require('../../scripts/calibrate-stone-strength');
const { craterChecks, summarise } = require('../../scripts/validation-report');
const { STONE_STRENGTH_PA, STONE_STRENGTH_DECILES_PA } = require('../services/collinsEntry');

describe('Atmospheric entry vs CNEOS fireballs (hold-out 2016+)', () => {
    let cal;
    beforeAll(() => { cal = calibrate(); });

    test('the strength used by the simulator is the one the calibration script produces', () => {
        expect(cal.nominalStrengthPa).toBeCloseTo(STONE_STRENGTH_PA, -3);
        expect(cal.decilesPa).toEqual(STONE_STRENGTH_DECILES_PA);
    });

    test('calibration and hold-out sets do not overlap', () => {
        expect(cal.nTrain + cal.nTest).toBe(360);
        expect(cal.nTest).toBeGreaterThan(200);
    });

    test('hold-out burst altitude: MAE < 8 km and |bias| < 3 km', () => {
        expect(cal.calibrated.test.maeKm).toBeLessThan(8);
        expect(Math.abs(cal.calibrated.test.biasKm)).toBeLessThan(3);
    });

    test('calibrated model beats the uncalibrated Collins strength on the hold-out', () => {
        expect(cal.calibrated.test.maeKm).toBeLessThan(cal.collins.test.maeKm);
    });

    test('Monte Carlo strength band (p05-p95) covers at least 80% of hold-out events', () => {
        expect(cal.holdOutCoverageP05P95).toBeGreaterThanOrEqual(0.8);
    });
});

describe('Craters (consistency checks, no parameter fitted on craters)', () => {
    let rows, groups;
    beforeAll(async () => {
        rows = await craterChecks();
        groups = summarise(rows);
    }, 120000);

    test('large stony HIGH-confidence craters: at least 4 of 5 inside the model band', () => {
        const g = groups.find(x => x.label === 'HIGH, single crater, stony');
        expect(g.n).toBe(5);
        expect(g.inBand).toBeGreaterThanOrEqual(4);
    });

    test('large stony HIGH-confidence craters: nominal MAE below 20%', () => {
        const g = groups.find(x => x.label === 'HIGH, single crater, stony');
        expect(g.mae).toBeLessThan(0.20);
    });

    test('crater fields are excluded from the scores', () => {
        const sikhote = rows.find(r => r.name.startsWith('Sikhote-Alin'));
        expect(sikhote.field).toBe(true);
    });
});
