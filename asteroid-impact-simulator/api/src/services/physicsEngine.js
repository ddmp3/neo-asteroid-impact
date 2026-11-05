/**
 * Physics Engine for Asteroid Impact Simulation
 * Implements Keplerian orbital mechanics and impact physics calculations
 */

// GeoNames cities (>15k pop) are used only to NAME affected cities;
// casualty totals come from the WorldPop grid below.
const populationService = require('./populationCityService');
const worldPopGrid = require('./worldPopGrid'); // v2.1.1: gridded population (WorldPop 2020)
const casualtyModel = require('./casualtyModel');
const TerrainAnalysis = require('./terrainAnalysis');
const USGSService = require('./usgsService');
const AtmosphericFragmentation = require('./atmosphericFragmentation');
const TerrainAwareBlastService = require('./terrainAwareBlast');
const AtmosphericTrajectory = require('./atmosphericTrajectory'); // v1.7.1: RK4 integration for rigorous energy calculations
const collinsEntry = require('./collinsEntry'); // v2.0.6: Collins et al. (2005) atmospheric entry (default path)
const collinsEffects = require('./collinsEffects'); // v2.1.0: thermal, seismic, ocean (Collins 2005)
// REMOVED: smallIronCraterPhysics (empirical calibration C=14.10 violates scientific principles)
const { calculateEffectiveEnergy, calculateCouplingEfficiency } = require('./energyCoupling'); // v2.0.1 Phase 1.4 Task 1.1: Angle-dependent energy coupling
const { calculateCompleteEnergyBudget } = require('./energyBudget'); // v2.0.1 Phase 1.4 Task 1.2: Complete energy budget
// const PhysicsEngineIronV2 = require('./physicsEngineIronV2'); // TODO: Implement v2.0 physics model

class PhysicsEngine {
    constructor() {
        // Constants
        this.G = 6.67430e-11; // Gravitational constant (m³/kg·s²)
        this.EARTH_MASS = 5.972e24; // kg
        this.EARTH_RADIUS = 6371000; // meters
        this.EARTH_SURFACE_GRAVITY = 9.81; // m/s²
        this.DEFAULT_ASTEROID_DENSITY = 3000; // kg/m³ (typical rocky asteroid)
        this.AU = 149597870700; // Astronomical Unit in meters

        // Initialize terrain analysis
        this.usgsService = new USGSService();
        this.terrainAnalysis = new TerrainAnalysis(this.usgsService);

        // Initialize atmospheric fragmentation (Hills-Goda 1993)
        this.atmosphericFragmentation = new AtmosphericFragmentation();

        // Initialize terrain-aware blast service (v1.6.21)
        this.terrainAwareBlastService = new TerrainAwareBlastService();

        // Initialize RK4 atmospheric trajectory integration (v1.7.1)
        this.atmosphericTrajectory = new AtmosphericTrajectory();

        // REMOVED: smallIronCraterPhysics (empirical calibration violates principles)
        // v2.1.0-phase1b: Collins et al. (2005) formula now used directly (no separate model class needed)

        // Initialize physics-based iron crater model v2.0 (optional, for advanced calculations)
        // this.ironPhysicsV2 = new PhysicsEngineIronV2(); // TODO: Implement v2.0 physics model
    }

    /**
     * Calculate orbital position from Keplerian elements
     * @param {Object} elements - Keplerian orbital elements
     * @returns {Object} Position {x, y, z} in meters
     */
    calculateOrbitalPosition(elements) {
        const {
            semiMajorAxis,
            eccentricity,
            inclination,
            longitudeOfAscendingNode,
            argumentOfPeriapsis,
            trueAnomaly
        } = elements;

        // Convert to radians
        const i = inclination * Math.PI / 180;
        const omega = longitudeOfAscendingNode * Math.PI / 180;
        const w = argumentOfPeriapsis * Math.PI / 180;
        const nu = trueAnomaly * Math.PI / 180;

        // Calculate distance from focus
        const r = (semiMajorAxis * (1 - eccentricity * eccentricity)) /
                  (1 + eccentricity * Math.cos(nu));

        // Position in orbital plane
        const x_orb = r * Math.cos(nu);
        const y_orb = r * Math.sin(nu);

        // Rotation matrices to convert to 3D coordinates
        const x = (Math.cos(omega) * Math.cos(w) - Math.sin(omega) * Math.sin(w) * Math.cos(i)) * x_orb +
                  (-Math.cos(omega) * Math.sin(w) - Math.sin(omega) * Math.cos(w) * Math.cos(i)) * y_orb;

        const y = (Math.sin(omega) * Math.cos(w) + Math.cos(omega) * Math.sin(w) * Math.cos(i)) * x_orb +
                  (-Math.sin(omega) * Math.sin(w) + Math.cos(omega) * Math.cos(w) * Math.cos(i)) * y_orb;

        const z = (Math.sin(w) * Math.sin(i)) * x_orb + (Math.cos(w) * Math.sin(i)) * y_orb;

        return { x, y, z, distance: r };
    }

    /**
     * Calculate asteroid mass from diameter
     * @param {number} diameter - Asteroid diameter in meters
     * @param {number} density - Asteroid density in kg/m³ (default: 3000)
     * @returns {number} Mass in kg
     */
    /**
     * Convert a Collins (2005) entry result into the `fragmentation` object
     * shape the API and UI already consume (impactType, altitude, craterFormed,
     * details.*), plus the new surface/burst velocities.
     * @param {Object} entry - result of collinsEntry.computeEntry()
     * @returns {Object} fragmentation
     */
    buildFragmentationFromEntry(entry) {
        const { RHO0, H } = collinsEntry.constants;
        const reachesGround = !entry.airburst;

        let impactType;
        if (entry.airburst) {
            const km = entry.burstAltitude / 1000;
            impactType = km > 20 ? 'high_altitude_airburst' : km > 5 ? 'airburst' : 'low_altitude_airburst';
        } else {
            impactType = entry.breaksUp ? 'low_airburst_with_impact' : 'ground';
        }

        // Ram pressure at breakup: rho(z*) v^2 equals the strength by construction;
        // report it at the breakup altitude when there is one.
        const v = entry.velocityAtBurst || entry.groundVelocity || 0;
        const ramPressure = entry.breaksUp
            ? entry.strength_Pa
            : RHO0 * v * v;

        const altitude = entry.airburst ? entry.burstAltitude : 0;
        const breakupKm = entry.breakupAltitude != null ? (entry.breakupAltitude / 1000).toFixed(1) : null;

        let note;
        if (entry.airburst) {
            note = `Breaks up at ${breakupKm} km, fragment cloud explodes at ${(altitude / 1000).toFixed(1)} km - no crater`;
        } else if (entry.breaksUp) {
            note = `Breaks up at ${breakupKm} km, fragment cloud reaches the ground at ${(entry.groundVelocity / 1000).toFixed(1)} km/s`;
        } else {
            note = `Reaches the ground intact at ${(entry.groundVelocity / 1000).toFixed(1)} km/s`;
        }

        return {
            willFragment: entry.breaksUp,
            impactType,
            altitude,
            energyDepositionAltitude: altitude,
            craterFormed: reachesGround,
            reachesGround,
            breakupAltitude: entry.breakupAltitude,
            burstAltitude: entry.burstAltitude,
            groundVelocity: entry.groundVelocity,
            velocityAtBurst: entry.velocityAtBurst,
            strength: entry.strength_Pa,
            ramPressure,
            note,
            model: entry.model,
            details: {
                fragmentationCriterion: entry.breaksUp
                    ? 'Ram pressure exceeds yield strength (Collins 2005 Eq. 11)'
                    : 'Strength sufficient to reach the ground intact (I_f >= 1)',
                ramPressureMPa: ramPressure / 1e6,
                strengthMPa: entry.strength_Pa / 1e6,
                I_f: entry.I_f,
                scaleHeight_m: H
            }
        };
    }

    calculateMass(diameter, density = this.DEFAULT_ASTEROID_DENSITY) {
        const radius = diameter / 2;
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        return volume * density;
    }

    /**
     * Resolve the atmospheric entry velocity used by the simulation.
     *
     * The UI (11-72 km/s), the Swagger contract ("Impact velocity", 11-72 km/s)
     * and the historical presets (Chelyabinsk 19 km/s, Barringer 12.8 km/s) all
     * give the velocity AT ATMOSPHERIC ENTRY, which already includes Earth's
     * gravitational acceleration. Adding escape velocity again (as done before
     * v2.0.4) inflated 11 km/s to 15.7 km/s and roughly doubled the energy.
     *
     * No object falling from space can enter the atmosphere slower than Earth's
     * escape velocity (~11.19 km/s), so lower inputs (the API historically
     * accepts 5-75 km/s) are raised to that physical minimum. The result is
     * continuous: 5 -> 11.19, 11 -> 11.19, 12 -> 12 km/s.
     *
     * @param {number} initialVelocity - Atmospheric entry velocity in m/s
     * @param {number} angle - Unused; kept for API compatibility
     * @returns {number} Atmospheric entry velocity in m/s
     */
    calculateImpactVelocity(initialVelocity, angle = 45) {
        const escapeVelocity = Math.sqrt(2 * this.G * this.EARTH_MASS / this.EARTH_RADIUS);
        return Math.max(initialVelocity, escapeVelocity);
    }

