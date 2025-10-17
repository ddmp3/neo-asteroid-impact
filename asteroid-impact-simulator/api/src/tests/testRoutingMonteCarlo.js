/**
 * Test Routing + Monte Carlo System
 *
 * Teste les 3 cas historiques avec le nouveau système de décision physique:
 * - Sikhote-Alin: Fragmentation certaine → Monte Carlo
 * - Odessa: Fragmentation incertaine → Monte Carlo complet
 * - Kaali: Fragmentation certaine → Monte Carlo
 *
 * v1.7.9 - Validation système multi-route
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
            composition: 'iron'
        },
        observed: {
            diameter: 26,  // Largest crater
            confidence: 'HIGH'
        }
    },
    {
        name: 'Odessa',
        params: {
            diameter: 15,
            velocity: 15000,
            angle: 50,
            density: 7800,
            composition: 'iron'
        },
        observed: {
            diameter: 168,
            confidence: 'MEDIUM'
        }
    },
    {
        name: 'Kaali',
        params: {
            diameter: 4,
            velocity: 16000,
            angle: 60,
            density: 7800,
            composition: 'iron'
        },
        observed: {
            diameter: 110,
            confidence: 'MEDIUM'
        }
    }
];

async function runTests() {
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' ROUTING + MONTE CARLO VALIDATION '.padStart(45).padEnd(78) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log();

    const physics = new SmallIronCraterPhysics();

    const results = [];

    for (const test_case of TEST_CASES) {
        console.log('\n' + '='.repeat(80));
        console.log(`TEST CASE: ${test_case.name}`);
        console.log('='.repeat(80));

        try {
            const result = await physics.calculateSmallIronCrater(test_case.params);

            // Determine if within confidence interval
            let validation_status;
            if (result.monte_carlo) {
                const in_CI = (
                    test_case.observed.diameter >= result.crater_diameter_P10 &&
                    test_case.observed.diameter <= result.crater_diameter_P90
                );

                const error_median = Math.abs(result.crater_diameter - test_case.observed.diameter) / test_case.observed.diameter * 100;

                validation_status = {
                    method: 'Monte Carlo',
                    median: result.crater_diameter,
                    CI_80pct: [result.crater_diameter_P10, result.crater_diameter_P90],
                    observed: test_case.observed.diameter,
                    error_median_pct: error_median,
                    in_CI: in_CI,
                    pass: in_CI || error_median < 30
                };
            } else {
                const error_pct = Math.abs(result.crater_diameter - test_case.observed.diameter) / test_case.observed.diameter * 100;

                validation_status = {
                    method: 'Deterministic',
                    predicted: result.crater_diameter,
                    observed: test_case.observed.diameter,
                    error_pct: error_pct,
                    pass: error_pct < 30
                };
            }

            results.push({
                name: test_case.name,
                validation: validation_status,
                full_result: result
            });

            console.log('\n' + '-'.repeat(80));
            console.log('VALIDATION:');
            console.log('-'.repeat(80));
            console.log(`Method: ${validation_status.method}`);
            console.log(`Observed: ${test_case.observed.diameter} m`);

            if (validation_status.method === 'Monte Carlo') {
                console.log(`Predicted (median): ${validation_status.median.toFixed(1)} m`);
                console.log(`80% CI: [${validation_status.CI_80pct[0].toFixed(1)}, ${validation_status.CI_80pct[1].toFixed(1)}] m`);
                console.log(`Error (median): ${validation_status.error_median_pct.toFixed(1)}%`);
                console.log(`In 80% CI: ${validation_status.in_CI ? '✅ YES' : '❌ NO'}`);
                console.log(`Status: ${validation_status.pass ? '✅ PASS' : '❌ FAIL'}`);
            } else {
                console.log(`Predicted: ${validation_status.predicted.toFixed(1)} m`);
                console.log(`Error: ${validation_status.error_pct.toFixed(1)}%`);
                console.log(`Status: ${validation_status.pass ? '✅ PASS' : '❌ FAIL'}`);
            }

        } catch (error) {
            console.error(`\n❌ ERROR: ${error.message}`);
            console.error(error.stack);

            results.push({
                name: test_case.name,
                validation: { method: 'ERROR', pass: false, error: error.message }
            });
        }
    }

    // SUMMARY
    console.log('\n\n');
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' VALIDATION SUMMARY '.padStart(48).padEnd(78) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log();

    console.log('┌' + '─'.repeat(15) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(13) + '┐');
    console.log('│ Crater        │ Method        │ Observed      │ Predicted     │ Status      │');
    console.log('├' + '─'.repeat(15) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(13) + '┤');

    for (const r of results) {
        const name = r.name.padEnd(13);
        const method = r.validation.method.padEnd(13);
        const observed = `${r.validation.observed}m`.padEnd(13);

        let predicted, status;
        if (r.validation.method === 'Monte Carlo') {
            predicted = `${r.validation.median.toFixed(1)}m CI`.padEnd(13);
        } else if (r.validation.method === 'Deterministic') {
            predicted = `${r.validation.predicted.toFixed(1)}m`.padEnd(13);
        } else {
            predicted = 'ERROR'.padEnd(13);
        }

        status = r.validation.pass ? '✅ PASS' : '❌ FAIL';

        console.log(`│ ${name} │ ${method} │ ${observed} │ ${predicted} │ ${status.padEnd(11)} │`);
    }

    console.log('└' + '─'.repeat(15) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(13) + '┘');
    console.log();

    const pass_count = results.filter(r => r.validation.pass).length;
    const total_count = results.length;

    console.log(`RESULTS: ${pass_count}/${total_count} PASS`);

    if (pass_count === total_count) {
        console.log('\n✅ ALL TESTS PASSED - Phase 1.2 validation complete!');
    } else {
        console.log('\n⚠️  SOME TESTS FAILED - Further refinement needed');
    }

    console.log('\n' + '='.repeat(80));
}

// Run tests
runTests().catch(err => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
});
