/**
 * Asteroid Composition Properties Database
 *
 * Compilation scientifique des propriétés physiques et mécaniques des astéroïdes
 * basée sur la littérature revue par les pairs (2002-2024)
 *
 * SOURCES PRINCIPALES:
 * 1. Pohl et al. (2020) - "Strengths of meteorites—An overview and analysis of available data"
 *    Meteoritics & Planetary Science, DOI: 10.1111/maps.13449
 *
 * 2. Carry (2012) - "Density of asteroids"
 *    Planetary and Space Science, DOI: 10.1016/j.pss.2012.03.009
 *
 * 3. Grott et al. (2020) - "Macroporosity and Grain Density of Rubble Pile Asteroid Ryugu"
 *    Journal of Geophysical Research: Planets, DOI: 10.1029/2020JE006519
 *
 * 4. Britt et al. (2002) - "Asteroid Density, Porosity, and Structure"
 *    Chapter in "Asteroids III"
 *
 * 5. Zhang et al. (2022) - "Cold Compaction and Macro-Porosity Removal in Rubble-Pile Asteroids"
 *    Journal of Geophysical Research: Planets, DOI: 10.1029/2022JE007342
 *
 * v1.7.6 - 2025-10-16
 */

/**
 * Classification des astéroïdes par structure interne:
 *
 * MONOLITH (0-10% porosité):
 * - Corps solide cohésif, peu ou pas de fractures
 * - Typique des petits astéroïdes non fragmentés ou météorites intacts
 *
 * CONSOLIDATED (10-25% porosité):
 * - Corps fortement fracturé mais maintenu par cohésion
 * - Fragments liés par résistance matérielle résiduelle
 * - Typique des grands astéroïdes différenciés (Vesta, Psyche)
 *
 * FRACTURED (25-35% porosité):
 * - Corps très fracturé, limite entre consolidé et rubble pile
 * - Quelque cohésion résiduelle mais structure affaiblie
 * - Zone de transition
 *
 * RUBBLE_PILE (35-50% porosité):
 * - Aggrégat gravitationnel de fragments
 * - Aucune cohésion matérielle, maintenu uniquement par gravité
 * - Résultat de réaccumulation post-collision catastrophique
 * - Typique des astéroïdes de taille moyenne (Itokawa, Bennu, Ryugu)
 */

