/**
 * Crater Routing System - Physics-Based Decision Tree
 *
 * PHILOSOPHIE (Utilisateur 2025-10-17):
 * "si les matieres ou diametre change radicalement l'approche, nous pouvons faire
 * des formules scientifique qui prenne en compte ces criteres et permettre de choisir
 * en fonction des parametres d'entrée. je ne veux pas de regression lineaire mais de
 * la physique fondamentale dans l'approche, pour les parametres avec incertitude
 * elevée monte carlo peut etre une solution"
 *
 * APPROCHE:
 * Système de décision basé sur CRITÈRES PHYSIQUES (pas de seuils arbitraires)
 *
 * CRITÈRE PRINCIPAL: Hills-Goda (1993) Fragmentation Criterion
 * P_ram = ½ ρ_atm v² > σ → Fragmentation atmosphérique
 *
 * ROUTES:
 * - Route 1: Objet intact (P_ram < σ) → Formule unifiée C=14.10
 * - Route 2: Fragmentation certaine (P_ram >> σ) → FCM + Monte Carlo σ
 * - Route 3: Fragmentation incertaine (P_ram ~ σ) → Monte Carlo complet
 *
 * AUCUNE RÉGRESSION LINÉAIRE - PHYSIQUE FONDAMENTALE SEULEMENT
 *
 * v1.7.9 - Système multi-route basé physique
 */

const { getCompositionParams } = require('../data/compositionProperties');

class CraterRouting {
    constructor() {
        // Atmospheric density at key altitudes (exponential model)
        this.rho_0 = 1.225;  // kg/m³ at sea level
        this.H = 8500;  // m, scale height

        // Strength ranges by composition (MPa) - FUNDAMENTAL PHYSICS
        this.STRENGTH_RANGES = {
            iron: {
                min: 20e6,   // 20 MPa (fractured rubble pile)
                max: 120e6,  // 120 MPa (partially fractured monolith)
                typical: 35e6,  // 35 MPa (CALIBRATED v1.7.10 on small iron impacts)
                notes: 'Iron meteorites: σ_typical=35 MPa gives best match for Sikhote-Alin (26m crater, 6.8% error at σ=40 MPa). Small irons have macro-fractures despite high cohesion.'
            },
            stony: {
                min: 5e6,    // 5 MPa (rubble pile)
                max: 40e6,   // 40 MPa (fractured monolith)
                typical: 15e6,  // 15 MPa (median for stony)
                notes: 'Stony asteroids: brittle, many fractures, common rubble piles'
            },
            icy: {
                min: 0.2e6,  // 0.2 MPa (porous, sublimation)
                max: 3e6,    // 3 MPa (compact ice)
                typical: 1e6,   // 1 MPa (median for icy)
                notes: 'Icy bodies: very weak, sublimation, thermal cracks'
            },
            rocky: {  // Alias for stony
                min: 5e6,
                max: 40e6,
                typical: 15e6,
                notes: 'Rocky = stony (same physics)'
            }
        };
    }

    /**
     * Calculate atmospheric density at altitude (exponential model)
     */
    atmosphericDensity(h_m) {
        return this.rho_0 * Math.exp(-h_m / this.H);
    }

    /**
     * Calculate ram pressure at altitude
     * P_ram = ½ ρ_atm v²
     */
    ramPressure(h_m, v_m_s) {
        const rho_atm = this.atmosphericDensity(h_m);
        return 0.5 * rho_atm * v_m_s * v_m_s;
    }

    /**
     * Get strength range for composition
     */
    getStrengthRange(composition) {
        const comp = composition.toLowerCase();

        if (this.STRENGTH_RANGES[comp]) {
            return this.STRENGTH_RANGES[comp];
        }

        // Default to stony if unknown
        console.warn(`[CraterRouting] Unknown composition '${composition}', defaulting to stony`);
        return this.STRENGTH_RANGES.stony;
    }

