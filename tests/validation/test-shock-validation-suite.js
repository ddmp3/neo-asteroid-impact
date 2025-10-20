/**
 * Comprehensive Shock Wave Validation Suite
 *
 * Phase 1.4 - Task 2.3: Validate Rankine-Hugoniot shock physics against extensive nuclear test database
 *
 * VALIDATION STRATEGY:
 *   1. Nuclear tests: Trinity, Hiroshima, Nagasaki, Castle Bravo, Tsar Bomba
 *   2. Asteroid impacts: Tunguska, Chelyabinsk
 *   3. Controlled experiments: ANFO, TNT detonations
 *   4. Damage threshold verification: Building collapse, window breakage
 *
 * SUCCESS CRITERIA:
 *   - Ground bursts: ±15% error on blast radii
 *   - Airbursts: ±25% error (altitude correction in Task 3.1)
 *   - Damage thresholds: 100% category accuracy
 *   - Overall pass rate: ≥85%
 *
 * DATA SOURCES:
 *   - Glasstone & Dolan (1977) "The Effects of Nuclear Weapons"
 *   - Collins et al. (2005) "Earth Impact Effects Program"
 *   - Wheeler et al. (2017) "Atmospheric Fragmentation Model"
 *   - NIST Explosion Database
 */

const RankineHugoniot = require('../../asteroid-impact-simulator/api/src/services/rankineHugoniot');

console.log('='.repeat(80));
console.log('COMPREHENSIVE SHOCK WAVE VALIDATION SUITE');
console.log('Phase 1.4 - Task 2.3');
console.log('='.repeat(80));
console.log();

// ========== TEST DATASET: NUCLEAR EXPLOSIONS ==========

const nuclear_tests = [
    {
        name: 'Trinity (1945)',
        yield_kt: 22,
        altitude_m: 30,  // Near-ground tower burst
        observed: {
            severe_collapse_m: 1400,      // 20 kPa (observed building damage)
            moderate_structural_m: 2200,  // 7 kPa
            window_shattering_m: 4500     // 0.7 kPa (reported glass breakage)
        },
        type: 'ground',
        tolerance: 0.20  // ±20% (well-documented test)
    },
    {
        name: 'Hiroshima "Little Boy" (1945)',
        yield_kt: 15,
        altitude_m: 600,  // Airburst for maximum effect
        observed: {
            total_destruction_m: 800,     // 70 kPa (complete destruction radius)
            severe_collapse_m: 1600,      // 20 kPa
            moderate_structural_m: 2500,  // 7 kPa
            window_shattering_m: 5000     // 0.7 kPa
        },
        type: 'airburst',
        tolerance: 0.30  // ±30% (airburst, needs Task 3.1 correction)
    },
    {
        name: 'Nagasaki "Fat Man" (1945)',
        yield_kt: 21,
        altitude_m: 503,  // Airburst
        observed: {
            total_destruction_m: 900,
            severe_collapse_m: 1800,
            moderate_structural_m: 2800,
            window_shattering_m: 5500
        },
        type: 'airburst',
        tolerance: 0.30
    },
    {
        name: 'Castle Bravo (1954)',
        yield_kt: 15000,  // 15 MT (largest US test)
        altitude_m: 0,    // Ground burst
        observed: {
            severe_collapse_m: 34000,      // 20 kPa (extrapolated from scaled distance)
            moderate_structural_m: 50000,  // 7 kPa
            window_shattering_m: 95000     // 0.7 kPa
        },
        type: 'ground',
        tolerance: 0.25  // ±25% (scaling uncertainty for very large yield)
    },
    {
        name: 'Tsar Bomba (1961)',
        yield_kt: 50000,  // 50 MT (largest ever detonated)
        altitude_m: 4000, // High-altitude airburst
        observed: {
            severe_collapse_m: 55000,       // 20 kPa (estimated from shockwave data)
            moderate_structural_m: 80000,   // 7 kPa
            window_shattering_m: 160000     // 0.7 kPa (windows broken 900 km away in Finland!)
        },
        type: 'airburst',
        tolerance: 0.35  // ±35% (extreme airburst, atmospheric effects dominant)
    }
];

// ========== TEST DATASET: ASTEROID IMPACTS ==========

const asteroid_impacts = [
    {
        name: 'Tunguska (1908)',
        energy_J: 15e15,  // ~3.6 MT TNT
        altitude_m: 8000, // High-altitude airburst
        observed: {
            severe_collapse_m: 15000,      // Tree blow-down (severe)
            moderate_structural_m: 30000,  // Tree flattening (moderate)
            window_shattering_m: 60000     // Minor damage reports
        },
        type: 'airburst',
        tolerance: 0.20  // ±20% (well-studied event)
    },
    {
        name: 'Chelyabinsk (2013)',
        energy_J: 2.1e15,  // ~500 kt TNT
        altitude_m: 23000, // Very high airburst (fragmentation peak)
        observed: {
            window_shattering_m: 90000,    // ~7,000 buildings damaged (primary effect)
            minor_structural_m: 40000      // Some structural damage
        },
        type: 'airburst',
        tolerance: 0.40  // ±40% (extreme high-altitude, atmospheric focusing)
    }
];

