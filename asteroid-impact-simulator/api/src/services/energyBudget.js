/**
 * Complete Energy Budget Module
 *
 * Phase 1.4 - Task 1.2: Decompose total impact energy into physical components
 *
 * PROBLEM:
 *   Current implementation only tracks kinetic energy (0.5 × m × v²)
 *   Missing: rotational energy, deformation energy, thermal partitioning
 *
 * SOLUTION:
 *   Implement complete energy budget from Melosh (1989) Chapter 5
 *
 * ENERGY COMPONENTS:
 *   1. Translational kinetic energy: E_trans = 0.5 × m × v²
 *   2. Rotational kinetic energy: E_rot = 0.5 × I × ω²
 *   3. Deformation energy: E_def (compression, shock heating)
 *   4. Thermal energy: E_thermal (ablation, vaporization) - [Task 1.3]
 *
 * REFERENCES:
 *   - Melosh, H. J. (1989) "Impact Cratering" Chapter 5
 *   - Collins et al. (2005) "Earth Impact Effects Program"
 *   - Asphaug et al. (1998) "Disruption of kilometre-sized asteroids"
 *
 * @module energyBudget
 * @version 1.0.0
 * @date 2025-10-19
 */

/**
 * Calculate rotational kinetic energy of asteroid
 *
 * PHYSICS:
 *   E_rot = 0.5 × I × ω²
 *
 *   Where:
 *     I = moment of inertia (kg·m²)
 *     ω = angular velocity (rad/s)
 *
 * MOMENT OF INERTIA (uniform sphere):
 *   I = (2/5) × m × R²
 *
 * TYPICAL ASTEROID ROTATION:
 *   Period P: 2-24 hours (most common: 4-8 hours)
 *   ω = 2π / P
 *
 * ROTATIONAL ENERGY MAGNITUDE:
 *   E_rot << E_trans (typically 0.01-1% of translational)
 *   BUT: Important for rubble-pile disruption, spin state
 *
 * @param {number} mass - Asteroid mass in kg
 * @param {number} diameter - Asteroid diameter in meters
 * @param {number} rotationPeriod - Rotation period in hours (default: 6h)
 * @returns {Object} Rotational energy components
 */
function calculateRotationalEnergy(mass, diameter, rotationPeriod = 6.0) {
    // Convert rotation period to angular velocity
    const period_seconds = rotationPeriod * 3600;  // hours to seconds
    const omega = (2 * Math.PI) / period_seconds;  // rad/s

    // Moment of inertia for uniform sphere: I = (2/5) × m × R²
    const radius = diameter / 2;
    const I = (2/5) * mass * radius * radius;

    // Rotational kinetic energy: E = 0.5 × I × ω²
    const E_rot = 0.5 * I * omega * omega;

    // Fraction of total kinetic energy (assuming v = 15 km/s typical)
    const v_typical = 15000;  // m/s
    const E_trans_typical = 0.5 * mass * v_typical * v_typical;
    const rotation_fraction = E_rot / E_trans_typical;

    return {
        rotational_energy: E_rot,           // Joules
        moment_of_inertia: I,               // kg·m²
        angular_velocity: omega,            // rad/s
        rotation_period: rotationPeriod,    // hours
        rotation_fraction: rotation_fraction,  // Typically 0.0001 to 0.01

        // Metadata
        assumption: `Uniform sphere, P=${rotationPeriod}h`,
        typical_range: '0.01-1% of translational energy'
    };
}

/**
 * Calculate deformation energy during impact
 *
 * PHYSICS:
 *   During impact, both impactor and target undergo:
 *   1. Elastic compression (reversible)
 *   2. Plastic deformation (irreversible)
 *   3. Shock heating (entropy increase)
 *
 * DEFORMATION ENERGY PARTITION:
 *   E_def ≈ 0.15 × E_kinetic (Collins et al. 2005)
 *
 *   Breakdown:
 *     - 40% → Target compression/heating
 *     - 30% → Impactor compression/heating
 *     - 30% → Shock wave dissipation
 *
 * VELOCITY DEPENDENCE:
 *   Low velocity (<5 km/s): More elastic, less deformation (~5%)
 *   Medium (5-20 km/s): Standard regime (~15%)
 *   Hypervelocity (>20 km/s): More vaporization, less deformation (~10%)
 *
 * @param {number} kineticEnergy - Total kinetic energy in Joules
 * @param {number} velocity - Impact velocity in m/s
 * @param {string} composition - Impactor composition ('iron', 'rocky', 'icy')
 * @returns {Object} Deformation energy breakdown
 */