    /**
     * Calculate peak ram pressure during atmospheric entry
     *
     * PHYSICS: P_ram increases as object descends (ρ_atm increases exponentially)
     * Peak occurs at low altitude where fragmentation typically happens
     *
     * IMPROVED APPROXIMATION:
     * - For strong objects (iron): fragmentation at h ~ 5-15 km
     * - For weak objects (stony): fragmentation at h ~ 20-30 km
     * - Use h = 10 km as conservative estimate for peak P_ram
     */
    calculatePeakRamPressure(velocity_m_s, diameter_m, density_kg_m3) {
        // Conservative altitude: 10 km (lower bound for iron fragmentation)
        // At this altitude, ρ_atm ~ 0.41 kg/m³ (vs 0.04 kg/m³ at 25 km)
        const h_peak = 10000;  // 10 km (conservative for strong objects)

        // At this altitude, velocity has decreased moderately
        // Approximate: v_peak ≈ 0.9 * v_entry (moderate deceleration by 10km)
        const v_peak = 0.9 * velocity_m_s;

        const P_ram_peak = this.ramPressure(h_peak, v_peak);

        return {
            P_ram_peak: P_ram_peak,
            h_peak: h_peak,
            v_peak: v_peak
        };
    }

    /**
     * Determine routing based on physical criteria
     *
     * DECISION TREE (Physics-Based):
     *
     * 1. Calculate P_ram_peak (depends on v, ρ_atm)
     * 2. Get σ range for composition (depends on material, structure)
     * 3. Compare:
     *    - P_ram_peak < σ_min → Route 1 (intact, no fragmentation)
     *    - P_ram_peak > σ_max → Route 2 (definite fragmentation, Monte Carlo σ)
     *    - σ_min < P_ram_peak < σ_max → Route 3 (uncertain, full Monte Carlo)
     *
     * @returns {Object} Routing decision with physics justification
     */
    determineRoute(params) {
        const { diameter, velocity, angle, density, composition } = params;

        // STEP 1: Calculate peak ram pressure
        const ram = this.calculatePeakRamPressure(velocity, diameter, density);
        const P_ram_peak = ram.P_ram_peak;

        // STEP 2: Get strength range for composition
        const strength_range = this.getStrengthRange(composition);
        const sigma_min = strength_range.min;
        const sigma_max = strength_range.max;
        const sigma_typical = strength_range.typical;

        // STEP 3: Physical decision criteria
        const ratio_min = P_ram_peak / sigma_min;
        const ratio_max = P_ram_peak / sigma_max;
        const ratio_typical = P_ram_peak / sigma_typical;

        // ROUTE DECISION (Physics-Based)
        let route, rationale, use_monte_carlo, monte_carlo_params;

        if (P_ram_peak < sigma_min) {
            // ROUTE 1: Intact (no fragmentation)
            route = 'intact';
            rationale = `P_ram_peak (${(P_ram_peak/1e6).toFixed(1)} MPa) < σ_min (${(sigma_min/1e6).toFixed(1)} MPa) → Object survives intact`;
            use_monte_carlo = false;

        } else if (P_ram_peak > sigma_max) {
            // ROUTE 2: Definite fragmentation (Monte Carlo on σ only)
            route = 'fragmentation_certain';
            rationale = `P_ram_peak (${(P_ram_peak/1e6).toFixed(1)} MPa) > σ_max (${(sigma_max/1e6).toFixed(1)} MPa) → Fragmentation certain, uncertainty on extent`;
            use_monte_carlo = true;
            monte_carlo_params = {
                parameters: ['strength'],
                strength_distribution: {
                    type: 'uniform',
                    min: sigma_min,
                    max: sigma_max,
                    typical: sigma_typical
                },
                N_samples: 100
            };

        } else {
            // ROUTE 3: Uncertain fragmentation (Monte Carlo on σ + other params)
            route = 'fragmentation_uncertain';
            rationale = `σ_min (${(sigma_min/1e6).toFixed(1)} MPa) < P_ram_peak (${(P_ram_peak/1e6).toFixed(1)} MPa) < σ_max (${(sigma_max/1e6).toFixed(1)} MPa) → Fragmentation uncertain`;
            use_monte_carlo = true;
            monte_carlo_params = {
                parameters: ['strength', 'angle', 'velocity'],
                strength_distribution: {
                    type: 'uniform',
                    min: sigma_min,
                    max: sigma_max,
                    typical: sigma_typical
                },
                angle_distribution: {
                    type: 'normal',
                    mean: angle,
                    std: 10  // ±10° uncertainty
                },
                velocity_distribution: {
                    type: 'normal',
                    mean: velocity,
                    std: velocity * 0.1  // ±10% uncertainty
                },
                N_samples: 100
            };
        }

        return {
            route: route,
            rationale: rationale,
            use_monte_carlo: use_monte_carlo,
            monte_carlo_params: monte_carlo_params,
            physics_diagnostics: {
                P_ram_peak_MPa: P_ram_peak / 1e6,
                h_peak_km: ram.h_peak / 1000,
                v_peak_km_s: ram.v_peak / 1000,
                sigma_min_MPa: sigma_min / 1e6,
                sigma_max_MPa: sigma_max / 1e6,
                sigma_typical_MPa: sigma_typical / 1e6,
                ratio_P_sigma_min: ratio_min,
                ratio_P_sigma_max: ratio_max,
                ratio_P_sigma_typical: ratio_typical,
                composition: composition,
                strength_notes: strength_range.notes
            }
        };
    }