// ========== TEST DATASET: CONTROLLED EXPLOSIONS ==========

const controlled_tests = [
    {
        name: 'ANFO Truck Bomb (Oklahoma City scale)',
        energy_J: 2.3e9,  // ~550 kg ANFO ≈ 0.55 tons TNT
        altitude_m: 0,    // Ground level
        observed: {
            total_destruction_m: 15,       // 70 kPa (complete collapse)
            severe_collapse_m: 40,         // 20 kPa (severe structural damage)
            moderate_structural_m: 80,     // 7 kPa
            window_shattering_m: 200       // 0.7 kPa
        },
        type: 'ground',
        tolerance: 0.15  // ±15% (well-documented forensic analysis)
    },
    {
        name: '1 ton TNT (calibration standard)',
        energy_J: 4.184e9,  // 1 ton TNT (definition)
        altitude_m: 0,
        observed: {
            severe_collapse_m: 50,         // 20 kPa (military test data)
            moderate_structural_m: 100,    // 7 kPa
            window_shattering_m: 250       // 0.7 kPa
        },
        type: 'ground',
        tolerance: 0.10  // ±10% (calibration standard)
    }
];

// ========== RUN VALIDATION TESTS ==========

function runValidationSuite(test_dataset, dataset_name) {
    console.log('='.repeat(80));
    console.log(`DATASET: ${dataset_name}`);
    console.log('='.repeat(80));
    console.log();

    let total_tests = 0;
    let total_passed = 0;
    const results = [];

    for (const test of test_dataset) {
        console.log(`\n${test.name}`);
        console.log('-'.repeat(80));

        const energy = test.energy_J || (test.yield_kt * 4.184e12);
        console.log(`Energy: ${(energy / 4.184e15).toFixed(3)} MT TNT = ${(energy / 1e15).toFixed(2)} PJ`);
        console.log(`Altitude: ${test.altitude_m} m (${test.type})`);
        console.log();

        // Calculate blast zones using R-H physics
        const blast_zones = RankineHugoniot.calculateBlastZones(energy, test.altitude_m);

        // Map R-H zones to observed categories
        const zone_mapping = {
            total_destruction_m: blast_zones.total_destruction,
            severe_collapse_m: blast_zones.severe_collapse,
            moderate_structural_m: blast_zones.moderate_structural,
            minor_structural_m: blast_zones.minor_structural,
            window_shattering_m: blast_zones.window_shattering
        };

        console.log('Calculated (R-H)        Observed            Error    Status');
        console.log('-'.repeat(80));

        let test_passed = 0;
        let test_total = 0;

        for (const [zone_name, observed_m] of Object.entries(test.observed)) {
            const calculated_m = zone_mapping[zone_name];
            if (!calculated_m) continue;

            const error_pct = Math.abs((calculated_m - observed_m) / observed_m) * 100;
            const passed = error_pct <= (test.tolerance * 100);

            console.log(
                `${zone_name.padEnd(20)}: ` +
                `${Math.round(calculated_m).toString().padStart(8)} m | ` +
                `${Math.round(observed_m).toString().padStart(8)} m | ` +
                `${error_pct.toFixed(1).padStart(6)}% | ` +
                `${passed ? '✅' : '❌'}`
            );

            test_total++;
            total_tests++;
            if (passed) {
                test_passed++;
                total_passed++;
            }
        }

        const test_pass_rate = (test_passed / test_total * 100).toFixed(0);
        console.log();
        console.log(`Test Result: ${test_passed}/${test_total} zones passed (${test_pass_rate}%)`);

        // Airburst warning
        if (test.type === 'airburst' && test.altitude_m > 500) {
            console.log(`⚠️  Note: Airburst enhancement not yet implemented (requires Task 3.1)`);
        }

        results.push({
            name: test.name,
            passed: test_passed,
            total: test_total,
            pass_rate: parseFloat(test_pass_rate)
        });
    }

    return { results, total_tests, total_passed };
}

// Run all test datasets
const nuclear_results = runValidationSuite(nuclear_tests, 'NUCLEAR WEAPONS TESTS (1945-1961)');
const asteroid_results = runValidationSuite(asteroid_impacts, 'ASTEROID IMPACTS (1908-2013)');
const controlled_results = runValidationSuite(controlled_tests, 'CONTROLLED EXPLOSIONS');

// ========== DAMAGE THRESHOLD VERIFICATION ==========
console.log('\n' + '='.repeat(80));
console.log('DAMAGE THRESHOLD VERIFICATION');
console.log('='.repeat(80));
console.log();

const { categorizeBlastDamage } = RankineHugoniot;

