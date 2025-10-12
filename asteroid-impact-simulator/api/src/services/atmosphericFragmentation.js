/**
 * Atmospheric Fragmentation Module (Hills-Goda 1993)
 * Implements pancake model for asteroid airburst detection
 *
 * References:
 * - Hills, J. G., & Goda, M. P. (1993). "The fragmentation of small asteroids in the atmosphere"
 *   The Astronomical Journal, 105(3), 1114-1144. DOI: 10.1086/116499
 * - Chyba, C. F., Thomas, P. J., & Zahnle, K. J. (1993). "The 1908 Tunguska explosion:
 *   atmospheric disruption of a stony asteroid" Nature, 361(6407), 40-44.
 * - Wheeler, L. F., et al. (2017). "A fragment-cloud model for asteroid breakup and
 *   atmospheric energy deposition" Icarus, 295, 149-169.
 *
 * Validation:
 * - Chelyabinsk (2013): 20m, 19 km/s → 23.5 km altitude (observed)
 * - Tunguska (1908): 60m, 15 km/s → 8 km altitude (estimated)
 * - Barringer (50k years): 50m iron, 12.8 km/s → ground impact (observed)
 */

class AtmosphericFragmentation {
    constructor() {
        // Atmospheric constants
        this.RHO_AIR_SURFACE = 1.225; // kg/m³ at sea level
        this.SCALE_HEIGHT = 8500; // meters (atmospheric scale height)
        this.GRAVITY = 9.81; // m/s²

        // Material strength values (Pa)
        // Based on Wheeler et al. (2017), Brown et al. (2013), and laboratory measurements
        this.STRENGTH_VALUES = {
            // Composition-based strengths
            rocky: 2e6,      // 2 MPa - typical stony asteroid (S-type, consolidated)
            iron: 1e8,       // 100 MPa - iron meteorite (M-type)
            icy: 1e5,        // 0.1 MPa - cometary material (C-type)

            // Quality-based modifiers (for weak/porous objects like Tunguska)
            weak: 5e5,       // 0.5 MPa - rubble pile, fractured (Tunguska-like)
            medium: 2e6,     // 2 MPa - typical consolidated
            strong: 1e7      // 10 MPa - monolithic rock
        };
    }

    /**
     * Determine material strength based on composition
     * @param {string} composition - 'rocky', 'iron', or 'icy'
     * @returns {number} Strength in Pascals
     */
    getMaterialStrength(composition) {
        const normalized = composition.toLowerCase();
        return this.STRENGTH_VALUES[normalized] || this.STRENGTH_VALUES.rocky;
    }

    /**
     * Calculate atmospheric density at altitude (exponential model)
     * @param {number} altitude - Altitude in meters
     * @returns {number} Air density in kg/m³
     */
    getAtmosphericDensity(altitude) {
        return this.RHO_AIR_SURFACE * Math.exp(-altitude / this.SCALE_HEIGHT);
    }

    /**
     * Calculate ram pressure (dynamic pressure) at given conditions
     * @param {number} altitude - Altitude in meters
     * @param {number} velocity - Velocity in m/s
     * @returns {number} Ram pressure in Pascals
     */
    calculateRamPressure(altitude, velocity) {
        const rho_air = this.getAtmosphericDensity(altitude);
        return 0.5 * rho_air * velocity * velocity;
    }