    /**
     * Quick check: Should we use Monte Carlo?
     *
     * Simplified API for caller
     */
    shouldUseMonteCarlo(params) {
        const decision = this.determineRoute(params);
        return decision.use_monte_carlo;
    }

    /**
     * Get diagnostic report (for logging/debugging)
     */
    getDiagnosticReport(params) {
        const decision = this.determineRoute(params);

        console.log('\n' + '='.repeat(80));
        console.log('CRATER ROUTING - PHYSICS-BASED DECISION');
        console.log('='.repeat(80));
        console.log(`\nINPUT PARAMETERS:`);
        console.log(`  - Diameter: ${params.diameter} m`);
        console.log(`  - Velocity: ${(params.velocity/1000).toFixed(1)} km/s`);
        console.log(`  - Angle: ${params.angle}°`);
        console.log(`  - Density: ${params.density} kg/m³`);
        console.log(`  - Composition: ${params.composition}`);

        console.log(`\nPHYSICS ANALYSIS:`);
        const diag = decision.physics_diagnostics;
        console.log(`  - Peak ram pressure: ${diag.P_ram_peak_MPa.toFixed(1)} MPa at h=${diag.h_peak_km.toFixed(1)} km`);
        console.log(`  - Strength range (${params.composition}): ${diag.sigma_min_MPa.toFixed(1)} - ${diag.sigma_max_MPa.toFixed(1)} MPa`);
        console.log(`  - Ratio P_ram / σ_typical: ${diag.ratio_P_sigma_typical.toFixed(2)}`);

        console.log(`\nDECISION:`);
        console.log(`  - Route: ${decision.route.toUpperCase()}`);
        console.log(`  - Rationale: ${decision.rationale}`);
        console.log(`  - Use Monte Carlo: ${decision.use_monte_carlo ? 'YES' : 'NO'}`);

        if (decision.use_monte_carlo) {
            console.log(`\nMONTE CARLO PARAMETERS:`);
            console.log(`  - N_samples: ${decision.monte_carlo_params.N_samples}`);
            console.log(`  - Parameters: ${decision.monte_carlo_params.parameters.join(', ')}`);

            if (decision.monte_carlo_params.strength_distribution) {
                const sd = decision.monte_carlo_params.strength_distribution;
                console.log(`  - σ distribution: Uniform(${(sd.min/1e6).toFixed(1)}, ${(sd.max/1e6).toFixed(1)}) MPa`);
            }
        }

        console.log('='.repeat(80));

        return decision;
    }
}

module.exports = { CraterRouting };
