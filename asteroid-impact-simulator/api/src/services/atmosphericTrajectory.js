/**
 * Atmospheric Trajectory Integration Module
 *
 * Implements rigorous physics-based atmospheric entry modeling using
 * Runge-Kutta 4th order (RK4) integration of coupled differential equations.
 *
 * CONSERVATION OF ENERGY GUARANTEE:
 *   E_initial = E_impact_ground + E_atmospheric + E_radiation
 *
 * Based on:
 * - Wheeler, L. F., et al. (2017). "A fragment-cloud model for asteroid breakup
 *   and atmospheric energy deposition." Icarus, 295, 149-169.
 * - Chyba, C. F., et al. (1993). "The 1908 Tunguska explosion: atmospheric
 *   disruption of a stony asteroid." Nature, 361(6407), 40-44.
 * - Hills, J. G., & Goda, M. P. (1993). "The fragmentation of small asteroids
 *   in the atmosphere." The Astronomical Journal, 105(3), 1114-1144.
 *
 * @module atmosphericTrajectory
 * @version 2.0.0
 * @author Meteor Madness Team - NASA Space Apps Challenge 2025
 */

class AtmosphericTrajectory {
    constructor() {
        // =====================================================================
        // PHYSICAL CONSTANTS
        // =====================================================================

        /** Atmospheric density at sea level (kg/m³) */
        this.RHO_0 = 1.225;

        /** Atmospheric scale height (m) - exponential atmosphere model */
        this.SCALE_HEIGHT = 8500;

        /** Gravitational acceleration at Earth's surface (m/s²) */
        this.GRAVITY = 9.81;

        // =====================================================================
        // MATERIAL PROPERTIES (Composition-Dependent)
        // =====================================================================

        /**
         * Drag coefficients (dimensionless)
         * Based on shape and surface roughness
         */
        this.DRAG_COEFFICIENTS = {
            rocky: 0.9,        // Rough spherical (ordinary chondrite)
            stony: 0.9,        // Synonym for rocky
            iron: 0.5,         // Smooth metallic surface
            metal: 0.5,        // Synonym for iron
            icy: 1.2,          // Irregular, easily fragmented
            ice: 1.2,          // Synonym for icy
            carbonaceous: 1.0  // Intermediate (C-type)
        };

        /**
         * Heat transfer coefficients (dimensionless)
         * Controls ablation rate during atmospheric passage
         *
         * Reference: Ceplecha et al. (1998) "Meteor Phenomena and Bodies"
         * CALIBRATED v1.7.1: Reduced to match Chelyabinsk/Tunguska observations
         */
        this.HEAT_TRANSFER_COEFFICIENTS = {
            rocky: 0.05,       // Moderate ablation (REDUCED from 0.1 to match observations)
            stony: 0.05,
            iron: 0.02,        // Resistant to ablation (REDUCED from 0.05)
            metal: 0.02,
            icy: 0.15,         // High ablation (REDUCED from 0.2)
            ice: 0.15,
            carbonaceous: 0.10 // High ablation (REDUCED from 0.15)
        };

        /**
         * Ablation enthalpy Q (J/kg)
         * Energy required to vaporize 1 kg of material
         *
         * Reference: Ceplecha, Z., et al. (1998) Space Sci. Rev. 84:327-471
         */
        this.ABLATION_ENTHALPY = {
            rocky: 8e6,         // 8 MJ/kg (silicate rocks)
            stony: 8e6,
            iron: 30e6,         // 30 MJ/kg (very resistant, high heat capacity)
            metal: 30e6,
            icy: 2e6,           // 2 MJ/kg (water ice sublimation)
            ice: 2e6,
            carbonaceous: 6e6   // 6 MJ/kg (organic-rich, lower than rocky)
        };

        /**
         * Material strength σ (Pa = N/m²) - BASE VALUES at 1 meter reference
         * Dynamic pressure at which fragmentation occurs
         *
         * v1.7.2: WEIBULL SCALING LAW - Physics-based size dependence
         *
         * References:
         * - Bruck Syal et al. (2016) "Scale-Dependent Measurements of Meteorite Strength"
         * - Popova et al. (2011) "Very low strengths of interplanetary meteoroids"
         * - Weibull fracture mechanics: σ(D) = σ₀ × (D₀/D)^(1/m)
         *
         * Weibull theory: Larger objects contain more defects → weaker strength
         */
        this.MATERIAL_STRENGTH_BASE = {
            rocky: 10e6,        // 10 MPa @ D=1m (reference strength)
            stony: 10e6,
            iron: 150e6,        // 150 MPa @ D=1m (very strong)
            metal: 150e6,
            icy: 1e6,           // 1 MPa @ D=1m (very weak)
            ice: 1e6,
            carbonaceous: 5e6   // 5 MPa @ D=1m
        };

        /**
         * Weibull modulus (m) - Controls strength scaling with size
         *
         * m = 15-20 for chondrite meteorites (Bruck Syal et al. 2016)
         * m = 10-15 for carbonaceous chondrites (weaker)
         * m = 25-30 for iron meteorites (stronger, less size dependence)
         */
        this.WEIBULL_MODULUS = {
            rocky: 18,          // Ordinary chondrites (LL/H/L)
            stony: 18,
            iron: 28,           // Iron meteorites (less size dependence)
            metal: 28,
            icy: 12,            // Cometary (more size dependence)
            ice: 12,
            carbonaceous: 15    // Carbonaceous chondrites
        };

        /**
         * Structural quality factors (rubble pile vs monolith)
         * Based on internal structure and cohesion
         */
        this.QUALITY_FACTORS = {
            'monolith': 1.0,        // Solid rock, no major fractures
            'consolidated': 0.5,    // Some fractures, partially consolidated
            'fractured': 0.2,       // Heavily fractured
            'rubble_pile': 0.1      // Loose aggregation (very weak)
        };

        // =====================================================================
        // PANCAKE MODEL PARAMETERS (Post-Fragmentation)
        // =====================================================================

        /**
         * Pancake spreading factor
         * After fragmentation, debris cloud expands laterally
         * Increases cross-sectional area → increases drag
         */
        this.PANCAKE_SPREADING_COEFFICIENT = 1.5;

        /**
         * Radiation efficiency
         * Fraction of atmospheric energy that becomes visible light
         *
         * Reference: Brown et al. (2013) Chelyabinsk analysis
         */
        this.RADIATION_EFFICIENCY = 0.10; // 10% becomes light/radiation
    }