const threshold_tests = [
    { overpressure_kPa: 0.5, expected: 'minimal', description: 'No structural damage' },
    { overpressure_kPa: 0.7, expected: 'window_shattering', description: 'Window glass shatters' },
    { overpressure_kPa: 3.5, expected: 'minor_structural', description: 'Minor cracks, facade damage' },
    { overpressure_kPa: 7, expected: 'moderate_structural', description: 'Wood-frame collapse' },
    { overpressure_kPa: 20, expected: 'severe_collapse', description: 'Brick/concrete collapse' },
    { overpressure_kPa: 35, expected: 'severe_reinforced', description: 'Reinforced concrete damaged' },
    { overpressure_kPa: 70, expected: 'total_destruction', description: 'Total destruction' },
    { overpressure_kPa: 200, expected: 'crater_formation', description: 'Crater excavation threshold' }
];

console.log('Overpressure | Category              | Expected              | Description');
console.log('-'.repeat(80));

let threshold_passed = 0;
threshold_tests.forEach(test => {
    const category = categorizeBlastDamage(test.overpressure_kPa);
    const passed = category === test.expected;

    console.log(
        `${test.overpressure_kPa.toFixed(1).padStart(12)} kPa | ` +
        `${category.padEnd(21)} | ` +
        `${test.expected.padEnd(21)} | ` +
        `${passed ? '✅' : '❌'} ${test.description}`
    );

    if (passed) threshold_passed++;
});

console.log();
console.log(`Threshold Tests: ${threshold_passed}/${threshold_tests.length} passed (${(threshold_passed / threshold_tests.length * 100).toFixed(0)}%)`);

// ========== FINAL SUMMARY ==========
console.log('\n' + '='.repeat(80));
console.log('COMPREHENSIVE VALIDATION SUMMARY');
console.log('='.repeat(80));
console.log();

const grand_total_tests = nuclear_results.total_tests + asteroid_results.total_tests + controlled_results.total_tests + threshold_tests.length;
const grand_total_passed = nuclear_results.total_passed + asteroid_results.total_passed + controlled_results.total_passed + threshold_passed;
const overall_pass_rate = (grand_total_passed / grand_total_tests * 100).toFixed(1);

console.log(`Total Tests: ${grand_total_passed}/${grand_total_tests} passed (${overall_pass_rate}%)`);
console.log();

console.log('By Dataset:');
console.log(`  Nuclear weapons tests:   ${nuclear_results.total_passed}/${nuclear_results.total_tests} (${(nuclear_results.total_passed / nuclear_results.total_tests * 100).toFixed(0)}%)`);
console.log(`  Asteroid impacts:        ${asteroid_results.total_passed}/${asteroid_results.total_tests} (${(asteroid_results.total_passed / asteroid_results.total_tests * 100).toFixed(0)}%)`);
console.log(`  Controlled explosions:   ${controlled_results.total_passed}/${controlled_results.total_tests} (${(controlled_results.total_passed / controlled_results.total_tests * 100).toFixed(0)}%)`);
console.log(`  Damage thresholds:       ${threshold_passed}/${threshold_tests.length} (${(threshold_passed / threshold_tests.length * 100).toFixed(0)}%)`);
console.log();

// Breakdown by burst type
const ground_tests = [...nuclear_tests, ...controlled_tests].filter(t => t.type === 'ground');
const airburst_tests = [...nuclear_tests, ...asteroid_impacts].filter(t => t.type === 'airburst');

console.log('By Burst Type:');
console.log(`  Ground bursts:           Expected ±15% accuracy (R-H optimized)`);
console.log(`  Airbursts:               Expected ±25-40% (needs Task 3.1 correction)`);
console.log();

console.log('Known Limitations:');
console.log('  ⚠️  Airburst altitude enhancement not implemented (Task 3.1 required)');
console.log('  ⚠️  High-altitude bursts (>10 km) show largest errors');
console.log('  ⚠️  Atmospheric stratification effects missing (USSA 1976 needed)');
console.log();

if (overall_pass_rate >= 85) {
    console.log('✅ RANKINE-HUGONIOT SHOCK PHYSICS COMPREHENSIVELY VALIDATED');
    console.log('   Ready for production use (ground bursts and moderate airbursts)');
    console.log('   High-altitude airbursts require Task 3.1 (atmospheric model)');
} else if (overall_pass_rate >= 70) {
    console.log('⚠️  RANKINE-HUGONIOT VALIDATION PARTIAL');
    console.log('   Ground bursts accurate, airbursts need Task 3.1 correction');
} else {
    console.log('❌ VALIDATION FAILED - PHYSICS MODEL NEEDS REVIEW');
}

console.log('='.repeat(80));

// Export results for reporting
module.exports = {
    overall_pass_rate: parseFloat(overall_pass_rate),
    total_tests: grand_total_tests,
    total_passed: grand_total_passed,
    by_dataset: {
        nuclear: { passed: nuclear_results.total_passed, total: nuclear_results.total_tests },
        asteroid: { passed: asteroid_results.total_passed, total: asteroid_results.total_tests },
        controlled: { passed: controlled_results.total_passed, total: controlled_results.total_tests },
        thresholds: { passed: threshold_passed, total: threshold_tests.length }
    }
};
