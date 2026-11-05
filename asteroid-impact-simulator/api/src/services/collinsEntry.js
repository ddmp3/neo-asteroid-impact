/**
 * Atmospheric entry model - Collins, Melosh & Marcus (2005)
 *
 * Reference: Collins, G.S., Melosh, H.J. & Marcus, R.A. (2005)
 *   "Earth Impact Effects Program: A Web-based computer program for calculating
 *   the regional environmental consequences of a meteoroid impact on Earth",
 *   Meteoritics & Planetary Science 40(6), 817-840. Section "Atmospheric entry".
 *
 * This is the model used by the Imperial College / Purdue "Impact Earth!"
 * calculator. It answers three questions with one consistent set of equations:
 *   1. Does the impactor break up, and at what altitude (z*)?
 *   2. Does the fragment cloud ("pancake") spread enough to explode in the air,
 *      and at what altitude (z_b)?
 *   3. If it reaches the ground, how fast is it going? (needed by the Collins
 *      crater scaling law, which takes the velocity AT THE SURFACE)
 *
 * Equations (numbers refer to Collins et al. 2005):
 *   Atmosphere:        rho(z) = rho0 exp(-z/H), rho0 = 1 kg/m^3, H = 8 km
 *   Strength (Eq. 10): Y_i = 10^(2.107 + 0.0624 sqrt(rho_i))   [Pa]
 *   Breakup  (Eq. 11): z* = -H [ ln(Y_i / (rho0 v0^2)) + 1.308 - 0.314 I_f - 1.303 sqrt(1 - I_f) ]
 *                      I_f = 4.07 C_D H Y_i / (rho_i L0 v0^2 sin(theta));  I_f >= 1 -> intact
 *   Dispersion (Eq. 12-13):
 *                      l = L0 sin(theta) sqrt(rho_i / (C_D rho(z*)))
 *                      L(z) = L0 sqrt(1 + (2H/l)^2 (exp((z* - z)/(2H)) - 1)^2)
 *   Airburst (Eq. 18): z_b = z* - 2H ln(1 + (l / 2H) sqrt(f_p^2 - 1)),  f_p = 7
 *   Drag:              d(ln v)/dz = 3 C_D rho(z) L(z)^2 / (4 rho_i L0^3 sin(theta))
 *                      (Eq. 8 before breakup, where L = L0; integrated numerically
 *                      after breakup instead of using the paper's closed form)
 *
 * Limitations (same as Collins et al. 2005): no ablation (constant mass), flat
 * Earth, straight-line trajectory, single "pancake" fragment cloud.
 */

const RHO0 = 1.0;      // kg/m^3, surface density used by Collins et al. (2005)
const H = 8000;        // m, scale height
const C_D = 2.0;       // drag coefficient
const F_P = 7;         // pancake factor: airburst when L(z) = 7 L0
const Z_ENTRY = 100000; // m, start of integration

function airDensity(z) {
    return RHO0 * Math.exp(-z / H);
}

function yieldStrength(density) {
    return Math.pow(10, 2.107 + 0.0624 * Math.sqrt(density));
}

/**
 * Effective breakup strength of stony impactors, calibrated on OBSERVED bolides
 * (v2.1.0). Not a material strength: it absorbs what the model leaves out
 * (unknown entry angle, taken as 45°; density taken as 3000 kg/m^3; pancake
 * idealisation).
 *
 * Why: with Collins' Eq. 10 (0.33 MPa for 3000 kg/m^3), predicted burst
 * altitudes of the 360 CNEOS fireballs (JPL/CNEOS, US government sensors) are
 * +12 km too high on average (MAE 13.3 km).
 *
 * How (no circularity): for each CNEOS fireball dated before 2016 (TRAINING set,
 * n = 125) the strength that reproduces its observed peak-brightness altitude
 * is found; the median of those values is the nominal strength, the deciles
 * feed the Monte Carlo. The 2016-2026 fireballs (HOLD-OUT set, n = 235) are
 * never used to choose anything; they are only scored:
 *   Collins Eq. 10:        MAE 13.5 km, bias +12.2 km
 *   calibrated (3.05 MPa): MAE  6.8 km, bias  -1.2 km, 90% band covers 88%
 * Reproduce with: node scripts/calibrate-stone-strength.js
 * Data: src/data/validation/cneos_fireballs.csv (retrieved 2026-11-05 from
 * https://ssd-api.jpl.nasa.gov/fireball.api).
 */
const STONE_STRENGTH_PA = 3.05e6;
// Deciles (p0..p100) of the training-set effective strengths, in Pa
const STONE_STRENGTH_DECILES_PA = [1.0e4, 3.11e5, 1.03e6, 1.76e6, 2.27e6, 3.05e6, 3.68e6, 4.52e6, 5.65e6, 1.01e7, 4.59e7];

/**
 * Sample an effective stony strength from the training-set distribution
 * (log-linear interpolation between deciles, tails clipped to p05-p95).
 * @param {number} u - uniform random number in [0, 1)
 */
function sampleStoneStrength(u) {
    const q = 0.05 + 0.9 * u;          // clip to p05..p95
    const pos = q * 10;
    const i = Math.min(9, Math.floor(pos));
    const f = pos - i;
    const a = Math.log(STONE_STRENGTH_DECILES_PA[i]);
    const b = Math.log(STONE_STRENGTH_DECILES_PA[i + 1]);
    return Math.exp(a + f * (b - a));
}

