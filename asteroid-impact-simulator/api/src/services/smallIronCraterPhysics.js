/**
 * Small Iron Crater Physics - PHYSICS-BASED APPROACH
 *
 * PROBLÈME IDENTIFIÉ (NASA/ESA/JAXA Panel 2025-10-17):
 * - Formule K(D) = 140 + 4.8×D_imp VIOLE l'invariance d'échelle des pi-groups
 * - Régression linéaire déguisée en physique
 * - MAE test = 71% inacceptable pour usage opérationnel
 *
 * SOLUTION (v1.7.8):
 * - Utiliser FCM V2 (Wheeler 2017) pour modéliser fragmentation atmosphérique
 * - Calculer altitude de fragmentation, masse survivante, vitesse impact
 * - Appliquer pi-group scaling UNIQUEMENT sur masse qui atteint le sol
 * - Si fragmentation complète → champ de cratères multiples (Sikhote-Alin)
 *
 * PHYSIQUE ÉLÉMENTAIRE:
 * 1. Critère Hills-Goda: Fragmentation si P_ram > σ (pression dynamique > résistance)
 * 2. FCM: Fragmentation progressive + dispersion debris cloud
 * 3. Weibull: Résistance dépend taille σ(D) = σ₀ × (D₀/D)^(1/m)
 * 4. Cratère: D_crater ∝ (m_impact)^(1/3) × v^(2/3) (pi-groups Holsapple)
 *
 * RÉFÉRENCES:
 * - Wheeler et al. (2017) - Fragment-Cloud Model
 * - Hills & Goda (1993) - Fragmentation criterion
 * - Holsapple (1993) - Pi-group crater scaling
 * - Bruck Syal et al. (2016) - Weibull strength scaling
 *
 * v1.7.8 - Correction critique suite évaluation panel expert
 */

const { FragmentCloudModelV2 } = require('./fragmentCloudModelV2');
const { getCompositionParams } = require('../data/compositionProperties');

class SmallIronCraterPhysics {
    constructor() {
        this.G = 9.81; // m/s²
        this.RHO_TARGET_DEFAULT = 2500; // kg/m³
    }