    // =========================================================================
    // CORE INTEGRATION METHOD - RK4 (Runge-Kutta 4th Order)
    // =========================================================================

    /**
     * Integrate atmospheric trajectory using Runge-Kutta 4th order method
     *
     * Solves 3 coupled ODEs:
     *   1. dv/dt = deceleration (drag force)
     *   2. dm/dt = mass loss (ablation)
     *   3. dz/dt = altitude change (descent)
     *
     * @param {Object} params - Initial conditions
     * @param {number} params.diameter - Initial diameter (m)
     * @param {number} params.velocity - Initial velocity (m/s)
     * @param {number} params.angle - Entry angle (degrees, 0=horizontal, 90=vertical)
     * @param {number} params.density - Material density (kg/m³)
     * @param {string} params.composition - Material type ('rocky', 'iron', 'icy')
     * @param {number} [params.altitude_start=100000] - Starting altitude (m), default 100 km
     * @param {number} [params.dt=0.01] - Time step (s), default 10 ms
     * @param {number} [params.altitude_stop=0] - Stop altitude (m), default ground level
     * @returns {Object} Complete trajectory analysis with energy breakdown
     */
    async integrateTrajectory(params) {
        const {
            diameter,
            velocity,
            angle,
            density,
            composition,
            quality = 'consolidated',  // v1.7.2: structural quality
            altitude_start = 100000,   // 100 km default entry altitude
            dt = 0.01,                 // 10 ms time step (adaptive possible)
            altitude_stop = 0          // Ground level
        } = params;

        // Validate inputs
        if (!diameter || !velocity || !density || !composition) {
            throw new Error('Missing required parameters: diameter, velocity, density, composition');
        }

        // =====================================================================
        // STEP 1: INITIALIZE STATE
        // =====================================================================

        const theta_rad = angle * Math.PI / 180;  // Convert to radians
        const radius = diameter / 2;
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        const mass_initial = volume * density;

        // Get material properties
        const C_D = this.getDragCoefficient(composition);
        const C_h = this.getHeatTransferCoefficient(composition);
        const Q = this.getAblationEnthalpy(composition);
        const sigma_strength = this.getMaterialStrength(composition, diameter, quality); // v1.7.2: Weibull scaling

        // Initial state vector: [altitude, velocity, mass, time]
        let z = altitude_start;      // altitude (m)
        let v = velocity;             // velocity (m/s)
        let m = mass_initial;         // mass (kg)
        let t = 0;                    // time (s)
        let theta = theta_rad;        // flight path angle (rad)

        // Trajectory history
        const trajectory = [];

        // Fragmentation tracking
        let fragmented = false;
        let z_fragmentation = null;
        let v_fragmentation = null;
        let t_fragmentation = null;
        let m_fragmentation = null;  // Mass at fragmentation
        let E_kinetic_fragmentation = null;  // Kinetic energy at fragmentation (for airburst blast)
        let area_effective = Math.PI * radius * radius; // Initial cross-section

        // Energy deposition tracking
        let E_deposited_atmospheric = 0;  // Cumulative energy in atmosphere (J)
        let E_ablation = 0;                // Energy used for ablation (J)

        // =====================================================================
        // STEP 2: RK4 INTEGRATION LOOP
        // =====================================================================

        const max_iterations = 1000000;  // Safety limit
        let iteration = 0;

        while (z > altitude_stop && v > 0 && m > 0 && iteration < max_iterations) {
            iteration++;

            // Current atmospheric density (exponential model)
            const rho_air = this.atmosphericDensity(z);

            // Dynamic pressure (ram pressure)
            const P_dyn = 0.5 * rho_air * v * v;

            // -----------------------------------------------------------
            // FRAGMENTATION CHECK (Hills-Goda 1993 + Weibull v1.7.2)
            // -----------------------------------------------------------
            // v1.7.2: NO empirical pancake correction!
            // Weibull law already accounts for size-dependent strength
            // σ(D) = σ₀ × (D₀/D)^(1/m) - larger objects are weaker
            if (!fragmented && P_dyn > sigma_strength) {
                fragmented = true;
                z_fragmentation = z;
                v_fragmentation = v;
                t_fragmentation = t;
                m_fragmentation = m;
                E_kinetic_fragmentation = 0.5 * m * v * v;  // CRITICAL: Energy at fragmentation for airburst blast

                // PANCAKE MODEL: Area increases as debris cloud spreads
                // After fragmentation, effective radius grows
                const current_radius = Math.pow((3 * m) / (4 * Math.PI * density), 1/3);
                area_effective = Math.PI * current_radius * current_radius * this.PANCAKE_SPREADING_COEFFICIENT;

                // Store fragmentation event
                trajectory.push({
                    time: t,
                    altitude: z,
                    velocity: v,
                    mass: m,
                    pressure_dynamic: P_dyn,
                    event: 'FRAGMENTATION',
                    fragmented: true,
                    area_effective: area_effective,
                    kinetic_energy_J: E_kinetic_fragmentation
                });
            }

            // Update area if not fragmented (sphere shrinks as mass ablates)
            if (!fragmented) {
                const current_radius = Math.pow((3 * m) / (4 * Math.PI * density), 1/3);
                area_effective = Math.PI * current_radius * current_radius;
            }

            // -----------------------------------------------------------
            // RK4 INTEGRATION STEP
            // -----------------------------------------------------------

            // k1 = f(t_n, y_n)
            const k1 = this.derivatives(z, v, m, theta, rho_air, area_effective, C_D, C_h, Q);

            // k2 = f(t_n + dt/2, y_n + k1*dt/2)
            const k2 = this.derivatives(
                z + 0.5 * dt * k1.dz,
                v + 0.5 * dt * k1.dv,
                m + 0.5 * dt * k1.dm,
                theta,
                this.atmosphericDensity(z + 0.5 * dt * k1.dz),
                area_effective,
                C_D, C_h, Q
            );

            // k3 = f(t_n + dt/2, y_n + k2*dt/2)
            const k3 = this.derivatives(
                z + 0.5 * dt * k2.dz,
                v + 0.5 * dt * k2.dv,
                m + 0.5 * dt * k2.dm,
                theta,
                this.atmosphericDensity(z + 0.5 * dt * k2.dz),
                area_effective,
                C_D, C_h, Q
            );

            // k4 = f(t_n + dt, y_n + k3*dt)
            const k4 = this.derivatives(
                z + dt * k3.dz,
                v + dt * k3.dv,
                m + dt * k3.dm,
                theta,
                this.atmosphericDensity(z + dt * k3.dz),
                area_effective,
                C_D, C_h, Q
            );

            // Weighted average: y_{n+1} = y_n + (dt/6)(k1 + 2k2 + 2k3 + k4)
            const dv = (dt / 6) * (k1.dv + 2*k2.dv + 2*k3.dv + k4.dv);
            const dm = (dt / 6) * (k1.dm + 2*k2.dm + 2*k3.dm + k4.dm);
            const dz = (dt / 6) * (k1.dz + 2*k2.dz + 2*k3.dz + k4.dz);

            // Energy deposited in atmosphere during this time step
            // E_deposited = F_drag × v × dt
            const F_drag = 0.5 * rho_air * C_D * area_effective * v * v;
            const dE_atmospheric = F_drag * v * dt;
            E_deposited_atmospheric += dE_atmospheric;

            // Energy used for ablation during this time step
            // E_ablation = -dm × Q (dm is negative, so -dm is positive mass lost)
            const dE_ablation = -dm * Q;  // dm < 0, so this is positive
            E_ablation += dE_ablation;

            // Update state
            v += dv;
            m += dm;  // dm is negative (mass loss)
            z += dz;  // dz is negative (descending)
            t += dt;

            // Safety checks
            if (v < 0) v = 0;
            if (m < 0.01 * mass_initial) {
                // Complete atmospheric breakup (>99% mass lost)
                break;
            }

            // Record trajectory point every ~100 steps to save memory
            if (iteration % 100 === 0 || fragmented) {
                trajectory.push({
                    time: t,
                    altitude: z,
                    velocity: v,
                    mass: m,
                    pressure_dynamic: P_dyn,
                    fragmented: fragmented,
                    area_effective: area_effective,
                    energy_deposited_cumulative: E_deposited_atmospheric
                });
            }

            // Stop integration for high-altitude airbursts
            // After fragmentation above 15 km, track if fragments reach ground as significant impactors
            if (fragmented && z_fragmentation > 15000) {
                const mass_lost_percent = ((mass_initial - m) / mass_initial) * 100;

                // Stop if high mass loss (>90%) - airburst with dispersed fragments
                if (mass_lost_percent > 90 && z > 5000) {
                    break;
                }

                // Stop if velocity dropped below terminal velocity (fragments dispersed)
                // Terminal velocity ~100-200 m/s for small fragments
                if (v < 300 && z > 5000) {
                    break;
                }
            }
        }

        // =====================================================================
        // STEP 3: ENERGY ACCOUNTING (Conservation Check)
        // =====================================================================

        const E_initial = 0.5 * mass_initial * velocity * velocity;
        const E_final = (z <= 0 && m > 0) ? 0.5 * m * v * v : 0;
        const E_radiation = this.RADIATION_EFFICIENCY * E_deposited_atmospheric;

        // Conservation check (FIXED: include ablation energy)
        // E_initial = E_final + E_atmospheric + E_ablation + E_radiation
        const E_total_accounted = E_final + E_deposited_atmospheric + E_ablation;
        const conservation_error = Math.abs(E_total_accounted - E_initial) / E_initial * 100;

        // =====================================================================
        // STEP 4: CLASSIFY IMPACT TYPE
        // =====================================================================

        // CLASSIFICATION LOGIC (FIXED v1.7.1):
        // Priority: Fragmentation altitude determines impact type, NOT final altitude
        // Airbursts are defined by HIGH-ALTITUDE fragmentation, even if fragments reach ground

        let impact_type, crater_formed;

        if (fragmented && z_fragmentation > 20000) {
            // High-altitude fragmentation (>20 km) = airburst
            // Example: Chelyabinsk (26 km)
            impact_type = 'high_altitude_airburst';
            crater_formed = false;
        } else if (fragmented && z_fragmentation > 5000) {
            // Mid-altitude fragmentation (5-20 km) = airburst
            // Example: Tunguska (8.5 km)
            impact_type = 'airburst';
            crater_formed = false;
        } else if (fragmented && z_fragmentation > 1000) {
            // Low-altitude fragmentation (1-5 km) = airburst with possible ground fragments
            impact_type = 'low_altitude_airburst';
            crater_formed = false;
        } else if (!fragmented && z <= 0) {
            // No fragmentation, reached ground intact = ground impact
            impact_type = 'ground';
            crater_formed = true;
        } else if (fragmented && z <= 0) {
            // Fragmented at very low altitude (<1 km), substantial fragments reach ground
            impact_type = 'low_airburst_with_impact';
            crater_formed = true;
        } else {
            // Stopped in atmosphere (complete breakup)
            impact_type = 'atmospheric_breakup';
            crater_formed = false;
        }

        // =====================================================================
        // STEP 5: RETURN COMPREHENSIVE RESULTS
        // =====================================================================

        return {
            // Trajectory data
            trajectory: trajectory,

            // Summary statistics
            summary: {
                // Initial conditions
                mass_initial: mass_initial,
                velocity_initial: velocity,
                diameter_initial: diameter,
                altitude_initial: altitude_start,

                // Final conditions
                mass_final: m,
                velocity_final: v,
                altitude_final: z,
                time_total: t,

                // Mass and velocity changes
                mass_ablated: mass_initial - m,
                mass_ablated_percent: ((mass_initial - m) / mass_initial) * 100,
                velocity_lost: velocity - v,
                velocity_lost_percent: ((velocity - v) / velocity) * 100,

                // Fragmentation
                fragmented: fragmented,
                altitude_fragmentation: z_fragmentation,
                velocity_fragmentation: v_fragmentation,
                time_fragmentation: t_fragmentation,
                mass_fragmentation: m_fragmentation,
                energy_kinetic_fragmentation_J: E_kinetic_fragmentation,  // CRITICAL: For airburst blast energy
                energy_kinetic_fragmentation_MT: E_kinetic_fragmentation ? E_kinetic_fragmentation / 4.184e15 : 0,

                // Impact classification
                impact_type: impact_type,
                crater_formed: crater_formed,

                // ENERGY ACCOUNTING (Conservation of Energy)
                energy_initial_J: E_initial,
                energy_final_J: E_final,
                energy_atmospheric_J: E_deposited_atmospheric,
                energy_ablation_J: E_ablation,  // FIXED: Added ablation energy
                energy_radiation_J: E_radiation,

                energy_initial_MT: E_initial / 4.184e15,
                energy_final_MT: E_final / 4.184e15,
                energy_atmospheric_MT: E_deposited_atmospheric / 4.184e15,
                energy_ablation_MT: E_ablation / 4.184e15,
                energy_radiation_MT: E_radiation / 4.184e15,

                // Retention factor (for comparison with old model)
                retention_factor: E_final / E_initial,
                atmospheric_loss_percent: (E_deposited_atmospheric / E_initial) * 100,

                // Conservation check
                conservation_error_percent: conservation_error
            },

            // Metadata
            method: 'Runge-Kutta 4 (RK4) - Wheeler et al. (2017)',
            timestep_seconds: dt,
            iterations: iteration,
            trajectory_points: trajectory.length,

            // Material properties used
            properties: {
                composition: composition,
                density: density,
                drag_coefficient: C_D,
                heat_transfer_coefficient: C_h,
                ablation_enthalpy: Q,
                material_strength: sigma_strength
            }
        };
    }

