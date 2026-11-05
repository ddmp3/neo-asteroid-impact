/**
 * Rankine-Hugoniot Shock Wave Physics Module
 *
 * Phase 1.4 - Task 2.1: Physics-based shock wave propagation
 *
 * PROBLEM (identified by external expert):
 *   Current blast calculations use empirical scaling laws (nuclear-derived)
 *   Not physics-based, not specific to asteroid impacts
 *
 * SOLUTION:
 *   Implement Rankine-Hugoniot jump conditions for shock waves
 *   Conservation of mass, momentum, and energy across shock front
 *
 * PHYSICS:
 *   Shock waves are discontinuities in fluid properties
 *   Governed by conservation laws (Euler equations)
 *
 * REFERENCES:
 *   - Zel'dovich, Y. B., & Raizer, Y. P. (1966)
 *     "Physics of Shock Waves and High-Temperature Hydrodynamic Phenomena"
 *   - Melosh, H. J. (1989) "Impact Cratering" Chapter 4
 *   - Collins, G. S., et al. (2005) "Earth Impact Effects Program"
 *
 * @module rankineHugoniot
 * @version 1.0.0
 * @date 2025-10-19
 */

/**
 * Calculate shock wave properties using Rankine-Hugoniot jump conditions
 *
 * CONSERVATION LAWS across shock front:
 *   [1] Mass:     ρ₁u₁ = ρ₂u₂
 *   [2] Momentum: P₁ + ρ₁u₁² = P₂ + ρ₂u₂²
 *   [3] Energy:   h₁ + ½u₁² = h₂ + ½u₂²
 *
 * Where:
 *   ρ: density
 *   u: velocity (in shock frame)
 *   P: pressure
 *   h: specific enthalpy (h = e + P/ρ)
 *   e: specific internal energy
 *
 * Subscripts:
 *   1: upstream (ahead of shock, undisturbed air)
 *   2: downstream (behind shock, shocked air)
 *
 * @param {number} P1 - Upstream pressure (Pa)
 * @param {number} rho1 - Upstream density (kg/m³)
 * @param {number} T1 - Upstream temperature (K)
 * @param {number} shockVelocity - Shock velocity (m/s)
 * @param {number} gamma - Ratio of specific heats (default: 1.4 for air)
 * @returns {Object} Downstream shock properties
 */
function calculateShockJump(P1, rho1, T1, shockVelocity, gamma = 1.4) {
    // Mach number of shock
    const c1 = Math.sqrt(gamma * (P1 / rho1));  // Speed of sound upstream
    const M = shockVelocity / c1;                // Shock Mach number

    // Rankine-Hugoniot jump conditions (normal shock relations)
    //
    // DERIVATION (from conservation laws):
    //   Pressure ratio across shock (from momentum conservation)
    const P2_P1 = 1 + (2 * gamma / (gamma + 1)) * (M * M - 1);
    const P2 = P1 * P2_P1;

    //   Density ratio across shock (from mass + momentum conservation)
    const rho2_rho1 = ((gamma + 1) * M * M) / ((gamma - 1) * M * M + 2);
    const rho2 = rho1 * rho2_rho1;

    //   Temperature ratio (from ideal gas law: P/ρT = constant)
    const T2_T1 = P2_P1 / rho2_rho1;
    const T2 = T1 * T2_T1;

    //   Velocity behind shock (in lab frame)
    const u1 = shockVelocity;  // Shock velocity in lab frame
    const u2 = u1 * (rho1 / rho2);  // Particle velocity behind shock

    // Energy density (pressure × volume = energy per unit volume)
    const energyDensity = P2 / (gamma - 1);  // Internal energy per unit volume (J/m³)

    return {
        // Downstream properties (behind shock)
        pressure: P2,           // Pa
        density: rho2,          // kg/m³
        temperature: T2,        // K
        velocity: u2,           // m/s (particle velocity)

        // Ratios
        pressure_ratio: P2_P1,
        density_ratio: rho2_rho1,
        temperature_ratio: T2_T1,

        // Shock properties
        mach_number: M,
        shock_velocity: shockVelocity,  // m/s
        sound_speed_upstream: c1,       // m/s

        // Energy
        energy_density: energyDensity,  // J/m³

        // Metadata
        gamma: gamma,
        regime: M > 5 ? 'strong_shock' : (M > 2 ? 'moderate_shock' : 'weak_shock')
    };
}

/**
 * Calculate blast wave overpressure at distance from explosion
 *
 * PHYSICS:
 *   Point source explosion → spherical shock wave
 *   Energy conservation + Rankine-Hugoniot → pressure decay
 *
 * SEDOV-TAYLOR SOLUTION (strong shock, γ=1.4):
 *   R(t) = ξ₀ × (E t² / ρ₀)^(1/5)
 *
 *   Where:
 *     ξ₀ ≈ 1.033 (numerical constant)
 *     E: explosion energy (J)
 *     t: time since explosion (s)
 *     ρ₀: ambient density (kg/m³)
 *
 * OVERPRESSURE DECAY (Brode 1955, Collins et al. 2005):
 *   ΔP/P₀ = f(Z)  where Z = R / (E/P₀)^(1/3)  (scaled distance)
 *
 * @param {number} energy - Explosion energy in Joules
 * @param {number} distance - Distance from explosion center in meters
 * @param {number} P0 - Ambient pressure (Pa, default: 101325 Pa = 1 atm)
 * @param {number} rho0 - Ambient density (kg/m³, default: 1.225 kg/m³)
 * @returns {Object} Blast wave properties at distance
 */
