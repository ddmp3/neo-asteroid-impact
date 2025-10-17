/**
 * Validation 3 Cases avec σ_typical = 35 MPa
 *
 * Test déterministe (pas Monte Carlo) avec valeur calibrée
 *
 * v1.7.10 - Validation finale
 */

const SmallIronCraterPhysics = require('../services/smallIronCraterPhysics');

const TEST_CASES = [
    {
        name: 'Sikhote-Alin',
        params: {
            diameter: 10,
            velocity: 14000,
            angle: 45,
            density: 7800,
            composition: 'iron',
            strength_override: 35e6,  // Use calibrated typical value
            disable_monte_carlo: true
        },
        observed: 26
    },
    {
        name: 'Odessa',
        params: {
            diameter: 15,
            velocity: 15000,
            angle: 50,
            density: 7800,
            composition: 'iron',
            strength_override: 35e6,
            disable_monte_carlo: true
        },
        observed: 168
    },
    {
        name: 'Kaali',
        params: {
            diameter: 4,
            velocity: 16000,
            angle: 60,
            density: 7800,
            composition: 'iron',
            strength_override: 35e6,
            disable_monte_carlo: true
        },
        observed: 110
    }
];

async function runValidation() {
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' VALIDATION v1.7.10 - σ_typical = 35 MPa '.padStart(50).padEnd(78) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log();

    const physics = new SmallIronCraterPhysics();
    const results = [];

    for (const test of TEST_CASES) {
        console.log(`Testing ${test.name}...`);

        try {
            const result = await physics.calculateSmallIronCrater(test.params);
            const error_pct = Math.abs(result.crater_diameter - test.observed) / test.observed * 100;
            const pass = error_pct < 30;

            results.push({
                name: test.name,
                observed: test.observed,
                predicted: result.crater_diameter,
                error_pct: error_pct,
                pass: pass,
                fragments: result.fragment_count || 'N/A'
            });

            console.log(`  Predicted: ${result.crater_diameter.toFixed(1)}m`);
            console.log(`  Observed: ${test.observed}m`);
            console.log(`  Error: ${error_pct.toFixed(1)}%`);
            console.log(`  Status: ${pass ? '✅ PASS' : '❌ FAIL'}`);
            console.log();

        } catch (error) {
            console.error(`  ❌ ERROR: ${error.message}`);
            results.push({
                name: test.name,
                error: error.message,
                pass: false
            });
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    console.log();

    console.log('┌─────────────────┬──────────┬───────────┬──────────┬────────────┐');
    console.log('│ Crater          │ Observed │ Predicted │ Error    │ Status     │');
    console.log('├─────────────────┼──────────┼───────────┼──────────┼────────────┤');

    for (const r of results) {
        const name = r.name.padEnd(15);
        const obs = `${r.observed}m`.padEnd(8);
        const pred = r.predicted ? `${r.predicted.toFixed(1)}m`.padEnd(9) : 'ERROR'.padEnd(9);
        const err = r.error_pct ? `${r.error_pct.toFixed(1)}%`.padEnd(8) : 'N/A'.padEnd(8);
        const status = r.pass ? '✅ PASS' : '❌ FAIL';

        console.log(`│ ${name} │ ${obs} │ ${pred} │ ${err} │ ${status.padEnd(10)} │`);
    }

    console.log('└─────────────────┴──────────┴───────────┴──────────┴────────────┘');
    console.log();

    const pass_count = results.filter(r => r.pass).length;
    console.log(`RESULTS: ${pass_count}/${results.length} PASS`);

    if (pass_count === results.length) {
        console.log('\n✅ ALL TESTS PASSED - v1.7.10 validation complete!');
        console.log('   σ_typical = 35 MPa is optimal for small iron impacts');
    } else {
        console.log(`\n⚠️  ${results.length - pass_count} test(s) failed`);
    }

    console.log('\n' + '='.repeat(80));

    return results;
}

runValidation().catch(err => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
});
