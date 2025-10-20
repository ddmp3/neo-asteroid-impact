/**
 * Complete Pi-Group Crater Scaling (Holsapple 1993)
 *
 * FORMULATION COMPLÈTE:
 *
 * D_crater / L = K × π₁^μ × π₂^ν × π_V^β × π_Y^γ × π_g^δ × π_θ^ε
 *
 * où:
 * - L = impactor diameter (scale length)
 * - K = scaling constant
 * - π₁ = (ρ_imp / ρ_target) - density ratio
 * - π₂ = (v² / g L) - Froude number (gravity regime)
 * - π_V = (ρ_target v² / Y) - strength regime
 * - π_Y = (Y / ρ_target g L) - gravity-strength transition
 * - π_g = dimensionless gravity (for non-Earth)
 * - π_θ = sin(θ) - impact angle
 *
 * EXPONENTS (à calibrer):
 * - μ: density coupling (théorie: ~0.33 pour 3D)
 * - ν: gravity scaling (théorie: 0.195 pour strength, 0.217 pour gravity)
 * - β: velocity coupling (théorie: ~0.67 pour strength)
 * - γ: strength-gravity transition
 * - δ: gravity correction
 * - ε: angle coupling (théorie: ~0.33)
 *
 * RÉFÉRENCES:
 * - Holsapple (1993) - "The Scaling of Impact Processes in Planetary Sciences"
 * - Schmidt & Housen (1987) - "Some recent advances in crater scaling"
 * - Holsapple & Schmidt (1982) - "On the scaling of crater dimensions 2"
 *
 * AVANTAGES vs formule simplifiée:
 * - Capture transition strength → gravity regime
 * - Angle impact non-vertical
 * - Densité target variable
 * - Applicable tous régimes (petits fragments → astéroïdes km)
 *
 * v1.7.12 - Option C implementation
 */

const G_EARTH = 9.81; // m/s²

/**
 * Complete Pi-Group Crater Model
 */
class CompletePiGroupCraterModel {
    constructor() {
        // PHYSICS CORRECTION #2: Use TRUE Holsapple (1993) values from Table 3
        // Reference: Holsapple, K. A. (1993). "The Scaling of Impact Processes in Planetary Sciences"
        //            Annual Review of Earth and Planetary Sciences, 21, 333-373.
        //            Table 3: Scaling Parameters for Crater Formation
        //
        // PREVIOUS: Generic "nominal" values (K=1.0, μ=0.33) - INCORRECT
        // CORRECT: Published values calibrated against experimental data
        //
        // NOTE: These values are for GRAVITY-DOMINATED regime (large impactors)
        //       For strength regime (small, fast projectiles), different values apply

        this.params = {
            // Scaling constant (Holsapple 1993, Table 3, rocky targets, gravity regime)
            K: 1.03,  // CORRECTED from 1.0 (gravity-dominated craters, rocky targets)

            // Exponents (Holsapple 1993, Table 3)
            mu: 0.55,     // CORRECTED from 0.33: Density coupling for 3D craters (π₁^μ)
                          // Physical meaning: ρ_projectile matters more than previously thought
            nu: 0.217,    // CORRECT: Gravity scaling exponent (gravity regime, π₂^ν)
                          // Determines how crater size scales with impact velocity
            beta: 0.67,   // Velocity coupling (strength regime, less relevant for large impacts)
            gamma: 0.0,   // Strength-gravity transition (set to 0 for pure gravity regime)
            delta: 0.0,   // Gravity correction (Earth only, δ=0)
            epsilon: 0.33, // CORRECT: Angle coupling (Pierazzo & Melosh 2000 confirms sin(θ)^(1/3))
                          // Oblique impacts: D ~ sin(θ)^(1/3)

            // Physical parameters
            rho_target_default: 2500,  // kg/m³ (average crustal rock)
            Y_target_default: 1e6,     // Pa (target strength, ~1 MPa for competent rock)
            g_default: G_EARTH         // m/s²
        };

        // Regime boundaries (for diagnostics)
        this.regimes = {
            strength_dominated: { pi_V_min: 1e6, pi_V_max: 1e10 },  // High velocity, small impactor
            gravity_dominated: { pi_2_min: 1e6, pi_2_max: 1e10 }    // Low velocity, large impactor
        };
    }