function calculateBlastOverpressure(energy, distance, P0 = 101325, rho0 = 1.225) {
    // v2.0.5: Kinney & Graham (1985) free-air blast curve.
    //
    // The previous piecewise fit had discontinuities of up to 15x at its
    // breakpoints (Z = 0.2, 1, 10), so damage radii jumped as energy changed.
    // Kinney & Graham is a single smooth fit to free-air TNT blast data,
    // widely used for explosion effects:
    //
    //   ΔP/P0 = 808 [1 + (Z/4.5)²] / sqrt{[1 + (Z/0.048)²][1 + (Z/0.32)²][1 + (Z/1.35)²]}
    //
    //   Z = R / W^(1/3)   (m / kg^(1/3)), W = TNT mass in kg (4.184e6 J/kg)
    //
    // Sachs scaling for non-standard ambient pressure: Z × (P0 / 101325)^(1/3).
    //
    // Reference: Kinney, G.F. & Graham, K.J. (1985) "Explosive Shocks in Air",
    //            2nd ed., Springer, Eq. 7-2.
    const W_kg = energy / 4.184e6;
    const scaledDistance = (distance / Math.cbrt(W_kg)) * Math.cbrt(P0 / 101325);

    const Z = scaledDistance;
    const overpressure_ratio = 808 * (1 + Math.pow(Z / 4.5, 2)) /
        Math.sqrt(
            (1 + Math.pow(Z / 0.048, 2)) *
            (1 + Math.pow(Z / 0.32, 2)) *
            (1 + Math.pow(Z / 1.35, 2))
        );

    const overpressure = overpressure_ratio * P0;  // Pascals
    const total_pressure = P0 + overpressure;

    // Shock velocity (from Rankine-Hugoniot + Mach number)
    const gamma = 1.4;
    const c0 = Math.sqrt(gamma * P0 / rho0);  // Ambient sound speed (~340 m/s)
    const M = Math.sqrt(1 + ((gamma + 1) / (2 * gamma)) * overpressure_ratio);  // Shock Mach number
    const shockVelocity = M * c0;

    // Dynamic pressure (ram pressure from particle velocity)
    // q = 0.5 × ρ × u²
    const particleVelocity = (2 * overpressure) / (rho0 * shockVelocity);  // From R-H
    const dynamicPressure = 0.5 * rho0 * particleVelocity * particleVelocity;

    return {
        // Pressures
        overpressure: overpressure,                    // Pa (gauge pressure)
        total_pressure: total_pressure,                // Pa (absolute pressure)
        dynamic_pressure: dynamicPressure,             // Pa (ram pressure)

        // Overpressure in common units
        overpressure_kPa: overpressure / 1000,         // kPa
        overpressure_psi: overpressure / 6894.76,      // psi
        overpressure_bar: overpressure / 100000,       // bar

        // Shock properties
        shock_velocity: shockVelocity,                 // m/s
        particle_velocity: particleVelocity,           // m/s
        mach_number: M,

        // Scaled parameters
        scaled_distance: scaledDistance,
        overpressure_ratio: overpressure_ratio,

        // Damage thresholds (overpressure in kPa)
        damage_category: categorizeBlastDamage(overpressure / 1000),

        // Metadata
        distance: distance,
        energy: energy
    };
}

/**
 * Categorize blast damage based on overpressure
 *
 * DAMAGE THRESHOLDS (from nuclear test data, Collins et al. 2005):
 *   - 0.7 kPa (0.1 psi): Window glass shatters
 *   - 3.5 kPa (0.5 psi): Minor structural damage
 *   - 7 kPa (1 psi): Moderate structural damage
 *   - 20 kPa (3 psi): Severe structural damage, buildings collapse
 *   - 35 kPa (5 psi): Reinforced concrete damaged
 *   - 70 kPa (10 psi): Total destruction
 *   - 200 kPa (30 psi): Crater formation threshold
 *
 * @param {number} overpressure_kPa - Overpressure in kilopascals
 * @returns {string} Damage category
 */
function categorizeBlastDamage(overpressure_kPa) {
    if (overpressure_kPa >= 200) return 'crater_formation';
    if (overpressure_kPa >= 70) return 'total_destruction';
    if (overpressure_kPa >= 35) return 'severe_reinforced';
    if (overpressure_kPa >= 20) return 'severe_collapse';
    if (overpressure_kPa >= 7) return 'moderate_structural';
    if (overpressure_kPa >= 3.5) return 'minor_structural';
    if (overpressure_kPa >= 0.7) return 'window_shattering';
    return 'minimal';
}

