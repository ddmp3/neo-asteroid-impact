/**
 * ANALYZE RESIDUALS - Error Pattern Analysis
 *
 * Analyzes prediction residuals to identify systematic biases
 * Helps understand which types of impacts have poor predictions
 *
 * Purpose:
 * - Detect systematic under/over-estimation
 * - Identify patterns by composition (iron, rocky, icy)
 * - Identify patterns by size, velocity, angle
 * - Guide Phase 1-4 improvements
 *
 * Usage: node src/tests/analyze-residuals.js [results.json]
 */

const fs = require('fs');
const path = require('path');

function loadResults(filename) {
    if (!fs.existsSync(filename)) {
        console.error(`❌ Error: Results file not found: ${filename}`);
        console.error(`\nPlease run validate-craters-v1.6.33.js first and save output to JSON\n`);
        process.exit(1);
    }

    try {
        const content = fs.readFileSync(filename, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`❌ Error parsing results file: ${error.message}`);
        process.exit(1);
    }
}

function analyzeResiduals(results) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`RESIDUAL ANALYSIS - ${results.version || 'Unknown Version'}`);
    console.log(`${'='.repeat(80)}\n`);

    if (!results.summary) {
        console.error('❌ Results file missing summary section');
        return;
    }

    const summary = results.summary;

    // Overall statistics
    console.log(`📊 OVERALL STATISTICS\n`);
    console.log(`MAE Global: ${summary.mae_global}%`);
    console.log(`Systematic Bias: ${summary.systematic_bias}%`);
    console.log(`Success Rate: ${summary.successful_predictions}/${summary.total_craters} (${(summary.successful_predictions/summary.total_craters*100).toFixed(1)}%)\n`);

    // Bias interpretation
    const bias = summary.systematic_bias;
    if (Math.abs(bias) < 5) {
        console.log(`✅ Bias Status: ACCEPTABLE (<5%)`);
        console.log(`   → Predictions are roughly balanced\n`);
    } else if (Math.abs(bias) < 10) {
        console.log(`⚠️  Bias Status: MODERATE (5-10%)`);
        console.log(`   → ${bias < 0 ? 'Under-estimation' : 'Over-estimation'} tendency\n`);
    } else {
        console.log(`❌ Bias Status: SEVERE (>10%)`);
        console.log(`   → Strong ${bias < 0 ? 'under-estimation' : 'over-estimation'} bias`);
        console.log(`   → Root cause analysis needed\n`);
    }

    // Composition breakdown
    console.log(`${'='.repeat(80)}`);
    console.log(`COMPOSITION BREAKDOWN\n`);

    console.log(`Iron Impacts:  ${summary.mae_iron}% MAE ${summary.mae_iron > 50 ? '❌ POOR' : summary.mae_iron > 30 ? '⚠️  FAIR' : '✅ GOOD'}`);
    console.log(`Rocky Impacts: ${summary.mae_rocky}% MAE ${summary.mae_rocky > 50 ? '❌ POOR' : summary.mae_rocky > 30 ? '⚠️  FAIR' : '✅ GOOD'}\n`);

    // Iron vs Rocky comparison
    const iron_rocky_diff = summary.mae_iron - summary.mae_rocky;
    console.log(`Iron vs Rocky Difference: ${iron_rocky_diff.toFixed(2)}%`);

    if (iron_rocky_diff > 20) {
        console.log(`❌ CRITICAL: Iron predictions much worse than rocky`);
        console.log(`   → K constants likely incorrect for iron`);
        console.log(`   → Density-dependent π₁ scaling missing?`);
    } else if (iron_rocky_diff > 10) {
        console.log(`⚠️  WARNING: Iron predictions worse than rocky`);
        console.log(`   → Check coupling efficiency for iron`);
    } else {
        console.log(`✅ Iron and rocky predictions similar`);
    }

    // Known problems from audit
    if (results.identified_problems) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`IDENTIFIED ROOT CAUSES\n`);

        for (let i = 0; i < results.identified_problems.length; i++) {
            const problem = results.identified_problems[i];
            console.log(`${i+1}. ${problem.problem}`);
            console.log(`   Impact: ${problem.impact}`);
            console.log(`   Fix: ${problem.fix}`);
            console.log(`   Phase: ${problem.phase}\n`);
        }
    }

    // Train/validation/test breakdown
    if (results.breakdown_by_split) {
        console.log(`${'='.repeat(80)}`);
        console.log(`TRAIN/VALIDATION/TEST SPLIT\n`);

        const splits = results.breakdown_by_split;

        console.log(`Training Set:   ${splits.training.mae}% MAE (${splits.training.count} craters)`);
        console.log(`Validation Set: ${splits.validation.mae}% MAE (${splits.validation.count} craters)`);
        console.log(`Test Set:       ${splits.test.mae}% MAE (${splits.test.count} craters)\n`);

        // Check for overfitting
        const train_test_gap = splits.test.mae - splits.training.mae;
        if (train_test_gap > 15) {
            console.log(`❌ OVERFITTING DETECTED: Test MAE much higher than training`);
            console.log(`   → Model may be calibrated to training craters`);
            console.log(`   → Switch to physics-based approach (Holsapple π-groups)\n`);
        } else if (train_test_gap > 5) {
            console.log(`⚠️  Moderate gap between training and test MAE`);
            console.log(`   → Some model-specific calibration present\n`);
        } else {
            console.log(`✅ No overfitting: Consistent performance across splits\n`);
        }
    }

    // Recommendations
    console.log(`${'='.repeat(80)}`);
    console.log(`RECOMMENDATIONS\n`);

    const recommendations = [];

    if (summary.mae_iron > 60) {
        recommendations.push({
            priority: 'HIGH',
            action: 'Fix K constants for iron impacts',
            details: 'Replace arbitrary K=380-650 with Holsapple π-groups (K=1.03)',
            expected_gain: '20-30 MAE points',
            phase: 'Phase 1'
        });
    }

    if (Math.abs(bias) > 20) {
        recommendations.push({
            priority: 'HIGH',
            action: 'Fix coupling efficiency formula',
            details: 'Replace linear 0.5+0.2×sin(θ) with Collins sin(θ)^(2/3)',
            expected_gain: '10-15 MAE points',
            phase: 'Phase 2'
        });
    }

    if (summary.mae_global > 40) {
        recommendations.push({
            priority: 'MEDIUM',
            action: 'Verify energy exponent',
            details: 'Check if E^0.25 should be E^0.217 (Holsapple) or E^0.294',
            expected_gain: '5-10 MAE points',
            phase: 'Phase 3 (optional)'
        });
    }

    if (summary.successful_predictions < summary.total_craters) {
        const failed = summary.total_craters - summary.successful_predictions;
        recommendations.push({
            priority: 'LOW',
            action: `Investigate ${failed} failed predictions`,
            details: 'Check for API timeouts, null responses, or edge cases',
            expected_gain: 'Improved reliability',
            phase: 'Debugging'
        });
    }

    for (const rec of recommendations) {
        console.log(`[${rec.priority}] ${rec.action}`);
        console.log(`   ${rec.details}`);
        console.log(`   Expected gain: ${rec.expected_gain}`);
        console.log(`   Phase: ${rec.phase}\n`);
    }

    if (recommendations.length === 0) {
        console.log(`✅ No critical issues detected\n`);
    }

    console.log(`${'='.repeat(80)}\n`);
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node src/tests/analyze-residuals.js [results.json]

Analyzes prediction residuals to identify systematic biases and guide improvements.

Arguments:
  results.json    Path to results JSON file (default: baselines/baseline-v2.0.6-optimized.json)

Examples:
  node src/tests/analyze-residuals.js baselines/baseline-v2.0.6-optimized.json
  node src/tests/analyze-residuals.js baselines/baseline-v2.1.0-phase1.json
`);
    process.exit(0);
}

const DEFAULT_RESULTS = path.join(__dirname, '../../baselines/baseline-v2.0.6-optimized.json');
const results_file = args[0] || DEFAULT_RESULTS;

const results = loadResults(results_file);
analyzeResiduals(results);
