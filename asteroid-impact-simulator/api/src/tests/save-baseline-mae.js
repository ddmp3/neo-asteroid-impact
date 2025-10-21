/**
 * SAVE BASELINE MAE - Phase 0 Preparation
 *
 * Runs crater validation and saves results to JSON for future comparison
 * This establishes the v2.0.6-optimized baseline before Holsapple integration
 *
 * Usage: node src/tests/save-baseline-mae.js [--local]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASELINE_DIR = path.join(__dirname, '../../baselines');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const VERSION = 'v2.0.6-optimized';

// Ensure baselines directory exists
if (!fs.existsSync(BASELINE_DIR)) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
}

console.log(`\n${'='.repeat(80)}`);
console.log(`SAVE BASELINE MAE - ${VERSION}`);
console.log(`${'='.repeat(80)}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`Output directory: ${BASELINE_DIR}\n`);

try {
    // Run the validation script and capture output
    console.log('Running crater validation...\n');

    const args = process.argv.slice(2).join(' ');
    const command = `node ${path.join(__dirname, 'validate-craters-v1.6.33.js')} ${args} --json`;

    console.log(`Command: ${command}\n`);

    const output = execSync(command, {
        cwd: path.join(__dirname, '../..'),
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    // Try to find JSON in the output
    const lines = output.split('\n');
    let jsonOutput = null;

    // Look for JSON block in output
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('{') && line.includes('"version"')) {
            try {
                jsonOutput = JSON.parse(line);
                break;
            } catch (e) {
                // Try multiline JSON
                let jsonStr = line;
                for (let j = i + 1; j < lines.length; j++) {
                    jsonStr += '\n' + lines[j];
                    try {
                        jsonOutput = JSON.parse(jsonStr);
                        break;
                    } catch (e2) {
                        // Continue
                    }
                }
                if (jsonOutput) break;
            }
        }
    }

    if (!jsonOutput) {
        console.error('Warning: Could not find JSON output in validation script');
        console.error('Creating baseline from raw output...\n');

        // Parse text output manually
        const mae_match = output.match(/MAE GLOBAL:\s+(\d+\.?\d*)/);
        const iron_match = output.match(/Iron impacts:\s+(\d+\.?\d*)/);
        const rocky_match = output.match(/Rocky impacts:\s+(\d+\.?\d*)/);
        const bias_match = output.match(/Biais systématique:\s+(-?\d+\.?\d*)/);

        jsonOutput = {
            version: VERSION,
            timestamp: new Date().toISOString(),
            summary: {
                mae_global: mae_match ? parseFloat(mae_match[1]) : null,
                mae_iron: iron_match ? parseFloat(iron_match[1]) : null,
                mae_rocky: rocky_match ? parseFloat(rocky_match[1]) : null,
                systematic_bias: bias_match ? parseFloat(bias_match[1]) : null,
                total_craters: 20,
                successful_predictions: null,
                failed_predictions: null
            },
            raw_output: output
        };
    }

    // Add metadata
    jsonOutput.version = VERSION;
    jsonOutput.saved_at = new Date().toISOString();
    jsonOutput.git_tag = 'v2.0.6-optimized-baseline';
    jsonOutput.phase = 'Phase 0 - Baseline before Holsapple integration';

    // Save to timestamped file
    const filename = `baseline-${VERSION}-${TIMESTAMP}.json`;
    const filepath = path.join(BASELINE_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(jsonOutput, null, 2));

    console.log(`✅ Baseline saved to: ${filepath}`);

    // Also save to "latest" symlink
    const latestPath = path.join(BASELINE_DIR, 'baseline-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(jsonOutput, null, 2));

    console.log(`✅ Latest baseline: ${latestPath}`);

    // Print summary
    console.log(`\n${'='.repeat(80)}`);
    console.log(`BASELINE SUMMARY`);
    console.log(`${'='.repeat(80)}`);

    if (jsonOutput.summary) {
        console.log(`MAE Global: ${jsonOutput.summary.mae_global}%`);
        console.log(`MAE Iron: ${jsonOutput.summary.mae_iron}%`);
        console.log(`MAE Rocky: ${jsonOutput.summary.mae_rocky}%`);
        console.log(`Systematic Bias: ${jsonOutput.summary.systematic_bias}%`);
        console.log(`Success Rate: ${jsonOutput.summary.successful_predictions}/${jsonOutput.summary.total_craters}`);
    }

    console.log(`\n✅ Baseline saved successfully!`);
    console.log(`\nNext step: Run compare-mae.js after implementing Holsapple π-groups\n`);

} catch (error) {
    console.error('\n❌ Error running validation script:');
    console.error(error.message);

    if (error.stdout) {
        console.error('\nScript output:');
        console.error(error.stdout.toString());
    }

    if (error.stderr) {
        console.error('\nError output:');
        console.error(error.stderr.toString());
    }

    process.exit(1);
}