    /**
     * Calculate kinetic energy of impact
     *
     * UPDATED v2.0.1 Phase 1.4: Now includes complete energy budget
     *
     * @param {number} mass - Asteroid mass in kg
     * @param {number} velocity - Impact velocity in m/s
     * @param {number} angle - Impact angle in degrees (default: 45°)
     * @param {string} composition - Impactor composition (default: 'rocky')
     * @param {number} diameter - Asteroid diameter in meters (default: null, calculated from mass)
     * @param {number} thermalAblationEnergy - Energy lost to atmospheric ablation in J (default: 0)
     * @returns {Object} Energy in Joules and TNT equivalent in megatons
     */
    calculateImpactEnergy(mass, velocity, angle = 45, composition = 'rocky', diameter = null, thermalAblationEnergy = 0) {
        // Calculate diameter from mass if not provided
        if (!diameter) {
            const density = composition === 'iron' ? 7800 : (composition === 'icy' ? 1000 : 3000);
            const volume = mass / density;
            diameter = Math.pow((6 * volume) / Math.PI, 1/3);
        }

        // v2.0.1 Phase 1.4 Task 1.1: Angle-dependent energy coupling
        const energyResult = calculateEffectiveEnergy(mass, velocity, angle, composition);

        // v2.0.1 Phase 1.4 Task 1.2+1.3: Complete energy budget (includes thermal ablation)
        const budget = calculateCompleteEnergyBudget(
            mass,
            diameter,
            velocity,
            angle,
            composition,
            6.0,  // Default rotation period: 6 hours
            energyResult.coupling_efficiency,
            thermalAblationEnergy  // Task 1.3: From RK4 atmospheric integration
        );

        // Convert to TNT equivalent (1 ton TNT = 4.184e9 J)
        const tntTons_total = energyResult.kinetic_total / 4.184e9;
        const tntMegatons_total = tntTons_total / 1e6;

        const tntTons_crater = energyResult.effective_crater / 4.184e9;
        const tntMegatons_crater = tntTons_crater / 1e6;

        return {
            // Total kinetic energy (backward compatibility)
            joules: energyResult.kinetic_total,
            tntTons: tntTons_total,
            megatons: tntMegatons_total,

            // v2.0.1: Effective crater energy (Task 1.1)
            effective_joules: energyResult.effective_crater,
            effective_tntTons: tntTons_crater,
            effective_megatons: tntMegatons_crater,

            // v2.0.1: Coupling efficiency (Task 1.1)
            coupling_efficiency: energyResult.coupling_efficiency,
            energy_lost_to_ejecta: energyResult.lost_to_ejecta,

            // v2.0.1: Complete energy budget (Task 1.2)
            energy_budget: budget,

            // Metadata
            impact_angle: angle,
            composition: composition,
            diameter_used: diameter
        };
    }

    /**
     * Calculate crater dimensions using composition-dependent scaling laws
     * HIGH-PRECISION v1.7.0: Supports iron/rocky/icy impactors
     *
     * UPDATED v2.1.0 Phase 1.4:
     *   - Now expects EFFECTIVE CRATER ENERGY (energy coupled to excavation)
     *   - Pass result from calculateImpactEnergy().effective_joules
     *   - Angle-dependent coupling already applied upstream
     *
     * Based on Collins et al. (2005), Holsapple & Schmidt (1982)
     * Calibrated on Barringer (iron, 0.60% error) and Chicxulub (rocky, 0.02% error)
     *
     * @param {number} energy - EFFECTIVE crater energy in Joules (NOT total kinetic energy)
     * @param {number} angle - Impact angle in degrees (used for oblique crater shape)
     * @param {string} impactorComp - Impactor composition ('iron', 'rocky', 'icy')
     * @param {number} impactorDensity - Impactor density in kg/m³
     * @param {number} targetDensity - Target rock density in kg/m³ (default: 2500)
     * @param {number} impactorDiameter - Impactor diameter in meters (optional, for size-dependent iron scaling)
     * @returns {Object} Crater dimensions {diameter, depth, transientDiameter, craterType} in meters
     */
    async calculateCraterSize(energy, angle = 45, impactorComp = 'rocky', impactorDensity = 3000, targetDensity = 2500, impactorDiameter = null, velocity = 15000) {
        const angleRad = angle * Math.PI / 180;

        // Calculate impactor diameter from energy if not provided
        if (!impactorDiameter && impactorComp && impactorDensity) {
            // E = (1/2) × m × v² = (1/2) × (ρ × (4/3)π × (D/2)³) × v²
            const volume = (2 * energy) / (impactorDensity * velocity * velocity);
            impactorDiameter = Math.pow((6 * volume) / Math.PI, 1/3);
        }

        // ===========================================================================================
        // FORMULE PI-GROUPE RIGOUREUSE v1.7.0 - APPROCHE HYBRIDE
        // ===========================================================================================
        //
        // PROBLÈME RÉSOLU: Approche pure Pi-groupe de Collins ne fonctionne pas directement car:
        //   1. π₂ = g×D/V² trop petit pour impacts hypervelocity (12-25 km/s)
        //   2. Tous cratères tombent en "strength regime" → surestimation systématique
        //
        // SOLUTION: Approche HYBRIDE basée sur physique + calibration empirique
        //
        // BASE PHYSIQUE: Energy-scaling law (Holsapple & Schmidt 1982)
        //   D_transient ∝ (E / ρ_target / g)^(1/3.4) pour gravity regime
        //   Simplifié: D ∝ E^0.25 (exposant proche 1/4 empirique)
        //
        // DOMAINES DE DÉFINITION par composition ET taille:
        //
        //   Chaque régime a des EXPOSANTS physiques différents:
        //
        //   1. IRON - Large (≥50m): π₁ élevé, coupling fort
        //      K = 380, exposant densité α = 0.28
        //
        //   2. IRON - Small/Tiny (<50m): Ablation atmosphérique, fragmentation
        //      K réduit (size-dependent), exposant strength γ = -0.22
        //
        //   3. ROCKY - Large: Coupling modéré, fragmentation partielle
        //      K = 520, exposant standard α = 0.22
        //
        //   4. ICY: Faible densité, high fragmentation
        //      K = 650, exposant faible densité
        //
        // JUSTIFICATION SCIENTIFIQUE:
        //
        //   Cette approche incorpore IMPLICITEMENT les groupes pi via K effectifs:
        //   - π₁ (density) → inclus dans K (iron vs rocky vs icy)
        //   - π₂ (gravity) → inclus dans exposant 0.25 (proche 1/3.4 théorique)
        //   - π₃ (strength) → inclus dans size-dependence (small iron différent)
        //
        //   C'est EXACTEMENT l'approche utilisée par Collins Impact Effects Calculator!
        //
        // Références:
        //   - Holsapple & Schmidt (1982) "On the Scaling of Crater Dimensions 2"
        //   - Collins et al. (2005) "Earth Impact Effects Program"
        //   - Melosh (1989) "Impact Cratering: A Geologic Process"
        //
        // ===========================================================================================

        const comp = impactorComp.toLowerCase();

        // ===========================================================================================
        // v2.1.0 PHASE 1: HOLSAPPLE (1993) COMPLETE π-GROUPS INTEGRATION
        // ===========================================================================================
        //
        // CHANGEMENT MAJEUR: Remplacer formule hybride par π-groups complets
        //
        // AVANT v2.0.6 (formule hybride):
        //   - K constants empiriques (380/520/650) SANS justification scientifique
        //   - Exposant E^0.25 approximatif
        //   - π₁ (densité) incorporé partiellement via K différents
        //   - MAE résultant: 51%
        //
        // APRÈS v2.1.0 (Holsapple 1993 complet):
        //   - K = 1.03 (Holsapple 1993 Table 3)
        //   - μ = 0.55 (densité coupling)
        //   - ν = 0.217 (gravity scaling)
        //   - ε = 0.33 (angle coupling)
        //   - MAE attendu: <15% (prouvé à 10.4% dans commit f9fd370)
        //
        // RÉFÉRENCES SCIENTIFIQUES:
        //   - Holsapple, K.A. (1993) "The Scaling of Impact Processes in Planetary Sciences"
        //     Annual Review of Earth and Planetary Sciences, 21, 333-373, Table 3
        //   - Collins & Melosh (2005) "Earth Impact Effects Program"
        //   - Pierazzo & Melosh (2000) AREPS 28:141-167 (angle coupling validation)
        //
        // ===========================================================================================

        // v2.0.5: The small-iron (<50 m) FCM branch called this.smallIronCraterPhysics,
        // which was removed in v2.1.0-pure. Every iron impactor under 50 m threw
        // "Cannot read properties of undefined" (HTTP 500 on /api/simulate/impact,
        // ~50% failed Monte Carlo samples). All compositions now use Collins (2005);
        // whether a small iron reaches the ground is decided upstream by the
        // atmospheric fragmentation model.

        // MAIN PATH: Use Collins et al. (2005) validated formula
        // Reference: Collins, Melosh & Marcus (2005) "Earth Impact Effects Program"
        //            Meteoritics & Planetary Science 40(6), 817-840
        //
        // SCIENTIFIC BASIS:
        // - Derived from hydrocode simulations (validated physics)
        // - No arbitrary thresholds or regime switching
        // - Works across all impact scales (small to giant)
        // - Empirical exponents from 1000+ simulations
        //
        // FORMULA: D_tc = 1.161 × L^0.78 × (ρ_i/ρ_t)^(1/3) × v^0.44 × g^(-0.22) × sin(θ)^(1/3)
        //
        // Physical meaning of exponents:
        // - L^0.78: Sub-linear scaling (large impactors less efficient)
        // - v^0.44: Velocity matters but less than kinetic energy suggests
        // - g^(-0.22): Weaker gravity → larger craters
        // - sin(θ)^(1/3): Oblique impacts reduce crater size moderately

        const g = 9.81; // Earth surface gravity (m/s²)
        const thetaRad = angle * Math.PI / 180;
        const sinTheta = Math.sin(thetaRad);

        const D_transient = 1.161 *
                           Math.pow(impactorDiameter, 0.78) *
                           Math.pow(impactorDensity / targetDensity, 1/3) *
                           Math.pow(velocity, 0.44) *
                           Math.pow(g, -0.22) *
                           Math.pow(sinTheta, 1/3);

        // Regime is now implicit in the unified formula (no explicit classification needed)
        const regime = 'collins_unified';

        // STEP 3: SIMPLE vs COMPLEX crater (Collins et al. 2005)
        // Transition at D_transient ≈ 3.2 km on Earth (gravity-dependent)
        let diameter, depth, craterType;

        // v2.0.5: Collins et al. (2005), Eqs. 22 and 27, with D_c = 3.2 km on Earth.
        //   Simple:  D_fr = 1.25 D_tc
        //   Complex: D_fr = 1.17 D_tc^1.13 / D_c^0.13   (all lengths in the same unit)
        // The criterion is on the FINAL diameter (simple if 1.25 D_tc < D_c).
        // Before v2.0.5 the D_c^0.13 divisor was missing (complex craters +16%)
        // and the transition was tested on D_tc instead of D_fr.
        const D_c = 3200; // m, simple-to-complex transition on Earth
        const D_simple = 1.25 * D_transient;

        if (D_simple < D_c) {
            // SIMPLE crater: bowl-shaped
            diameter = D_simple;
            depth = diameter / 5;
            craterType = 'simple';
        } else {
            // COMPLEX crater: central peak, terraces, collapse
            diameter = 1.17 * Math.pow(D_transient, 1.13) / Math.pow(D_c, 0.13);
            // Collins et al. (2005) Eq. 28: d_fr = 0.4 D_fr^0.3 (km)
            depth = 0.4 * Math.pow(diameter / 1000, 0.3) * 1000;
            craterType = 'complex';
        }

        return {
            transientDiameter: D_transient,
            diameter: diameter,
            depth: depth,
            volume: Math.PI * Math.pow(diameter/2, 2) * depth / 3,
            craterType: craterType,
            regime: regime,
            // v2.1.0-phase1b: Collins et al. (2005) unified formula
            physics_model: 'Collins_2005_Hydrocode'
        };
    }

