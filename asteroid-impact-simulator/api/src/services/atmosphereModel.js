/**
 * USSA 1976 Atmospheric Model
 *
 * Phase 1.4 - Task 3.1: Standard Atmosphere Model for Altitude-Dependent Physics
 *
 * REPLACES: Constant sea-level atmosphere (ρ = 1.225 kg/m³, P = 101325 Pa, T = 288.15 K)
 * WITH: Altitude-stratified atmosphere from 0 to 86 km (USSA 1976 standard)
 *
 * PHYSICS:
 *   - Troposphere (0-11 km): Linear temperature decrease, exponential pressure/density decay
 *   - Stratosphere (11-47 km): Temperature increases with altitude (ozone layer)
 *   - Mesosphere (47-86 km): Temperature decreases again
 *
 * APPLICATIONS:
 *   1. Airburst blast enhancement (Mach reflection corrections)
 *   2. Atmospheric entry calculations (drag, heating)
 *   3. Fragment-cloud model V2 (altitude-dependent fragmentation)
 *   4. Crater formation (atmospheric path length)
 *
 * REFERENCES:
 *   - NOAA/NASA/USAF (1976) "U.S. Standard Atmosphere, 1976"
 *   - Anderson, J. D. (2016) "Introduction to Flight", Appendix A
 *   - Collins et al. (2005) "Earth Impact Effects Program"
 *
 * @module atmosphereModel
 */

// Physical constants
const R_SPECIFIC = 287.05;  // Specific gas constant for air (J/kg·K)
const GAMMA = 1.4;          // Ratio of specific heats for air
const g0 = 9.80665;         // Standard gravity at sea level (m/s²)
const R_EARTH = 6371000;    // Earth radius (m)

/**
 * USSA 1976 Layer Definitions
 *
 * Each atmospheric layer is defined by:
 *   - Base altitude (m)
 *   - Base temperature (K)
 *   - Base pressure (Pa)
 *   - Base density (kg/m³)
 *   - Temperature lapse rate (K/m)
 */
const ATMOSPHERE_LAYERS = [
    {
        name: 'Troposphere',
        h_base: 0,              // Sea level
        T_base: 288.15,         // 15°C
        P_base: 101325,         // 1 atm
        rho_base: 1.225,        // kg/m³
        lapse_rate: -0.0065,    // -6.5 K/km (temperature decreases)
        h_top: 11000            // 11 km (tropopause)
    },
    {
        name: 'Tropopause',
        h_base: 11000,
        T_base: 216.65,         // -56.5°C (constant in tropopause)
        P_base: 22632,          // Pa
        rho_base: 0.36391,      // kg/m³
        lapse_rate: 0.0,        // Isothermal layer
        h_top: 20000            // 20 km
    },
    {
        name: 'Stratosphere Lower',
        h_base: 20000,
        T_base: 216.65,
        P_base: 5474.9,
        rho_base: 0.08803,
        lapse_rate: 0.001,      // +1 K/km (temperature increases)
        h_top: 32000            // 32 km
    },
    {
        name: 'Stratosphere Middle',
        h_base: 32000,
        T_base: 228.65,
        P_base: 868.02,
        rho_base: 0.01322,
        lapse_rate: 0.0028,     // +2.8 K/km
        h_top: 47000            // 47 km (stratopause)
    },
    {
        name: 'Stratopause',
        h_base: 47000,
        T_base: 270.65,
        P_base: 110.91,
        rho_base: 0.00143,
        lapse_rate: 0.0,        // Isothermal
        h_top: 51000            // 51 km
    },
    {
        name: 'Mesosphere Lower',
        h_base: 51000,
        T_base: 270.65,
        P_base: 66.939,
        rho_base: 0.00086,
        lapse_rate: -0.0028,    // -2.8 K/km (cooling)
        h_top: 71000            // 71 km
    },
    {
        name: 'Mesosphere Upper',
        h_base: 71000,
        T_base: 214.65,
        P_base: 3.9564,
        rho_base: 0.000064,
        lapse_rate: -0.002,     // -2 K/km
        h_top: 86000            // 86 km (mesopause)
    }
];