    /**
     * Calculate all dimensionless pi-groups
     */
    calculatePiGroups(params) {
        const {
            diameter_m,          // Impactor diameter (L)
            velocity_m_s,        // Impact velocity
            angle_deg,           // Impact angle
            density_imp,         // Impactor density
            density_target,      // Target density (default: 2500)
            strength_target,     // Target strength Y (default: 1e6 Pa)
            gravity             // Gravity (default: 9.81 m/s²)
        } = params;

        const L = diameter_m;
        const v = velocity_m_s;
        const theta = angle_deg * Math.PI / 180;

        const rho_imp = density_imp;
        const rho_target = density_target || this.params.rho_target_default;
        const Y = strength_target || this.params.Y_target_default;
        const g = gravity || this.params.g_default;

        // π₁ = (ρ_imp / ρ_target) - Density ratio
        const pi_1 = rho_imp / rho_target;

        // π₂ = (v² / g L) - Froude number (gravity regime)
        const pi_2 = (v * v) / (g * L);

        // π_V = (ρ_target v² / Y) - Strength regime parameter
        const pi_V = (rho_target * v * v) / Y;

        // π_Y = (Y / ρ_target g L) - Gravity-strength transition
        const pi_Y = Y / (rho_target * g * L);

        // π_g = (g / g_Earth) - Gravity scaling (for other planets)
        const pi_g = g / G_EARTH;

        // π_θ = sin(θ) - Impact angle
        const pi_theta = Math.sin(theta);

        return {
            pi_1,
            pi_2,
            pi_V,
            pi_Y,
            pi_g,
            pi_theta,
            // Derived quantities for diagnostics
            L,
            v,
            theta,
            rho_imp,
            rho_target,
            Y,
            g
        };
    }

    /**
     * Determine dominant regime (strength vs gravity)
     */
    determineRegime(pi_groups) {
        const { pi_2, pi_V } = pi_groups;

        // Strength-dominated: High velocity, target strength matters
        // π_V >> 1 → strength regime
        const strength_regime = pi_V > 1e3;

        // Gravity-dominated: Large impactor, gravity matters
        // π₂ >> 1 → gravity regime
        const gravity_regime = pi_2 > 1e6;

        // Transition regime
        const transition_regime = !strength_regime && !gravity_regime;

        return {
            regime: strength_regime ? 'strength' :
                    gravity_regime ? 'gravity' :
                    'transition',
            pi_2,
            pi_V,
            strength_dominated: strength_regime,
            gravity_dominated: gravity_regime
        };
    }

    /**
     * Calculate crater diameter using complete pi-group formulation
     *
     * REGIME-DEPENDENT FORMULATION:
     * - Strength regime: D/L = K × π₁^μ × π_V^(-β) × π_θ^ε
     * - Gravity regime: D/L = K × π₁^μ × π₂^ν × π_θ^ε
     * - Transition: Combined with π_Y
     *
     * KEY CORRECTION: In strength regime, β is NEGATIVE exponent!
     */
    calculateCraterDiameter(input_params, model_params = null) {
        // Use provided model params or defaults
        const mp = model_params || this.params;

        // Calculate all pi-groups
        const pg = this.calculatePiGroups(input_params);

        // Determine regime
        const regime_info = this.determineRegime(pg);

        // Complete pi-group formula - REGIME DEPENDENT
        const pi_1_term = Math.pow(pg.pi_1, mp.mu);
        const pi_theta_term = Math.pow(pg.pi_theta, mp.epsilon);

        let diameter_ratio;

        if (regime_info.strength_dominated) {
            // STRENGTH REGIME: π_V^(-β) - NEGATIVE EXPONENT!
            const pi_V_term = Math.pow(pg.pi_V, -mp.beta);  // NEGATIVE!
            diameter_ratio = mp.K * pi_1_term * pi_V_term * pi_theta_term;

        } else if (regime_info.gravity_dominated) {
            // GRAVITY REGIME: π₂^ν
            const pi_2_term = Math.pow(pg.pi_2, mp.nu);
            diameter_ratio = mp.K * pi_1_term * pi_2_term * pi_theta_term;

        } else {
            // TRANSITION REGIME: Use both with π_Y modulation
            const pi_2_term = Math.pow(pg.pi_2, mp.nu);
            const pi_V_term = Math.pow(pg.pi_V, -mp.beta);  // NEGATIVE!
            const pi_Y_term = Math.pow(pg.pi_Y, mp.gamma);
            const pi_g_term = Math.pow(pg.pi_g, mp.delta);

            diameter_ratio = mp.K * pi_1_term * pi_2_term * pi_V_term *
                           pi_Y_term * pi_g_term * pi_theta_term;
        }

        // Store individual terms for diagnostics
        const terms = {
            K: mp.K,
            pi_1_term,
            pi_2_term: regime_info.gravity_dominated ? Math.pow(pg.pi_2, mp.nu) : null,
            pi_V_term: regime_info.strength_dominated ? Math.pow(pg.pi_V, -mp.beta) : null,
            pi_Y_term: !regime_info.strength_dominated && !regime_info.gravity_dominated ? Math.pow(pg.pi_Y, mp.gamma) : null,
            pi_g_term: !regime_info.strength_dominated && !regime_info.gravity_dominated ? Math.pow(pg.pi_g, mp.delta) : null,
            pi_theta_term
        };

        const D_crater = diameter_ratio * pg.L;

        return {
            diameter_m: D_crater,
            diameter_ratio: diameter_ratio,
            pi_groups: pg,
            regime: regime_info,
            terms: terms,  // Use the terms object created above
            model_params: mp
        };
    }