const COMPOSITION_PROPERTIES = {
    // ========== TYPE C: CARBONACEOUS (Carboné) ==========
    //
    // DESCRIPTION:
    // - 75% des astéroïdes connus
    // - Riches en carbone, matière organique, silicates hydratés
    // - Analogues: Chondrites carbonées (CI, CM, CV, CO)
    // - Albédo très faible (<0.10)
    // - Localisation: Ceinture externe (>3.5 AU)
    //
    // EXEMPLES DOCUMENTÉS:
    // - (162173) Ryugu: C-type, densité 1.19 g/cm³, 50% porosité (rubble pile)
    // - (101955) Bennu: C-type, densité 1.26 g/cm³, 40-50% porosité (rubble pile)
    // - (253) Mathilde: C-type, densité 1.3 g/cm³, 50% porosité
    // - Tagish Lake (météorite, 2000): Carbonaceous, densité ~1.6 g/cm³
    //
    C_TYPE_CONSOLIDATED: {
        name: 'C-type (Carbonaceous) - Consolidated',
        taxonomy: 'C',
        description: 'Carbonaceous asteroid, heavily fractured but cohesive',

        // DENSITÉ (Carry 2012, Grott et al. 2020)
        density: {
            meteorite: 2300,      // kg/m³ - Densité grain (carbonaceous chondrite)
            bulk_typical: 1700,   // kg/m³ - Densité bulk typique (moyenne C-types)
            bulk_range: [1200, 2200],  // kg/m³ - Plage observée
            notes: 'CI/CM chondrites: 2.1-2.4 g/cm³ (grain), bulk reduced by porosity'
        },

        // POROSITÉ (Britt et al. 2002, Grott et al. 2020)
        porosity: {
            macro: 0.25,          // 25% - Macro-porosité typique (fractures, voids)
            micro: 0.10,          // 10% - Micro-porosité (pores dans grains)
            total: 0.35,          // 35% - Porosité totale
            structure: 'fractured',
            notes: 'C-complex average 25-30% macro-porosity (Carry 2012)'
        },

        // RÉSISTANCE MÉCANIQUE (Pohl et al. 2020)
        strength: {
            tensile: 1.0e6,       // Pa (1 MPa) - Résistance traction moyenne
            tensile_range: [0.7e6, 10e6],  // Pa - Plage mesurée
            compressive: 40e6,    // Pa (40 MPa) - Résistance compression
            compressive_range: [20e6, 90e6],  // Pa
            notes: 'Pohl et al. (2020): Carbonaceous chondrites very weak, σ₀ = 1-10 MPa (tensile)'
        },

        // PARAMÈTRES WHEELER FCM
        wheeler_params: {
            alpha: 0.38,          // Weibull modulus (Wheeler Case C)
            cloud_mass_fraction: 0.86,  // 86% masse → clouds après fragmentation
            C_disp: 2.0,          // Coefficient dispersion (réduit pour matériau faible)
            sigma_ablation_fragment: 1.5e-8,  // s²/m² - Ablation fragments (augmenté)
            sigma_ablation_cloud: 7e-9,       // s²/m² - Ablation clouds
            notes: 'Higher ablation than rocky due to volatile content'
        },

        references: [
            'Pohl et al. (2020) - Meteoritics & Planetary Science',
            'Carry (2012) - Density of asteroids',
            'Grott et al. (2020) - Ryugu macroporosity'
        ]
    },

    C_TYPE_RUBBLE_PILE: {
        name: 'C-type (Carbonaceous) - Rubble Pile',
        taxonomy: 'C',
        description: 'Carbonaceous asteroid, gravitational aggregate (no cohesion)',

        density: {
            meteorite: 2300,
            bulk_typical: 1300,   // kg/m³ - Densité réduite (rubble pile)
            bulk_range: [1100, 1600],
            notes: 'Ryugu: 1.19 g/cm³, Bennu: 1.26 g/cm³, Mathilde: 1.3 g/cm³'
        },

        porosity: {
            macro: 0.45,          // 45% - Très haute porosité
            micro: 0.10,
            total: 0.55,          // 55%
            structure: 'rubble_pile',
            notes: 'Post-catastrophic disruption: 40-50% macroporosity expected'
        },

        strength: {
            tensile: 0.0,         // Pa - AUCUNE cohésion (rubble pile)
            tensile_range: [0, 0],
            compressive: 0.0,     // Maintenu uniquement par gravité
            compressive_range: [0, 0],
            notes: 'Zero tensile strength - gravitational aggregate only'
        },

        wheeler_params: {
            alpha: 0.35,          // Weibull plus faible (matériau très fragmenté)
            cloud_mass_fraction: 0.90,  // 90% → clouds (désintégration plus complète)
            C_disp: 3.0,          // Dispersion élevée
            sigma_ablation_fragment: 2e-8,
            sigma_ablation_cloud: 1e-8,
            notes: 'Very weak structure, rapid disintegration expected'
        },

        references: [
            'Grott et al. (2020) - Ryugu: 50% porosity, 1.19 g/cm³',
            'Lauretta et al. (2019) - Bennu rubble pile structure'
        ]
    },

    // ========== TYPE S: STONY/SILICACEOUS (Rocheux) ==========
    //
    // DESCRIPTION:
    // - 17% des astéroïdes connus (2ème plus commun)
    // - Silicates de fer et magnésium, pyroxène, olivine
    // - Analogues: Chondrites ordinaires (H, L, LL)
    // - Albédo modéré (0.10-0.22)
    // - Localisation: Ceinture interne (<2.2 AU)
    //
    // EXEMPLES DOCUMENTÉS:
    // - (433) Eros: S-type, densité 2.67 g/cm³, 20% porosité (fractured)
    // - (25143) Itokawa: S-type, densité 1.9 g/cm³, 40% porosité (rubble pile)
    // - Chelyabinsk (2013): LL5 chondrite, densité ~3.3 g/cm³ (meteorite)
    //
    S_TYPE_CONSOLIDATED: {
        name: 'S-type (Stony) - Consolidated',
        taxonomy: 'S',
        description: 'Stony silicate asteroid, fractured but cohesive',

        // DENSITÉ (Carry 2012, Britt et al. 2002)
        density: {
            meteorite: 3500,      // kg/m³ - Ordinary chondrite grain density
            bulk_typical: 2700,   // kg/m³ - Bulk avec ~23% porosité
            bulk_range: [2400, 3200],
            notes: 'Ordinary chondrites (H/L/LL): 3.3-3.7 g/cm³ (grain), Eros: 2.67 g/cm³'
        },

        // POROSITÉ (Britt et al. 2002)
        porosity: {
            macro: 0.20,          // 20% - Eros: ~20% macro-porosity
            micro: 0.05,          // 5% - Faible micro-porosité
            total: 0.25,          // 25%
            structure: 'fractured',
            notes: 'S-types like Ida and Eros: ~20-30% porosity, fractured monolith'
        },

        // RÉSISTANCE MÉCANIQUE (Pohl et al. 2020)
        strength: {
            tensile: 20e6,        // Pa (20 MPa) - Résistance moyenne
            tensile_range: [18e6, 31e6],  // Pa - Plage ordinary chondrites
            compressive: 150e6,   // Pa (150 MPa)
            compressive_range: [105e6, 203e6],
            notes: 'Pohl et al. (2020): OC compression 105-203 MPa, tensile 18-31 MPa'
        },

        // PARAMÈTRES WHEELER FCM (Case C - calibré sur Chelyabinsk LL5)
        wheeler_params: {
            alpha: 0.38,          // Weibull modulus
            cloud_mass_fraction: 0.86,
            C_disp: 2.0,          // Dispersion modérée
            sigma_ablation_fragment: 1e-8,   // s²/m²
            sigma_ablation_cloud: 5e-9,
            notes: 'Wheeler Case C (macro-porosity) best fit for Chelyabinsk'
        },

        references: [
            'Pohl et al. (2020) - OC tensile/compressive strength',
            'Britt et al. (2002) - Eros 20% porosity',
            'Wheeler et al. (2017) - Table 2 Case C'
        ]
    },

    S_TYPE_RUBBLE_PILE: {
        name: 'S-type (Stony) - Rubble Pile',
        taxonomy: 'S',
        description: 'Stony asteroid, gravitational aggregate',

        density: {
            meteorite: 3500,
            bulk_typical: 2000,   // kg/m³ - Itokawa: 1.9 g/cm³
            bulk_range: [1800, 2300],
            notes: 'Itokawa (rubble pile S-type): 1.9 g/cm³, 40% porosity'
        },

        porosity: {
            macro: 0.40,          // 40% - Itokawa
            micro: 0.05,
            total: 0.45,
            structure: 'rubble_pile',
            notes: 'Rubble pile S-types: 30-40% porosity typical'
        },

        strength: {
            tensile: 0.0,         // Aucune cohésion
            tensile_range: [0, 0],
            compressive: 0.0,
            compressive_range: [0, 0],
            notes: 'Gravitational aggregate - no tensile strength'
        },

        wheeler_params: {
            alpha: 0.36,
            cloud_mass_fraction: 0.88,
            C_disp: 3.5,          // Dispersion élevée
            sigma_ablation_fragment: 1.2e-8,
            sigma_ablation_cloud: 6e-9,
            notes: 'Rubble pile fragments more easily than consolidated body'
        },

        references: [
            'Fujiwara et al. (2006) - Itokawa rubble pile',
            'Carry (2012) - S-type densities'
        ]
    },

    // ========== TYPE M: METALLIC (Métallique) ==========
    //
    // DESCRIPTION:
    // - ~8% des astéroïdes (X-complex includes M)
    // - Fer-nickel métallique (noyaux différenciés)
    // - Analogues: Météorites de fer (Fe-Ni, 5-11% Ni typique)
    // - Albédo modéré à élevé (0.10-0.30)
    // - Très haute densité
    //
    // EXEMPLES DOCUMENTÉS:
    // - (16) Psyche: M-type, densité 3.7-4.2 g/cm³ (incertain)
    // - Meteor Crater (Canyon Diablo): Iron meteorite, densité ~7.8 g/cm³
    // - Sikhote-Alin (1947): Iron IIAB, densité 7.8 g/cm³
    //
    M_TYPE_CONSOLIDATED: {
        name: 'M-type (Metallic) - Consolidated',
        taxonomy: 'M',
        description: 'Metallic iron-nickel asteroid, coherent body',

        // DENSITÉ (Carry 2012, iron meteorite data)
        density: {
            meteorite: 7800,      // kg/m³ - Iron meteorite (Fe-Ni)
            bulk_typical: 6500,   // kg/m³ - Avec ~15-20% porosité
            bulk_range: [5000, 7500],
            notes: 'Iron meteorites: 7.8 g/cm³, (16) Psyche: 3.7-4.2 g/cm³ (disputed, may be porous)'
        },

        // POROSITÉ (Highly uncertain for M-types)
        porosity: {
            macro: 0.15,          // 15% - Estimé (peu de données)
            micro: 0.02,          // 2% - Métaux peu poreux
            total: 0.17,
            structure: 'consolidated',
            notes: 'M-type porosity poorly constrained. Psyche lower than expected density.'
        },

        // RÉSISTANCE MÉCANIQUE (Kumamoto University 2021, Acta Mater. 2021)
        strength: {
            tensile: 350e6,       // Pa (350 MPa) - Yield strength kamacite
            tensile_range: [170e6, 800e6],  // Pa - Large range
            compressive: 500e6,   // Pa (500 MPa) - Estimé
            compressive_range: [430e6, 600e6],
            notes: 'Kumamoto: Kamacite 350 MPa, Taenite 935 MPa. Average ~400 MPa UTS for Fe-Ni.'
        },

        // PARAMÈTRES WHEELER FCM
        wheeler_params: {
            alpha: 0.42,          // Weibull plus élevé (matériau fort)
            cloud_mass_fraction: 0.60,  // 60% clouds (moins de désintégration)
            C_disp: 1.0,          // Dispersion faible (cohésion élevée)
            sigma_ablation_fragment: 5e-9,   // s²/m² - Ablation très faible
            sigma_ablation_cloud: 2e-9,
            notes: 'High strength metal, low ablation, fewer fragments expected'
        },

        references: [
            'Kumamoto University (2021) - Kamacite/Taenite mechanical properties',
            'Acta Materialia (2021) - Fe-Ni meteoritic alloys',
            'Carry (2012) - M-type densities'
        ]
    },

    // ========== TYPE P: PRIMITIVE (Organique riche) ==========
    //
    // DESCRIPTION:
    // - Très sombre, albédo <0.10
    // - Riche en matière organique (kerogen-like)
    // - Densité très faible (~1.3 g/cm³)
    // - Ceinture externe et Troyens
    //
    // EXEMPLES:
    // - (87) Sylvia: P-type, 1.3 g/cm³
    // - (107) Camilla: P-type, 1.3 g/cm³
    //
    P_TYPE: {
        name: 'P-type (Primitive) - Organic Rich',
        taxonomy: 'P',
        description: 'Very dark, organic-rich primitive asteroid',

        density: {
            meteorite: 2000,      // kg/m³ - Estimé (peu de données)
            bulk_typical: 1300,   // kg/m³ - Sylvia, Camilla
            bulk_range: [1200, 1500],
            notes: 'P-types very low density, lower than C-types. High porosity or ice content?'
        },

        porosity: {
            macro: 0.35,          // 35% - Estimé
            micro: 0.15,          // Haute micro-porosité (organics)
            total: 0.50,
            structure: 'rubble_pile',
            notes: 'Very porous structure inferred from low density'
        },

        strength: {
            tensile: 0.5e6,       // Pa (0.5 MPa) - Très faible (estimé)
            tensile_range: [0.3e6, 1e6],
            compressive: 15e6,    // Pa (15 MPa)
            compressive_range: [10e6, 30e6],
            notes: 'Weaker than C-types, high organic content reduces strength'
        },

        wheeler_params: {
            alpha: 0.33,
            cloud_mass_fraction: 0.92,
            C_disp: 4.0,
            sigma_ablation_fragment: 2.5e-8,
            sigma_ablation_cloud: 1.2e-8,
            notes: 'Very weak, high ablation due to volatile/organic content'
        },

        references: [
            'Carry (2012) - Sylvia and Camilla densities 1.3 g/cm³',
            'Lucy Mission - P-type taxonomy'
        ]
    },

    // ========== TYPE D: DARK PRIMITIVE (Probablement glacé) ==========
    //
    // DESCRIPTION:
    // - Très sombre, rouge
    // - Ceinture externe (>3.5 AU) et Troyens joviens
    // - Composition incertaine (glace? organics?)
    // - 8% des grands astéroïdes
    //
    D_TYPE: {
        name: 'D-type (Dark Primitive) - Possibly Icy',
        taxonomy: 'D',
        description: 'Very dark, red, outer belt/Trojans - icy composition suspected',

        density: {
            meteorite: 1500,      // kg/m³ - Très incertain
            bulk_typical: 1200,   // kg/m³ - Estimé (peu de mesures)
            bulk_range: [1000, 1500],
            notes: 'Very few density measurements. Low density suggests ice/organics.'
        },

        porosity: {
            macro: 0.40,
            micro: 0.20,          // Haute si contient glace
            total: 0.60,
            structure: 'rubble_pile',
            notes: 'High porosity expected, possibly ice-rich'
        },

        strength: {
            tensile: 0.3e6,       // Pa (0.3 MPa) - Très faible
            tensile_range: [0.1e6, 0.5e6],
            compressive: 10e6,    // Pa (10 MPa)
            compressive_range: [5e6, 20e6],
            notes: 'Very weak if ice-rich. Similar to comet nuclei?'
        },

        wheeler_params: {
            alpha: 0.30,
            cloud_mass_fraction: 0.95,
            C_disp: 5.0,
            sigma_ablation_fragment: 3e-8,
            sigma_ablation_cloud: 1.5e-8,
            notes: 'Very weak, rapid disintegration expected. High volatiles.'
        },

        references: [
            'Lucy Mission - D-type asteroids in outer belt',
            'Emery et al. (2015) - D/P-types possibly ice-rich'
        ]
    },

    // ========== TYPE V: BASALTIC (Vesta family) ==========
    //
    // DESCRIPTION:
    // - Basalte achondritique (crust différencié)
    // - Famille de Vesta (HED meteorites)
    // - Haute densité (~3.5 g/cm³)
    // - Albédo modéré
    //
    // EXEMPLE:
    // - (4) Vesta: V-type, densité 3.456 g/cm³
    //
    V_TYPE: {
        name: 'V-type (Basaltic) - Vesta Family',
        taxonomy: 'V',
        description: 'Basaltic achondrite, differentiated crust material',

        density: {
            meteorite: 3400,      // kg/m³ - HED meteorites (eucrite, diogenite)
            bulk_typical: 3200,   // kg/m³ - Vesta fragments
            bulk_range: [3000, 3500],
            notes: 'Vesta: 3.456 g/cm³. HED meteorites 3.3-3.5 g/cm³'
        },

        porosity: {
            macro: 0.10,          // 10% - Faible porosité
            micro: 0.03,
            total: 0.13,
            structure: 'consolidated',
            notes: 'Low porosity, coherent basaltic rock from differentiated parent'
        },

        strength: {
            tensile: 25e6,        // Pa (25 MPa) - Basalte terrestre analogue
            tensile_range: [20e6, 35e6],
            compressive: 200e6,   // Pa (200 MPa)
            compressive_range: [150e6, 300e6],
            notes: 'Similar to terrestrial basalt strength'
        },

        wheeler_params: {
            alpha: 0.40,
            cloud_mass_fraction: 0.80,
            C_disp: 1.5,
            sigma_ablation_fragment: 8e-9,
            sigma_ablation_cloud: 4e-9,
            notes: 'Strong coherent rock, low ablation'
        },

        references: [
            'Russell et al. (2012) - Dawn at Vesta',
            'Carry (2012) - Vesta density 3.456 g/cm³'
        ]
    }
};