/**
 * Get atmospheric properties at a given altitude using USSA 1976
 *
 * @param {number} altitude - Altitude above sea level in meters (0 to 86000 m)
 * @returns {Object} Atmospheric properties
 */
function getAtmosphericProperties(altitude) {
    // Clamp altitude to valid range
    if (altitude < 0) altitude = 0;
    if (altitude > 86000) {
        // Above 86 km: Use exponential decay (simplified model)
        return getHighAltitudeProperties(altitude);
    }

    // Find appropriate layer
    let layer = null;
    for (const l of ATMOSPHERE_LAYERS) {
        if (altitude >= l.h_base && altitude < l.h_top) {
            layer = l;
            break;
        }
    }

    // If exactly at top boundary, use next layer
    if (!layer && altitude === 86000) {
        layer = ATMOSPHERE_LAYERS[ATMOSPHERE_LAYERS.length - 1];
    }

    if (!layer) {
        throw new Error(`Altitude ${altitude} m is outside valid range (0-86000 m)`);
    }

    // Calculate altitude above layer base
    const h = altitude - layer.h_base;

    // Temperature calculation
    const T = layer.T_base + layer.lapse_rate * h;

    // Pressure and density calculation (depends on lapse rate)
    let P, rho;

    if (Math.abs(layer.lapse_rate) < 1e-6) {
        // Isothermal layer (lapse_rate ≈ 0)
        // P = P_base × exp(-g₀ × h / (R × T))
        const exponent = (-g0 * h) / (R_SPECIFIC * T);
        P = layer.P_base * Math.exp(exponent);
        rho = layer.rho_base * Math.exp(exponent);
    } else {
        // Non-isothermal layer
        // P = P_base × (T / T_base)^(-g₀ / (R × L))
        const T_ratio = T / layer.T_base;
        const exponent = -g0 / (R_SPECIFIC * layer.lapse_rate);
        P = layer.P_base * Math.pow(T_ratio, exponent);
        rho = layer.rho_base * Math.pow(T_ratio, exponent - 1);
    }

    // Derived properties
    const c = Math.sqrt(GAMMA * R_SPECIFIC * T);  // Speed of sound (m/s)
    const mu = calculateViscosity(T);              // Dynamic viscosity (Pa·s)
    const nu = mu / rho;                           // Kinematic viscosity (m²/s)

    return {
        altitude: altitude,
        layer: layer.name,

        // Primary properties
        temperature: T,           // K
        pressure: P,              // Pa
        density: rho,             // kg/m³

        // Derived properties
        speed_of_sound: c,        // m/s
        dynamic_viscosity: mu,    // Pa·s
        kinematic_viscosity: nu,  // m²/s

        // Common units
        temperature_C: T - 273.15,              // °C
        pressure_kPa: P / 1000,                 // kPa
        pressure_atm: P / 101325,               // atm
        density_ratio: rho / 1.225,             // ρ/ρ₀ (sea level)
        pressure_ratio: P / 101325,             // P/P₀

        // Scale height (for exponential decay approximation)
        scale_height: (R_SPECIFIC * T) / g0     // meters
    };
}

/**
 * High-altitude properties (>86 km) using simplified exponential model
 *
 * Above 86 km (mesopause), the atmosphere becomes very thin and molecular
 * diffusion dominates. Use simple exponential decay with fixed scale height.
 *
 * @param {number} altitude - Altitude in meters (>86000 m)
 * @returns {Object} Atmospheric properties
 */
function getHighAltitudeProperties(altitude) {
    // Base values at 86 km (mesopause)
    const h_base = 86000;
    const T_base = 186.87;     // K (mesopause temperature)
    const P_base = 0.3734;     // Pa
    const rho_base = 0.0000069; // kg/m³

    // Exponential decay above 86 km
    const H_scale = 6000;  // Scale height ~6 km (simplified)
    const h = altitude - h_base;

    const P = P_base * Math.exp(-h / H_scale);
    const rho = rho_base * Math.exp(-h / H_scale);
    const T = T_base;  // Approximately constant (simplified)

    const c = Math.sqrt(GAMMA * R_SPECIFIC * T);
    const mu = calculateViscosity(T);
    const nu = mu / rho;

    return {
        altitude: altitude,
        layer: 'Thermosphere (simplified)',

        temperature: T,
        pressure: P,
        density: rho,

        speed_of_sound: c,
        dynamic_viscosity: mu,
        kinematic_viscosity: nu,

        temperature_C: T - 273.15,
        pressure_kPa: P / 1000,
        pressure_atm: P / 101325,
        density_ratio: rho / 1.225,
        pressure_ratio: P / 101325,
        scale_height: H_scale
    };
}

