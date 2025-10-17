/**
 * VALIDATION PHASE 1.1 - Small Iron Crater Physics
 *
 * TEST: Vérifier que K(D) linéaire a été remplacé par approche FCM
 *
 * CAS DE TEST:
 * 1. Sikhote-Alin (1947) - 26m fer, fragmentation atmosphérique
 * 2. Odessa (petit fer 10-20m estimé)
 * 3. Kaali (petit fer ~20m estimé)
 *
 * OBJECTIF:
 * - Réduire MAE de 71% → <30% (objectif panel)
 * - Prouver que FCM donne résultats physiques (pas régression)
 * - Documenter champs de cratères multiples si applicable
 *
 * v1.7.8 - Validation Phase 1.1
 */

const SmallIronCraterPhysics = require('../services/smallIronCraterPhysics');

// CAS DOCUMENTÉS - Small iron craters
const TEST_CASES = [
    {
        name: 'Sikhote-Alin',
        year: 1947,
        location: 'Russia',
        parameters: {
            diameter: 10.0,         // ~10m objet initial (fragmenté en ~1m fragments)
            velocity: 14000,        // m/s (estimé)
            angle: 45,              // degrés (estimé)
            density: 7800,          // kg/m³ (fer météoritique)
            composition: 'iron'
        },
        observed: {
            crater_field: true,
            crater_count: 122,      // 122 cratères documentés !
            largest_crater_diameter: 26,  // mètres (plus gros cratère)
            notes: 'Fragmentation atmosphérique massive - champ de cratères multiples'
        },
        confidence: 'HIGH',
        references: [
            'Krinov (1966) - Giant Meteorites',
            'Svetsov (1996) - Sikhote-Alin fragmentation modeling'
        ]
    },
    {
        name: 'Odessa',
        year: -61000,  // ~63,000 ans BP
        location: 'Texas, USA',
        parameters: {
            diameter: 15,           // m (estimé depuis cratère)
            velocity: 15000,        // m/s (typique fer)
            angle: 50,              // degrés (estimé)
            density: 7800,          // kg/m³
            composition: 'iron'
        },
        observed: {
            crater_field: false,
            crater_count: 1,
            largest_crater_diameter: 168,  // mètres
            notes: 'Cratère simple, objet intact ou fragmentation minimale'
        },
        confidence: 'MEDIUM',
        references: [
            'Earth Impact Database - Odessa crater'
        ]
    },
    {
        name: 'Kaali',
        year: -3500,  // ~3,500 ans BP
        location: 'Estonia',
        parameters: {
            diameter: 4,            // m (estimé depuis cratère)
            velocity: 16000,        // m/s
            angle: 60,              // degrés
            density: 7800,          // kg/m³
            composition: 'iron'
        },
        observed: {
            crater_field: true,
            crater_count: 9,        // 9 cratères principaux
            largest_crater_diameter: 110,  // mètres
            notes: 'Fragmentation modérée - champ de 9 cratères'
        },
        confidence: 'MEDIUM',
        references: [
            'Raukas et al. (2001) - Kaali crater field'
        ]
    }
];