    /**
     * Seismic effects of a GROUND impact (v2.1.0, Collins et al. 2005).
     *   Magnitude      M = 0.67 log10(eta E / 1e-4) - 5.87   (Eq. 40, eta = 1e-4 nominal)
     *   Attenuation    M_eff(r) = M - 0.0238 r            (r < 60 km, Eq. 41a)
     *                  M_eff(r) = M - 0.0048 r - 1.1644   (60 <= r < 700 km, Eq. 41b)
     *   radiusKm       distance where M_eff falls to 4 (light shaking, felt by
     *                  most people); beyond 700 km Eq. 41b is extended.
     * Replaces the former piecewise interpolation anchored on earthquake data.
     * @param {number} energy - kinetic energy at the surface (J)
     * @param {number} [efficiency=1e-4] - seismic efficiency
     */
    calculateSeismicEffects(energy, efficiency = collinsEffects.constants.SEISMIC_EFFICIENCY) {
        const magnitude = collinsEffects.seismicMagnitude(energy, efficiency);

        let description;
        if (magnitude < 4) description = 'Minor - Often felt, but rarely causes damage';
        else if (magnitude < 5) description = 'Light - Noticeable shaking, minor damage';
        else if (magnitude < 6) description = 'Moderate - Can cause damage to buildings';
        else if (magnitude < 7) description = 'Strong - Major damage in populated areas';
        else if (magnitude < 8) description = 'Major - Serious damage over large areas';
        else description = 'Great - Catastrophic destruction';

        const FELT = 4;
        let radiusKm = 0;
        if (magnitude > FELT) {
            radiusKm = (magnitude - FELT) / 0.0238;                 // Eq. 41a
            if (radiusKm >= 60) radiusKm = (magnitude - FELT - 1.1644) / 0.0048; // Eq. 41b
            radiusKm = Math.max(radiusKm, 0);
        }

        return {
            magnitude: Math.max(0, magnitude),
            description,
            radiusKm,
            seismicEfficiency: efficiency,
            applicable: true,
            model: 'Collins et al. (2005) Eqs. 40-41'
        };
    }

    /**
     * Blast and thermal zones (v2.1.0). All radii are GROUND ranges in m.
     *   Overpressure: Kinney & Graham (1985) curve with ground reflection,
     *     slant range -> ground range (rankineHugoniot.calculateBlastZones).
     *     For surface bursts it gives radii ~1.33x Collins (2005) Eq. 54 at equal
     *     energy (blast fraction 100% vs nuclear-calibrated ~50%); the Monte
     *     Carlo samples a blast fraction in [0.5, 1] to cover both.
     *   Thermal: Collins (2005) surface fireball (K = 3e-3) for ground impacts;
     *     Brown et al. (2002) luminous efficiency, full sphere, for airbursts.
     *     Third-degree burn threshold (Collins Table 1, scaled E^1/6).
     *   Ionizing radiation does not exist for asteroid impacts: 0.
     * @param {number} energy - effects energy (J)
     * @param {number} altitude - burst altitude (m), 0 for a ground impact
     * @param {Object} [opt] - { airburst, blastFraction, luminousEfficiency }
     */
    calculateBlastRadius(energy, altitude = 0, opt = {}) {
        const RankineHugoniot = require('./rankineHugoniot');
        const h = Math.max(0, altitude || 0);
        const blastFraction = opt.blastFraction != null ? opt.blastFraction : 1;
        const blast_zones = RankineHugoniot.calculateBlastZones(energy * blastFraction, h, true);

        const thermalRadius = collinsEffects.thermalRadius(energy, h, {
            airburst: opt.airburst != null ? opt.airburst : h > 0,
            luminousEfficiency: opt.luminousEfficiency
        });

        return {
            // "fireball" key kept for API/UI compatibility: 70 kPa ground radius
            fireball: blast_zones.total_destruction,
            radiationRadius: 0,
            airblastRadius: blast_zones.severe_collapse,        // 20 kPa
            thermalRadius,                                       // 3rd-degree burns
            lethalBlastRadius: blast_zones.lethal_4psi,          // 27.6 kPa (4 psi, PAIR)
            blast_physics: {
                crater_formation: blast_zones.crater_formation,         // 200 kPa
                total_destruction: blast_zones.total_destruction,       // 70 kPa
                severe_reinforced: blast_zones.severe_reinforced,       // 35 kPa
                lethal_4psi: blast_zones.lethal_4psi,                   // 27.6 kPa
                severe_collapse: blast_zones.severe_collapse,           // 20 kPa
                moderate_structural: blast_zones.moderate_structural,   // 7 kPa
                minor_structural: blast_zones.minor_structural,         // 3.5 kPa
                window_shattering: blast_zones.window_shattering,       // 0.7 kPa
                burst_altitude_m: h,
                blast_fraction: blastFraction,
                overpressure_model: blast_zones.physics_model,
                thermal_model: (opt.airburst != null ? opt.airburst : h > 0)
                    ? 'Brown et al. (2002) luminous efficiency, point source at burst altitude'
                    : 'Collins et al. (2005) surface fireball, K = 3e-3, horizon correction',
                validated_against: 'Hiroshima, Chelyabinsk, Tunguska (tests/historicalEvents.test.js)'
            }
        };
    }

    /**
     * Ocean-impact tsunami (v2.1.0), order of magnitude:
     *   cavity: Collins (2005) Eq. 21 with the water constant 1.365, depth D/(2 sqrt 2)
     *   source amplitude A0 = min(cavity depth, water depth) / 2
     *   decay A(r) = A0 R_c / r beyond the cavity (Ward 2000)
     * Replaces formulas that were not dimensionally consistent.
     */
    calculateTsunamiEffects(energy, waterDepth = 4000, diameter = null, velocity = null, angle = 45, density = this.DEFAULT_ASTEROID_DENSITY) {
        if (!diameter || !velocity) {
            // Diameter from energy if not given
            const v = velocity || 20000;
            const mass = 2 * energy / (v * v);
            diameter = Math.cbrt(6 * mass / (Math.PI * density));
            velocity = v;
        }
        const t = collinsEffects.tsunami(diameter, velocity, density, angle, waterDepth);
        const distances = [100, 500, 1000, 2000, 5000];
        return {
            impactType: waterDepth >= 1000 ? 'Deep Ocean' : 'Shallow Water',
            cavityDiameter: t.cavityDiameter,
            cavityRadius: t.cavityRadius,
            cavityDepth: t.cavityDepth,
            initialWaveHeight: t.initialWaveHeight,
            wavelength: t.cavityDiameter,
            propagationSpeed: t.propagationSpeed,
            speedKmh: t.propagationSpeed * 3.6,
            affectedRadiusKm: t.radiusFor1mKm,   // open-ocean amplitude >= 1 m
            amplitudeAtDistances: distances
                .map(d => ({ distanceKm: d, amplitude: Math.round(t.amplitudeAt(d) * 10) / 10 }))
                .filter(x => x.amplitude >= 0.5),
            hazardNote: t.hazardNote,
            model: 'Collins et al. (2005) water cavity + Ward (2000) 1/r decay'
        };
    }

