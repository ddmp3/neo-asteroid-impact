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
 *     no structural collapse, window damage over ~5,000 km² (Artemieva & Shuvalov 2013)
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

    test('no building-collapse zone on the ground', () => {
        expect(r.blast.airblastRadius).toBe(0);
        expect(r.blast.fireball).toBe(0);
        // Window-damage extent is over-predicted (~16x in area): known gap,
        // tested against observations in validation.test.js (ground_truth.json).
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
    // KNOWN GAP (v2.1.0): irons follow the NASA PAIR rule (no breakup, drag
    // only, no ablation), so the impactor keeps ~12 km/s and the crater is
    // ~1.52 km. Melosh & Collins (2005, Nature 434:157) explain the ~1.2 km
    // crater with breakup and mass loss, which the model does not include.
    // When iron fragmentation/ablation is modelled, this test will start
    // passing: change `test.failing` to `test`.
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

describe('Physical consistency (v2.1.0)', () => {
    const CE = require('../services/collinsEffects');
    const MT = 4.184e15;

    test('ground impact: effects use the energy left at the surface, not the entry energy', async () => {
        const r = await makeEngine().simulateImpact({
            diameter: 100, velocity: 20000, angle: 45, density: 3000,
            composition: 'rocky', impactLocation: { lat: 0.1, lon: -30 }
        });
        expect(r.fragmentation.craterFormed).toBe(true);
        expect(r.energy.effects_joules).toBeLessThan(r.energy.joules);
        expect(r.energy.effects_joules + r.energy.atmospheric_deposition_joules).toBeCloseTo(r.energy.joules, -3);
    });

    test('airburst: no seismic magnitude (Collins Eq. 40 applies to ground impacts)', async () => {
        const r = await makeEngine().simulateImpact({
            diameter: 18, velocity: 19000, angle: 18, density: 3300,
            composition: 'rocky', impactLocation: { lat: 55.15, lon: 61.4 }
        });
        expect(r.seismic.applicable).toBe(false);
        expect(r.seismic.magnitude).toBe(0);
    });

    test('thermal: 1 Mt surface impact, 3rd-degree burns at ~2.2 km (Collins Eq. 34, 39)', () => {
        const km = CE.thermalRadius(MT, 0) / 1000;
        expect(km).toBeGreaterThan(2.0);
        expect(km).toBeLessThan(2.4);
    });

    test('thermal: Chelyabinsk produces no 3rd-degree burns on the ground', () => {
        expect(CE.thermalRadius(0.44 * MT, 26000)).toBe(0);
    });

    test('airburst luminous efficiency reproduces the CNEOS Chelyabinsk record (Brown et al. 2002)', () => {
        // CNEOS: radiated 3.75e14 J, total 441 kt
        expect(CE.airburstLuminousEfficiency(441 * 4.184e12)).toBeCloseTo(3.75e14 / (441 * 4.184e12), 2);
    });

    test('seismic magnitude matches Collins Eq. 40 at the nominal efficiency', () => {
        const E = 1e18;
        expect(CE.seismicMagnitude(E)).toBeCloseTo(0.67 * Math.log10(E) - 5.87, 6);
    });

    test('tsunami cavity is a length that scales like L^0.78 (dimensionally consistent)', () => {
        const a = CE.waterCavity(100, 20000, 3000, 45).diameter;
        const b = CE.waterCavity(1000, 20000, 3000, 45).diameter;
        expect(b / a).toBeCloseTo(Math.pow(10, 0.78), 6);
    });

    test('no tsunami from an airburst over the ocean (NASA/NOAA 2017)', async () => {
        const engine = makeEngine();
        engine.usgsService = { getElevation: async () => ({ elevation: -4000, isOcean: true, depth: 4000 }) };
        const r = await engine.simulateImpact({
            diameter: 18, velocity: 19000, angle: 18, density: 3300,
            composition: 'rocky', impactLocation: { lat: 0, lon: -30 }
        });
        expect(r.tsunami).toBeNull();
    });

    test('iron impactors do not break up (NASA PAIR rule)', () => {
        const { computeImpactorEntry } = require('../services/collinsEntry');
        const e = computeImpactorEntry({ diameter: 15, velocity: 12000, angle: 60, density: 7800, composition: 'iron' });
        expect(e.breaksUp).toBe(false);
        expect(e.airburst).toBe(false);
    });
});

describe('Deflection (v2.1.0)', () => {
    test('DART check: 580 kg at 6.1 km/s with beta 3.6 gives ~3 mm/s on a 4.3e9 kg body', () => {
        const engine = new PhysicsEngine();
        const r = engine.calculateDeflection({ asteroidMass: 4.3e9, warningTime: 3650, missDistance: 1, method: 'kinetic' });
        const dv = 3.6 * 580 * 6100 / 4.3e9;
        expect(dv * 1000).toBeGreaterThan(2.5);
        expect(dv * 1000).toBeLessThan(3.5);
        // achieved miss distance = 3 dv t
        expect(r.achievedMissDistanceKm).toBeCloseTo(3 * dv * 3650 * 86400 / 1000, 3);
    });

    test('success probability is a percentage', () => {
        const engine = new PhysicsEngine();
        const r = engine.calculateDeflection({ asteroidMass: engine.calculateMass(50, 3000), warningTime: 3650, missDistance: 12742, method: 'kinetic' });
        expect(r.successProbability).toBeGreaterThanOrEqual(0);
        expect(r.successProbability).toBeLessThanOrEqual(100);
        expect(r.feasible).toBe(true);
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
