/**
 * COMPARE MAE - Validation Comparison Tool
 *
 * Compares MAE results between baseline and current version
 * Used to validate improvements after Holsapple π-groups integration
 *
 * Usage: node src/tests/compare-mae.js [baseline_file] [current_file]
 *        node src/tests/compare-mae.js (uses defaults)
 */

const fs = require('fs');
const path = require('path');

// Default paths
const BASELINE_DIR = path.join(__dirname, '../../baselines');
const DEFAULT_BASELINE = path.join(BASELINE_DIR, 'baseline-v2.0.6-optimized.json');

function loadBaseline(filename) {
    if (!fs.existsSync(filename)) {
        console.error(`❌ Error: Baseline file not found: ${filename}`);
        process.exit(1);
    }

    try {
        const content = fs.readFileSync(filename, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`❌ Error parsing baseline file: ${error.message}`);
        process.exit(1);
    }
}

function calculateImprovement(baseline, current) {
    const improvement = baseline - current;
    const percent_change = (improvement / baseline) * 100;
    const sign = improvement > 0 ? '↓' : '↑';
    const color = improvement > 0 ? '✅' : '❌';
    return {
        improvement,
        percent_change,
        sign,
        color,
        baseline,
        current
    };
}

function printComparison(baseline, current) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`MAE COMPARISON - Baseline vs Current`);
    console.log(`${'='.repeat(80)}\n`);

    console.log(`Baseline: ${baseline.version} (${baseline.git_tag || 'no tag'})`);
    console.log(`   Date: ${baseline.timestamp}`);
    console.log(`   Phase: ${baseline.phase}`);

    if (current) {
        console.log(`\nCurrent: ${current.version || 'unknown'} (${current.git_tag || 'no tag'})`);
        console.log(`   Date: ${current.timestamp || 'unknown'}`);
        console.log(`   Phase: ${current.phase || 'unknown'}`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`SUMMARY METRICS`);
    console.log(`${'='.repeat(80)}\n`);

    const metrics = [
        {
            name: 'MAE Global',
            baseline: baseline.summary.mae_global,
            current: current ? current.summary.mae_global : null
        },
        {
            name: 'MAE Iron',
            baseline: baseline.summary.mae_iron,
            current: current ? current.summary.mae_iron : null
        },
        {
            name: 'MAE Rocky',
            baseline: baseline.summary.mae_rocky,
            current: current ? current.summary.mae_rocky : null
        },
        {
            name: 'Systematic Bias',
            baseline: Math.abs(baseline.summary.systematic_bias),
            current: current ? Math.abs(current.summary.systematic_bias) : null,
            lower_is_better: true
        }
    ];

    console.log(`${'Metric'.padEnd(25)} ${'Baseline'.padStart(12)} ${'Current'.padStart(12)} ${'Change'.padStart(12)} ${'Status'}`);
    console.log('-'.repeat(80));

    let total_improvement = 0;
    let metrics_count = 0;

    for (const metric of metrics) {
        const baseline_str = `${metric.baseline.toFixed(2)}%`;
        const current_str = metric.current !== null ? `${metric.current.toFixed(2)}%` : 'N/A';

        if (metric.current !== null) {
            const result = calculateImprovement(metric.baseline, metric.current);
            const change_str = `${result.sign}${Math.abs(result.improvement).toFixed(2)}%`;
            const percent_str = `(${result.sign}${Math.abs(result.percent_change).toFixed(1)}%)`;

            console.log(
                `${metric.name.padEnd(25)} ${baseline_str.padStart(12)} ${current_str.padStart(12)} ${change_str.padStart(12)} ${result.color} ${percent_str}`
            );

            total_improvement += result.improvement;
            metrics_count++;
        } else {
            console.log(
                `${metric.name.padEnd(25)} ${baseline_str.padStart(12)} ${current_str.padStart(12)} ${'N/A'.padStart(12)}`
            );
        }
    }

    if (metrics_count > 0) {
        const avg_improvement = total_improvement / metrics_count;
        console.log('-'.repeat(80));
        console.log(`Average improvement: ${avg_improvement > 0 ? '↓' : '↑'}${Math.abs(avg_improvement).toFixed(2)}%`);
    }

    // Success rate comparison
    if (current) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`SUCCESS RATE`);
        console.log(`${'='.repeat(80)}\n`);

        const baseline_success = baseline.summary.successful_predictions || 0;
        const baseline_total = baseline.summary.total_craters || 20;
        const current_success = current.summary.successful_predictions || 0;
        const current_total = current.summary.total_craters || 20;

        console.log(`Baseline: ${baseline_success}/${baseline_total} (${(baseline_success/baseline_total*100).toFixed(1)}%)`);
        console.log(`Current:  ${current_success}/${current_total} (${(current_success/current_total*100).toFixed(1)}%)`);

        const success_improvement = current_success - baseline_success;
        if (success_improvement > 0) {
            console.log(`✅ Improvement: +${success_improvement} successful predictions`);
        } else if (success_improvement < 0) {
            console.log(`❌ Regression: ${success_improvement} successful predictions`);
        } else {
            console.log(`→ No change in success rate`);
        }
    }

    // Target comparison
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TARGET ACHIEVEMENT`);
    console.log(`${'='.repeat(80)}\n`);

    if (baseline.target_after_holsapple && current) {
        console.log(`Phase 1 Targets (After Holsapple π-groups):`);
        console.log(`   MAE Global: ${current.summary.mae_global.toFixed(2)}% ${current.summary.mae_global < 25 ? '✅' : '❌'} <25%`);
        console.log(`   MAE Iron:   ${current.summary.mae_iron.toFixed(2)}% ${current.summary.mae_iron < 40 ? '✅' : '❌'} <40%`);
        console.log(`   MAE Rocky:  ${current.summary.mae_rocky.toFixed(2)}% ${current.summary.mae_rocky < 20 ? '✅' : '❌'} <20%`);
    }

    if (baseline.final_target_v2_1_0 && current) {
        console.log(`\nFinal v2.1.0 Targets (After all phases):`);
        console.log(`   MAE Global: ${current.summary.mae_global.toFixed(2)}% ${current.summary.mae_global < 15 ? '✅' : '❌'} <15%`);
        console.log(`   MAE Iron:   ${current.summary.mae_iron.toFixed(2)}% ${current.summary.mae_iron < 25 ? '✅' : '❌'} <25%`);
        console.log(`   MAE Rocky:  ${current.summary.mae_rocky.toFixed(2)}% ${current.summary.mae_rocky < 12 ? '✅' : '❌'} <12%`);
    }

    console.log(`\n${'='.repeat(80)}\n`);
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node src/tests/compare-mae.js [baseline_file] [current_file]

Options:
  baseline_file   Path to baseline JSON file (default: baselines/baseline-v2.0.6-optimized.json)
  current_file    Path to current results JSON file (required for comparison)

Examples:
  # Compare with current results
  node src/tests/compare-mae.js baselines/baseline-v2.0.6-optimized.json baselines/baseline-v2.1.0-phase1.json

  # View baseline only
  node src/tests/compare-mae.js

  # Use custom baseline
  node src/tests/compare-mae.js my-baseline.json current-results.json
`);
    process.exit(0);
}

const baseline_file = args[0] || DEFAULT_BASELINE;
const current_file = args[1] || null;

const baseline = loadBaseline(baseline_file);
const current = current_file ? loadBaseline(current_file) : null;

printComparison(baseline, current);

if (!current) {
    console.log(`\n💡 To compare with new results, run:`);
    console.log(`   node src/tests/compare-mae.js ${baseline_file} <new_results.json>\n`);
}