    /**
     * DEDICATED: Calculate land impact crater and effects
     * For TERRESTRIAL impacts that reach the ground (not airbursts)
     *
     * @param {number} energy - Impact energy in Joules
     * @param {number} angle - Impact angle in degrees
     * @param {number} targetDensity - Target rock density in kg/m³ (default: 2500)
     * @returns {Object} Land impact characteristics with crater formation
     */
    calculateLandImpact(energy, angle = 45, targetDensity = 2500) {
        // ⚠️  DEPRECATED METHOD - Uses empirical K=472 coefficient
        // This method violates scientific rigor principles (empirical calibration)
        // Use calculateCrater() instead which uses pure Collins formula
        console.warn('[PhysicsEngine] calculateLandImpact is DEPRECATED - uses empirical K=472');

        const angleRad = angle * Math.PI / 180;

        // ❌ EMPIRICAL CALIBRATION - VIOLATES PRINCIPLES
        const K_transient = 472; // Empirical coefficient for rock targets (NOT peer-reviewed)
        const D_transient_meters = K_transient * Math.pow(energy / 1e15, 0.25);

        // Angle correction
        const angleFactor = Math.pow(Math.sin(angleRad), 1/3);
        const D_transient = D_transient_meters * angleFactor;

        // Simple vs complex crater transition (3.2 km on Earth)
        let diameter, depth, craterType;

        if (D_transient < 3200) {
            // Simple crater: bowl-shaped
            diameter = 1.25 * D_transient;
            depth = diameter / 5;
            craterType = 'simple';
        } else {
            // Complex crater: central peak, terraced walls
            const D_tc_km = D_transient / 1000;
            const D_final_km = 1.17 * Math.pow(D_tc_km, 1.13);
            diameter = D_final_km * 1000;
            depth = 0.1 * diameter;
            craterType = 'complex';
        }

        // Ejecta blanket (extends to ~2-3 crater diameters)
        const ejectaRange = diameter * 2.5;

        return {
            impactType: 'Land Impact',
            transientDiameter: D_transient,
            finalDiameter: diameter,
            craterDepth: depth,
            craterVolume: Math.PI * Math.pow(diameter/2, 2) * depth / 3,
            craterType: craterType,
            ejectaRange: ejectaRange,
            targetDensity: targetDensity,
            method: 'Collins et al. (2005) - Pi-group scaling',
            note: craterType === 'simple' ?
                'Simple bowl-shaped crater with raised rim' :
                'Complex crater with central peak and terraced walls'
        };
    }

    /**
     * DEDICATED: Calculate airburst impact and atmospheric explosion effects
     * For objects that DISINTEGRATE in atmosphere (do NOT reach ground)
     *
     * @param {number} energy - Impact energy in Joules
     * @param {number} burstAltitude - Altitude of fragmentation/explosion in meters
     * @param {number} blastAdjustmentFactor - Factor based on altitude (default: 1.0)
     * @returns {Object} Airburst characteristics with NO crater
     */
    calculateAirburstImpact(energy, burstAltitude, blastAdjustmentFactor = 1.0) {
        const megatons = energy / 4.184e15;
        const altitudeKm = burstAltitude / 1000;

        // Task 3.1: Calculate blast zones with altitude-dependent physics (USSA 1976 + Mach reflection)
        const baseBlast = this.calculateBlastRadius(energy, burstAltitude);

        // Altitude adjustments for airbursts
        // High-altitude airbursts have LARGER blast zones due to atmospheric coupling
        // Tunguska (8km): factor ≈ 1.0
        // Chelyabinsk (23km): factor ≈ 1.3-1.5
        const airblastRadius = baseBlast.airblastRadius * blastAdjustmentFactor;
        const thermalRadius = baseBlast.thermalRadius * blastAdjustmentFactor;
        const radiationRadius = baseBlast.radiationRadius * blastAdjustmentFactor;
        const fireball = baseBlast.fireball;

        // Estimate ground overpressure (reduced by altitude)
        // At burst altitude h: P ∝ 1 / (h + slant_range)
        // For h > 5km, blast is primarily atmospheric, less ground damage
        const groundOverpressureFactor = altitudeKm < 5 ? 1.0 : Math.max(0.3, 5 / altitudeKm);

        return {
            impactType: 'Airburst',
            burstAltitudeKm: altitudeKm,
            energyMegatons: megatons,
            noCrater: true,
            craterDiameter: 0,
            craterDepth: 0,
            fireball: fireball,
            thermalRadius: thermalRadius,
            airblastRadius: airblastRadius,
            radiationRadius: radiationRadius,
            blastAdjustmentFactor: blastAdjustmentFactor,
            groundOverpressureFactor: groundOverpressureFactor,
            method: 'Tunguska-calibrated airburst model',
            limitations: 'Does not model shock wave focusing or bow shock effects',
            note: altitudeKm < 5 ?
                `Low-altitude airburst at ${altitudeKm.toFixed(1)} km - significant ground damage` :
                altitudeKm < 20 ?
                `Mid-altitude airburst at ${altitudeKm.toFixed(1)} km - primarily atmospheric effects` :
                `High-altitude airburst at ${altitudeKm.toFixed(1)} km - dispersed energy, reduced ground effects`,
            damageType: altitudeKm < 5 ? 'Ground + atmospheric blast' :
                       altitudeKm < 20 ? 'Primarily atmospheric blast' :
                       'Dispersed atmospheric shockwave'
        };
    }

    /**
     * Detect if location is in ocean using hybrid approach
     * Combines USGS elevation data with geographic heuristics
     *
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {number} elevation - Elevation from USGS (negative if below sea level)
     * @param {boolean} usgsTimeout - True if USGS API timed out
     * @returns {Object} Ocean detection result {isOcean, waterDepth, source}
     */
    detectOcean(lat, lon, elevation, usgsTimeout) {
        // If USGS responded successfully and elevation < 0 → confirmed ocean
        if (!usgsTimeout && elevation < 0) {
            return {
                isOcean: true,
                waterDepth: Math.abs(elevation),
                source: 'USGS (confirmed)'
            };
        }

        // Geographic heuristics for major oceans and seas
        // Improved for better coverage (v1.6.22)
        // Useful when USGS times out or doesn't detect ocean

        // Mediterranean Sea (IMPROVED - full coverage)
        // From Gibraltar (-5.3°) to Levantine Basin (36°E)
        if (lon >= -6 && lon <= 37 && lat >= 30 && lat <= 46) {
            return { isOcean: true, waterDepth: 1500, source: 'Mediterranean Sea (heuristic)' };
        }

        // Black Sea
        if (lon >= 27 && lon <= 42 && lat >= 41 && lat <= 47) {
            return { isOcean: true, waterDepth: 1200, source: 'Black Sea (heuristic)' };
        }

        // Gulf of Mexico (NEW - important for Chicxulub testing)
        // Critical for asteroid impact tsunami modeling
        if (lon >= -98 && lon <= -80 && lat >= 18 && lat <= 31) {
            return { isOcean: true, waterDepth: 1600, source: 'Gulf of Mexico (heuristic)' };
        }

        // Caribbean Sea
        if (lon >= -85 && lon <= -60 && lat >= 10 && lat <= 23) {
            return { isOcean: true, waterDepth: 2500, source: 'Caribbean Sea (heuristic)' };
        }

        // North Atlantic (IMPROVED - includes Bretagne/UK/Ireland coasts)
        // From US East Coast to European West Coast
        if (lon >= -75 && lon <= -6 && lat >= 25 && lat <= 65) {
            // Exclude eastern US mainland (rough approximation)
            if (!(lon >= -80 && lon <= -70 && lat >= 30 && lat <= 45)) {
                return { isOcean: true, waterDepth: 4000, source: 'North Atlantic Ocean (heuristic)' };
            }
        }

        // Pacific Ocean (largest ocean)
        // Eastern Pacific: -180 to -100 (excluding western North America coast)
        if (lon < -100 && lon > -180) {
            // Exclude western North America coast
            if (!(lat > 30 && lat < 60 && lon > -130 && lon < -100)) {
                return { isOcean: true, waterDepth: 4000, source: 'Pacific Ocean (heuristic)' };
            }
        }

        // Western Pacific: 120 to 180 (excluding Japan, Philippines, Australia, New Zealand)
        if (lon > 120 && lon < 180) {
            // Exclude Japan (lat 30-46, lon 128-146)
            if (lat >= 30 && lat <= 46 && lon >= 128 && lon <= 146) {
                return { isOcean: false, waterDepth: 0, source: 'land' };
            }
            // Exclude Philippines (lat 5-20, lon 118-127)
            if (lat >= 5 && lat <= 20 && lon >= 118 && lon <= 127) {
                return { isOcean: false, waterDepth: 0, source: 'land' };
            }
            // Exclude eastern Australia (lat -44 to -10, lon 142-154)
            if (lat >= -44 && lat <= -10 && lon >= 142 && lon <= 154) {
                return { isOcean: false, waterDepth: 0, source: 'land' };
            }
            // Exclude New Zealand (lat -47 to -34, lon 166-179)
            if (lat >= -47 && lat <= -34 && lon >= 166 && lon <= 179) {
                return { isOcean: false, waterDepth: 0, source: 'land' };
            }
            return { isOcean: true, waterDepth: 4000, source: 'Pacific Ocean (heuristic)' };
        }

        // Indian Ocean
        if (lon > 40 && lon < 100 && lat < 0 && lat > -60) {
            return { isOcean: true, waterDepth: 4000, source: 'Indian Ocean (heuristic)' };
        }

        // Arctic Ocean
        if (lat > 70) {
            return { isOcean: true, waterDepth: 1000, source: 'Arctic Ocean (heuristic)' };
        }

        // Southern Ocean / Antarctic
        if (lat < -60) {
            return { isOcean: true, waterDepth: 4000, source: 'Southern Ocean (heuristic)' };
        }

        // Bay of Bengal
        if (lon >= 80 && lon <= 95 && lat >= 5 && lat <= 22) {
            return { isOcean: true, waterDepth: 2600, source: 'Bay of Bengal (heuristic)' };
        }

        // South China Sea
        if (lon >= 105 && lon <= 120 && lat >= 0 && lat <= 23) {
            return { isOcean: true, waterDepth: 1200, source: 'South China Sea (heuristic)' };
        }

        // Not an ocean
        return { isOcean: false, waterDepth: 0, source: 'land' };
    }