    /**
     * Simplified formula for comparison
     * (Current v1.7.10 approach)
     */
    calculateSimplifiedCrater(input_params) {
        const {
            diameter_m,
            velocity_m_s,
            angle_deg,
            density_imp,
            density_target
        } = input_params;

        const C = 14.10;  // From Phase 1.2 bootstrap
        const V_REF = 12000;  // m/s
        const RHO_TARGET = density_target || 2500;

        // PHYSICS CORRECTION Phase 1.4.3: μ = 0.55 (Holsapple 1993)
        // PREVIOUS: μ = 1/3 (incorrect for hypervelocity impacts)
        // CORRECT: μ = 0.55 (experimentally calibrated, Table 3)
        const MU_HOLSAPPLE_1993 = 0.55;
        const rho_ratio = Math.pow(density_imp / RHO_TARGET, MU_HOLSAPPLE_1993);
        const v_ratio = Math.pow(velocity_m_s / V_REF, 2/3);
        const theta = angle_deg * Math.PI / 180;
        const sin_theta = Math.pow(Math.sin(theta), 1/3);

        const D_crater = C * diameter_m * rho_ratio * v_ratio * sin_theta;

        return {
            diameter_m: D_crater,
            formula: 'simplified',
            C: C
        };
    }

    /**
     * Get diagnostic report
     */
    getDiagnosticReport(input_params, model_params = null) {
        const result = this.calculateCraterDiameter(input_params, model_params);
        const pg = result.pi_groups;
        const regime = result.regime;

        const report = [];
        report.push('═══════════════════════════════════════════════════════════════');
        report.push('  COMPLETE PI-GROUP CRATER SCALING (Holsapple 1993)');
        report.push('═══════════════════════════════════════════════════════════════');
        report.push('');
        report.push('INPUT PARAMETERS:');
        report.push(`  Impactor diameter (L):    ${pg.L.toFixed(1)} m`);
        report.push(`  Impact velocity (v):      ${(pg.v/1000).toFixed(1)} km/s`);
        report.push(`  Impact angle (θ):         ${(pg.theta*180/Math.PI).toFixed(1)}°`);
        report.push(`  Impactor density (ρ_imp): ${pg.rho_imp} kg/m³`);
        report.push(`  Target density (ρ_tgt):   ${pg.rho_target} kg/m³`);
        report.push(`  Target strength (Y):      ${(pg.Y/1e6).toFixed(1)} MPa`);
        report.push(`  Gravity (g):              ${pg.g.toFixed(2)} m/s²`);
        report.push('');
        report.push('DIMENSIONLESS PI-GROUPS:');
        report.push(`  π₁ (ρ_imp/ρ_tgt):          ${pg.pi_1.toFixed(3)}`);
        report.push(`  π₂ (v²/gL) [Froude]:       ${pg.pi_2.toExponential(2)}`);
        report.push(`  π_V (ρv²/Y) [Strength]:    ${pg.pi_V.toExponential(2)}`);
        report.push(`  π_Y (Y/ρgL) [Transition]:  ${pg.pi_Y.toExponential(2)}`);
        report.push(`  π_g (g/g_Earth):           ${pg.pi_g.toFixed(3)}`);
        report.push(`  π_θ (sin θ):               ${pg.pi_theta.toFixed(3)}`);
        report.push('');
        report.push('REGIME ANALYSIS:');
        report.push(`  Dominant regime:           ${regime.regime.toUpperCase()}`);
        report.push(`  Strength-dominated:        ${regime.strength_dominated ? 'YES' : 'NO'} (π_V > 1e3)`);
        report.push(`  Gravity-dominated:         ${regime.gravity_dominated ? 'YES' : 'NO'} (π₂ > 1e6)`);
        report.push('');
        report.push('PI-GROUP CONTRIBUTIONS:');
        report.push(`  K (scaling constant):      ${result.terms.K.toFixed(3)}`);
        report.push(`  π₁^μ (density):            ${result.terms.pi_1_term.toFixed(3)}`);
        if (result.terms.pi_2_term !== null) {
            report.push(`  π₂^ν (gravity):            ${result.terms.pi_2_term.toFixed(3)}`);
        }
        if (result.terms.pi_V_term !== null) {
            report.push(`  π_V^(-β) (strength):       ${result.terms.pi_V_term.toFixed(3)} [NEGATIVE β!]`);
        }
        if (result.terms.pi_Y_term !== null) {
            report.push(`  π_Y^γ (transition):        ${result.terms.pi_Y_term.toFixed(3)}`);
        }
        if (result.terms.pi_g_term !== null) {
            report.push(`  π_g^δ (g-correction):      ${result.terms.pi_g_term.toFixed(3)}`);
        }
        report.push(`  π_θ^ε (angle):             ${result.terms.pi_theta_term.toFixed(3)}`);
        report.push('');
        report.push('RESULT:');
        report.push(`  Crater diameter:           ${result.diameter_m.toFixed(1)} m`);
        report.push(`  Diameter ratio (D/L):      ${result.diameter_ratio.toFixed(1)}`);
        report.push('');
        report.push('═══════════════════════════════════════════════════════════════');

        return report.join('\n');
    }

    /**
     * Set model parameters (for calibration)
     */
    setParams(params) {
        this.params = { ...this.params, ...params };
    }

    /**
     * Get current model parameters
     */
    getParams() {
        return { ...this.params };
    }
}

module.exports = CompletePiGroupCraterModel;
