/**
 * Historical events regression suite (v2.0.5)
 *
 * Anchors the simulator to OBSERVED events instead of to its own previous
 * outputs. Ranges are deliberately wide: they reflect the uncertainty of the
 * observations and of the impactor parameters, not a tuning target.
 *
 * Observations used:
 *   - Hiroshima 1945: 15 kt at ~580 m; heavy damage (~35 kPa / 5 psi) to ~1.3-1.6 km
 *   - Chelyabinsk 2013: ~0.4-0.5 Mt, peak brightness ~27-30 km, no deaths,
 *     no structural collapse, broken glass up to ~100+ km
 *       (Popova et al. 2013, Science 342:1069; Brown et al. 2013, Nature 503:238)
 *   - Tunguska 1908: ~3-15 Mt at ~5-10 km, ~2150 km² of trees felled (~26 km radius)
 *       (Boslough & Crawford 2008; Chyba et al. 1993)
 *   - Chicxulub: final crater ~150-180 km for a ~10 km impactor at ~20 km/s
 *   - Meteor Crater (Barringer): ~1.2 km for a ~50 m iron at ~12-13 km/s entry
 *
 * External services are stubbed so the suite is deterministic and offline.
 */

const PhysicsEngine = require('../services/physicsEngine');
const RankineHugoniot = require('../services/rankineHugoniot');

const MT = 4.184e15; // J per megaton TNT

function makeEngine() {
    const engine = new PhysicsEngine();
    engine.usgsService = {
        getElevation: async () => ({ elevation: 100, isOcean: false, depth: 0 })
    };
    return engine;
}

// Silence the engine's verbose console output during tests
let logSpy;
beforeAll(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
    logSpy.mockRestore();
});

describe('Blast model against nuclear and bolide observations', () => {
    test('Hiroshima (15 kt at 580 m): 35 kPa ground range 1.0-1.8 km', () => {
        const zones = RankineHugoniot.calculateBlastZones(0.015 * MT, 580);
        expect(zones.severe_reinforced / 1000).toBeGreaterThan(1.0);
        expect(zones.severe_reinforced / 1000).toBeLessThan(1.8);
    });

    test('overpressure decreases monotonically with distance (no breakpoint jumps)', () => {
        let previous = Infinity;
        for (let r = 10; r <= 1e6; r *= 1.05) {
            const p = RankineHugoniot.calculateBlastOverpressure(MT, r).overpressure_kPa;
            expect(p).toBeLessThan(previous);
            previous = p;
        }
    });

    test('a burst above the damage radius produces no ground damage zone', () => {
        const zones = RankineHugoniot.calculateBlastZones(0.5 * MT, 30000);
        expect(zones.severe_collapse).toBe(0);
        expect(zones.window_shattering).toBeGreaterThan(0);
    });
});

describe('Chelyabinsk 2013 (18 m stony, 19 km/s, 18°)', () => {
    let r;
    beforeAll(async () => {
        r = await makeEngine().simulateImpact({
            diameter: 18, velocity: 19000, angle: 18, density: 3300,
            composition: 'rocky',
            impactLocation: { lat: 55.15, lon: 61.4 }
        });
    });

    test('is an airburst with no crater', () => {
        expect(r.fragmentation.craterFormed).toBe(false);
        expect(r.crater.diameter).toBe(0);
    });

    test('energy 0.3-0.7 Mt (observed ~0.4-0.5 Mt)', () => {
        expect(r.energy.megatons).toBeGreaterThan(0.3);
        expect(r.energy.megatons).toBeLessThan(0.7);
    });

    test('burst altitude 20-40 km (observed ~27-30 km)', () => {
        expect(r.fragmentation.altitude / 1000).toBeGreaterThan(20);
        expect(r.fragmentation.altitude / 1000).toBeLessThan(40);
    });

    test('no building-collapse zone on the ground, glass breakage 50-200 km', () => {
        expect(r.blast.airblastRadius).toBe(0);
        expect(r.blast.fireball).toBe(0);
        const glassKm = r.blast.blast_physics.window_shattering / 1000;
        expect(glassKm).toBeGreaterThan(50);
        expect(glassKm).toBeLessThan(200);
    });

    test('no deaths (observed: 0)', () => {
        expect(r.casualties.estimatedCasualties).toBe(0);
    });
});