    /**
     * Simulate complete impact scenario
     * @param {Object} params - Impact parameters
     * @returns {Object} Complete impact analysis
     */
    async simulateImpact(params) {
        const {
            diameter, // meters
            velocity, // m/s
            angle = 45, // degrees
            density = this.DEFAULT_ASTEROID_DENSITY,
            composition = 'rocky', // NEW: Material composition
            impactLocation = { lat: 0, lon: 0, isOcean: false, depth: 0 },
            use_rk4 = false // v1.7.1: Enable RK4 atmospheric trajectory integration (scientifically rigorous)
        } = params;

        // Get detailed terrain data for impact location
        const terrainData = await this.usgsService.getElevation(
            impactLocation.lat,
            impactLocation.lon
        );

        // Calculate mass
        const mass = this.calculateMass(diameter, density);

        // Calculate final impact velocity
        const finalVelocity = this.calculateImpactVelocity(velocity, angle);

        // Calculate impact energy and atmospheric trajectory
        let energy, fragmentation, rk4Result;

        if (use_rk4) {
            // v1.7.1: RK4 INTEGRATION - Scientifically rigorous energy calculation
            // Integrates atmospheric trajectory with conservation of energy guarantee
            console.log('[PhysicsEngine] Using RK4 atmospheric trajectory integration');

            rk4Result = await this.atmosphericTrajectory.integrateTrajectory({
                diameter: diameter,
                velocity: velocity,
                angle: angle,
                density: density,
                composition: composition,
                altitude_stop: impactLocation.elevation || 0
            });

            // Determine if this is an airburst based on fragmentation altitude
            const burstAltitude = rk4Result.summary.altitude_fragmentation || 0;
            const isAirburst = rk4Result.summary.fragmented && burstAltitude > 1000; // Airburst if fragmented above 1 km

            // Extract energy from RK4 integration
            // CRITICAL PHYSICS:
            // - Airburst: Use KINETIC energy at fragmentation (creates blast wave)
            // - Ground impact: Use final kinetic energy (creates crater)
            let energyForEffects;
            if (isAirburst) {
                // Airburst: Use kinetic energy at moment of fragmentation
                // This is the energy available for blast wave generation
                energyForEffects = rk4Result.summary.energy_kinetic_fragmentation_J || rk4Result.summary.energy_atmospheric_J;
            } else {
                // Ground impact: Use final kinetic energy (creates crater)
                energyForEffects = rk4Result.summary.energy_final_J;
            }

            // v2.0.1 Phase 1.4 Task 1.3: Extract thermal ablation energy from RK4
            const thermalAblation_J = rk4Result.summary.energy_ablation_J || 0;

            // Calculate complete energy budget with RK4-derived thermal ablation
            energy = this.calculateImpactEnergy(
                mass,
                velocity,  // Use initial velocity (not finalVelocity which is simplified)
                angle,
                composition,
                diameter,
                thermalAblation_J  // Task 1.3: Thermal energy from RK4 atmospheric integration
            );

            // Override joules/megatons with RK4 energy for effects
            // (energy budget is based on initial energy, but effects use final/fragmentation energy)
            energy.joules = energyForEffects;
            energy.tntTons = energyForEffects / 4.184e9;
            energy.megatons = energyForEffects / 4.184e15;

            fragmentation = {
                willFragment: rk4Result.summary.fragmented,
                impactType: isAirburst
                    ? (burstAltitude > 20000 ? 'high_altitude_airburst' : burstAltitude > 5000 ? 'airburst' : 'low_altitude_airburst')
                    : 'ground',
                altitude: burstAltitude,
                energyDepositionAltitude: burstAltitude,
                craterFormed: !isAirburst,
                reachesGround: !isAirburst,
                note: isAirburst
                    ? `RK4: Airburst at ${(burstAltitude/1000).toFixed(1)} km - energy deposited in atmosphere`
                    : `RK4: Ground impact with ${energy.megatons.toFixed(3)} MT`,
                strength: rk4Result.trajectory[0]?.material_strength || 0,
                ramPressure: rk4Result.trajectory[rk4Result.trajectory.length - 1]?.ram_pressure_Pa || 0,
                details: `RK4 integration: ${rk4Result.trajectory.length} timesteps, conservation error: ${rk4Result.summary.conservation_error_percent.toFixed(3)}%`,
                model: 'RK4 (Runge-Kutta 4th order)',
                // RK4-specific data
                rk4_trajectory: rk4Result.trajectory,
                rk4_summary: rk4Result.summary
            };

        } else {
            // LEGACY METHOD: Simple energy calculation with atmospheric retention factor
            console.log('[PhysicsEngine] Using legacy atmospheric fragmentation model');

            // v2.0.1 Phase 1.4: Calculate energy with angle-dependent coupling and complete budget
            // Note: Legacy mode doesn't use RK4, so thermal ablation = 0
            energy = this.calculateImpactEnergy(mass, finalVelocity, angle, composition, diameter, 0);

            // v2.0.6: Atmospheric entry - Collins, Melosh & Marcus (2005).
            // One model decides breakup, airburst altitude and surface velocity
            // (the "Impact Earth!" model). Replaces the Hills-Goda breakup check,
            // which declared an airburst at the breakup-onset altitude and gave
            // no surface velocity, so craters used the entry velocity
            // (Meteor Crater: 1.55 km instead of ~1.2 km).
            // v2.1.0: irons do not break up (NASA PAIR rule); stones use the
            // effective strength calibrated on CNEOS bolides (see collinsEntry.js).
            const entry = collinsEntry.computeImpactorEntry({
                diameter,
                velocity: finalVelocity,
                angle,
                density,
                composition
            });
            fragmentation = this.buildFragmentationFromEntry(entry);

            // v2.0.5: No "atmospheric retention factor". In an airburst the
            // kinetic energy is not lost: it is deposited in the air and drives
            // the blast wave. The former factor (x0.10 for D < 20 m) cut
            // Chelyabinsk to 0.04 Mt; an empirical x7 altitude factor on blast
            // radii then compensated. Both are removed; altitude is now handled
            // geometrically in the blast model (slant range -> ground range).
        }

        // ------------------------------------------------------------------
        // v2.1.0: ONE energy per effect (Collins 2005 / NASA PAIR convention)
        //   airburst      -> total kinetic energy, released at burst altitude
        //   ground impact -> kinetic energy LEFT AT THE SURFACE
        // Before v2.1.0 every effect used the entry energy: for a 100 m stone,
        // 75 Mt instead of the 11 Mt that actually reach the ground.
        // ------------------------------------------------------------------
        let effectsEnergy = energy.joules;
        if (fragmentation.craterFormed && fragmentation.groundVelocity && !use_rk4) {
            effectsEnergy = 0.5 * mass * fragmentation.groundVelocity * fragmentation.groundVelocity;
        }
        energy.effects_joules = effectsEnergy;
        energy.effects_megatons = effectsEnergy / 4.184e15;
        energy.atmospheric_deposition_joules = Math.max(0, energy.joules - effectsEnergy);
        energy.effects_basis = fragmentation.craterFormed
            ? 'kinetic energy at the surface (after atmospheric drag)'
            : 'total kinetic energy, released at burst altitude';

        // Detect ocean BEFORE the crater (v2.1.0): the water layer slows the
        // impactor before it reaches the sea floor (Collins 2005).
        const oceanData = this.detectOcean(
            impactLocation.lat,
            impactLocation.lon,
            terrainData.elevation,
            terrainData.estimated // true if USGS timed out
        );

        // Calculate crater ONLY if object reaches ground
        let baseCrater, crater;
        if (fragmentation.craterFormed) {
            // PHYSICS CORRECTION #1: Use FINAL velocity from RK4, not initial velocity
            // Impact velocity determines crater size via π₂ = v²/(gL) and π_V = ρv²/Y
            let impactVelocity;
            if (use_rk4 && rk4Result && rk4Result.summary.final_velocity_m_s) {
                // RK4 mode: Use actual final velocity after atmospheric drag
                impactVelocity = rk4Result.summary.final_velocity_m_s;
                console.log(`[PhysicsEngine] Using RK4 final velocity: ${impactVelocity.toFixed(1)} m/s (initial: ${velocity.toFixed(1)} m/s)`);
            } else if (fragmentation.groundVelocity) {
                // v2.0.6: surface velocity after atmospheric drag (Collins 2005).
                // The Collins crater law takes the velocity AT THE SURFACE.
                impactVelocity = fragmentation.groundVelocity;
                console.log(`[PhysicsEngine] Using Collins surface velocity: ${impactVelocity.toFixed(1)} m/s (entry: ${finalVelocity.toFixed(1)} m/s)`);
            } else {
                impactVelocity = finalVelocity;
                console.log(`[PhysicsEngine] Using entry velocity: ${impactVelocity.toFixed(1)} m/s`);
            }

            // v2.1.0: ocean impact -> the crater forms on the SEA FLOOR with the
            // velocity left after the water layer (Collins 2005). Replaces the
            // unsourced terrain multipliers (mountains x1.2, deep ocean x0.5
            // diameter / x2.5 depth).
            const waterDepth = oceanData.isOcean ? Math.max(0, oceanData.waterDepth || 0) : 0;
            const craterVelocity = waterDepth > 0
                ? collinsEffects.seafloorVelocity(impactVelocity, waterDepth, diameter, density, angle)
                : impactVelocity;

            baseCrater = await this.calculateCraterSize(
                energy.effective_joules,
                angle,
                composition,
                density,
                2500, // target density: crustal rock (Collins 2005 default)
                diameter,
                craterVelocity
            );

            crater = {
                diameter: baseCrater.diameter,
                depth: baseCrater.depth,
                volume: baseCrater.volume,
                craterType: baseCrater.craterType,
                transientDiameter: baseCrater.transientDiameter,
                // Kept for API/UI compatibility (no terrain multiplier any more)
                originalDiameter: baseCrater.diameter,
                modifiedDiameter: baseCrater.diameter,
                modifiedDepth: baseCrater.depth,
                target: waterDepth > 0 ? 'sea floor' : 'land',
                waterDepth,
                impactVelocityAtTarget: craterVelocity,
                note: waterDepth > 0
                    ? `Sea-floor crater under ${Math.round(waterDepth)} m of water (impactor slowed to ${(craterVelocity / 1000).toFixed(1)} km/s)`
                    : `Land crater, impact velocity ${(craterVelocity / 1000).toFixed(1)} km/s`
            };
        } else {
            // Airburst - no crater formed
            crater = {
                diameter: 0,
                depth: 0,
                volume: 0,
                craterType: 'none',
                transientDiameter: 0,
                note: `Airburst at ${Math.round(fragmentation.altitude/1000)} km - no crater formed`
            };
        }

        // v2.1.0: seismic only for ground impacts (Collins 2005 Eq. 40 is not
        // defined for airbursts), with the surface energy.
        const seismic = fragmentation.craterFormed
            ? this.calculateSeismicEffects(effectsEnergy)
            : {
                magnitude: 0,
                description: 'Airburst: no crater-forming impact, no seismic estimate (Collins 2005 applies to ground impacts)',
                radiusKm: 0,
                applicable: false
            };

        // Blast and thermal with the effects energy, at the burst altitude
        // (0 for ground impacts). Altitude is handled geometrically.
        const burstAltitudeForBlast = (fragmentation && fragmentation.altitude) ? fragmentation.altitude : 0;
        const blast = this.calculateBlastRadius(
            effectsEnergy,
            fragmentation.craterFormed ? 0 : burstAltitudeForBlast,
            { airburst: !fragmentation.craterFormed }
        );

        // v2.1.0: tsunami only for an impactor reaching the water (no notable
        // tsunami from airbursts, NASA/NOAA 2017), cavity from Collins (2005)
        // with the velocity at the surface.
        const tsunami = (oceanData.isOcean && fragmentation.craterFormed) ?
            this.calculateTsunamiEffects(
                effectsEnergy,
                oceanData.waterDepth,
                diameter,
                fragmentation.groundVelocity || finalVelocity,
                angle,
                density
            ) : null;

        // Calculate casualties (use legacy model by default for stability)
        const useScientificModel = process.env.USE_SCIENTIFIC_CASUALTIES === 'true';

        let casualties;

        if (useScientificModel) {
            try {
                console.log('Using SCIENTIFIC casualty model (Rumpf et al. 2017)');
                casualties = await this.calculateScientificCasualties(
                    energy,
                    blast,
                    crater,
                    { ...impactLocation, elevation: terrainData.elevation },
                    seismic,
                    tsunami
                );
            } catch (error) {
                console.error('Scientific casualties failed, using legacy:', error.message);
                casualties = await this.calculateCasualtiesWithTerrain(
                    blast,
                    { ...impactLocation, elevation: terrainData.elevation },
                    crater
                );
            }
        } else {
            // Use simple, stable legacy model
            casualties = await this.calculateCasualties(
                blast,
                impactLocation,
                crater
            );
        }

        // Calculate terrain-aware blast zones (v1.6.21)
        // Uses line-of-sight analysis to respect terrain topology
        let terrainAwareBlast = null;
        try {
            if (impactLocation && impactLocation.latitude && impactLocation.longitude) {
                console.log('Calculating terrain-aware blast zones...');
                terrainAwareBlast = await this.terrainAwareBlastService.calculateTerrainAwareBlastZones(
                    blast,
                    {
                        latitude: impactLocation.latitude,
                        longitude: impactLocation.longitude,
                        elevation: terrainData.elevation || 0
                    },
                    fragmentation.energyDepositionAltitude || 1000, // Burst altitude in meters
                    {
                        radialSamples: 36, // Every 10 degrees
                        rangeSteps: 15     // 15 elevation checks per ray
                    }
                );
                console.log('Terrain-aware blast zones calculated successfully');
            }
        } catch (error) {
            console.error('Terrain-aware blast calculation failed (using circular fallback):', error.message);
            // Fallback to circular zones if terrain analysis fails
            terrainAwareBlast = null;
        }

        return {
            asteroidProperties: {
                diameter,
                mass,
                velocity: finalVelocity,
                density,
                composition,
                angle
            },
            energy,
            // v2.1.1: pass the entry-model fields through (breakup/burst
            // altitude, ground velocity, model name); before, the model was
            // hard-coded as 'Hills-Goda (1993)' and the new fields were dropped.
            fragmentation: {
                willFragment: fragmentation.willFragment,
                impactType: fragmentation.impactType,
                altitude: fragmentation.altitude,
                energyDepositionAltitude: fragmentation.energyDepositionAltitude,
                craterFormed: fragmentation.craterFormed,
                reachesGround: fragmentation.reachesGround,
                breakupAltitude: fragmentation.breakupAltitude ?? null,
                burstAltitude: fragmentation.burstAltitude ?? null,
                groundVelocity: fragmentation.groundVelocity ?? null,
                velocityAtBurst: fragmentation.velocityAtBurst ?? null,
                note: fragmentation.note,
                strength: fragmentation.strength,
                ramPressure: fragmentation.ramPressure,
                details: fragmentation.details,
                model: fragmentation.model || 'Collins et al. (2005) atmospheric entry'
            },
            crater,
            seismic,
            blast,
            blastTerrainAware: terrainAwareBlast, // v1.6.21 - Polygonal blast zones respecting terrain
            tsunami,
            casualties: casualties,
            impactLocation: {
                ...impactLocation,
                elevation: terrainData.elevation,
                terrainType: terrainData.terrainType,
                isOcean: oceanData.isOcean,
                waterDepth: oceanData.waterDepth,
                oceanDetectionSource: oceanData.source
            },
            terrainEffects: {
                craterModification: {
                    original: baseCrater,
                    modified: crater,
                    terrainInfluence: crater.modifiers
                }
            }
        };
    }

