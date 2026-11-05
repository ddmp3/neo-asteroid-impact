/**
 * Impact effects from Collins, Melosh & Marcus (2005) (v2.1.0)
 *
 * Replaces formulas that had no source or were dimensionally inconsistent:
 *   - thermal radius "5300 m x Mt^0.41" (no reference; 2-4.5x Collins)
 *   - tsunami cavity "1.88 (E/rho)^0.22" (not a length) and
 *     "affected radius = wave height x cavity radius" (m^2 read as km)
 *   - terrain crater multipliers (mountains x1.2, deep ocean x0.5 / x2.5)
 *
 * Every function states its equation and source. Lengths in m, energy in J.
 */

const MT = 4.184e15;          // J per megaton TNT
const R_EARTH = 6.371e6;      // m
const G = 9.81;               // m/s^2

// ---------------------------------------------------------------------------
// Thermal radiation (Collins 2005, Eqs. 32-39, Table 1)
// ---------------------------------------------------------------------------

/** Third-degree burn threshold at 1 Mt (Collins Table 1), J/m^2 */
const THIRD_DEGREE_BURN_1MT = 0.42e6;
/** Luminous efficiency (Collins: 3e-3, plausible range 1e-4 to 1e-2) */
const LUMINOUS_EFFICIENCY = 3e-3;

/**
 * Ground radius where the thermal exposure reaches a damage threshold.
 *   Exposure      Phi(R) = K E / (2 pi R^2)             (Eq. 34, R = slant range)
 *   Threshold     Phi_c(E) = Phi_c(1 Mt) x E_Mt^(1/6)   (Eq. 39)
 *   Horizon       fraction f of the fireball above the horizon (Eqs. 36-37),
 *                 fireball radius R_f = 0.002 E^(1/3)    (Eq. 32)
 * @param {number} energy   - J
 * @param {number} altitude - burst altitude in m (0 for a surface impact)
 * @param {Object} [opt]
 * @param {number} [opt.luminousEfficiency=3e-3]
 * @param {number} [opt.threshold1Mt=0.42e6] - J/m^2 at 1 Mt
 * @returns {number} ground radius in m
 */
/**
 * Luminous efficiency of an AIRBURST from bolide observations: Brown et al.
 * (2002, Nature 420:294) relate total energy E and optical radiated energy E_r
 * (both in kt) by E = 8.2508 E_r^0.885, the relation JPL/CNEOS uses (it
 * reproduces Chelyabinsk: E_r = 89.6 kt -> E = 441 kt). Hence
 * eta = E_r / E = (E / 8.2508)^(1/0.885) / E. Calibrated on small bolides
 * (<~0.5 Mt); larger energies are an extrapolation.
 */
function airburstLuminousEfficiency(energy) {
    const Ekt = energy / 4.184e12;
    const Er = Math.pow(Ekt / 8.2508, 1 / 0.885);
    return Math.min(0.5, Er / Ekt);
}

/**
 * @param {boolean} [opt.airburst] - true: radiation from a point at `altitude`
 *   into the full sphere (4 pi) with the Brown (2002) efficiency; false: Collins
 *   surface fireball (2 pi, K = 3e-3, horizon correction).
 */
function thermalRadius(energy, altitude = 0, opt = {}) {
    const h = Math.max(0, altitude || 0);
    const airburst = opt.airburst != null ? opt.airburst : h > 0;
    const K = opt.luminousEfficiency != null
        ? opt.luminousEfficiency
        : (airburst ? airburstLuminousEfficiency(energy) : LUMINOUS_EFFICIENCY);
    const solidAngle = airburst ? 4 * Math.PI : 2 * Math.PI;
    const phi1 = opt.threshold1Mt != null ? opt.threshold1Mt : THIRD_DEGREE_BURN_1MT;
    if (!(energy > 0)) return 0;

    const threshold = phi1 * Math.pow(energy / MT, 1 / 6);
    const Rf = 0.002 * Math.cbrt(energy);

    const exposureAtGround = (r) => {
        const slant = Math.sqrt(r * r + h * h);
        let phi = K * energy / (solidAngle * slant * slant);
        // Horizon correction (surface impacts only; an airburst fireball is
        // above the horizon over the ranges of interest)
        if (!airburst) {
            const delta = r / R_EARTH;
            const drop = (1 - Math.cos(delta)) * R_EARTH;
            if (drop >= Rf) return 0;
            const gamma = Math.acos(drop / Rf);
            const f = (2 / Math.PI) * (gamma - (drop / Rf) * Math.sin(gamma)); // f = 1 at ground zero
            phi *= f;
        }
        return phi;
    };

    if (exposureAtGround(0) < threshold) return 0;
    // Exposure decreases with range: geometric bisection
    let lo = 1, hi = Math.PI * R_EARTH;
    if (exposureAtGround(hi) >= threshold) return hi;
    for (let i = 0; i < 200; i++) {
        const mid = Math.sqrt(lo * hi);
        if (exposureAtGround(mid) >= threshold) lo = mid; else hi = mid;
        if (hi / lo < 1 + 1e-6) break;
    }
    return Math.sqrt(lo * hi);
}

