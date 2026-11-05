#!/usr/bin/env node
/**
 * Validation report (v2.1.0) - writes docs/VALIDATION.md at the repo root.
 *
 * Two kinds of evidence, kept separate on purpose:
 *
 * 1. VALIDATION (independent data, hold-out): atmospheric entry against JPL/CNEOS
 *    fireballs. Energies, altitudes and velocities are measured by sensors, not
 *    derived from the model. One parameter (effective stony strength) is
 *    calibrated on fireballs before 2016 and scored on 2016+ only.
 *
 * 2. CONSISTENCY CHECKS (not validation): natural craters. The impactor size,
 *    speed and angle of a natural crater are almost never observed; they are
 *    estimated, mostly with crater scaling laws. Comparing a scaling law with
 *    craters whose impactor was sized by a scaling law is circular, so these
 *    checks only ask whether the observed diameter lies inside the band the
 *    model gives over the published impactor ranges. No parameter is fitted on
 *    craters. Crater FIELDS (many small craters from a fragmented iron) are
 *    excluded: the model describes a single body.
 *
 * Usage: node scripts/validation-report.js        (prints and writes the report)
 */
const fs = require('fs');
const path = require('path');
const { calibrate } = require('./calibrate-stone-strength');
const db = require('../src/data/earthCraterDatabase');
const { computeImpactorEntry } = require('../src/services/collinsEntry');
const PhysicsEngine = require('../src/services/physicsEngine');

// Crater fields: several craters from one fragmented impactor (database notes,
// Earth Impact Database). A single-body model cannot be compared to them.
const CRATER_FIELDS = new Set([
    'Sikhote-Alin (largest)', 'Sobolev', 'Wabar', 'Henbury', 'Kaali (main)', 'Morasko',
    'Campo del Cielo', 'Ilumetsa', 'Odessa'
]);

async function predictCrater(engine, L, v, theta, rho, comp) {
    const e = computeImpactorEntry({ diameter: L, velocity: v, angle: theta, density: rho, composition: comp });
    if (e.airburst) return 0;
    const c = await engine.calculateCraterSize(1, theta, comp, rho, 2500, L, e.groundVelocity);
    return c.diameter;
}

async function craterChecks() {
    const quiet = console.log;
    console.log = () => {};
    const engine = new PhysicsEngine();
    const rows = [];
    try {
        for (const c of db.getAllCraters()) {
            const im = c.impactor;
            if (!im || !im.diameter_m || !im.velocity_m_s) continue;
            const theta0 = im.angle_deg || 45;
            const Ls = im.diameter_range || [im.diameter_m];
            const vs = im.velocity_range || [im.velocity_m_s];
            const ths = im.angle_range || [theta0];
            let lo = Infinity, hi = 0;
            for (const L of Ls) for (const v of vs) for (const th of ths) {
                const d = await predictCrater(engine, L, v, th, im.density_kg_m3, im.composition);
                lo = Math.min(lo, d); hi = Math.max(hi, d);
            }
            const nominal = await predictCrater(engine, im.diameter_m, im.velocity_m_s, theta0, im.density_kg_m3, im.composition);
            const obs = c.crater.diameter_m;
            rows.push({
                name: c.name,
                confidence: c.confidence,
                composition: im.composition,
                field: CRATER_FIELDS.has(c.name),
                observed: obs,
                nominal,
                bandLow: lo,
                bandHigh: hi,
                hasRanges: !!(im.diameter_range && im.velocity_range),
                inBand: obs >= lo * 0.999 && obs <= hi * 1.001,
                error: (nominal - obs) / obs
            });
        }
    } finally {
        console.log = quiet;
    }
    return rows;
}

function summarise(rows) {
    const mae = r => r.length ? r.reduce((s, x) => s + Math.abs(x.error), 0) / r.length : NaN;
    const bias = r => r.length ? r.reduce((s, x) => s + x.error, 0) / r.length : NaN;
    const single = rows.filter(r => !r.field);
    const groups = {
        'HIGH, single crater': single.filter(r => r.confidence === 'HIGH'),
        'HIGH, single crater, stony': single.filter(r => r.confidence === 'HIGH' && r.composition !== 'iron'),
        'HIGH, single crater, iron': single.filter(r => r.confidence === 'HIGH' && r.composition === 'iron'),
        'MEDIUM/LOW, single crater (impactor sized by scaling: not evidence)': single.filter(r => r.confidence !== 'HIGH')
    };
    return Object.entries(groups).map(([label, r]) => ({
        label, n: r.length, mae: mae(r), bias: bias(r),
        inBand: r.filter(x => x.inBand).length
    }));
}

async function buildReport() {
    const cal = calibrate();
    const rows = await craterChecks();
    const groups = summarise(rows);
    return { cal, rows, groups };
}