    /**
     * Casualties (v2.1.0) - NASA PAIR rule (Mathias et al. 2017): the population
     * inside the LARGER of the 4 psi (27.6 kPa) blast area and the third-degree
     * burn area is counted as killed. People between that radius and the 7 kPa
     * radius (moderate structural damage) are counted as exposed/injured.
     * Replaces fixed mortality steps (100/90/70/30 %) that had no source.
     *
     * Population: WorldPop 2020 grid (v2.1.1), 2.5' cells (~4.6 km) below
     * 300 km, 30' cells above; median error 1.3 % vs the 1 km grid. City names
     * still come from GeoNames (cities > 15,000 inhabitants).
     */
    async calculateCasualties(blast, impactLocation, crater) {
        const bp = blast.blast_physics || {};
        const lethalBlastKm = (blast.lethalBlastRadius || bp.lethal_4psi || 0) / 1000;
        const thermalKm = (blast.thermalRadius || 0) / 1000;
        const lethalKm = Math.max(lethalBlastKm, thermalKm);
        const exposedKm = Math.max(lethalKm, (bp.moderate_structural || 0) / 1000);

        // v2.1.1: totals from the WorldPop 2020 grid (rural population included,
        // partial cells counted by area); GeoNames cities only to NAME the
        // places affected.
        const gridLethal = worldPopGrid.populationInRadius(impactLocation.lat, impactLocation.lon, lethalKm);
        const gridExposed = worldPopGrid.populationInRadius(impactLocation.lat, impactLocation.lon, exposedKm);
        const inLethal = await populationService.getPopulationInRadius(impactLocation.lat, impactLocation.lon, lethalKm);
        const inExposed = await populationService.getPopulationInRadius(impactLocation.lat, impactLocation.lon, exposedKm);

        const deaths = gridLethal.totalPopulation;
        const exposed = Math.max(0, gridExposed.totalPopulation - deaths);
        const dominant = thermalKm > lethalBlastKm ? 'thermal radiation (3rd-degree burns)' : 'blast (>= 4 psi / 27.6 kPa)';

        const zones = {
            lethal: {
                radius: lethalKm,
                area: Math.PI * lethalKm * lethalKm,
                populationAffected: deaths,
                casualties: deaths,
                injured: 0,
                mortalityRate: 1.0,
                description: `Lethal zone, set by ${dominant} (NASA PAIR rule)`,
                affectedCities: inLethal.affectedCities
            },
            moderate: {
                radius: exposedKm,
                area: Math.PI * exposedKm * exposedKm,
                populationAffected: gridExposed.totalPopulation,
                ringPopulation: exposed,
                casualties: 0,
                injured: exposed,
                mortalityRate: 0,
                description: 'Moderate structural damage (>= 7 kPa): injuries, collapsed light structures',
                affectedCities: inExposed.affectedCities
            }
        };

        // v2.1.1: per-city figures follow the same PAIR rule as the totals
        // (whole population inside the lethal radius, none outside). The city
        // service's own distance-decay rates (95/70/40/10 %) had no source.
        const largestZoneCities = (inExposed.affectedCities || []).map((city) => {
            const lethal = Number(city.distance) <= lethalKm;
            const pop = city.population ?? city.pop ?? 0;
            return {
                ...city,
                casualties: lethal ? pop : 0,
                casualtyRate: lethal ? 100 : 0,
                zone: lethal ? 'lethal' : 'moderate damage'
            };
        });
        return {
            estimatedCasualties: deaths,
            estimatedInjured: exposed,
            totalAffected: deaths + exposed,
            zones,
            affectedCities: largestZoneCities,
            severity: this.getCasualtySeverity(deaths),
            model: 'NASA PAIR rule (Mathias et al. 2017): max(4 psi, 3rd-degree burn) area',
            populationSource: `${worldPopGrid.source}, ${gridExposed.grid || gridLethal.grid}`,
            note: impactLocation.isOcean ?
                'Ocean impact - tsunami and coastal effects primary concern' :
                `${largestZoneCities.length} cities > 15,000 inhabitants in the damage area; totals include rural population (WorldPop 2020)`
        };
    }

