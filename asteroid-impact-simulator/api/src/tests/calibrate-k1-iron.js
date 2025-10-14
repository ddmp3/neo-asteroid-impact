#!/usr/bin/env node

/**
 * K1 CALIBRATION FOR IRON CRATERS
 *
 * Find optimal K1 coefficient for Holsapple pi-group formula
 * to minimize prediction error on train set.
 *
 * Method: Grid search over K1 ∈ [0.2, 0.8], step 0.05
 */

const PhysicsEngineIronV2 = require('../services/physicsEngineIronV2');
const CraterPiGroups = require('../services/craterPiGroups');

// Training set only (for calibration)
const TRAIN_SET = [
    {
        name: 'Barringer',
        D_obs: 1200,
        D_impactor: 50,
        velocity: 12800,
        angle: 80,
        density: 7870
    },
    {
        name: 'Odessa',
        D_obs: 168,
        D_impactor: 12,
        velocity: 14000,
        angle: 50,
        density: 7870
    },
    {
        name: 'Wabar',
        D_obs: 116,
        D_impactor: 10,
        velocity: 12000,
        angle: 45,
        density: 7870
    },
    {
        name: 'Henbury',
        D_obs: 180,
        D_impactor: 6,
        velocity: 15000,
        angle: 45,
        density: 7870
    },
    {
        name: 'Kaali',
        D_obs: 110,
        D_impactor: 4,
        velocity: 17000,
        angle: 45,
        density: 7870
    },
    {
        name: 'Wolfe Creek',
        D_obs: 892,
        D_impactor: 50,
        velocity: 17000,
        angle: 45,
        density: 7870
    }
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('K1 CALIBRATION FOR IRON CRATERS - Train Set');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Method: Grid search K1 ∈ [0.2, 0.8], step 0.05');
console.log('Metric: Mean Absolute Error (MAE)\n');

console.log('Current Holsapple K1 = 1.17 (for competent rock)');
console.log('Empirical estimate K1 ≈ 0.36 (from 3.26× overestimation)\n');

console.log('═══════════════════════════════════════════════════════════════\n');

const results = [];

// Grid search
for (let K1 = 0.20; K1 <= 0.80; K1 += 0.05) {
    const engine = new PhysicsEngineIronV2();

    // Directly modify the K1_GRAVITY in the craterFormation instance
    engine.craterFormation.K1_GRAVITY = K1;

    let totalError = 0;
    let validCount = 0;

    for (const crater of TRAIN_SET) {
        const result = engine.calculateIronCrater({
            diameter: crater.D_impactor,
            velocity: crater.velocity,
            angle: crater.angle,
            density: crater.density
        });

        if (!isNaN(result.diameter) && result.diameter > 0) {
            const error = Math.abs(result.diameter - crater.D_obs) / crater.D_obs * 100;
            totalError += error;
            validCount++;
        }
    }

    const MAE = validCount > 0 ? totalError / validCount : NaN;

    results.push({
        K1: K1.toFixed(2),
        MAE: MAE.toFixed(1),
        validCount: validCount
    });
}

// Sort by MAE
results.sort((a, b) => parseFloat(a.MAE) - parseFloat(b.MAE));

console.log('CALIBRATION RESULTS (sorted by MAE):');
console.log('─────────────────────────────────────');

results.slice(0, 15).forEach((r, i) => {
    const marker = i === 0 ? '✅' : i < 5 ? '⭐' : '  ';
    console.log(`${marker} K1 = ${r.K1}  →  MAE = ${r.MAE}%  (${r.validCount}/6 valid)`);
});

console.log('\n═══════════════════════════════════════════════════════════════');

const optimal = results[0];
console.log(`\nOPTIMAL K1 = ${optimal.K1}`);
console.log(`Train MAE = ${optimal.MAE}%`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('NEXT STEPS:');
console.log('  1. Update craterPiGroups.js: K1_GRAVITY = ' + optimal.K1);
console.log('  2. Run validate-iron-v2.js to test on test set');
console.log('  3. Expected test MAE: <30% (vs 71.71% baseline)');
console.log('═══════════════════════════════════════════════════════════════\n');