describe('Tunguska 1908 (50 m stony, 15 km/s, 45°)', () => {
    let r;
    beforeAll(async () => {
        r = await makeEngine().simulateImpact({
            diameter: 50, velocity: 15000, angle: 45, density: 3000,
            composition: 'rocky',
            impactLocation: { lat: 60.9, lon: 101.9 }
        });
    });

    test('is an airburst at 5-12 km', () => {
        expect(r.fragmentation.craterFormed).toBe(false);
        expect(r.fragmentation.altitude / 1000).toBeGreaterThan(5);
        expect(r.fragmentation.altitude / 1000).toBeLessThan(12);
    });

    test('energy 3-15 Mt', () => {
        expect(r.energy.megatons).toBeGreaterThan(3);
        expect(r.energy.megatons).toBeLessThan(15);
    });

    test('7 kPa ground radius 15-40 km (tree fall ~26 km)', () => {
        const km = r.blast.blast_physics.moderate_structural / 1000;
        expect(km).toBeGreaterThan(15);
        expect(km).toBeLessThan(40);
    });
});

describe('Chicxulub (10 km stony, 20 km/s, 60°)', () => {
    test('complex crater 100-200 km (observed ~150-180 km)', async () => {
        const r = await makeEngine().simulateImpact({
            diameter: 10000, velocity: 20000, angle: 60, density: 3000,
            composition: 'rocky',
            impactLocation: { lat: 21.4, lon: -89.5 }
        });
        const km = (r.crater.originalDiameter ?? r.crater.diameter) / 1000;
        expect(r.crater.craterType).toBe('complex');
        expect(km).toBeGreaterThan(100);
        expect(km).toBeLessThan(200);
    });
});

describe('Meteor Crater (50 m iron, 12.8 km/s entry)', () => {
    // KNOWN GAP: Collins (2005) needs the velocity AT THE GROUND. The legacy path
    // uses the entry velocity, giving ~1.55 km instead of ~1.2 km. Melosh &
    // Collins (2005, Nature 434:157) show the impactor slowed to ~8 km/s; with
    // that velocity Collins gives ~1.26 km. When atmospheric deceleration is
    // wired into the default path, this test will start passing: change
    // `test.failing` to `test`.
    test.failing('final crater 0.9-1.5 km (observed ~1.2 km)', async () => {
        const r = await makeEngine().simulateImpact({
            diameter: 50, velocity: 12800, angle: 45, density: 7800,
            composition: 'iron',
            impactLocation: { lat: 35.03, lon: -111.02 }
        });
        const km = (r.crater.originalDiameter ?? r.crater.diameter) / 1000;
        expect(km).toBeGreaterThan(0.9);
        expect(km).toBeLessThan(1.5);
    });
});

describe('Invariants', () => {
    test('entry velocity is used as given, with escape velocity as minimum', () => {
        const engine = new PhysicsEngine();
        expect(engine.calculateImpactVelocity(19000)).toBe(19000);
        expect(engine.calculateImpactVelocity(5000) / 1000).toBeCloseTo(11.19, 1);
    });

    test('small iron impactors do not throw (regression: removed FCM module)', async () => {
        const r = await makeEngine().simulateImpact({
            diameter: 30, velocity: 15000, angle: 45, density: 7800,
            composition: 'iron',
            impactLocation: { lat: 35.0, lon: -111.0 }
        });
        expect(Number.isFinite(r.energy.megatons)).toBe(true);
    });

    test('deaths never exceed the population in range (Paris, 300 m)', async () => {
        const r = await makeEngine().simulateImpact({
            diameter: 300, velocity: 20000, angle: 45, density: 3000,
            composition: 'rocky',
            impactLocation: { lat: 48.8566, lon: 2.3522 }
        });
        const popInRange = Math.max(
            ...Object.values(r.casualties.zones).map(z => z.populationAffected)
        );
        expect(r.casualties.estimatedCasualties).toBeLessThanOrEqual(popInRange);
    });

    test('ionizing radiation zone is zero for asteroid impacts', () => {
        const blast = new PhysicsEngine().calculateBlastRadius(MT, 0);
        expect(blast.radiationRadius).toBe(0);
    });
});