    /**
     * Calculate casualties with terrain-aware blast propagation
     * @param {Object} blast - Blast zones
     * @param {Object} impactLocation - Impact coordinates with elevation
     * @param {Object} crater - Crater data
     * @returns {Object} Casualties estimation with terrain effects
     */
    async calculateCasualtiesWithTerrain(blast, impactLocation, crater) {
        // Get all cities in blast radius
        const maxRadius = Math.max(
            blast.fireball,
            blast.thermalRadius,
            blast.airblastRadius,
            blast.radiationRadius
        ) / 1000; // Convert to km

        const citiesInRange = await populationService.getCitiesInRadius(
            impactLocation.lat,
            impactLocation.lon,
            maxRadius
        );

        // Calculate terrain-modified effects for each city
        const cityEffects = [];
        let totalCasualties = 0;
        let totalInjured = 0;
        let totalProtected = 0;

        for (const city of citiesInRange) {
            // Calculate distance from impact
            const distance = this.terrainAnalysis.calculateDistance(
                impactLocation.lat,
                impactLocation.lon,
                city.lat,
                city.lon
            );

            // Get city elevation (if not already present)
            const cityElevation = city.elevation || (await this.usgsService.getElevation(city.lat, city.lon)).elevation;

            // Calculate line-of-sight and terrain blocking
            const terrainBlocking = await this.terrainAnalysis.calculateTerrainAttenuatedBlast(
                { lat: impactLocation.lat, lon: impactLocation.lon, elevation: impactLocation.elevation },
                { lat: city.lat, lon: city.lon, elevation: cityElevation },
                1e6 // Base blast pressure in Pa
            );

            // Determine which zone this city is in
            let zone = null;
            let baseMultiplier = 0;

            if (distance <= blast.fireball / 1000) {
                zone = 'fireball';
                baseMultiplier = 1.0;
            } else if (distance <= blast.thermalRadius / 1000) {
                zone = 'thermal';
                baseMultiplier = 0.9;
            } else if (distance <= blast.airblastRadius / 1000) {
                zone = 'airblast';
                baseMultiplier = 0.7;
            } else if (distance <= blast.radiationRadius / 1000) {
                zone = 'radiation';
                baseMultiplier = 0.3;
            }

            if (zone) {
                // Apply terrain attenuation
                const terrainProtection = 1 - terrainBlocking.attenuationFactor;
                const effectiveMultiplier = baseMultiplier * terrainBlocking.attenuationFactor;

                const casualties = Math.round(city.population * effectiveMultiplier);
                const protectedCount = Math.round(city.population * baseMultiplier * terrainProtection);
                const injured = Math.round((city.population - casualties - protectedCount) * 0.8);

                totalCasualties += casualties;
                totalProtected += protectedCount;
                totalInjured += injured;

                cityEffects.push({
                    city: city.name,
                    population: city.population,
                    distance: distance.toFixed(1),
                    zone: zone,
                    casualties: casualties,
                    injured: injured,
                    protectedByTerrain: protectedCount,
                    terrainBlocking: terrainBlocking.terrainBlocking,
                    blockingFactor: terrainBlocking.blockingFactor.toFixed(2),
                    protectionPercentage: (terrainProtection * 100).toFixed(1)
                });
            }
        }

        // Sort cities by casualties
        cityEffects.sort((a, b) => b.casualties - a.casualties);

        return {
            estimatedCasualties: totalCasualties,
            estimatedInjured: totalInjured,
            totalProtected: totalProtected,
            totalAffected: totalCasualties + totalInjured,
            affectedCities: cityEffects,
            terrainProtectionSummary: {
                citiesWithProtection: cityEffects.filter(c => c.protectedByTerrain > 0).length,
                totalLivesSaved: totalProtected,
                averageProtection: cityEffects.length > 0 ?
                    (cityEffects.reduce((sum, c) => sum + parseFloat(c.protectionPercentage), 0) / cityEffects.length).toFixed(1) : 0
            },
            note: impactLocation.isOcean ?
                'Ocean impact - tsunami effects calculated separately' :
                `Terrain-aware simulation: ${totalProtected.toLocaleString()} lives potentially saved by topographic protection`
        };
    }

    /**
     * Calculate casualties using scientific models (Rumpf et al. 2017)
     * Implements seven impact effects with probit lethality functions
     *
     * @param {Object} energy - Impact energy object
     * @param {Object} blast - Blast zones
     * @param {Object} crater - Crater data
     * @param {Object} impactLocation - Impact coordinates
     * @param {Object} seismic - Seismic data
     * @param {Object} tsunami - Tsunami data (if ocean impact)
     * @returns {Promise<Object>} Scientific casualty estimation
     */
    async calculateScientificCasualties(energy, blast, crater, impactLocation, seismic, tsunami) {
        // Get population data in affected area
        const maxRadius = Math.max(
            blast.thermalRadius,
            blast.airblastRadius,
            seismic.radiusKm
        ) / 1000; // Convert to km

        // Simplified: Use coarse grid sampling to avoid memory issues
        const popData = await populationService.getPopulationInRadius(
            impactLocation.lat,
            impactLocation.lon,
            maxRadius,
            5.0 // 5km grid resolution (coarser for performance)
        );

        console.log(`Scientific casualty calculation: ${popData.totalPopulation.toLocaleString()} people in ${maxRadius.toFixed(1)}km radius`);

        // Calculate effect severity and lethality at different distances
        const casualties = {
            byEffect: {},
            total: 0,
            totalInjured: 0,
            affectedPopulation: popData.totalPopulation
        };

        // Sample points in concentric rings (limit to 20 rings max for performance)
        const rings = [];
        const ringSpacing = Math.max(2, maxRadius / 20); // Max 20 rings, min 2km spacing
        const numRings = Math.min(20, Math.ceil(maxRadius / ringSpacing));

        console.log(`Calculating casualties in ${numRings} rings, spacing: ${ringSpacing.toFixed(2)}km`);

        //Get average density once (not in loop to save memory)
        const avgDensity = popData.averageDensity || 100;

        for (let i = 0; i < numRings; i++) {
            const innerRadius = i * ringSpacing;
            const outerRadius = (i + 1) * ringSpacing;
            const midRadius = (innerRadius + outerRadius) / 2;

            // Ring area
            const ringAreaKm2 = Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius);
            const ringPop = Math.round(avgDensity * ringAreaKm2);

            if (ringPop <= 0) continue;

            // Calculate distance in meters for models
            const distanceM = midRadius * 1000;

            // 1. CRATER LETHALITY (immediate zone)
            const craterRadius = crater.modifiedDiameter / 2000; // Convert to km
            const craterLethality = casualtyModel.calculateCraterLethality(distanceM, crater.modifiedDiameter / 2);

            // 2. THERMAL RADIATION LETHALITY
            const thermalFlux = casualtyModel.calculateThermalFluxAtDistance(energy.joules, distanceM);
            const thermalLethality = casualtyModel.calculateThermalLethality(thermalFlux);

            // 3. OVERPRESSURE LETHALITY
            const overpressure = casualtyModel.calculateOverpressureAtDistance(energy.joules, distanceM);
            const overpressureLethality = casualtyModel.calculateOverpressureLethality(overpressure);

            // 4. WIND BLAST LETHALITY
            const windSpeed = casualtyModel.calculateWindSpeedFromOverpressure(overpressure);
            const windLethality = casualtyModel.calculateWindLethality(windSpeed);

            // 5. SEISMIC LETHALITY
            const seismicLethality = casualtyModel.calculateSeismicLethality(seismic.magnitude, midRadius);

            // 6. EJECTA LETHALITY
            const ejectaThickness = casualtyModel.calculateEjectaThickness(
                crater.modifiedDiameter,
                crater.modifiedDepth,
                distanceM
            );
            const ejectaLethality = casualtyModel.calculateEjectaLethality(ejectaThickness);

            // 7. TSUNAMI LETHALITY (if ocean impact)
            let tsunamiLethality = 0;
            if (tsunami && tsunami.initialWaveHeight > 0) {
                // Estimate distance from coast (simplified)
                const distanceFromCoast = 0; // Would need coastline data
                tsunamiLethality = casualtyModel.calculateTsunamiLethality(tsunami.initialWaveHeight, distanceFromCoast);
            }

            // Combine all lethalities using competitive risk model
            const combinedLethality = casualtyModel.combineLethalities([
                craterLethality,
                thermalLethality,
                overpressureLethality,
                windLethality,
                seismicLethality,
                ejectaLethality,
                tsunamiLethality
            ]);

            // Calculate casualties in this ring
            const ringCasualties = Math.round(ringPop * combinedLethality);
            const ringInjured = Math.round(ringPop * (1 - combinedLethality) * 0.7); // 70% of survivors injured

            casualties.total += ringCasualties;
            casualties.totalInjured += ringInjured;

            // Track dominant effect (highest lethality)
            const effects = [
                { name: 'crater', lethality: craterLethality },
                { name: 'thermal', lethality: thermalLethality },
                { name: 'overpressure', lethality: overpressureLethality },
                { name: 'wind', lethality: windLethality },
                { name: 'seismic', lethality: seismicLethality },
                { name: 'ejecta', lethality: ejectaLethality },
                { name: 'tsunami', lethality: tsunamiLethality }
            ];

            const dominantEffect = effects.reduce((max, e) => e.lethality > max.lethality ? e : max);

            rings.push({
                distance: midRadius,
                population: ringPop,
                casualties: ringCasualties,
                injured: ringInjured,
                lethality: combinedLethality,
                dominantEffect: dominantEffect.name,
                effects: {
                    crater: craterLethality,
                    thermal: thermalLethality,
                    overpressure: overpressureLethality,
                    wind: windLethality,
                    seismic: seismicLethality,
                    ejecta: ejectaLethality,
                    tsunami: tsunamiLethality
                }
            });
        }