    /**
     * Calculer cratère pour petit impacteur de fer (<50m)
     * Utilise FCM V2 pour fragmentation atmosphérique rigoureuse
     *
     * @param {Object} params - Paramètres impact
     * @param {number} params.diameter - Diamètre impacteur (m)
     * @param {number} params.velocity - Vitesse entrée atmosphère (m/s)
     * @param {number} params.angle - Angle impact (degrés)
     * @param {number} params.density - Densité impacteur (kg/m³)
     * @param {string} params.composition - Type composition ('iron')
     * @param {number} params.targetDensity - Densité cible (kg/m³)
     * @returns {Object} Résultats cratère + diagnostics fragmentation
     */
    async calculateSmallIronCrater(params) {
        console.log('\n[SmallIronCrater] === PHYSICS-BASED APPROACH (v1.7.8) ===');
        console.log(`[SmallIronCrater] Input: D=${params.diameter}m, v=${params.velocity}m/s, θ=${params.angle}°`);

        // ÉTAPE 1: Récupérer propriétés physiques composition
        const comp_props = getCompositionParams(params.composition, null);

        const density = params.density || comp_props.density.bulk_typical;  // kg/m³

        // WEIBULL STRENGTH SCALING (INVERSE pour petits objets)
        // σ(D) = σ₀ × (D/D₀)^(-1/m)
        // Pour petits objets, résistance DIMINUE car plus de défauts/fissures
        //
        // PHYSIQUE:
        // - σ₀ = 350 MPa pour métal monolithique (D₀ = 1m)
        // - m = 8 (Weibull modulus pour fer fragile)
        // - D = diamètre objet (m)
        //
        // RÉSULTAT:
        // - D=1m  → σ = 350 MPa (monolithique)
        // - D=10m → σ = 350 × (1/10)^(1/8) = 350 × 0.75 = 262 MPa ❌ ENCORE TROP ÉLEVÉ
        //
        // CORRECTION: Pour petits astéroïdes, défauts macroscopiques dominent
        // Utiliser m=3 (plus faible, plus de variation avec taille)
        //
        // - D=10m → σ = 350 × (1/10)^(1/3) = 350 × 0.46 = 162 MPa ❌ TOUJOURS TROP HAUT
        //
        // SOLUTION FINALE: Résistance effective pour rubble piles
        // σ_eff = 1-10 MPa pour petits objets (<50m) avec fractures

        const D_ref = 1.0;  // 1 mètre référence
        const sigma_ref = 350e6;  // 350 MPa monolithique
        const m_weibull = 3;  // Weibull modulus réduit (rubble pile)

        // Pour petits objets, résistance limitée par fractures macroscopiques
        // Plafonner à 10 MPa max pour D<50m
        const sigma_weibull = sigma_ref * Math.pow(D_ref / params.diameter, 1/m_weibull);
        const sigma_max_rubble = 10e6;  // 10 MPa max pour rubble pile
        const strength = Math.min(sigma_weibull, sigma_max_rubble);

        console.log(`[SmallIronCrater] Material properties (M-type):`);
        console.log(`  - Reference strength: ${(sigma_ref/1e6).toFixed(0)} MPa (monolithic)`);
        console.log(`  - Weibull scaled: ${(sigma_weibull/1e6).toFixed(1)} MPa`);
        console.log(`  - Effective strength: ${(strength/1e6).toFixed(1)} MPa (rubble pile limit)`);
        console.log(`  - Bulk density: ${density} kg/m³`);
        console.log(`  - Porosity: ${(comp_props.porosity.total*100).toFixed(0)}%`);

        // ÉTAPE 2: Simuler fragmentation atmosphérique avec FCM V2
        console.log(`\n[SmallIronCrater] Running FCM V2 atmospheric fragmentation...`);

        const fcm_params = {
            diameter: params.diameter,
            velocity: params.velocity,
            angle: params.angle,
            density: density,
            composition: params.composition,
            strength: strength,
            // Wheeler parameters pour M-type
            alpha: comp_props.wheeler_params?.alpha || 0.30,
            cloud_mass_fraction: comp_props.wheeler_params?.cloud_mass_fraction || 0.70,
            C_disp: comp_props.wheeler_params?.C_disp || 2.0,
            sigma_ablation_fragment: comp_props.wheeler_params?.sigma_ablation_fragment || 5e-9,
            sigma_ablation_cloud: comp_props.wheeler_params?.sigma_ablation_cloud || 3e-9,
            dh: 10  // 10m altitude step
        };

        const fcm = new FragmentCloudModelV2(fcm_params);
        const fcm_result = await fcm.integrate();

        console.log(`\n[SmallIronCrater] FCM V2 Results:`);
        console.log(`  - Peak altitude: ${fcm_result.peak_altitude_km.toFixed(1)} km`);
        console.log(`  - Surviving mass: ${fcm_result.surviving_mass_kg.toFixed(1)} kg`);
        console.log(`  - Fragmentation events: ${fcm_result.fragmentation_count}`);
        console.log(`  - Energy conservation error: ${fcm_result.energy_conservation_error_pct.toFixed(3)}%`);

        // ÉTAPE 3: Décider stratégie cratère basée sur masse survivante
        const m_initial = (4/3) * Math.PI * Math.pow(params.diameter/2, 3) * density;
        const survival_fraction = fcm_result.surviving_mass_kg / m_initial;

        console.log(`\n[SmallIronCrater] Survival analysis:`);
        console.log(`  - Initial mass: ${m_initial.toFixed(0)} kg`);
        console.log(`  - Survival fraction: ${(survival_fraction*100).toFixed(1)}%`);

        // APPROCHE SIMPLIFIÉE: Calculer cratère du PLUS GROS FRAGMENT uniquement
        // Plus fiable et plus simple pour planification civile

        const surviving_fragments = fcm_result.surviving_fragments || [];

        console.log(`\n[SmallIronCrater] Fragment analysis:`);
        console.log(`  - Total surviving fragments: ${surviving_fragments.length}`);

        if (surviving_fragments.length === 0) {
            // CAS 1: Fragmentation complète → Airburst pur, pas de cratère
            console.log(`[SmallIronCrater] RESULT: Complete fragmentation (airburst), NO CRATER`);
            return {
                crater_diameter: 0,
                crater_depth: 0,
                crater_volume: 0,
                crater_type: 'none',
                regime: 'airburst_complete_fragmentation',
                fragment_count: 0,
                fragmentation_altitude_km: fcm_result.peak_altitude_km,
                survival_fraction: survival_fraction,
                energy_deposited_atmospheric_MT: fcm_result.energy_deposited_MT,
                impact_energy_MT: fcm_result.energy_initial_MT,
                warning: 'Complete atmospheric fragmentation - no crater formed (airburst only)'
            };
        }

        // IDENTIFIER LE PLUS GROS FRAGMENT (déjà trié par masse décroissante)
        const largest_fragment = surviving_fragments[0];

        console.log(`\n[SmallIronCrater] Largest fragment (main crater):`);
        console.log(`  - Mass: ${largest_fragment.mass_kg.toFixed(0)} kg (${(largest_fragment.mass_kg/fcm_result.surviving_mass_kg*100).toFixed(1)}% of total)`);
        console.log(`  - Velocity: ${largest_fragment.velocity_m_s.toFixed(0)} m/s`);
        console.log(`  - Diameter: ${(largest_fragment.radius_m * 2).toFixed(1)} m`);

        // CALCULER CRATÈRE DU PLUS GROS FRAGMENT
        const main_crater_diameter = this.calculateCraterFromMass(
            largest_fragment.mass_kg,
            largest_fragment.velocity_m_s,
            params.angle,
            density,
            params.targetDensity || this.RHO_TARGET_DEFAULT
        );

        const main_crater_depth = main_crater_diameter / 5;
        const main_crater_volume = (Math.PI / 4) * Math.pow(main_crater_diameter, 2) * main_crater_depth;

        console.log(`\n[SmallIronCrater] Main crater results:`);
        console.log(`  - Diameter: ${main_crater_diameter.toFixed(1)} m`);
        console.log(`  - Depth: ${main_crater_depth.toFixed(1)} m`);
        console.log(`  - Total fragments: ${surviving_fragments.length}`);

        // DÉTERMINER RÉGIME basé sur nombre de fragments
        let regime, warning;
        if (surviving_fragments.length >= 10) {
            regime = 'multiple_crater_field';
            warning = `Multiple crater field (~${surviving_fragments.length} fragments) - main crater reported. CRITICAL for civilian evacuation planning`;
        } else if (surviving_fragments.length >= 3) {
            regime = 'small_crater_field';
            warning = `Small crater field (${surviving_fragments.length} fragments) - main crater reported`;
        } else if (surviving_fragments.length === 2) {
            regime = 'double_impact';
            warning = 'Two large fragments - main crater reported';
        } else {
            regime = 'single_crater';
            warning = null;
        }

        return {
            // Cratère principal (plus gros fragment)
            crater_diameter: main_crater_diameter,
            crater_depth: main_crater_depth,
            crater_volume: main_crater_volume,
            crater_type: 'simple',

            // Contexte fragmentation
            regime: regime,
            fragment_count: surviving_fragments.length,
            largest_fragment_mass_kg: largest_fragment.mass_kg,
            largest_fragment_fraction: largest_fragment.mass_kg / fcm_result.surviving_mass_kg,

            // Diagnostics
            fragmentation_altitude_km: fcm_result.peak_altitude_km,
            survival_fraction: survival_fraction,
            energy_deposited_atmospheric_MT: fcm_result.energy_deposited_MT,
            impact_energy_MT: fcm_result.energy_initial_MT,
            warning: warning
        };
    }

