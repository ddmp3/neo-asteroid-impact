/**
 * VALIDATION RIGOUREUSE v1.7.0 - FORMULE PI-GROUPE COMPLÈTE
 *
 * Train/Test Split: 70% calibration / 30% validation indépendante
 *
 * RÈGLE: Calibrer C UNIQUEMENT sur TRAIN set
 *        Valider sur TEST set (JAMAIS VU pendant calibration)
 *
 * Objectif: Erreur <20% sur TEST set (preuve robustesse)
 */

const PhysicsEngine = require('../services/physicsEngine');

// ===========================================================================================
// BASE DE DONNÉES 20 CRATÈRES - TRAIN/TEST SPLIT
// ===========================================================================================

const CRATER_DATABASE = {
    // TRAIN SET (70% = 14 cratères) - Pour calibrer C
    train: [
        // Large Iron (3 cratères)
        {
            name: 'Barringer',
            D_obs: 1200,
            D_impactor: 50,
            velocity: 12800,
            angle: 80,
            composition: 'iron',
            density: 7870,
            energy: 4.2e16,
            reference: 'Kring (2007)'
        },
        {
            name: 'Wolfe Creek',
            D_obs: 892,
            D_impactor: 50,
            velocity: 17000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 4.2e16,
            reference: 'Shoemaker & Shoemaker (1996)'
        },
        {
            name: 'Roter Kamm',
            D_obs: 2500,
            D_impactor: 150,
            velocity: 15000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 3.8e17,
            reference: 'Koeberl et al. (1997)'
        },

        // Small Iron (3 cratères)
        {
            name: 'Odessa',
            D_obs: 168,
            D_impactor: 12,
            velocity: 14000,
            angle: 50,
            composition: 'iron',
            density: 7870,
            energy: 3.3e14,
            reference: 'Holliday & Weldon (2014)'
        },
        {
            name: 'Wabar',
            D_obs: 116,
            D_impactor: 10,
            velocity: 12000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 1.7e14,
            reference: 'Gnos et al. (2013)'
        },
        {
            name: 'Monturaqui',
            D_obs: 460,
            D_impactor: 20,
            velocity: 17000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 2.0e15,
            reference: 'Bunch & Cassidy (1972)'
        },

        // Tiny Iron (2 cratères)
        {
            name: 'Henbury',
            D_obs: 180,
            D_impactor: 6,
            velocity: 15000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 4.6e13,
            reference: 'Milton (1968)'
        },
        {
            name: 'Kaali',
            D_obs: 110,
            D_impactor: 6,
            velocity: 10000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 2.0e13,
            reference: 'Raukas (2000)'
        },

        // Giant Rocky (2 cratères)
        {
            name: 'Chicxulub',
            D_obs: 180000,
            D_impactor: 10000,
            velocity: 20000,
            angle: 60,
            composition: 'rocky',
            density: 3000,
            energy: 4.2e23,
            reference: 'Hildebrand et al. (1991)'
        },
        {
            name: 'Popigai',
            D_obs: 100000,
            D_impactor: 5000,
            velocity: 20000,
            angle: 45,
            composition: 'rocky',
            density: 3000,
            energy: 5.2e22,
            reference: 'Masaitis (1998)'
        },

        // Large Rocky (2 cratères)
        {
            name: 'Ries',
            D_obs: 24000,
            D_impactor: 1500,
            velocity: 20000,
            angle: 45,
            composition: 'rocky',
            density: 3000,
            energy: 1.9e21,
            reference: 'Stöffler et al. (2002)'
        },
        {
            name: 'Bosumtwi',
            D_obs: 10500,
            D_impactor: 500,
            velocity: 20000,
            angle: 45,
            composition: 'rocky',
            density: 3000,
            energy: 5.2e20,
            reference: 'Koeberl et al. (2007)'
        },

        // Small Rocky (2 cratères)
        {
            name: 'Lonar',
            D_obs: 1830,
            D_impactor: 60,
            velocity: 25000,
            angle: 45,
            composition: 'rocky',
            density: 3000,
            energy: 2.4e17,
            reference: 'Maloof et al. (2010)'
        },
        {
            name: 'Tenoumer',
            D_obs: 1900,
            D_impactor: 100,
            velocity: 20000,
            angle: 45,
            composition: 'rocky',
            density: 3000,
            energy: 4.2e17,
            reference: 'Paillou et al. (2003)'
        }
    ],

    // TEST SET (30% = 6 cratères) - JAMAIS VUS (validation indépendante)
    test: [
        // Iron Test (2 cratères)
        {
            name: 'Sikhote-Alin',
            D_obs: 26,
            D_impactor: 3,
            velocity: 14000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 1.0e13,
            reference: 'Krinov (1966)'
        },
        {
            name: 'Boxhole',
            D_obs: 175,
            D_impactor: 15,
            velocity: 14000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 6.1e14,
            reference: 'Milton (1968)'
        },

        // Rocky Test (4 cratères)
        {
            name: 'Manicouagan',
            D_obs: 100000,
            D_impactor: 5000,
            velocity: 20000,
            angle: 45,
            composition: 'rocky',
            density: 3000,
            energy: 5.2e22,
            reference: 'Grieve & Head (1983)'
        },
        {
            name: 'Clearwater West',
            D_obs: 36000,
            D_impactor: 2000,
            velocity: 20000,
            angle: 45,
            composition: 'rocky',
            density: 3000,
            energy: 4.2e21,
            reference: 'Dence (1965)'
        },
        {
            name: 'Rochechouart',
            D_obs: 23000,
            D_impactor: 1500,
            velocity: 20000,
            angle: 45,
            composition: 'rocky',
            density: 3000,
            energy: 1.9e21,
            reference: 'Lambert (2010)'
        },
        {
            name: 'Vredefort',
            D_obs: 300000,
            D_impactor: 15000,
            velocity: 20000,
            angle: 45,
            composition: 'rocky',
            density: 3000,
            energy: 1.9e24,
            reference: 'Therriault et al. (1997)'
        }
    ]
};