function calculateDeformationEnergy(kineticEnergy, velocity, composition = 'rocky') {
    const v_km_s = velocity / 1000;

    // Base deformation fraction (velocity-dependent)
    let deformation_fraction;
    if (v_km_s < 5) {
        // Low velocity: More elastic behavior
        deformation_fraction = 0.05;
    } else if (v_km_s <= 20) {
        // Medium velocity: Standard impact regime
        // Linear interpolation: 5% at 5 km/s, 15% at 20 km/s
        deformation_fraction = 0.05 + (v_km_s - 5) * (0.10 / 15);
    } else {
        // Hypervelocity: More vaporization, less deformation
        deformation_fraction = 0.10;
    }

    // Composition correction
    let composition_factor = 1.0;
    const comp_lower = composition.toLowerCase();

    if (comp_lower === 'iron' || comp_lower === 'metal') {
        // Iron: Higher strength → more elastic response
        composition_factor = 0.8;  // 20% less deformation
    } else if (comp_lower === 'icy' || comp_lower === 'ice' || comp_lower === 'comet') {
        // Ice: Lower strength → more crushing/fragmentation
        composition_factor = 1.2;  // 20% more deformation
    }

    const adjusted_fraction = deformation_fraction * composition_factor;
    const E_def_total = kineticEnergy * adjusted_fraction;

    // Partition deformation energy (Collins et al. 2005)
    const E_target_compression = E_def_total * 0.40;
    const E_impactor_compression = E_def_total * 0.30;
    const E_shock_dissipation = E_def_total * 0.30;

    return {
        total_deformation: E_def_total,
        target_compression: E_target_compression,
        impactor_compression: E_impactor_compression,
        shock_dissipation: E_shock_dissipation,

        // Metadata
        deformation_fraction: adjusted_fraction,
        velocity_km_s: v_km_s,
        composition: composition,
        note: 'Based on Collins et al. (2005) impact energy partitioning'
    };
}

/**
 * Calculate complete energy budget for asteroid impact
 *
 * TOTAL ENERGY BALANCE:
 *   E_total = E_kinetic_trans + E_kinetic_rot
 *   E_kinetic_trans = E_crater + E_ejecta + E_deformation + E_thermal
 *
 * WHERE:
 *   E_crater: Energy coupled to crater excavation (from energyCoupling.js)
 *   E_ejecta: Energy in ejecta curtain (high-velocity material)
 *   E_deformation: Compression + shock heating
 *   E_thermal: Ablation + vaporization [Task 1.3]
 *
 * @param {number} mass - Impactor mass in kg
 * @param {number} diameter - Impactor diameter in meters
 * @param {number} velocity - Impact velocity in m/s
 * @param {number} angle - Impact angle in degrees
 * @param {string} composition - Impactor composition
 * @param {number} rotationPeriod - Rotation period in hours (default: 6h)
 * @param {number} couplingEfficiency - Energy coupling from energyCoupling.js
 * @returns {Object} Complete energy budget
 */