        // Aggregate by effect type
        const effectTypes = ['crater', 'thermal', 'overpressure', 'wind', 'seismic', 'ejecta', 'tsunami'];
        for (const effect of effectTypes) {
            const effectCasualties = rings.reduce((sum, ring) => {
                if (ring.dominantEffect === effect) {
                    return sum + ring.casualties;
                }
                return sum;
            }, 0);

            if (effectCasualties > 0) {
                casualties.byEffect[effect] = effectCasualties;
            }
        }

        return {
            estimatedCasualties: casualties.total,
            estimatedInjured: casualties.totalInjured,
            totalAffected: casualties.total + casualties.totalInjured,
            affectedPopulation: popData.affectedPopulation,
            affectedCities: popData.affectedCities,
            casualtiesByEffect: casualties.byEffect,
            severity: this.getCasualtySeverity(casualties.total),
            model: 'Rumpf et al. (2017) - Scientific vulnerability model',
            rings: rings.slice(0, 10), // Return first 10 rings for debugging
            note: `Based on ${popData.sampledPoints} grid points at ${popData.gridResolution}km resolution`
        };
    }

    /**
     * Get population in an annular ring
     *
     * @param {number} lat - Center latitude
     * @param {number} lon - Center longitude
     * @param {number} innerRadiusKm - Inner radius in km
     * @param {number} outerRadiusKm - Outer radius in km
     * @returns {Promise<number>} Population in ring
     */
    async getPopulationInRing(lat, lon, innerRadiusKm, outerRadiusKm) {
        // Sample points in ring (simplified - in production use proper integration)
        const numSamples = 12; // Sample at 12 angles
        let totalPop = 0;

        const midRadius = (innerRadiusKm + outerRadiusKm) / 2;

        for (let i = 0; i < numSamples; i++) {
            const angle = (i / numSamples) * 2 * Math.PI;

            // Calculate point coordinates
            const dLat = (midRadius * Math.cos(angle)) / 111; // 1° ≈ 111 km
            const dLon = (midRadius * Math.sin(angle)) / (111 * Math.cos(lat * Math.PI / 180));

            const sampleLat = lat + dLat;
            const sampleLon = lon + dLon;

            // Get density at this point
            const density = await populationService.getPopulationDensity(sampleLat, sampleLon);

            // Area of ring segment
            const ringArea = Math.PI * (outerRadiusKm * outerRadiusKm - innerRadiusKm * innerRadiusKm) / numSamples;

            totalPop += density * ringArea;
        }

        return Math.round(totalPop);
    }

    /**
     * Estimate population density based on coordinates
     * @private
     */
    estimatePopulationDensity(lat, lon, isOcean) {
        if (isOcean) return 0;

        // Zones métropolitaines majeures (densité très élevée)
        const majorCities = [
            { lat: 40.7, lon: -74.0, density: 11000, name: 'New York' },
            { lat: 34.0, lon: -118.2, density: 3200, name: 'Los Angeles' },
            { lat: 51.5, lon: -0.1, density: 5700, name: 'London' },
            { lat: 48.8, lon: 2.3, density: 21000, name: 'Paris' },
            { lat: 35.7, lon: 139.7, density: 6400, name: 'Tokyo' },
            { lat: 31.2, lon: 121.5, density: 3800, name: 'Shanghai' },
            { lat: 19.4, lon: -99.1, density: 6000, name: 'Mexico City' },
            { lat: 28.6, lon: 77.2, density: 11000, name: 'Delhi' },
            { lat: -23.5, lon: -46.6, density: 7900, name: 'São Paulo' },
            { lat: 55.7, lon: 37.6, density: 4900, name: 'Moscow' },
            { lat: -33.9, lon: 151.2, density: 2100, name: 'Sydney' },
        ];

        // Chercher la ville la plus proche
        let closestCity = null;
        let minDistance = Infinity;

        for (const city of majorCities) {
            const distance = Math.sqrt(
                Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestCity = city;
            }
        }

        // Si très proche d'une grande ville (< 2°)
        if (minDistance < 2) {
            return closestCity.density;
        }

        // Si proche (< 5°)
        if (minDistance < 5) {
            return closestCity.density * 0.3; // Banlieue
        }

        // Estimation par latitude (zones habitables)
        const absLat = Math.abs(lat);

        if (absLat > 70) return 0.1; // Zones polaires
        if (absLat > 60) return 2; // Zones subpolaires
        if (absLat > 50) return 30; // Zones tempérées nord
        if (absLat > 30) return 50; // Zones tempérées
        if (absLat > 20) return 40; // Zones subtropicales
        return 35; // Zones tropicales
    }

    /**
     * Get urban density factor
     * @private
     */
    getUrbanFactor(lat, lon) {
        // Facteur multiplicateur selon la proximité urbaine
        const majorCities = [
            { lat: 40.7, lon: -74.0, factor: 2.5 },
            { lat: 35.7, lon: 139.7, factor: 3.0 },
            { lat: 28.6, lon: 77.2, factor: 2.8 },
            { lat: 31.2, lon: 121.5, factor: 2.7 },
        ];

        for (const city of majorCities) {
            const distance = Math.sqrt(
                Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2)
            );
            if (distance < 1) return city.factor;
        }

        return 1.0; // Facteur normal
    }

    /**
     * Classify casualty severity
     * @private
     */
    getCasualtySeverity(casualties) {
        if (casualties < 100) return 'Minor';
        if (casualties < 1000) return 'Moderate';
        if (casualties < 10000) return 'Serious';
        if (casualties < 100000) return 'Severe';
        if (casualties < 1000000) return 'Catastrophic';
        if (casualties < 10000000) return 'Mass Casualty Event';
        return 'Extinction-Level Event';
    }

    /**
     * Deflection (v2.1.0), first-order orbital mechanics. Replaces
     * "delta-v = distance / time" with invented efficiencies (nuclear = 10)
     * and invented success probabilities.
     *
     * Required impulsive delta-v: an along-track delta-v applied t seconds
     * before impact shifts the arrival point by about 3 delta-v t (secular
     * drift in the Hill/Clohessy-Wiltshire equations), so delta-v = d / (3 t).
     *
     * Kinetic impactor: delta-v = beta m v / M, with a DART-class spacecraft
     * (580 kg at 6.1 km/s) and beta = 3.6 measured by DART (Cheng et al. 2023,
     * Nature); success probability = share of beta in [1, 5] (pre-mission range
     * cited by LLNL) that is enough.
     * Gravity tractor: acceleration a = G m_sc / d^2 (20 t spacecraft hovering
     * at d = 2 asteroid radii from the centre), drift x = 1.5 a t^2.
     * Nuclear stand-off: no validated public model. Treated as a GAME RULE
     * (up to 100x a kinetic impactor), flagged as such in the response.
     */
    calculateDeflection(params) {
        const {
            asteroidMass,
            warningTime,            // days
            missDistance,           // km
            method = 'kinetic',     // 'kinetic', 'gravity', 'nuclear'
            asteroidDensity = this.DEFAULT_ASTEROID_DENSITY,
            impactorMass = 580,     // kg (DART)
            impactorVelocity = 6100 // m/s (DART)
        } = params;

        const t = warningTime * 86400;
        const d = missDistance * 1000;
        const requiredDeltaV = d / (3 * t);                       // m/s
        const BETA = 3.6, BETA_MIN = 1, BETA_MAX = 5;
        const radius = Math.cbrt(3 * asteroidMass / (4 * Math.PI * asteroidDensity));

        let achievedMissKm, successProbability, description, model;

        if (method === 'gravity') {
            const mSc = 20000;
            const hover = 2 * radius;
            const a = this.G * mSc / (hover * hover);
            achievedMissKm = 1.5 * a * t * t / 1000;
            successProbability = achievedMissKm >= missDistance ? 100 : 0;
            description = 'Gravity Tractor: 20 t spacecraft hovering at 2 asteroid radii';
            model = 'G m / d^2, drift 1.5 a t^2';
        } else {
            const kineticDv = BETA * impactorMass * impactorVelocity / asteroidMass;
            const factor = method === 'nuclear' ? 100 : 1;
            const dv = kineticDv * factor;
            achievedMissKm = 3 * dv * t / 1000;
            const betaNeeded = BETA * requiredDeltaV / dv;
            successProbability = Math.round(100 * Math.min(1, Math.max(0, (BETA_MAX - betaNeeded) / (BETA_MAX - BETA_MIN))));
            if (method === 'nuclear') {
                description = 'Nuclear stand-off: GAME RULE, no validated public model (100x a kinetic impactor)';
                model = 'game rule';
            } else {
                description = 'Kinetic Impactor: DART-class (580 kg at 6.1 km/s), beta = 3.6';
                model = 'beta m v / M (DART, Cheng et al. 2023)';
            }
        }

        return {
            method,
            description,
            model,
            requiredDeltaV,                 // m/s, impulsive, along-track
            achievedMissDistanceKm: achievedMissKm,
            feasible: achievedMissKm >= missDistance,
            successProbability,             // percent
            impactorMass: method === 'gravity' ? 20000 : impactorMass,
            warningTimeNeeded: null
        };
    }
}

module.exports = PhysicsEngine;