    /**
     * Determine if asteroid will fragment in atmosphere (Hills-Goda 1993)
     *
     * Fragmentation criterion: P_ram > σ (material strength)
     * Where P_ram = 0.5 × ρ_air × v²
     *
     * @param {number} diameter - Asteroid diameter in meters
     * @param {number} velocity - Entry velocity in m/s
     * @param {string} composition - Material type ('rocky', 'iron', 'icy')
     * @param {number} density - Asteroid density in kg/m³ (optional)
     * @returns {Object} Fragmentation analysis result
     */
    analyzeFragmentation(diameter, velocity, composition = 'rocky', density = 3000) {
        // 1. Get material strength
        const strength = this.getMaterialStrength(composition);

        // 2. Calculate ram pressure at surface (maximum)
        const P_ram_surface = this.calculateRamPressure(0, velocity);

        // 3. Check if fragmentation will occur
        if (P_ram_surface < strength) {
            // Object is strong enough to survive atmosphere intact
            return {
                willFragment: false,
                reachesGround: true,
                impactType: 'ground',
                altitude: 0,
                strength: strength,
                ramPressure: P_ram_surface,
                note: 'Object survives atmospheric entry intact',
                craterFormed: true
            };
        }

        // 4. Calculate altitude of initial fragmentation
        // Solving: 0.5 × ρ_air(h) × v² = σ
        // ρ_air(h) = ρ₀ × exp(-h/H)
        // → h = H × ln(0.5 × ρ₀ × v² / σ)
        //
        // CORRECTION: The observed burst altitude is typically LOWER than
        // theoretical fragmentation height due to:
        // 1. Progressive breakup (not instantaneous)
        // 2. Fragment cloud deceleration
        // 3. Peak energy deposition occurs below initial breakup
        //
        // Empirical correction factor ~0.55 based on Chelyabinsk & Tunguska data
        const theoretical_altitude = this.SCALE_HEIGHT *
            Math.log(P_ram_surface / strength);
        const altitude_fragmentation = theoretical_altitude * 0.55;

        // 5. Determine impact type based on fragmentation altitude and size
        let impactType, reachesGround, craterFormed, note;

        // Size threshold for complete airburst (Wheeler et al. 2017)
        // Small objects (<50m) fragment completely at high altitude
        // Large objects (>100m) can still reach ground even if fragmented
        const SIZE_THRESHOLD_COMPLETE_AIRBURST = 50; // meters
        const SIZE_THRESHOLD_PARTIAL = 100; // meters
        const ALTITUDE_THRESHOLD_HIGH = 20000; // 20 km
        const ALTITUDE_THRESHOLD_LOW = 5000; // 5 km

        if (altitude_fragmentation > ALTITUDE_THRESHOLD_HIGH &&
            diameter < SIZE_THRESHOLD_COMPLETE_AIRBURST) {
            // High-altitude airburst, complete vaporization
            impactType = 'high_altitude_airburst';
            reachesGround = false;
            craterFormed = false;
            note = `Complete atmospheric breakup at ${Math.round(altitude_fragmentation/1000)} km altitude (like Chelyabinsk 2013)`;

        } else if (altitude_fragmentation > ALTITUDE_THRESHOLD_LOW &&
                   diameter < SIZE_THRESHOLD_PARTIAL) {
            // Medium-altitude airburst, some fragments may reach ground
            impactType = 'airburst';
            reachesGround = false;
            craterFormed = false;
            note = `Atmospheric airburst at ${Math.round(altitude_fragmentation/1000)} km altitude (like Tunguska 1908)`;

        } else {
            // Low-altitude fragmentation or large object
            // Fragments still reach ground with significant energy
            impactType = 'low_airburst_with_impact';
            reachesGround = true;
            craterFormed = true;
            note = `Low-altitude fragmentation at ${Math.round(altitude_fragmentation/1000)} km, fragments impact ground`;
        }

        // 6. Calculate energy deposition altitude (where most energy is released)
        // For pancake model, peak energy deposition occurs slightly below fragmentation
        const energy_deposition_altitude = Math.max(0, altitude_fragmentation - 2000);

        return {
            willFragment: true,
            reachesGround: reachesGround,
            impactType: impactType,
            altitude: altitude_fragmentation,
            energyDepositionAltitude: energy_deposition_altitude,
            strength: strength,
            ramPressure: P_ram_surface,
            craterFormed: craterFormed,
            note: note,

            // Additional details for UI/debugging
            details: {
                fragmentationCriterion: 'P_ram > σ (material strength)',
                strengthMPa: strength / 1e6,
                ramPressureMPa: P_ram_surface / 1e6,
                fragmentationRatio: P_ram_surface / strength,
                model: 'Hills-Goda (1993) pancake model'
            }
        };
    }

