#!/usr/bin/env node
/**
 * Ground-truth evaluation (v2.1.0): the simulator against OBSERVED footprints.
 *
 * Data: src/data/validation/ground_truth.json (each case cites its source).
 * Nothing in this file is used to calibrate the model.
 *
 * Three measures, each answering one question:
 *   - factor  : is the physics right?   model / observed (1.00 = exact)
 *   - km      : is the map right?       model - observed, in km (or km2)
 *   - people  : is the human toll right? model - observed, in people
 * A case PASSES when the observation lies inside the model range obtained by
 * varying the inputs over their published uncertainty (energy, burst height,
 * mass, velocity, angle). Cases with a `knownGap` are expected to fail and are
 * reported as such.
 *
 * Usage: node scripts/ground-truth.js
 */
const fs = require('fs');
const path = require('path');
const RH = require('../src/services/rankineHugoniot');
const { computeImpactorEntry } = require('../src/services/collinsEntry');

const KT = 4.184e12;

function corners(a, b) {
    return a === b ? [a] : [a, b];
}

function evalBlastRadius(c) {
    const heights = c.burstHeightRangeM || [c.burstHeightM];
    const [eLo, eHi] = c.energyRangeKt;
    const [pHigh, pLow] = c.bracketKPa;          // e.g. [20, 3.5]
    let lo = Infinity, hi = 0;
    for (const E of corners(eLo, eHi)) for (const h of heights) {
        lo = Math.min(lo, RH.groundRangeForOverpressure(E * KT, h, pHigh));
        hi = Math.max(hi, RH.groundRangeForOverpressure(E * KT, h, pLow));
    }
    const nominal = RH.groundRangeForOverpressure(c.energyKt * KT, c.burstHeightM, c.modelLevelKPa) / 1000;
    const obs = c.observedKm;
    return {
        model: nominal, observed: obs, unit: 'km',
        range: [lo / 1000, hi / 1000],
        pass: obs >= lo / 1000 && obs <= hi / 1000,
        factor: nominal / obs,
        absolute: nominal - obs
    };
}

function evalOverpressure(c) {
    const heights = c.burstHeightRangeM || [c.burstHeightM];
    const [eLo, eHi] = c.energyRangeKt;
    let lo = Infinity, hi = 0;
    for (const E of corners(eLo, eHi)) for (const h of heights) {
        const p = RH.groundOverpressureKPa(E * KT, h, c.distanceKm * 1000);
        lo = Math.min(lo, p); hi = Math.max(hi, p);
    }
    const nominal = RH.groundOverpressureKPa(c.energyKt * KT, c.burstHeightM, c.distanceKm * 1000);
    const [oLo, oHi] = c.observedRangeKPa;
    const obsMid = Math.sqrt(oLo * oHi);
    return {
        model: nominal, observed: obsMid, unit: 'kPa',
        range: [lo, hi], observedRange: [oLo, oHi],
        pass: hi >= oLo && lo <= oHi,
        factor: nominal / obsMid,
        absolute: nominal - obsMid
    };
}

function evalArea(c) {
    const r = RH.groundRangeForOverpressure(c.energyKt * KT, c.burstHeightM, c.modelLevelKPa) / 1000;
    const area = Math.PI * r * r;
    const [oLo, oHi] = c.observedRangeKm2;
    return {
        model: area, observed: c.observedKm2, unit: 'km2',
        observedRange: [oLo, oHi],
        pass: area >= oLo && area <= oHi,
        factor: area / c.observedKm2,
        absolute: area - c.observedKm2
    };
}

/** Population killed under the NASA PAIR rule (blast >= 4 psi), uniform density within each band */
function pairKilled(bands, lethalKm) {
    let killed = 0;
    for (const b of bands) {
        const inner = Math.min(Math.max(lethalKm, b.fromKm), b.toKm);
        const frac = (inner * inner - b.fromKm * b.fromKm) / (b.toKm * b.toKm - b.fromKm * b.fromKm);
        killed += b.population * Math.max(0, frac);
    }
    return killed;
}