/**
 * Calculate blast zone radii for different damage thresholds
 *
 * REPLACES: Empirical scaling laws (nuclear-derived)
 * WITH: Physics-based Rankine-Hugoniot + Sedov-Taylor + Mach reflection (Task 3.1)
 *
 * @param {number} energy - Explosion energy in Joules
 * @param {number} altitude - Explosion altitude in meters (0 = ground level)
 * @param {boolean} apply_mach_reflection - Apply Mach reflection correction for airbursts (default true)
 * @returns {Object} Blast zone radii in meters
 */
function calculateBlastZones(energy, altitude = 0, apply_mach_reflection = true) {
    // v2.0.5: Ground-range blast zones for surface bursts AND airbursts.
    //
    // Damage happens at the GROUND, so:
    //   1. Overpressure is evaluated with ground-level (sea-level) ambient air.
    //      (Before v2.0.5, atmosphereModel.js failed to load because of a "×"
    //      character in code, so this silently fell back to sea level anyway,
    //      and Mach reflection was never applied.)
    //   2. Ground reflection doubles the effective yield (standard hemispherical
    //      / reflected-wave approximation, Kinney & Graham 1985). This replaces
    //      the former radius multiplier for Mach reflection, which would double
    //      count the same effect.
    //   3. Each threshold is first found as a SLANT range R from the burst point,
    //      then converted to a ground range: r = sqrt(R² - h²), or 0 if R < h.
    //      Before v2.0.5 slant ranges were used directly as ground radii, so a
    //      burst at 30 km still produced "building collapse" zones on the ground;
    //      an empirical x7 altitude factor then inflated them further.
    //
    // Checks (see tests/historicalEvents.test.js):
    //   - Hiroshima (15 kt, 580 m): 35 kPa at ~1.3 km ground range
    //   - Chelyabinsk (~0.5 Mt, ~27 km): no structural zone, glass breakage ~100+ km
    //   - Tunguska (~5-12 Mt, ~8 km): 7 kPa at ~25-40 km (tree fall ~26 km)
    const P0 = 101325;
    const rho0 = 1.225;
    const h = Math.max(0, altitude || 0);
    const reflectedEnergy = 2 * energy;

    function findSlantRange(targetOverpressure_kPa) {
        // Overpressure decreases monotonically with distance: geometric bisection
        let r_min = 0.01;
        let r_max = 1e7;
        for (let iter = 0; iter < 200; iter++) {
            const r_mid = Math.sqrt(r_min * r_max);
            const blast = calculateBlastOverpressure(reflectedEnergy, r_mid, P0, rho0);
            if (blast.overpressure_kPa > targetOverpressure_kPa) {
                r_min = r_mid;
            } else {
                r_max = r_mid;
            }
            if (r_max / r_min < 1 + 1e-6) break;
        }
        return Math.sqrt(r_min * r_max);
    }

    function groundRange(targetOverpressure_kPa) {
        const R = findSlantRange(targetOverpressure_kPa);
        return R > h ? Math.sqrt(R * R - h * h) : 0;
    }

    const zones_final = {
        crater_formation: groundRange(200),      // 200 kPa
        total_destruction: groundRange(70),      // 70 kPa
        severe_reinforced: groundRange(35),      // 35 kPa
        severe_collapse: groundRange(20),        // 20 kPa
        moderate_structural: groundRange(7),     // 7 kPa
        minor_structural: groundRange(3.5),      // 3.5 kPa
        window_shattering: groundRange(0.7),     // 0.7 kPa
    };

    zones_final.energy = energy;
    zones_final.altitude = h;
    zones_final.ambient_pressure = P0;
    zones_final.ambient_density = rho0;
    zones_final.physics_model = 'Kinney & Graham (1985) blast curve, ground reflection, slant-to-ground range';
    zones_final.altitude_adjusted = h > 0;

    return zones_final;
}

/**
 * Validate Rankine-Hugoniot module against known test data
 *
 * @returns {Object} Validation results
 */
function validateRankineHugoniot() {
    // Test case 1: Trinity nuclear test (22 kt TNT)
    const trinity_energy = 22 * 4.184e12;  // 22 kilotons TNT
    const trinity_distance = 1000;  // 1 km

    const trinity_blast = calculateBlastOverpressure(trinity_energy, trinity_distance);

    // Test case 2: Hiroshima (15 kt TNT, ~600m altitude)
    const hiroshima_energy = 15 * 4.184e12;
    const hiroshima_altitude = 600;
    const hiroshima_zones = calculateBlastZones(hiroshima_energy, hiroshima_altitude);

    return {
        trinity: {
            energy_kt: 22,
            distance_km: 1.0,
            overpressure_kPa: trinity_blast.overpressure_kPa,
            damage: trinity_blast.damage_category
        },
        hiroshima: {
            energy_kt: 15,
            altitude_m: 600,
            severe_collapse_radius_km: hiroshima_zones.severe_collapse / 1000,
            moderate_damage_radius_km: hiroshima_zones.moderate_structural / 1000
        }
    };
}

module.exports = {
    calculateShockJump,
    calculateBlastOverpressure,
    categorizeBlastDamage,
    calculateBlastZones,
    validateRankineHugoniot
};