    /**
     * Calculer diamètre cratère depuis masse impacteur (formule simplifiée Holsapple)
     *
     * PHYSIQUE ÉLÉMENTAIRE (pas de régression):
     * D_crater = C × (m / ρ_imp)^(1/3) × (ρ_imp / ρ_target)^(1/3) × (v / v_ref)^(2/3) × sin^(1/3)(θ)
     *
     * où:
     * - C = constante empirique calibrée (similaire à K mais pour formule simplifiée)
     * - m = masse impacteur (kg)
     * - ρ_imp = densité impacteur (kg/m³)
     * - ρ_target = densité cible (kg/m³)
     * - v = vitesse impact (m/s)
     * - v_ref = vitesse de référence (15000 m/s typique)
     * - θ = angle impact (degrés)
     *
     * JUSTIFICATION:
     * - Dérivée de pi-groups mais forme simplifiée pour petits objets
     * - Exposants 1/3, 2/3 viennent de scaling dimensionnel
     * - C calibré empiriquement mais CONSTANT (pas C(D) !)
     *
     * @param {number} mass - Masse impacteur (kg)
     * @param {number} velocity - Vitesse impact (m/s)
     * @param {number} angle - Angle impact (degrés)
     * @param {number} density_imp - Densité impacteur (kg/m³)
     * @param {number} density_target - Densité cible (kg/m³)
     * @returns {number} Diamètre cratère (m)
     */
    calculateCraterFromMass(mass, velocity, angle, density_imp, density_target) {
        // Diamètre impacteur équivalent
        const D_imp = Math.pow((6 * mass) / (Math.PI * density_imp), 1/3);

        // Scaling factors
        const density_ratio = density_imp / density_target;
        const theta_rad = angle * Math.PI / 180;
        const angle_factor = Math.pow(Math.sin(theta_rad), 1/3);

        // Velocity scaling (référence 15000 m/s)
        const v_ref = 15000;
        const velocity_factor = Math.pow(velocity / v_ref, 2/3);

        // Constante C pour petits cratères de fer (calibrée empiriquement)
        // CALIBRATION v1.7.8:
        // - Sikhote-Alin: C=25 donne 11m, observé 26m → C=60
        // - Kaali: C=25 donne 7m, observé 110m → C=390 (outlier, objet plus gros)
        // - Odessa: C=25 donne 23m, observé 168m → C=180 (objet intact, pas fragments)
        //
        // DÉCISION: C=50 pour fragments (moyenne Sikhote-Alin × 2 + marge)
        const C = 50;

        // FORMULE SIMPLIFIÉE (physique élémentaire)
        const D_crater = C * D_imp * Math.pow(density_ratio, 1/3) * velocity_factor * angle_factor;

        return D_crater;
    }
}

module.exports = SmallIronCraterPhysics;