// ---------------------------------------------------------------------------
// Seismic (Collins 2005, Eq. 40 and seismic efficiency)
// ---------------------------------------------------------------------------

/** Seismic efficiency (Collins: 1e-4, plausible range 1e-5 to 1e-3) */
const SEISMIC_EFFICIENCY = 1e-4;

/**
 * Richter magnitude of a ground impact.
 * Collins Eq. 40, M = 0.67 log10(E) - 5.87, assumes a seismic efficiency of
 * 1e-4. Written for any efficiency eta: M = 0.67 log10(eta E / 1e-4) - 5.87.
 * Not applicable to airbursts.
 */
function seismicMagnitude(energy, efficiency = SEISMIC_EFFICIENCY) {
    if (!(energy > 0)) return 0;
    return 0.67 * Math.log10(energy * efficiency / 1e-4) - 5.87;
}

// ---------------------------------------------------------------------------
// Ocean impacts (Collins 2005, water layer; Ward 2000, tsunami decay)
// ---------------------------------------------------------------------------

/**
 * Velocity at the sea floor after crossing a water layer of depth d_w
 * (Collins 2005, drag in water, same form as Eq. 8):
 *   v_sf = v exp( -3 rho_w C_D d_w / (2 rho_i L sin(theta)) ),  C_D = 0.877
 */
function seafloorVelocity(velocity, waterDepth, diameter, density, angleDeg) {
    const rhoW = 1000;
    const CD = 0.877;
    const sinT = Math.sin(Math.max(1, Math.min(90, angleDeg)) * Math.PI / 180);
    return velocity * Math.exp(-3 * rhoW * CD * waterDepth / (2 * density * diameter * sinT));
}

/**
 * Transient cavity in water (Collins 2005, Eq. 21 with the water constant):
 *   D_tc = 1.365 (rho_i / rho_w)^(1/3) L^0.78 v^0.44 g^-0.22 sin(theta)^(1/3)
 *   depth d_tc = D_tc / (2 sqrt 2)                          (Eq. 25)
 */
function waterCavity(diameter, velocity, density, angleDeg) {
    const sinT = Math.sin(Math.max(1, Math.min(90, angleDeg)) * Math.PI / 180);
    const D = 1.365 * Math.cbrt(density / 1000) * Math.pow(diameter, 0.78) *
        Math.pow(velocity, 0.44) * Math.pow(G, -0.22) * Math.cbrt(sinT);
    return { diameter: D, depth: D / (2 * Math.SQRT2) };
}

/**
 * Order-of-magnitude tsunami from an ocean impact.
 *   Source amplitude A0 = min(cavity depth, water depth) / 2 (rim-to-trough)
 *   Decay beyond the cavity: A(r) = A0 (R_c / r)   (Ward 2000: dispersion makes
 *   long-distance decay close to 1/r)
 *   Shallow-water speed c = sqrt(g d)
 * The NASA/NOAA 2017 workshop found older models overestimated the hazard,
 * negligible below ~200 m impactors, and no notable tsunami from airbursts.
 */
function tsunami(diameter, velocity, density, angleDeg, waterDepth) {
    const cav = waterCavity(diameter, velocity, density, angleDeg);
    const Rc = cav.diameter / 2;
    const A0 = Math.min(cav.depth, waterDepth) / 2;
    const amplitudeAt = (rKm) => {
        const r = rKm * 1000;
        return r <= Rc ? A0 : A0 * Rc / r;
    };
    // Distance where the open-ocean amplitude falls below 1 m
    const radiusFor1m = A0 > 1 ? A0 * Rc / 1 : 0;
    const speed = Math.sqrt(G * waterDepth);
    return {
        cavityDiameter: cav.diameter,
        cavityDepth: cav.depth,
        cavityRadius: Rc,
        initialWaveHeight: A0,
        amplitudeAt,
        radiusFor1mKm: radiusFor1m / 1000,
        propagationSpeed: speed,
        hazardNote: diameter < 200
            ? 'Impactor below ~200 m: tsunami hazard negligible (NASA/NOAA 2017 workshop)'
            : 'Upper-bound order of magnitude (linear 1/r decay, Ward 2000): hydrocode studies summarised by the NASA/NOAA 2017 workshop found lower amplitudes. Coastal run-up not modelled.'
    };
}

module.exports = {
    thermalRadius,
    airburstLuminousEfficiency,
    seismicMagnitude,
    seafloorVelocity,
    waterCavity,
    tsunami,
    constants: { LUMINOUS_EFFICIENCY, SEISMIC_EFFICIENCY, THIRD_DEGREE_BURN_1MT, MT }
};