/**
 * Fonction utilitaire: Sélectionner les paramètres de composition appropriés
 *
 * @param {string} composition - Type de composition ('rocky', 'carbonaceous', 'iron', etc.)
 * @param {number} [porosity] - Porosité estimée (0-1) si connue
 * @returns {object} Paramètres de composition
 */
function getCompositionParams(composition, porosity = null) {
    // Mapping composition simple → taxonomy détaillée
    const mapping = {
        'rocky': porosity && porosity > 0.35 ? 'S_TYPE_RUBBLE_PILE' : 'S_TYPE_CONSOLIDATED',
        'carbonaceous': porosity && porosity > 0.35 ? 'C_TYPE_RUBBLE_PILE' : 'C_TYPE_CONSOLIDATED',
        'iron': 'M_TYPE_CONSOLIDATED',
        'metallic': 'M_TYPE_CONSOLIDATED',
        'icy': 'D_TYPE',
        'organic': 'P_TYPE',
        'basaltic': 'V_TYPE',
        'primitive': 'P_TYPE'
    };

    const key = mapping[composition.toLowerCase()] || 'S_TYPE_CONSOLIDATED';
    return COMPOSITION_PROPERTIES[key];
}

/**
 * Fonction: Calculer densité bulk depuis densité grain et porosité
 *
 * ρ_bulk = ρ_grain × (1 - φ_total)
 *
 * @param {number} grain_density - Densité grain (kg/m³)
 * @param {number} porosity - Porosité totale (0-1)
 * @returns {number} Densité bulk (kg/m³)
 */
function calculateBulkDensity(grain_density, porosity) {
    return grain_density * (1 - porosity);
}

/**
 * Fonction: Estimer porosité depuis densités observées
 *
 * φ = 1 - (ρ_bulk / ρ_grain)
 *
 * @param {number} bulk_density - Densité bulk observée (kg/m³)
 * @param {number} grain_density - Densité grain (kg/m³)
 * @returns {number} Porosité totale (0-1)
 */
function calculatePorosity(bulk_density, grain_density) {
    return 1 - (bulk_density / grain_density);
}

module.exports = {
    COMPOSITION_PROPERTIES,
    getCompositionParams,
    calculateBulkDensity,
    calculatePorosity
};
