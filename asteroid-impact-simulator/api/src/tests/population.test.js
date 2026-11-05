/**
 * WorldPop 2020 population grid (v2.1.1).
 * Reference values computed on the full 30" (~1 km) WorldPop grid with
 * scripts/build-population-grid.py inputs (see worldPopGrid.js header).
 */
const W = require('../services/worldPopGrid');

describe('WorldPop population grid', () => {
    test('whole Earth sums to the WorldPop 2020 total (7.97 billion)', () => {
        const r = W.populationInRadius(0, 0, 20100);
        expect(r.totalPopulation / 1e9).toBeCloseTo(7.97, 2);
    });

    test.each([
        // [place, lat, lon, radius km, population on the 1 km grid]
        ['Paris', 48.8566, 2.3522, 16, 7.64e6],
        ['Paris', 48.8566, 2.3522, 50, 12.49e6],
        ['Tokyo', 35.68, 139.69, 16, 11.04e6],
        ['Tokyo', 35.68, 139.69, 50, 35.02e6]
    ])('%s (case %#): within 10%% of the 1 km grid', (name, lat, lon, r, ref) => {
        const got = W.populationInRadius(lat, lon, r).totalPopulation;
        expect(Math.abs(got - ref) / ref).toBeLessThan(0.10);
    });

    test('rural population is counted (city points left it out)', () => {
        // Central Iowa farmland, no city > 15,000 at the centre
        expect(W.populationInRadius(42.0, -93.5, 10).totalPopulation).toBeGreaterThan(1000);
    });

    test('open ocean is empty', () => {
        expect(W.populationInRadius(0, -30, 100).totalPopulation).toBe(0);
    });

    test('longitude wrap-around at the antimeridian', () => {
        const east = W.populationInRadius(-17.8, 178.0, 300).totalPopulation;  // Fiji
        expect(east).toBeGreaterThan(100000);
    });
});
