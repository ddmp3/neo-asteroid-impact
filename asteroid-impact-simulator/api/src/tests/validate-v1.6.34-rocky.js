#!/usr/bin/env node

/**
 * VALIDATION RAPIDE v1.6.34 - Rocky Craters Only
 *
 * Vérifier que la correction C=0.726 restaure la stabilité rocky:
 *   v1.6.33: 6.43% error ✅
 *   v1.7.1:  87.31% error ❌ (C=1.415 incohérence)
 *   v1.6.34: ~25% error ✓ (C=0.726 cohérent avec K=520)
 */

const PhysicsEngine = require('../services/physicsEngine');
const physicsEngine = new PhysicsEngine();

// TEST SET - Rocky craters only (never used for calibration)
const ROCKY_TEST_SET = [
    {
        name: 'Chicxulub',
        D_obs: 180000,     // 180 km
        impactorDiameter: 10000, // 10 km
        velocity: 20000,    // 20 km/s
        angle: 90,
        composition: 'rocky'
    },
    {
        name: 'Ries',
        D_obs: 24000,      // 24 km
        impactorDiameter: 1500, // 1.5 km
        velocity: 20000,
        angle: 90,
        composition: 'rocky'
    },
    {
        name: 'Bosumtwi',
        D_obs: 10500,      // 10.5 km
        impactorDiameter: 500,  // ~500m (estimate)
        velocity: 20000,
        angle: 90,
        composition: 'rocky'
    }
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('VALIDATION v1.6.34 STABLE - Rocky Craters Test Set');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('CORRECTIONS APPLIQUÉES:');
console.log('  1. C = 1.415 → 0.726 (cohérent avec K=520)');
console.log('  2. K_iron_large = 400 → 380 (v1.6.33 stable)');
console.log('  3. K_iron_small = -32+17.7×D → 140+4.8×D (v1.6.33)');
console.log('  4. K_rocky = 520 (stable)\n');

console.log('OBJECTIF:');
console.log('  Rocky error: 87.31% (v1.7.1) → <30% (v1.6.34)\n');

console.log('═══════════════════════════════════════════════════════════════\n');

let totalError = 0;
let totalLogError = 0;
const results = [];

async function validateRockyCraters() {
    for (const crater of ROCKY_TEST_SET) {
        // Calculate impact energy: E = 0.5 × m × v²
        const density = 3000; // rocky impactor density kg/m³
        const radius = crater.impactorDiameter / 2;
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        const mass = density * volume;
        const velocity_m_s = crater.velocity;
        const energy_joules = 0.5 * mass * velocity_m_s * velocity_m_s;

        const result = await physicsEngine.calculateCraterSize(
            energy_joules,      // energy in joules
            crater.angle,       // impact angle
            crater.composition, // impactor composition
            density,            // impactor density
            2500,               // target density
            crater.impactorDiameter,  // impactor diameter
            crater.velocity     // velocity m/s
        );

        const D_pred = result.diameter;
    const D_obs = crater.D_obs;

    const linearError = Math.abs(D_pred - D_obs) / D_obs * 100;
    const logError = Math.abs(Math.log10(D_pred) - Math.log10(D_obs));
    const ratio = D_pred / D_obs;

    totalError += linearError;
    totalLogError += logError;

    results.push({
        name: crater.name,
        D_obs: (D_obs/1000).toFixed(1),
        D_pred: (D_pred/1000).toFixed(1),
        linearError: linearError.toFixed(1),
        logError: logError.toFixed(3),
        ratio: ratio.toFixed(2)
    });

    const status = linearError < 30 ? '✓' : linearError < 50 ? '~' : '✗';

    console.log(`${crater.name.padEnd(15)} ${status}`);
    console.log(`  Observed:  ${(D_obs/1000).toFixed(1)} km`);
    console.log(`  Predicted: ${(D_pred/1000).toFixed(1)} km`);
    console.log(`  Linear error: ${linearError.toFixed(1)}%`);
    console.log(`  Log error: ${logError.toFixed(3)}`);
    console.log(`  Ratio: ${ratio.toFixed(2)}×\n`);
    }

    const avgLinearError = totalError / ROCKY_TEST_SET.length;
const avgLogError = totalLogError / ROCKY_TEST_SET.length;

console.log('═══════════════════════════════════════════════════════════════');
console.log('RÉSULTATS v1.6.34:');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`Mean Linear Error: ${avgLinearError.toFixed(2)}%`);
console.log(`Mean Log Error:    ${avgLogError.toFixed(3)}\n`);

console.log('COMPARAISON:');
console.log(`  v1.6.33: 6.43% ✅  (C=1.415 with K≈298)`);
console.log(`  v1.7.1:  87.31% ❌ (C=1.415 with K=520 - INCOHÉRENCE!)`);
console.log(`  v1.6.34: ${avgLinearError.toFixed(2)}% ${avgLinearError < 30 ? '✓' : avgLinearError < 50 ? '~' : '✗'}  (C=0.726 with K=520 - cohérent)\n`);

    if (avgLinearError < 30) {
        console.log('✅ VALIDATION RÉUSSIE: Error <30%, stable pour déploiement\n');
    } else if (avgLinearError < 50) {
        console.log('⚠️  ACCEPTABLE: Error <50%, amélioration significative vs v1.7.1\n');
    } else {
        console.log('❌ ÉCHEC: Error >50%, investigation nécessaire\n');
    }

    console.log('═══════════════════════════════════════════════════════════════');
}

validateRockyCraters().catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
});