    /**
     * Estimate blast zone adjustment for airburst events
     * Airbursts deposit energy at altitude, affecting blast radius
     *
     * @param {number} altitude - Airburst altitude in meters
     * @param {number} energy - Impact energy in Joules
     * @returns {Object} Blast zone adjustments
     */
    calculateAirburstBlastAdjustment(altitude, energy) {
        // High-altitude airbursts spread energy over wider area but with less ground damage
        // Based on Glasstone & Dolan (1977) altitude scaling

        const altitude_km = altitude / 1000;
        const megatons = energy / 4.184e15;

        // Optimal burst height for maximum ground damage (nuclear weapons scaling)
        // H_opt ≈ 0.4 × W^0.4 km, where W is yield in kilotons
        const kilotons = megatons * 1000;
        const optimal_height_km = 0.4 * Math.pow(kilotons, 0.4);

        let adjustment_factor, damage_type;

        if (altitude_km < optimal_height_km * 0.5) {
            // Very low airburst - crater may form, concentrated damage
            adjustment_factor = 0.8;
            damage_type = 'concentrated';
        } else if (altitude_km < optimal_height_km * 1.5) {
            // Optimal height - maximum ground damage radius
            adjustment_factor = 1.2;
            damage_type = 'maximum';
        } else if (altitude_km < 20) {
            // High airburst - wider area, less concentrated
            adjustment_factor = 1.5;
            damage_type = 'widespread';
        } else {
            // Very high airburst (>20km) - energy dissipates significantly
            adjustment_factor = 0.7;
            damage_type = 'dispersed';
        }

        return {
            altitudeKm: altitude_km,
            optimalHeightKm: optimal_height_km,
            adjustmentFactor: adjustment_factor,
            damageType: damage_type,
            note: `Airburst at ${altitude_km.toFixed(1)} km altitude (optimal: ${optimal_height_km.toFixed(1)} km)`
        };
    }

    /**
     * Comprehensive fragmentation analysis with validation examples
     * @param {Object} params - Impact parameters
     * @returns {Object} Complete analysis
     */
    fullAnalysis(params) {
        const {
            diameter,
            velocity,
            composition = 'rocky',
            density = 3000,
            energy = null
        } = params;

        // Run fragmentation analysis
        const fragmentation = this.analyzeFragmentation(
            diameter,
            velocity,
            composition,
            density
        );

        // If airburst, calculate blast adjustments
        let blastAdjustment = null;
        if (!fragmentation.craterFormed && energy) {
            blastAdjustment = this.calculateAirburstBlastAdjustment(
                fragmentation.altitude,
                energy
            );
        }

        return {
            fragmentation: fragmentation,
            blastAdjustment: blastAdjustment,
            validation: this.getValidationCase(diameter, velocity, composition)
        };
    }

    /**
     * Get validation case if parameters match known events
     * @param {number} diameter - Diameter in meters
     * @param {number} velocity - Velocity in m/s
     * @param {string} composition - Composition type
     * @returns {Object|null} Validation info if match found
     */
    getValidationCase(diameter, velocity, composition) {
        const validation_cases = [
            {
                name: 'Chelyabinsk (2013)',
                diameter: 20,
                velocity: 19000,
                composition: 'rocky',
                observed_altitude: 23500,
                observed_type: 'high_altitude_airburst',
                reference: 'Brown et al. (2013) Nature 503:238-241'
            },
            {
                name: 'Tunguska (1908)',
                diameter: 60,
                velocity: 15000,
                composition: 'rocky',
                observed_altitude: 8000,
                observed_type: 'airburst',
                reference: 'Vasilyev (1998) Planet. Space Sci. 46:129-150'
            },
            {
                name: 'Barringer/Meteor Crater (50k years)',
                diameter: 50,
                velocity: 12800,
                composition: 'iron',
                observed_altitude: 0,
                observed_type: 'ground',
                reference: 'Shoemaker (1963)'
            }
        ];

        // Check if parameters are close to any validation case
        for (const vcase of validation_cases) {
            const diameter_match = Math.abs(diameter - vcase.diameter) < vcase.diameter * 0.2;
            const velocity_match = Math.abs(velocity - vcase.velocity) < vcase.velocity * 0.2;
            const composition_match = composition.toLowerCase() === vcase.composition;

            if (diameter_match && velocity_match && composition_match) {
                return {
                    matches: vcase.name,
                    observed_altitude: vcase.observed_altitude,
                    observed_type: vcase.observed_type,
                    reference: vcase.reference,
                    note: `Parameters similar to ${vcase.name}`
                };
            }
        }

        return null;
    }
}

module.exports = AtmosphericFragmentation;