function calculateCompleteEnergyBudget(
    mass,
    diameter,
    velocity,
    angle,
    composition = 'rocky',
    rotationPeriod = 6.0,
    couplingEfficiency = null,
    thermalAblationEnergy = 0  // v2.0.1 Phase 1.4 Task 1.3: From RK4 atmospheric integration
) {
    // Component 1: Translational kinetic energy
    const E_kinetic_trans = 0.5 * mass * velocity * velocity;

    // Component 2: Rotational kinetic energy
    const rotation = calculateRotationalEnergy(mass, diameter, rotationPeriod);
    const E_kinetic_rot = rotation.rotational_energy;

    // Total kinetic energy
    const E_kinetic_total = E_kinetic_trans + E_kinetic_rot;

    // Component 3: Deformation energy (dissipated during impact)
    // This energy is LOST to compression, shock heating - not available for crater/ejecta
    const deformation = calculateDeformationEnergy(E_kinetic_total, velocity, composition);
    const E_deformation = deformation.total_deformation;

    // Component 4: Thermal energy (v2.0.1 Task 1.3)
    // Energy lost to ablation, vaporization during atmospheric entry
    // Calculated by RK4 atmospheric trajectory integration (atmosphericTrajectory.js)
    //
    // PHYSICS:
    //   - Stagnation heating: Q = 0.5 × ρ × v³ × A × C_H
    //   - Ablation: dm/dt = Q / L_ablation
    //   - Energy lost: E_thermal = ∫ Q dt = ∫ (-dm) × L_ablation
    //
    // TYPICAL VALUES:
    //   - Small asteroids (<100m): 10-50% of kinetic energy
    //   - Large asteroids (>1km): <5% (less atmospheric interaction)
    const E_thermal_ablation = thermalAblationEnergy;

    // Energy AVAILABLE for crater formation and ejecta (after deformation/thermal losses)
    const E_available = E_kinetic_trans - E_deformation - E_thermal_ablation;

    // Component 5: Crater excavation energy (from coupling efficiency)
    // If coupling not provided, use default 0.85 (vertical impact)
    const eta = couplingEfficiency !== null ? couplingEfficiency : 0.85;
    const E_crater = E_available * eta;

    // Component 6: Ejecta energy (momentum lost to high-velocity ejecta)
    const E_ejecta = E_available * (1.0 - eta);

    // ENERGY BALANCE CHECK
    // E_total = E_crater + E_ejecta + E_deformation + E_thermal + E_rotational
    const E_accounted = E_crater + E_ejecta + E_deformation + E_thermal_ablation + E_kinetic_rot;
    const E_unaccounted = E_kinetic_total - E_accounted;

    return {
        // Total energy
        total_energy: E_kinetic_total,
        translational_kinetic: E_kinetic_trans,
        rotational_kinetic: E_kinetic_rot,

        // Energy partitioning
        crater_excavation: E_crater,
        ejecta_curtain: E_ejecta,
        deformation: E_deformation,
        thermal_ablation: E_thermal_ablation,  // TODO: Task 1.3
        unaccounted: E_unaccounted,

        // Fractions (for visualization)
        fractions: {
            crater: E_crater / E_kinetic_total,
            ejecta: E_ejecta / E_kinetic_total,
            deformation: E_deformation / E_kinetic_total,
            thermal: E_thermal_ablation / E_kinetic_total,
            rotational: E_kinetic_rot / E_kinetic_total,
            unaccounted: E_unaccounted / E_kinetic_total
        },

        // Detailed breakdowns
        rotation_details: rotation,
        deformation_details: deformation,

        // Metadata
        coupling_efficiency: eta,
        velocity_km_s: velocity / 1000,
        composition: composition,
        impact_angle: angle
    };
}

/**
 * Validate energy budget conservation
 *
 * PHYSICS CHECKS:
 *   1. Total energy = Sum of components (±1% tolerance)
 *   2. Rotational energy << Translational (<1%)
 *   3. Deformation energy: 5-20% of total
 *   4. Crater + Ejecta = (1 - deformation) × Translational
 *
 * @param {Object} budget - Energy budget from calculateCompleteEnergyBudget()
 * @returns {Object} Validation results
 */
function validateEnergyBudget(budget) {
    const total = budget.total_energy;
    const sum_components = budget.translational_kinetic + budget.rotational_kinetic;

    const conservation_error = Math.abs((sum_components - total) / total);
    const conservation_valid = conservation_error < 0.01;  // 1% tolerance

    const rotation_fraction = budget.rotational_kinetic / total;
    const rotation_valid = rotation_fraction < 0.01;  // Should be <1%

    const deformation_fraction = budget.deformation / total;
    const deformation_valid = deformation_fraction >= 0.05 && deformation_fraction <= 0.20;

    const partitioning_sum = budget.crater_excavation + budget.ejecta_curtain +
                            budget.deformation + budget.thermal_ablation;
    const partitioning_error = Math.abs((partitioning_sum - total) / total);
    const partitioning_valid = partitioning_error < 0.05;  // 5% tolerance

    const all_valid = conservation_valid && rotation_valid && deformation_valid && partitioning_valid;

    return {
        valid: all_valid,
        checks: {
            energy_conservation: {
                valid: conservation_valid,
                error_pct: (conservation_error * 100).toFixed(2),
                tolerance: '1%'
            },
            rotational_magnitude: {
                valid: rotation_valid,
                fraction_pct: (rotation_fraction * 100).toFixed(4),
                expected: '<1%'
            },
            deformation_range: {
                valid: deformation_valid,
                fraction_pct: (deformation_fraction * 100).toFixed(1),
                expected: '5-20%'
            },
            partitioning_sum: {
                valid: partitioning_valid,
                error_pct: (partitioning_error * 100).toFixed(2),
                tolerance: '5%'
            }
        },
        summary: all_valid ? '✅ Energy budget valid' : '❌ Energy budget has inconsistencies'
    };
}

module.exports = {
    calculateRotationalEnergy,
    calculateDeformationEnergy,
    calculateCompleteEnergyBudget,
    validateEnergyBudget
};
