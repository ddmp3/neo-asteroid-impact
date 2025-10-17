/**
 * Find Optimal Sigma for Sikhote-Alin
 *
 * Test différentes valeurs de σ pour trouver celle qui donne D_crater ≈ 26m
 *
 * v1.7.10 - Analyse sensitivité σ
 */

const SmallIronCraterPhysics = require('../services/smallIronCraterPhysics');

async function testSigma(sigma_MPa) {
    const physics = new SmallIronCraterPhysics();

    const params = {
        diameter: 10,
        velocity: 14000,
        angle: 45,
        density: 7800,
        composition: 'iron',
        strength_override: sigma_MPa * 1e6,  // Convert to Pa
        disable_monte_carlo: true  // Force deterministic
    };

    try {
        const result = await physics.calculateSmallIronCrater(params);
        return {
            sigma_MPa: sigma_MPa,
            crater_diameter: result.crater_diameter,
            fragment_count: result.fragment_count || 'N/A',
            survival_fraction: result.survival_fraction
        };
    } catch (error) {
        return {
            sigma_MPa: sigma_MPa,
            error: error.message
        };
    }
}

async function findOptimalSigma() {
    console.log('='.repeat(80));
    console.log('FINDING OPTIMAL SIGMA FOR SIKHOTE-ALIN');
    console.log('='.repeat(80));
    console.log('Target: D_crater ≈ 26m (observed)');
    console.log('Object: 10m iron at 14 km/s, 45°');
    console.log();

    const sigma_values = [
        5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120
    ];

    console.log('Testing σ values...\n');

    const results = [];

    for (const sigma of sigma_values) {
        process.stdout.write(`Testing σ = ${sigma} MPa... `);
        const result = await testSigma(sigma);

        if (result.error) {
            console.log(`ERROR: ${result.error}`);
        } else {
            const error = Math.abs(result.crater_diameter - 26) / 26 * 100;
            console.log(`D = ${result.crater_diameter.toFixed(1)}m (${error.toFixed(1)}% error)`);
            results.push({ ...result, error_pct: error });
        }
    }

    console.log();
    console.log('='.repeat(80));
    console.log('RESULTS SUMMARY:');
    console.log('='.repeat(80));
    console.log();

    // Sort by error
    results.sort((a, b) => a.error_pct - b.error_pct);

    console.log('┌──────────┬────────────┬───────────┬──────────────┐');
    console.log('│ σ (MPa)  │ D_crater   │ Error     │ Fragments    │');
    console.log('├──────────┼────────────┼───────────┼──────────────┤');

    for (const r of results) {
        const sigma_str = r.sigma_MPa.toString().padEnd(8);
        const diameter_str = `${r.crater_diameter.toFixed(1)}m`.padEnd(10);
        const error_str = `${r.error_pct.toFixed(1)}%`.padEnd(9);
        const fragments_str = r.fragment_count.toString().padEnd(12);

        const mark = r.error_pct < 10 ? '✅' : r.error_pct < 30 ? '⚠️ ' : '  ';

        console.log(`│ ${mark}${sigma_str} │ ${diameter_str} │ ${error_str} │ ${fragments_str} │`);
    }

    console.log('└──────────┴────────────┴───────────┴──────────────┘');
    console.log();

    const best = results[0];
    console.log(`BEST MATCH: σ = ${best.sigma_MPa} MPa`);
    console.log(`  Predicted: ${best.crater_diameter.toFixed(1)}m`);
    console.log(`  Observed: 26m`);
    console.log(`  Error: ${best.error_pct.toFixed(1)}%`);
    console.log(`  Fragments: ${best.fragment_count}`);
    console.log();

    console.log('='.repeat(80));
}

findOptimalSigma().catch(err => {
    console.error('ERROR:', err);
    console.error(err.stack);
    process.exit(1);
});