function evalDeaths(c) {
    const lethal = E => RH.groundRangeForOverpressure(E * KT, c.burstHeightM, 27.6) / 1000;
    const observed = c.bands.reduce((s, b) => s + b.killed, 0);
    const nominal = pairKilled(c.bands, lethal(c.energyKt));
    const lo = pairKilled(c.bands, lethal(c.energyRangeKt[0]));
    const hi = pairKilled(c.bands, lethal(c.energyRangeKt[1]));
    return {
        model: nominal, observed, unit: 'people',
        range: [lo, hi],
        lethalRadiusKm: lethal(c.energyKt),
        // Order-of-magnitude rule: pass within a factor 1.5
        pass: nominal / observed <= 1.5 && observed / nominal <= 1.5,
        factor: nominal / observed,
        absolute: nominal - observed
    };
}

async function evalCrater(c, engine) {
    const diam = m => Math.cbrt(6 * m / (Math.PI * c.densityKgM3));
    let lo = Infinity, hi = 0;
    for (const m of corners(...c.massRangeKg))
        for (const v of corners(...c.surfaceVelocityRangeMs))
            for (const th of corners(...c.angleRangeDeg)) {
                const d = (await engine.calculateCraterSize(1, th, c.composition, c.densityKgM3, 2500, diam(m), v)).diameter;
                lo = Math.min(lo, d); hi = Math.max(hi, d);
            }
    const mMid = Math.sqrt(c.massRangeKg[0] * c.massRangeKg[1]);
    const vMid = Math.sqrt(c.surfaceVelocityRangeMs[0] * c.surfaceVelocityRangeMs[1]);
    const thMid = (c.angleRangeDeg[0] + c.angleRangeDeg[1]) / 2;
    const nominal = (await engine.calculateCraterSize(1, thMid, c.composition, c.densityKgM3, 2500, diam(mMid), vMid)).diameter;
    return {
        model: nominal, observed: c.observedM, unit: 'm',
        range: [lo, hi],
        pass: c.observedM >= lo && c.observedM <= hi,
        factor: nominal / c.observedM,
        absolute: nominal - c.observedM
    };
}

function evalEntry(c) {
    const outcomes = c.massRangeKg.map(m => {
        const L = Math.cbrt(6 * m / (Math.PI * c.densityKgM3));
        const e = computeImpactorEntry({ diameter: L, velocity: c.entryVelocityMs, angle: c.angleDeg, density: c.densityKgM3, composition: c.composition });
        return e.airburst ? 'airburst' : 'ground';
    });
    return {
        model: outcomes.join('/'), observed: c.observedOutcome, unit: 'outcome',
        pass: outcomes.includes(c.observedOutcome)
    };
}

async function evaluate() {
    const file = path.join(__dirname, '../src/data/validation/ground_truth.json');
    const { cases } = JSON.parse(fs.readFileSync(file, 'utf8'));
    const PhysicsEngine = require('../src/services/physicsEngine');
    const quiet = console.log;
    console.log = () => {};
    const engine = new PhysicsEngine();
    const results = [];
    try {
        for (const c of cases) {
            let r;
            if (c.kind === 'blast_radius') r = evalBlastRadius(c);
            else if (c.kind === 'overpressure_at_distance') r = evalOverpressure(c);
            else if (c.kind === 'damage_area') r = evalArea(c);
            else if (c.kind === 'deaths_by_band') r = evalDeaths(c);
            else if (c.kind === 'crater_band') r = await evalCrater(c, engine);
            else if (c.kind === 'entry_outcome') r = evalEntry(c);
            results.push({ id: c.id, event: c.event, kind: c.kind, observation: c.observation, knownGap: c.knownGap || null, caveat: c.caveat || null, source: c.source, ...r });
        }
    } finally {
        console.log = quiet;
    }
    return results;
}

module.exports = { evaluate, pairKilled };

if (require.main === module) {
    evaluate().then((rows) => {
        for (const r of rows) {
            const f = r.factor != null ? ` factor x${r.factor.toFixed(2)}` : '';
            const fmt = x => (typeof x === 'number' ? (Math.abs(x) >= 100 ? Math.round(x).toLocaleString('en-US') : x.toFixed(2)) : x);
            console.log(`${r.pass ? 'PASS' : (r.knownGap ? 'GAP ' : 'FAIL')} ${r.id.padEnd(24)} model ${fmt(r.model)} vs observed ${fmt(r.observed)} ${r.unit}${f}${r.range ? ` range ${fmt(r.range[0])}-${fmt(r.range[1])}` : ''}`);
        }
    });
}
