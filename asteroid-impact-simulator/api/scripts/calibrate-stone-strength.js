#!/usr/bin/env node
/**
 * Reproduces the effective stony strength used by collinsEntry.js (v2.1.0).
 *
 * Data: src/data/validation/cneos_fireballs.csv - JPL/CNEOS fireball records
 * with measured total impact energy (kt), peak-brightness altitude (km) and
 * velocity (km/s), retrieved 2026-11-05 from https://ssd-api.jpl.nasa.gov/fireball.api
 *
 * Protocol (fixed before looking at results, no circularity):
 *   - TRAINING: fireballs dated before 2016 (1998-2015). For each one, find the strength that
 *     makes the Collins (2005) entry model reproduce its observed altitude.
 *     Nominal strength = median; deciles = Monte Carlo distribution.
 *   - HOLD-OUT: fireballs dated 2016 onwards. Never used to choose anything;
 *     only scored (MAE, bias, coverage of the p05-p95 band).
 *   - Assumptions for every event: density 3000 kg/m^3, entry angle 45°
 *     (CNEOS does not publish angles for most events), diameter from
 *     E = (pi/12) rho L^3 v^2.
 *
 * Usage: node scripts/calibrate-stone-strength.js
 */
const fs = require('fs');
const path = require('path');
const { computeEntry } = require('../src/services/collinsEntry');

const RHO = 3000;
const ANGLE = 45;
const SPLIT_YEAR = 2016;

function loadFireballs() {
    const file = path.join(__dirname, '../src/data/validation/cneos_fireballs.csv');
    const [header, ...lines] = fs.readFileSync(file, 'utf8').trim().split('\n');
    const cols = header.split(',');
    return lines.map((line) => {
        const v = line.split(',');
        const row = Object.fromEntries(cols.map((c, i) => [c, v[i]]));
        const E = parseFloat(row.impact_energy_kt) * 4.184e12;   // J
        const vel = parseFloat(row.vel_kms) * 1000;               // m/s
        const mass = 2 * E / (vel * vel);
        return {
            date: row.date,
            year: parseInt(row.date.slice(0, 4), 10),
            energyKt: parseFloat(row.impact_energy_kt),
            altitudeKm: parseFloat(row.alt_km),
            velocity: vel,
            diameter: Math.cbrt(6 * mass / (Math.PI * RHO))
        };
    });
}

function predictedAltitudeKm(ev, strength) {
    const e = computeEntry({ diameter: ev.diameter, velocity: ev.velocity, angle: ANGLE, density: RHO, strength });
    return e.airburst ? e.burstAltitude / 1000 : 0;
}

function effectiveStrength(ev) {
    // Burst altitude decreases monotonically with strength: log bisection
    let lo = 1e4, hi = 1e9;
    for (let i = 0; i < 60; i++) {
        const mid = Math.sqrt(lo * hi);
        if (predictedAltitudeKm(ev, mid) > ev.altitudeKm) lo = mid; else hi = mid;
    }
    return Math.sqrt(lo * hi);
}

function score(events, strength) {
    const err = events.map(ev => predictedAltitudeKm(ev, strength) - ev.altitudeKm);
    const n = err.length;
    return {
        n,
        maeKm: err.reduce((s, x) => s + Math.abs(x), 0) / n,
        biasKm: err.reduce((s, x) => s + x, 0) / n
    };
}

function calibrate() {
    const all = loadFireballs();
    const train = all.filter(e => e.year < SPLIT_YEAR);
    const test = all.filter(e => e.year >= SPLIT_YEAR);

    const eff = train.map(effectiveStrength).sort((a, b) => a - b);
    const decile = k => eff[Math.round(k / 10 * (eff.length - 1))];
    const deciles = Array.from({ length: 11 }, (_, k) => Number(decile(k).toPrecision(3)));
    const nominal = deciles[5];

    const p05 = eff[Math.floor(0.05 * (eff.length - 1))];
    const p95 = eff[Math.floor(0.95 * (eff.length - 1))];
    let covered = 0;
    for (const ev of test) {
        const a = predictedAltitudeKm(ev, p95);
        const b = predictedAltitudeKm(ev, p05);
        if (ev.altitudeKm >= Math.min(a, b) && ev.altitudeKm <= Math.max(a, b)) covered++;
    }

    return {
        nTrain: train.length,
        nTest: test.length,
        nominalStrengthPa: nominal,
        decilesPa: deciles,
        collins: { train: score(train, null), test: score(test, null) },
        calibrated: { train: score(train, nominal), test: score(test, nominal) },
        holdOutCoverageP05P95: covered / test.length
    };
}

module.exports = { calibrate, loadFireballs, predictedAltitudeKm };

if (require.main === module) {
    const r = calibrate();
    const f = s => `MAE ${s.maeKm.toFixed(1)} km, bias ${s.biasKm >= 0 ? '+' : ''}${s.biasKm.toFixed(1)} km (n=${s.n})`;
    console.log(`Training before ${SPLIT_YEAR}: n=${r.nTrain}   Hold-out ${SPLIT_YEAR}+: n=${r.nTest}`);
    console.log(`Nominal effective strength: ${(r.nominalStrengthPa / 1e6).toFixed(2)} MPa`);
    console.log(`Deciles (Pa): ${JSON.stringify(r.decilesPa)}`);
    console.log(`Collins Eq. 10  hold-out: ${f(r.collins.test)}`);
    console.log(`Calibrated      hold-out: ${f(r.calibrated.test)}`);
    console.log(`Hold-out coverage of p05-p95 band: ${(100 * r.holdOutCoverageP05P95).toFixed(0)}%`);
}