// ===========================================================================================
// VALIDATION FUNCTIONS
// ===========================================================================================

async function testCrater(crater, physicsEngine) {
    const result = await physicsEngine.calculateCraterSize(
        crater.energy,
        crater.angle,
        crater.composition,
        crater.density,
        2500, // targetDensity
        crater.D_impactor,
        crater.velocity
    );

    const D_calc = result.diameter;
    const D_obs = crater.D_obs;

    const error_linear = ((D_calc - D_obs) / D_obs) * 100;
    const error_log = Math.log10(D_calc / D_obs);

    return {
        name: crater.name,
        D_obs: D_obs,
        D_calc: D_calc.toFixed(0),
        error_linear_pct: error_linear.toFixed(1),
        error_log: error_log.toFixed(3),
        regime: result.regime || 'N/A',
        K_used: result.K_used ? result.K_used.toFixed(1) : 'N/A'
    };
}

async function validatePiGroup() {
    console.log('='.repeat(100));
    console.log('VALIDATION RIGOUREUSE v1.7.0 - FORMULE PI-GROUPE COMPLÈTE');
    console.log('Train/Test Split: 70% calibration / 30% validation indépendante');
    console.log('='.repeat(100));
    console.log();

    const physicsEngine = new PhysicsEngine();

    // ===========================================================================================
    // PHASE 1: TRAIN SET (14 cratères) - Vérifier calibration
    // ===========================================================================================

    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
    console.log('PHASE 1: TRAIN SET (14 cratères) - Calibration C = 1.4');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
    console.log();

    const train_results = [];
    for (const crater of CRATER_DATABASE.train) {
        const result = await testCrater(crater, physicsEngine);
        train_results.push(result);

        const status = Math.abs(parseFloat(result.error_linear_pct)) < 20 ? '✅' :
                       Math.abs(parseFloat(result.error_log)) < 0.9 ? '⚠️' : '❌';

        console.log(`${status} ${result.name.padEnd(20)} | Obs: ${String(result.D_obs).padStart(8)}m | Calc: ${String(result.D_calc).padStart(8)}m | Error: ${result.error_linear_pct.padStart(6)}% | Log: ${result.error_log.padStart(6)} | K: ${result.K_used} (${result.regime})`);
    }

    console.log();

    // Statistiques TRAIN
    const train_within_20 = train_results.filter(r => Math.abs(parseFloat(r.error_linear_pct)) < 20).length;
    const train_within_09 = train_results.filter(r => Math.abs(parseFloat(r.error_log)) < 0.9).length;

    console.log(`TRAIN SET PERFORMANCE:`);
    console.log(`  - ${train_within_20}/14 cratères (${(train_within_20/14*100).toFixed(0)}%) within 20% linear error`);
    console.log(`  - ${train_within_09}/14 cratères (${(train_within_09/14*100).toFixed(0)}%) within 0.9 log error`);
    console.log();

    // ===========================================================================================
    // PHASE 2: TEST SET (6 cratères) - VALIDATION INDÉPENDANTE
    // ===========================================================================================

    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
    console.log('PHASE 2: TEST SET (6 cratères) - VALIDATION INDÉPENDANTE (JAMAIS VUS)');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
    console.log();

    const test_results = [];
    for (const crater of CRATER_DATABASE.test) {
        const result = await testCrater(crater, physicsEngine);
        test_results.push(result);

        const status = Math.abs(parseFloat(result.error_linear_pct)) < 20 ? '✅' :
                       Math.abs(parseFloat(result.error_log)) < 0.9 ? '⚠️' : '❌';

        console.log(`${status} ${result.name.padEnd(20)} | Obs: ${String(result.D_obs).padStart(8)}m | Calc: ${String(result.D_calc).padStart(8)}m | Error: ${result.error_linear_pct.padStart(6)}% | Log: ${result.error_log.padStart(6)} | K: ${result.K_used} (${result.regime})`);
    }

    console.log();

    // Statistiques TEST
    const test_within_20 = test_results.filter(r => Math.abs(parseFloat(r.error_linear_pct)) < 20).length;
    const test_within_09 = test_results.filter(r => Math.abs(parseFloat(r.error_log)) < 0.9).length;

    console.log(`TEST SET PERFORMANCE (VALIDATION INDÉPENDANTE):`);
    console.log(`  - ${test_within_20}/6 cratères (${(test_within_20/6*100).toFixed(0)}%) within 20% linear error`);
    console.log(`  - ${test_within_09}/6 cratères (${(test_within_09/6*100).toFixed(0)}%) within 0.9 log error`);
    console.log();

    // ===========================================================================================
    // PHASE 3: CRITÈRES D'ACCEPTATION
    // ===========================================================================================

    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
    console.log('PHASE 3: CRITÈRES D\'ACCEPTATION');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
    console.log();

    const test_pass_20 = (test_within_20 / 6) >= 0.70; // 70% succès minimum
    const test_pass_09 = (test_within_09 / 6) >= 0.85; // 85% succès minimum

    console.log(`Critère 1: ≥70% cratères TEST within 20% linear error`);
    console.log(`  → Résultat: ${test_within_20}/6 = ${(test_within_20/6*100).toFixed(0)}% ${test_pass_20 ? '✅ PASS' : '❌ FAIL'}`);
    console.log();

    console.log(`Critère 2: ≥85% cratères TEST within 0.9 log error`);
    console.log(`  → Résultat: ${test_within_09}/6 = ${(test_within_09/6*100).toFixed(0)}% ${test_pass_09 ? '✅ PASS' : '❌ FAIL'}`);
    console.log();

    const global_pass = test_pass_20 && test_pass_09;

    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
    if (global_pass) {
        console.log('✅ VALIDATION RÉUSSIE - FORMULE PI-GROUPE ROBUSTE');
        console.log('   La formule généralise correctement sur cratères JAMAIS VUS');
        console.log('   → PRÊT POUR PRODUCTION v1.7.0');
    } else {
        console.log('❌ VALIDATION ÉCHOUÉE - OVERFITTING DÉTECTÉ');
        console.log('   La formule ne généralise pas sur cratères indépendants');
        console.log('   → CALIBRATION C À AJUSTER');
    }
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
}

// Exécuter validation
validatePiGroup().catch(err => {
    console.error('ERREUR:', err);
    process.exit(1);
});