async function validateSmallIronPhysics() {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  VALIDATION PHASE 1.1 - Small Iron Crater Physics (v1.7.8)        ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    console.log('OBJECTIF: Remplacer K(D) linéaire par approche FCM physique');
    console.log('CIBLE:    Réduire MAE de 71% → <30%');
    console.log('MÉTHODE:  Fragment-Cloud Model V2 (Wheeler 2017)\n');

    const physics = new SmallIronCraterPhysics();
    const results = [];

    for (const test of TEST_CASES) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`TEST CASE: ${test.name} (${test.year > 0 ? test.year : Math.abs(test.year) + ' years BP'})`);
        console.log(`Location:  ${test.location}`);
        console.log(`Confidence: ${test.confidence}`);
        console.log(`${'='.repeat(80)}\n`);

        console.log('OBSERVED DATA:');
        console.log(`  - Crater field: ${test.observed.crater_field ? 'YES' : 'NO'}`);
        console.log(`  - Crater count: ${test.observed.crater_count}`);
        console.log(`  - Largest crater: ${test.observed.largest_crater_diameter} m`);
        console.log(`  - Notes: ${test.observed.notes}\n`);

        console.log('INPUT PARAMETERS:');
        console.log(`  - Diameter: ${test.parameters.diameter} m`);
        console.log(`  - Velocity: ${test.parameters.velocity} m/s`);
        console.log(`  - Angle: ${test.parameters.angle}°`);
        console.log(`  - Density: ${test.parameters.density} kg/m³`);
        console.log(`  - Composition: ${test.parameters.composition}\n`);

        try {
            const result = await physics.calculateSmallIronCrater(test.parameters);

            console.log('\n' + '─'.repeat(80));
            console.log('FCM V2 RESULTS:');
            console.log('─'.repeat(80));
            console.log(`  - Regime: ${result.regime}`);
            console.log(`  - Fragmentation altitude: ${result.fragmentation_altitude_km.toFixed(1)} km`);
            console.log(`  - Survival fraction: ${(result.survival_fraction * 100).toFixed(1)}%`);

            if (result.fragment_count !== undefined && result.fragment_count > 0) {
                console.log(`\n  MAIN CRATER (largest fragment):`);
                console.log(`  - Crater diameter: ${result.crater_diameter.toFixed(1)} m`);
                console.log(`  - Fragment count: ${result.fragment_count}`);
                if (result.largest_fragment_mass_kg) {
                    console.log(`  - Largest fragment: ${result.largest_fragment_mass_kg.toFixed(0)} kg (${(result.largest_fragment_fraction*100).toFixed(1)}% of total)`);
                }
            } else {
                console.log(`  - No crater formed (complete airburst)`);
            }

            if (result.warning) {
                console.log(`\n  - ⚠️ Warning: ${result.warning}`);
            }

            // CALCUL ERREUR
            const observed = test.observed.largest_crater_diameter;
            const predicted = result.crater_diameter;
            const error_abs = Math.abs(predicted - observed);
            const error_pct = (error_abs / observed) * 100;

            console.log('\n' + '─'.repeat(80));
            console.log('VALIDATION:');
            console.log('─'.repeat(80));
            console.log(`  - Observed diameter:  ${observed} m`);
            console.log(`  - Predicted diameter: ${predicted.toFixed(1)} m`);
            console.log(`  - Absolute error:     ${error_abs.toFixed(1)} m`);
            console.log(`  - Relative error:     ${error_pct.toFixed(1)}%`);

            const status = error_pct < 30 ? '✅ PASS' : error_pct < 50 ? '⚠️ ACCEPTABLE' : '❌ FAIL';
            console.log(`  - Status:             ${status} (<30% target)`);

            // VÉRIFICATION PHYSIQUE
            console.log('\n' + '─'.repeat(80));
            console.log('PHYSICS CHECKS:');
            console.log('─'.repeat(80));

            // Check 1: Crater field vs single crater
            const field_match = test.observed.crater_field === (result.regime === 'multiple_crater_field' || result.regime === 'airburst_complete_fragmentation');
            console.log(`  - Crater field prediction: ${field_match ? '✅ CORRECT' : '⚠️ MISMATCH'}`);
            console.log(`    (Observed: ${test.observed.crater_field ? 'field' : 'single'}, Predicted: ${result.regime})`);

            // Check 2: Energy conservation
            const conservation_ok = result.fcm_diagnostics && result.fcm_diagnostics.energy_conservation_error_pct < 1.0;
            console.log(`  - Energy conservation: ${conservation_ok ? '✅ <1% error' : '⚠️ Check needed'}`);
            if (result.fcm_diagnostics) {
                console.log(`    (Error: ${result.fcm_diagnostics.energy_conservation_error_pct.toFixed(3)}%)`);
            }

            // Check 3: Physical plausibility
            const plausible = result.survival_fraction >= 0 && result.survival_fraction <= 1.0;
            console.log(`  - Survival fraction plausible: ${plausible ? '✅ YES' : '❌ NO'}`);

            results.push({
                name: test.name,
                confidence: test.confidence,
                observed: observed,
                predicted: predicted,
                error_pct: error_pct,
                regime: result.regime,
                field_match: field_match,
                conservation_ok: conservation_ok,
                status: status
            });

        } catch (error) {
            console.error(`\n❌ ERROR: ${error.message}`);
            console.error(error.stack);
            results.push({
                name: test.name,
                confidence: test.confidence,
                error: error.message,
                status: '❌ ERROR'
            });
        }
    }

    // SUMMARY
    console.log('\n\n' + '╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(25) + 'VALIDATION SUMMARY' + ' '.repeat(35) + '║');
    console.log('╚' + '═'.repeat(78) + '╝\n');

    console.log('┌────────────────┬────────────┬──────────┬────────────┬──────────┬──────────┐');
    console.log('│ Crater         │ Confidence │ Observed │ Predicted  │ Error    │ Status   │');
    console.log('├────────────────┼────────────┼──────────┼────────────┼──────────┼──────────┤');

    for (const r of results) {
        if (r.error) {
            console.log(`│ ${r.name.padEnd(14)} │ ${r.confidence.padEnd(10)} │ -        │ -          │ ERROR    │ ❌       │`);
        } else {
            const obs_str = `${r.observed}m`.padEnd(8);
            const pred_str = `${r.predicted.toFixed(1)}m`.padEnd(10);
            const err_str = `${r.error_pct.toFixed(1)}%`.padEnd(8);
            const status_icon = r.status.includes('✅') ? '✅' : r.status.includes('⚠️') ? '⚠️' : '❌';
            console.log(`│ ${r.name.padEnd(14)} │ ${r.confidence.padEnd(10)} │ ${obs_str} │ ${pred_str} │ ${err_str} │ ${status_icon.padEnd(8)} │`);
        }
    }

    console.log('└────────────────┴────────────┴──────────┴────────────┴──────────┴──────────┘\n');

    // STATISTIQUES GLOBALES
    const valid_results = results.filter(r => !r.error);
    if (valid_results.length > 0) {
        const errors = valid_results.map(r => r.error_pct);
        const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
        const max_error = Math.max(...errors);
        const min_error = Math.min(...errors);

        console.log('GLOBAL STATISTICS:');
        console.log(`  - Mean Absolute Error (MAE):  ${mae.toFixed(1)}%`);
        console.log(`  - Maximum error:              ${max_error.toFixed(1)}%`);
        console.log(`  - Minimum error:              ${min_error.toFixed(1)}%`);
        console.log(`  - Test cases:                 ${valid_results.length}/${TEST_CASES.length}`);

        const pass_count = results.filter(r => r.status.includes('✅')).length;
        const acceptable_count = results.filter(r => r.status.includes('⚠️')).length;
        const fail_count = results.filter(r => r.status.includes('❌')).length;

        console.log(`\n  - PASS (<30%):     ${pass_count}/${TEST_CASES.length} ✅`);
        console.log(`  - ACCEPTABLE:      ${acceptable_count}/${TEST_CASES.length} ⚠️`);
        console.log(`  - FAIL:            ${fail_count}/${TEST_CASES.length} ❌`);

        console.log('\n' + '─'.repeat(80));
        console.log('PHASE 1.1 VERDICT:');
        console.log('─'.repeat(80));

        if (mae < 30) {
            console.log('✅ PHASE 1.1 COMPLETE - MAE <30% target achieved!');
            console.log(`   Improvement: 71% → ${mae.toFixed(1)}% (${((71 - mae)/71*100).toFixed(0)}% reduction)`);
            console.log('\n   K(D) linear regression successfully REPLACED with FCM physics ✅');
        } else if (mae < 50) {
            console.log(`⚠️ PHASE 1.1 PARTIAL - MAE ${mae.toFixed(1)}% (target <30%)`);
            console.log(`   Improvement: 71% → ${mae.toFixed(1)}% (${((71 - mae)/71*100).toFixed(0)}% reduction)`);
            console.log('   Still an improvement, but needs further calibration');
        } else {
            console.log(`❌ PHASE 1.1 FAILED - MAE ${mae.toFixed(1)}% (target <30%)`);
            console.log('   Physics approach needs review');
        }
    }

    console.log('\n' + '═'.repeat(80) + '\n');
}

// RUN VALIDATION
if (require.main === module) {
    validateSmallIronPhysics()
        .then(() => {
            console.log('Validation complete.');
            process.exit(0);
        })
        .catch(error => {
            console.error('Validation failed:', error);
            process.exit(1);
        });
}

module.exports = { validateSmallIronPhysics };