function toMarkdown({ cal, rows, groups }) {
    const pct = x => `${(100 * x).toFixed(0)} %`;
    const km = x => `${x.toFixed(1)} km`;
    const signed = x => `${x >= 0 ? '+' : ''}${x.toFixed(1)}`;
    const L = [];
    L.push('# Validation report');
    L.push('');
    L.push('Generated by `asteroid-impact-simulator/api/scripts/validation-report.js`. Do not edit by hand.');
    L.push('');
    L.push('## 1. Atmospheric entry vs JPL/CNEOS fireballs (independent data, hold-out)');
    L.push('');
    L.push(`Data: ${cal.nTrain + cal.nTest} fireballs with measured energy, peak-brightness altitude and velocity ([CNEOS fireball API](https://ssd-api.jpl.nasa.gov/fireball.api), retrieved 2026-11-05). One parameter, the effective stony strength, is calibrated on the ${cal.nTrain} events before 2016. The ${cal.nTest} events from 2016 on are only scored.`);
    L.push('');
    L.push('| Model | Hold-out MAE | Hold-out bias |');
    L.push('| --- | --- | --- |');
    L.push(`| Collins (2005) Eq. 10 strength | ${km(cal.collins.test.maeKm)} | ${signed(cal.collins.test.biasKm)} km |`);
    L.push(`| Calibrated effective strength (${(cal.nominalStrengthPa / 1e6).toFixed(2)} MPa) | ${km(cal.calibrated.test.maeKm)} | ${signed(cal.calibrated.test.biasKm)} km |`);
    L.push('');
    L.push(`Hold-out coverage of the Monte Carlo strength band (p05-p95): ${pct(cal.holdOutCoverageP05P95)} of events (target 90 %).`);
    L.push('');
    L.push('Assumptions for every event: density 3,000 kg/m³, entry angle 45° (angles are not published for most events).');
    L.push('');
    L.push('## 2. Craters (consistency checks, not validation)');
    L.push('');
    L.push('The impactor of a natural crater is almost never observed: its size is mostly estimated with crater scaling laws. Scoring a scaling law on such craters is circular. These checks only ask whether the observed diameter falls inside the band the model gives over the published impactor ranges. No parameter is fitted on craters. Crater fields are excluded (single-body model).');
    L.push('');
    L.push('| Group | n | Nominal MAE | Nominal bias | Observed inside model band |');
    L.push('| --- | --- | --- | --- | --- |');
    for (const g of groups) {
        L.push(`| ${g.label} | ${g.n} | ${isNaN(g.mae) ? '-' : pct(g.mae)} | ${isNaN(g.bias) ? '-' : (g.bias >= 0 ? '+' : '') + pct(g.bias)} | ${g.inBand}/${g.n} |`);
    }
    L.push('');
    L.push('### HIGH-confidence craters');
    L.push('');
    L.push('| Crater | Observed (m) | Model nominal (m) | Model band (m) | Inside band |');
    L.push('| --- | --- | --- | --- | --- |');
    for (const r of rows.filter(x => x.confidence === 'HIGH')) {
        L.push(`| ${r.name}${r.field ? ' (crater field, excluded)' : ''} | ${r.observed.toLocaleString('en-US')} | ${Math.round(r.nominal).toLocaleString('en-US')} | ${Math.round(r.bandLow).toLocaleString('en-US')}-${Math.round(r.bandHigh).toLocaleString('en-US')} | ${r.inBand ? 'yes' : 'no'} |`);
    }
    L.push('');
    L.push('## Known limitations');
    L.push('');
    L.push('- Irons follow the NASA PAIR rule (no breakup, no ablation). The two single iron craters are both outside the model band, in opposite directions (Meteor Crater over-predicted, Wolfe Creek under-predicted): iron fragmentation and ablation are not modelled. Melosh & Collins (2005) explain Meteor Crater with breakup and mass loss.');
    L.push('- Chicxulub is just outside its band (model up to 176 km vs ~180 km observed).');
    L.push('- Burst altitudes assume a 45° entry and 3,000 kg/m³; real events scatter around them (see the hold-out band coverage).');
    L.push('- Casualties use GeoNames cities > 15,000 inhabitants as points: an order of magnitude only.');
    L.push('- Tsunami amplitudes are order-of-magnitude (Collins cavity + Ward 1/r decay); NASA/NOAA (2017) found older models overestimated the hazard.');
    L.push('');
    return L.join('\n');
}

module.exports = { buildReport, summarise, craterChecks, CRATER_FIELDS };

if (require.main === module) {
    buildReport().then((report) => {
        const md = toMarkdown(report);
        const out = path.join(__dirname, '../../../docs/VALIDATION.md');
        fs.writeFileSync(out, md + '\n');
        process.stdout.write(md + '\n\nWritten to ' + path.relative(process.cwd(), out) + '\n');
    });
}