/**
 * Calculate dynamic viscosity using Sutherland's formula
 *
 * FORMULA: μ = μ₀ × (T/T₀)^(3/2) × (T₀ + S) / (T + S)
 *
 * Where:
 *   μ₀ = 1.716e-5 Pa·s (reference viscosity at T₀)
 *   T₀ = 273.15 K (reference temperature)
 *   S = 110.4 K (Sutherland constant for air)
 *
 * @param {number} T - Temperature in Kelvin
 * @returns {number} Dynamic viscosity in Pa·s
 */
function calculateViscosity(T) {
    const mu0 = 1.716e-5;  // Pa·s
    const T0 = 273.15;     // K
    const S = 110.4;       // K (Sutherland constant)

    return mu0 * Math.pow(T / T0, 1.5) * (T0 + S) / (T + S);
}

/**
 * Calculate atmospheric path length for a given impact trajectory
 *
 * Integrates atmospheric density along trajectory from entry point to ground.
 * Used for atmospheric ablation, drag, and fragmentation calculations.
 *
 * @param {number} entry_altitude - Entry altitude in meters
 * @param {number} impact_altitude - Impact altitude (usually 0 for sea level)
 * @param {number} entry_angle - Entry angle from horizontal in degrees (0=horizontal, 90=vertical)
 * @param {number} num_steps - Number of integration steps (default 100)
 * @returns {Object} Path length and integrated atmospheric properties
 */
function calculatePathLength(entry_altitude, impact_altitude, entry_angle, num_steps = 100) {
    // Convert angle to radians (90° = vertical down)
    const theta_rad = entry_angle * Math.PI / 180;
    const sin_theta = Math.sin(theta_rad);

    if (sin_theta === 0) {
        throw new Error('Entry angle cannot be 0° (horizontal) - would never reach ground');
    }

    // Path length through atmosphere
    const altitude_change = entry_altitude - impact_altitude;
    const path_length = altitude_change / sin_theta;  // Slant path

    // Integration step size
    const ds = path_length / num_steps;  // Step along slant path
    const dh = -altitude_change / num_steps;  // Step in altitude (negative = descending)

    // Integrated quantities
    let total_column_density = 0;     // kg/m² (mass per unit area)
    let average_density = 0;          // kg/m³
    let average_pressure = 0;         // Pa
    let average_temperature = 0;      // K

    // Integrate along path
    for (let i = 0; i < num_steps; i++) {
        const h = entry_altitude + i * dh + dh / 2;  // Midpoint of step
        const atm = getAtmosphericProperties(h);

        // Trapezoidal integration for column density
        total_column_density += atm.density * ds;

        // Simple averaging for other properties
        average_density += atm.density / num_steps;
        average_pressure += atm.pressure / num_steps;
        average_temperature += atm.temperature / num_steps;
    }

    return {
        // Path geometry
        entry_altitude: entry_altitude,
        impact_altitude: impact_altitude,
        altitude_change: altitude_change,
        entry_angle: entry_angle,
        path_length: path_length,

        // Integrated atmospheric properties
        column_density: total_column_density,        // kg/m² (total mass along path)
        average_density: average_density,            // kg/m³
        average_pressure: average_pressure,          // Pa
        average_temperature: average_temperature,    // K

        // For comparison with sea level
        column_density_ratio: total_column_density / (1.225 * altitude_change),
        average_density_ratio: average_density / 1.225
    };
}

