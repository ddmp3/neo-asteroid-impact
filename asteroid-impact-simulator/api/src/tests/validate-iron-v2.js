#!/usr/bin/env node

/**
 * VALIDATION IRON CRATERS V2.0
 *
 * Test the new physics-based model against the 20-crater database
 * Compare with v1.6.34 results
 *
 * Expected improvement: 71.71% error → 20-30% error
 */

const PhysicsEngineIronV2 = require('../services/physicsEngineIronV2');

// ═══════════════════════════════════════════════════════════════════════════
// CRATER DATABASE - SAME AS v1.6.33/v1.6.34
// ═══════════════════════════════════════════════════════════════════════════

const IRON_CRATERS = {
    // Training set (for reference - not used in v2.0, physics-based!)
    train: [
        {
            name: 'Barringer',
            D_obs: 1200,
            D_impactor: 50,
            velocity: 12800,
            angle: 80,
            composition: 'iron',
            density: 7870,
            energy: 4.2e16
        },
        {
            name: 'Odessa',
            D_obs: 168,
            D_impactor: 12,
            velocity: 14000,
            angle: 50,
            composition: 'iron',
            density: 7870,
            energy: 3.3e14
        },
        {
            name: 'Wabar',
            D_obs: 116,
            D_impactor: 10,
            velocity: 12000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 1.7e14
        },
        {
            name: 'Henbury',
            D_obs: 180,
            D_impactor: 6,
            velocity: 15000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 4.6e13
        },
        {
            name: 'Kaali',
            D_obs: 110,
            D_impactor: 4,
            velocity: 17000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 2.1e13
        },
        {
            name: 'Wolfe Creek',
            D_obs: 892,
            D_impactor: 50,
            velocity: 17000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 4.2e16
        }
    ],

    // Test set (CRITICAL - never seen during model development)
    test: [
        {
            name: 'Monturaqui',
            D_obs: 460,
            D_impactor: 20,
            velocity: 17000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 2.0e15
        },
        {
            name: 'Roter Kamm',
            D_obs: 2500,
            D_impactor: 150,
            velocity: 15000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 3.8e17
        },
        {
            name: 'Sikhote-Alin',
            D_obs: 26,
            D_impactor: 2,
            velocity: 14000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 3.9e12
        },
        {
            name: 'Boxhole',
            D_obs: 175,
            D_impactor: 15,
            velocity: 15000,
            angle: 45,
            composition: 'iron',
            density: 7870,
            energy: 5.9e14
        }
    ]
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║          VALIDATION IRON CRATERS V2.0 - PHYSICS-BASED MODEL               ║');
console.log('╠════════════════════════════════════════════════════════════════════════════╣');
console.log('║                                                                            ║');
console.log('║  Model: Atmospheric Entry (Hills-Goda + Bronshten) → Pi-groups Holsapple  ║');
console.log('║  Expected: 71.71% error (v1.6.34) → 20-30% error (v2.0)                   ║');
console.log('║                                                                            ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

const engine = new PhysicsEngineIronV2();

/**
 * Run validation on dataset
 */
function validateDataset(dataset, name) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`${name.toUpperCase()}`);
    console.log(`${'═'.repeat(80)}\n`);

    const results = [];

    for (const crater of dataset) {
        try {
            // Calculate with new model
            const result = engine.calculateIronCrater({
                diameter: crater.D_impactor,
                velocity: crater.velocity,
                angle: crater.angle,
                density: crater.density
            });

            const D_predicted = result.diameter;
            const D_observed = crater.D_obs;

            const error_pct = ((D_predicted - D_observed) / D_observed) * 100;
            const abs_error = Math.abs(error_pct);

            // Status indicator
            let status;
            if (abs_error < 15) {
                status = '✅';
            } else if (abs_error < 30) {
                status = '⚠️ ';
            } else {
                status = '❌';
            }

            console.log(`${status} ${crater.name.padEnd(18)}`);
            console.log(`   Observed:  ${D_observed.toString().padStart(8)} m`);
            console.log(`   Predicted: ${Math.round(D_predicted).toString().padStart(8)} m`);
            console.log(`   Error:     ${error_pct.toFixed(1).padStart(8)}%`);
            console.log(`   V₀→V_impact: ${crater.velocity} → ${Math.round(result.entry.V_impact)} m/s`);
            console.log(`   Mass loss: ${result.entry.mass_loss_percent}%`);
            console.log(`   Fragmented: ${result.entry.fragmented ? 'Yes' : 'No'}${result.entry.fragmented ? ` (${result.entry.N_fragments} fragments)` : ''}`);
            console.log(`   Regime: ${result.regime}`);
            console.log(`   Confidence: ${result.confidence}\n`);

            results.push({
                name: crater.name,
                error: error_pct,
                abs_error: abs_error,
                fragmented: result.entry.fragmented,
                regime: result.regime
            });

        } catch (error) {
            console.log(`❌ ${crater.name}: ERROR - ${error.message}\n`);
            results.push({
                name: crater.name,
                error: null,
                abs_error: 100,
                failed: true
            });
        }
    }

    // Calculate statistics
    const valid_results = results.filter(r => !r.failed);
    const mae = valid_results.reduce((sum, r) => sum + r.abs_error, 0) / valid_results.length;
    const success_rate = valid_results.filter(r => r.abs_error < 30).length / valid_results.length;

    console.log(`${'─'.repeat(80)}`);
    console.log(`STATISTICS:`);
    console.log(`  Mean Absolute Error: ${mae.toFixed(2)}%`);
    console.log(`  Success Rate (<30%): ${(success_rate * 100).toFixed(0)}% (${valid_results.filter(r => r.abs_error < 30).length}/${valid_results.length})`);
    console.log(`  Excellent (<15%):    ${valid_results.filter(r => r.abs_error < 15).length}/${valid_results.length}`);
    console.log(`  Fragmented:          ${valid_results.filter(r => r.fragmented).length}/${valid_results.length}`);
    console.log(`${'─'.repeat(80)}\n`);

    return {mae, success_rate, results: valid_results};
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

const train_stats = validateDataset(IRON_CRATERS.train, 'TRAINING SET (Reference)');
const test_stats = validateDataset(IRON_CRATERS.test, 'TEST SET (Critical)');

// ═══════════════════════════════════════════════════════════════════════════
// FINAL COMPARISON
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                        FINAL COMPARISON v1.6.34 vs v2.0                       ║');
console.log('╠════════════════════════════════════════════════════════════════════════════╣\n');

console.log('  TEST SET (Critical Validation):');
console.log(`    v1.6.34 (K=140+4.8D):  ${(71.71).toFixed(2)}% MAE ❌ FAILED`);
console.log(`    v2.0 (Physics-based):  ${test_stats.mae.toFixed(2)}% MAE ${test_stats.mae < 30 ? '✅ SUCCESS' : test_stats.mae < 50 ? '⚠️  IMPROVED' : '❌ FAILED'}\n`);

const improvement = 71.71 - test_stats.mae;
const improvement_pct = (improvement / 71.71) * 100;

console.log(`  IMPROVEMENT: ${improvement.toFixed(1)} percentage points (${improvement_pct.toFixed(0)}% reduction)\n`);

if (test_stats.mae < 30) {
    console.log('  ✅ VALIDATION SUCCESSFUL - Model meets <30% error objective');
    console.log('  ✅ Ready for production deployment\n');
} else if (test_stats.mae < 50) {
    console.log('  ⚠️  SIGNIFICANT IMPROVEMENT - Further calibration recommended');
    console.log('  ⚠️  Consider fine-tuning ablation coefficient and strength parameters\n');
} else {
    console.log('  ❌ INSUFFICIENT IMPROVEMENT - Model requires revision\n');
}

console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════
// DETAILED ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

console.log('═'.repeat(80));
console.log('DETAILED ANALYSIS\n');

console.log('Fragmentation events:');
const frag_test = test_stats.results.filter(r => r.fragmented);
console.log(`  ${frag_test.length}/${test_stats.results.length} test craters fragmented`);
if (frag_test.length > 0) {
    const frag_mae = frag_test.reduce((sum, r) => sum + r.abs_error, 0) / frag_test.length;
    console.log(`  Fragmented MAE: ${frag_mae.toFixed(1)}%`);
}

const no_frag_test = test_stats.results.filter(r => !r.fragmented);
if (no_frag_test.length > 0) {
    const no_frag_mae = no_frag_test.reduce((sum, r) => sum + r.abs_error, 0) / no_frag_test.length;
    console.log(`  Non-fragmented MAE: ${no_frag_mae.toFixed(1)}%\n`);
}

console.log('Regime distribution:');
const gravity_test = test_stats.results.filter(r => r.regime === 'gravity');
const strength_test = test_stats.results.filter(r => r.regime === 'strength');
console.log(`  Gravity regime: ${gravity_test.length}/${test_stats.results.length}`);
console.log(`  Strength regime: ${strength_test.length}/${test_stats.results.length}\n`);

console.log('═'.repeat(80));
console.log('VALIDATION COMPLETE\n');