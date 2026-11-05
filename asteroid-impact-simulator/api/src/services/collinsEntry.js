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
 * @param {Object} p
 * @param {number} p.diameter - impactor diameter L0 (m)
 * @param {number} p.velocity - atmospheric entry velocity v0 (m/s)
 * @param {number} p.angle    - entry angle from horizontal (degrees)
 * @param {number} p.density  - impactor density rho_i (kg/m^3)
 * @returns {Object} entry result
 */
function computeEntry({ diameter, velocity, angle, density }) {
    const L0 = diameter;
    const v0 = velocity;
    const rho_i = density;
    const theta = Math.max(1, Math.min(90, angle)) * Math.PI / 180;
    const sinT = Math.sin(theta);

    const Y = yieldStrength(rho_i);
    const I_f = 4.07 * C_D * H * Y / (rho_i * L0 * v0 * v0 * sinT);

    // ---- Intact to the ground --------------------------------------------
    if (I_f >= 1) {
        // Eq. 8 evaluated at z = 0
        const vGround = v0 * Math.exp(-3 * RHO0 * C_D * H / (4 * rho_i * L0 * sinT));
        return {
            model: 'Collins et al. (2005) atmospheric entry',
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
    const zBurstRaw = zStar - 2 * H * Math.log(1 + (l / (2 * H)) * Math.sqrt(F_P * F_P - 1));
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
    yieldStrength,
    airDensity,
    constants: { RHO0, H, C_D, F_P }
};