/**
 * Calculate Mach reflection enhancement for airburst
 *
 * When a spherical blast wave from an airburst reflects off the ground,
 * it creates a Mach stem (vertical shock front) that increases overpressure.
 *
 * PHYSICS:
 *   - Optimal burst height: H_opt ≈ 0.4 to 0.6 × R_target
 *   - Enhancement factor: 1.5× to 2.0× for optimal height
 *   - Ground burst: No enhancement (factor = 1.0)
 *   - Very high airburst: No enhancement (spherical wave doesn't reach ground)
 *
 * FORMULA (empirical, from nuclear test data):
 *   M = 1 + α × exp(-β × (H/R)²)
 *
 * Where:
 *   M = Mach reflection enhancement factor
 *   H = burst height above ground (m)
 *   R = blast radius at target overpressure (m)
 *   α = 0.8 (maximum enhancement ~80%)
 *   β = 2.0 (decay rate)
 *
 * @param {number} burst_height - Height above ground in meters
 * @param {number} blast_radius - Blast radius for target overpressure in meters
 * @returns {Object} Mach reflection properties
 */
function calculateMachReflection(burst_height, blast_radius) {
    if (burst_height <= 0) {
        // Ground burst: No Mach reflection (already at ground)
        return {
            burst_height: 0,
            blast_radius: blast_radius,
            height_ratio: 0,
            enhancement_factor: 1.0,
            enhanced_radius: blast_radius,
            optimal_height: false,
            type: 'ground_burst'
        };
    }

    // Height-to-radius ratio
    const H_R = burst_height / blast_radius;

    // Mach reflection enhancement (empirical formula)
    const alpha = 0.8;   // Maximum enhancement
    const beta = 2.0;    // Decay rate
    const M = 1 + alpha * Math.exp(-beta * H_R * H_R);

    // Enhanced blast radius (effective radius with Mach reflection)
    const enhanced_radius = blast_radius * M;

    // Optimal burst height (H/R ≈ 0.5 for maximum effect)
    const optimal_H_R_min = 0.4;
    const optimal_H_R_max = 0.6;
    const is_optimal = (H_R >= optimal_H_R_min && H_R <= optimal_H_R_max);

    // Determine burst type
    let burst_type;
    if (H_R < 0.1) {
        burst_type = 'low_airburst';  // Very close to ground
    } else if (is_optimal) {
        burst_type = 'optimal_airburst';  // Maximum Mach enhancement
    } else if (H_R < 2.0) {
        burst_type = 'moderate_airburst';
    } else {
        burst_type = 'high_airburst';  // Minimal Mach enhancement
    }

    return {
        burst_height: burst_height,
        blast_radius: blast_radius,
        height_ratio: H_R,
        enhancement_factor: M,
        enhanced_radius: enhanced_radius,
        optimal_height: is_optimal,
        optimal_range: [optimal_H_R_min, optimal_H_R_max],
        type: burst_type,

        // Additional metadata
        enhancement_percent: (M - 1) * 100,  // % increase in radius
        area_enhancement: M * M               // Affected area scales as R²
    };
}

/**
 * Calculate optimal burst height for maximum blast effect
 *
 * Given a target overpressure (e.g., 20 kPa for building collapse), calculate
 * the altitude that maximizes the affected area on the ground.
 *
 * @param {number} energy - Explosion energy in Joules
 * @param {number} target_overpressure - Target overpressure in kPa (default 20 kPa)
 * @returns {Object} Optimal burst parameters
 */
function calculateOptimalBurstHeight(energy, target_overpressure = 20) {
    // This requires the Rankine-Hugoniot module to calculate blast radius
    // For now, return the theoretical H/R ratio
    // Full implementation in Task 3.2 (integration with R-H module)

    return {
        energy: energy,
        target_overpressure_kPa: target_overpressure,
        optimal_height_ratio: 0.5,  // H/R ≈ 0.5 for maximum area
        note: 'Full implementation requires Rankine-Hugoniot integration (Task 3.2)'
    };
}

module.exports = {
    // Primary functions
    getAtmosphericProperties,
    calculatePathLength,
    calculateMachReflection,
    calculateOptimalBurstHeight,

    // Layer data (for debugging/visualization)
    ATMOSPHERE_LAYERS,

    // Physical constants
    R_SPECIFIC,
    GAMMA,
    g0,
    R_EARTH
};