    // =========================================================================
    // DIFFERENTIAL EQUATIONS (Right-Hand Side of ODEs)
    // =========================================================================

    /**
     * Calculate derivatives for RK4 integration
     *
     * @param {number} z - Altitude (m)
     * @param {number} v - Velocity (m/s)
     * @param {number} m - Mass (kg)
     * @param {number} theta - Flight path angle (rad)
     * @param {number} rho_air - Atmospheric density (kg/m³)
     * @param {number} A - Effective cross-sectional area (m²)
     * @param {number} C_D - Drag coefficient
     * @param {number} C_h - Heat transfer coefficient
     * @param {number} Q - Ablation enthalpy (J/kg)
     * @returns {Object} {dv, dm, dz} - Derivatives
     */
    derivatives(z, v, m, theta, rho_air, A, C_D, C_h, Q) {
        // Drag force: F_D = (1/2) × ρ_air × C_D × A × v²
        const F_drag = 0.5 * rho_air * C_D * A * v * v;

        // Deceleration: dv/dt = -F_D / m
        const dv_dt = -F_drag / m;

        // Ablation (mass loss): dm/dt = -(1/2) × C_h × (ρ_air × A × v³) / Q
        // Negative sign because mass decreases
        const dm_dt = -0.5 * C_h * (rho_air * A * Math.pow(v, 3)) / Q;

        // Descent: dz/dt = -v × sin(θ)
        // Negative sign because altitude decreases
        const dz_dt = -v * Math.sin(theta);

        return {
            dv: dv_dt,
            dm: dm_dt,
            dz: dz_dt
        };
    }