function isIron(composition, density) {
    const c = (composition || '').toLowerCase();
    return c === 'iron' || c === 'metal' || (!c && density >= 6000);
}

/**
 * Entry model as used by the simulator (v2.1.0):
 *   - iron: no breakup (NASA PAIR rule, Mathias et al. 2017), drag only
 *   - stone/ice: Collins (2005) breakup + pancake with the CNEOS-calibrated
 *     effective strength (or an explicit `strength`, e.g. Monte Carlo sample)
 */
function computeImpactorEntry({ diameter, velocity, angle, density, composition = 'rocky', strength = null }) {
    if (isIron(composition, density)) {
        return computeEntry({ diameter, velocity, angle, density, breaksUp: false });
    }
    return computeEntry({
        diameter, velocity, angle, density,
        strength: strength != null ? strength : STONE_STRENGTH_PA
    });
}

/**
 * @param {Object} p
 * @param {number} p.diameter - impactor diameter L0 (m)
 * @param {number} p.velocity - atmospheric entry velocity v0 (m/s)
 * @param {number} p.angle    - entry angle from horizontal (degrees)
 * @param {number} p.density  - impactor density rho_i (kg/m^3)
 * @returns {Object} entry result
 */
function computeEntry({ diameter, velocity, angle, density, strength = null, breaksUp = true, pancakeFactor = F_P }) {
    const L0 = diameter;
    const v0 = velocity;
    const rho_i = density;
    const theta = Math.max(1, Math.min(90, angle)) * Math.PI / 180;
    const sinT = Math.sin(theta);

    // Strength: Collins Eq. 10 by default; an explicit value (Pa) can be given
    // (e.g. sampled in the Monte Carlo, or a population model).
    const Y = strength != null ? strength : yieldStrength(rho_i);
    const I_f = 4.07 * C_D * H * Y / (rho_i * L0 * v0 * v0 * sinT);

    // ---- Intact to the ground --------------------------------------------
    // breaksUp = false: NASA PAIR treats iron impactors as non-breaking
    // (Mathias et al. 2017); only drag (Eq. 8) applies.
    if (I_f >= 1 || !breaksUp) {
        // Eq. 8 evaluated at z = 0
        const vGround = v0 * Math.exp(-3 * RHO0 * C_D * H / (4 * rho_i * L0 * sinT));
        return {
            model: breaksUp ? 'Collins et al. (2005) atmospheric entry' : 'Collins et al. (2005) drag, no breakup (iron, NASA PAIR rule)',
            strength_Pa: Y,
            I_f,
            breaksUp: false,
            breakupAltitude: null,
            airburst: false,
            burstAltitude: null,
            groundVelocity: vGround,
            velocityAtBurst: null,
            dispersedDiameterAtGround: L0
        };
    }

    // ---- Breakup altitude (Eq. 11) ---------------------------------------
    const zStar = Math.max(0, -H * (
        Math.log(Y / (RHO0 * v0 * v0)) + 1.308 - 0.314 * I_f - 1.303 * Math.sqrt(1 - I_f)
    ));

    const rhoStar = airDensity(zStar);
    const l = L0 * sinT * Math.sqrt(rho_i / (C_D * rhoStar));

    const L = (z) => {
        if (z >= zStar) return L0;
        const e = Math.exp((zStar - z) / (2 * H)) - 1;
        return L0 * Math.sqrt(1 + Math.pow(2 * H / l, 2) * e * e);
    };

    // ---- Airburst altitude (Eq. 18) --------------------------------------
    const zBurstRaw = zStar - 2 * H * Math.log(1 + (l / (2 * H)) * Math.sqrt(pancakeFactor * pancakeFactor - 1));
    const airburst = zBurstRaw > 0;
    const zEnd = airburst ? zBurstRaw : 0;

    // ---- Velocity: integrate d(ln v)/dz from entry down to zEnd ----------
    // Trapezoidal rule on a fine grid (N steps); ln v decreases with descent.
    const N = 4000;
    const dz = (Z_ENTRY - zEnd) / N;
    const k = 3 * C_D / (4 * rho_i * Math.pow(L0, 3) * sinT);
    const integrand = (z) => k * airDensity(z) * Math.pow(L(z), 2);
    let lnLoss = 0;
    for (let i = 0; i < N; i++) {
        const zA = Z_ENTRY - i * dz;
        const zB = zA - dz;
        lnLoss += 0.5 * (integrand(zA) + integrand(zB)) * dz;
    }
    const vEnd = v0 * Math.exp(-lnLoss);

    return {
        model: 'Collins et al. (2005) atmospheric entry',
        strength_Pa: Y,
        I_f,
        breaksUp: true,
        breakupAltitude: zStar,
        dispersionLength: l,
        airburst,
        burstAltitude: airburst ? zBurstRaw : null,
        groundVelocity: airburst ? null : vEnd,
        velocityAtBurst: airburst ? vEnd : null,
        dispersedDiameterAtGround: airburst ? null : L(0)
    };
}

module.exports = {
    computeEntry,
    computeImpactorEntry,
    sampleStoneStrength,
    isIron,
    STONE_STRENGTH_PA,
    STONE_STRENGTH_DECILES_PA,
    yieldStrength,
    airDensity,
    constants: { RHO0, H, C_D, F_P }
};