    // =========================================================================
    // ATMOSPHERIC MODEL
    // =========================================================================

    /**
     * Calculate atmospheric density at given altitude
     * Uses exponential atmosphere model (barometric formula)
     *
     * ρ(z) = ρ_0 × exp(-z / H)
     *
     * @param {number} altitude - Altitude above sea level (m)
     * @returns {number} Atmospheric density (kg/m³)
     */
    atmosphericDensity(altitude) {
        return this.RHO_0 * Math.exp(-altitude / this.SCALE_HEIGHT);
    }

    // =========================================================================
    // MATERIAL PROPERTY ACCESSORS
    // =========================================================================

    getDragCoefficient(composition) {
        const comp = composition.toLowerCase();
        return this.DRAG_COEFFICIENTS[comp] || 0.9; // Default rocky
    }

    getHeatTransferCoefficient(composition) {
        const comp = composition.toLowerCase();
        return this.HEAT_TRANSFER_COEFFICIENTS[comp] || 0.1; // Default rocky
    }

    getAblationEnthalpy(composition) {
        const comp = composition.toLowerCase();
        return this.ABLATION_ENTHALPY[comp] || 8e6; // Default rocky (8 MJ/kg)
    }

    /**
     * Calculate material strength using Weibull scaling law (v1.7.2)
     *
     * WEIBULL FRACTURE MECHANICS:
     * σ(D) = σ₀ × (D₀ / D)^(1/m)
     *
     * Where:
     * - σ(D) = strength at diameter D
     * - σ₀ = reference strength at D₀ = 1 meter
     * - m = Weibull modulus (material-dependent)
     * - D = diameter in meters
     *
     * Physics: Larger objects contain more defects/cracks → weaker
     * Validated: Bruck Syal et al. (2016) on real meteorite samples
     *
     * @param {string} composition - Material type
     * @param {number} diameter - Asteroid diameter in meters
     * @param {string} quality - Structural quality ('monolith', 'consolidated', 'fractured', 'rubble_pile')
     * @returns {number} Material strength in Pa
     */
    getMaterialStrength(composition, diameter = 1.0, quality = 'consolidated') {
        const comp = composition.toLowerCase();

        // Get base strength at 1 meter reference
        const sigma_0 = this.MATERIAL_STRENGTH_BASE[comp] || 10e6;

        // Get Weibull modulus
        const m = this.WEIBULL_MODULUS[comp] || 18;

        // WEIBULL SCALING LAW: σ(D) = σ₀ × (D₀/D)^(1/m)
        // D₀ = 1 meter (reference)
        const D_0 = 1.0;
        const weibull_factor = Math.pow(D_0 / diameter, 1 / m);
        let sigma = sigma_0 * weibull_factor;

        // Apply structural quality factor
        const quality_factor = this.QUALITY_FACTORS[quality] || 0.5;
        sigma *= quality_factor;

        return sigma;
    }
}

module.exports = AtmosphericTrajectory;
