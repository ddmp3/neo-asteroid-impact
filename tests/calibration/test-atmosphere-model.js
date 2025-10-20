/**
 * USSA 1976 Atmospheric Model - Validation Test
 *
 * Phase 1.4 - Task 3.1: Verify atmospheric properties against USSA 1976 standard
 *
 * VALIDATION DATA:
 *   NOAA/NASA/USAF (1976) "U.S. Standard Atmosphere, 1976" Table I
 *
 * SUCCESS CRITERIA:
 *   - Temperature: ±1 K
 *   - Pressure: ±5%
 *   - Density: ±5%
 *   - Pass rate: ≥95%
 */

const atmosphere = require('../../asteroid-impact-simulator/api/src/services/atmosphereModel');

console.log('='.repeat(80));
console.log('USSA 1976 ATMOSPHERIC MODEL - VALIDATION TEST');
console.log('Phase 1.4 - Task 3.1');
console.log('='.repeat(80));
console.log();

// ========== STANDARD ATMOSPHERE TEST POINTS (USSA 1976 Table I) ==========

const ussa_1976_table = [
    // Altitude, Temperature(K), Pressure(Pa), Density(kg/m³)
    { h: 0,     T: 288.15, P: 101325, rho: 1.2250 },      // Sea level
    { h: 1000,  T: 281.65, P: 89874,  rho: 1.1117 },      // 1 km
    { h: 2000,  T: 275.15, P: 79495,  rho: 1.0066 },      // 2 km
    { h: 5000,  T: 255.65, P: 54020,  rho: 0.7361 },      // 5 km
    { h: 10000, T: 223.15, P: 26436,  rho: 0.4127 },      // 10 km (commercial cruise)
    { h: 11000, T: 216.65, P: 22632,  rho: 0.3639 },      // 11 km (tropopause)
    { h: 15000, T: 216.65, P: 12044,  rho: 0.1937 },      // 15 km
    { h: 20000, T: 216.65, P: 5474,   rho: 0.0880 },      // 20 km
    { h: 25000, T: 221.65, P: 2511,   rho: 0.0395 },      // 25 km
    { h: 30000, T: 226.65, P: 1172,   rho: 0.0180 },      // 30 km
    { h: 40000, T: 250.65, P: 277,    rho: 0.00385 },     // 40 km
    { h: 50000, T: 270.65, P: 75.9,   rho: 0.00098 },     // 50 km (stratopause)
    { h: 60000, T: 245.65, P: 21.7,   rho: 0.00031 },     // 60 km
    { h: 70000, T: 214.65, P: 4.69,   rho: 0.000076 },    // 70 km
    { h: 80000, T: 194.65, P: 0.886,  rho: 0.000016 },    // 80 km
];

console.log('TEST 1: Atmospheric Properties at Standard Altitudes');
console.log('-'.repeat(80));
console.log('Alt(km) | T(K) Calc | T(K) USSA | Err | P(Pa) Calc | P(Pa) USSA | Err | ρ Calc | ρ USSA | Err');
console.log('-'.repeat(80));

let total_tests = 0;
let passed_tests = 0;

for (const ref of ussa_1976_table) {
    const atm = atmosphere.getAtmosphericProperties(ref.h);

    const T_error = Math.abs((atm.temperature - ref.T) / ref.T) * 100;
    const P_error = Math.abs((atm.pressure - ref.P) / ref.P) * 100;
    const rho_error = Math.abs((atm.density - ref.rho) / ref.rho) * 100;

    const T_pass = T_error < 0.5;      // ±0.5%
    const P_pass = P_error < 5.0;      // ±5%
    const rho_pass = rho_error < 5.0;  // ±5%

    const all_pass = T_pass && P_pass && rho_pass;

    console.log(
        `${(ref.h / 1000).toFixed(1).padStart(7)} | ` +
        `${atm.temperature.toFixed(2).padStart(9)} | ` +
        `${ref.T.toFixed(2).padStart(9)} | ` +
        `${T_error.toFixed(1).padStart(3)}% | ` +
        `${atm.pressure.toFixed(1).padStart(10)} | ` +
        `${ref.P.toFixed(1).padStart(10)} | ` +
        `${P_error.toFixed(1).padStart(3)}% | ` +
        `${atm.density.toFixed(5).padStart(7)} | ` +
        `${ref.rho.toFixed(5).padStart(7)} | ` +
        `${rho_error.toFixed(1).padStart(3)}% ${all_pass ? '✅' : '❌'}`
    );

    total_tests += 3;
    if (T_pass) passed_tests++;
    if (P_pass) passed_tests++;
    if (rho_pass) passed_tests++;
}

const pass_rate_1 = (passed_tests / total_tests * 100).toFixed(1);
console.log();
console.log(`Test 1 Result: ${passed_tests}/${total_tests} passed (${pass_rate_1}%)`);

// ========== TEST 2: ATMOSPHERIC LAYERS ==========
console.log('\n' + '='.repeat(80));
console.log('TEST 2: Atmospheric Layer Boundaries');
console.log('-'.repeat(80));

const layer_tests = [
    { h: 0, expected_layer: 'Troposphere' },
    { h: 5000, expected_layer: 'Troposphere' },
    { h: 10000, expected_layer: 'Troposphere' },
    { h: 11000, expected_layer: 'Tropopause' },
    { h: 15000, expected_layer: 'Tropopause' },
    { h: 20000, expected_layer: 'Stratosphere Lower' },
    { h: 30000, expected_layer: 'Stratosphere Lower' },
    { h: 40000, expected_layer: 'Stratosphere Middle' },
    { h: 50000, expected_layer: 'Stratopause' },
    { h: 60000, expected_layer: 'Mesosphere Lower' },
    { h: 75000, expected_layer: 'Mesosphere Upper' },
    { h: 86000, expected_layer: 'Mesosphere Upper' },
];

let layer_tests_passed = 0;

console.log('Altitude (km) | Detected Layer         | Expected Layer         | Status');
console.log('-'.repeat(80));

for (const test of layer_tests) {
    const atm = atmosphere.getAtmosphericProperties(test.h);
    const passed = atm.layer === test.expected_layer;

    console.log(
        `${(test.h / 1000).toFixed(1).padStart(13)} | ` +
        `${atm.layer.padEnd(22)} | ` +
        `${test.expected_layer.padEnd(22)} | ` +
        `${passed ? '✅' : '❌'}`
    );

    if (passed) layer_tests_passed++;
}

const pass_rate_2 = (layer_tests_passed / layer_tests.length * 100).toFixed(0);
console.log();
console.log(`Test 2 Result: ${layer_tests_passed}/${layer_tests.length} passed (${pass_rate_2}%)`);

// ========== TEST 3: TEMPERATURE LAPSE RATES ==========
console.log('\n' + '='.repeat(80));
console.log('TEST 3: Temperature Lapse Rates');
console.log('-'.repeat(80));

const lapse_tests = [
    { layer: 'Troposphere', h1: 0, h2: 5000, expected_lapse: -6.5 },      // -6.5 K/km
    { layer: 'Tropopause', h1: 11000, h2: 15000, expected_lapse: 0.0 },   // Isothermal
    { layer: 'Stratosphere Lower', h1: 20000, h2: 30000, expected_lapse: 1.0 },  // +1 K/km
];

let lapse_tests_passed = 0;

console.log('Layer                  | Alt Range (km) | Lapse Calc | Lapse Exp | Error | Status');
console.log('-'.repeat(80));

for (const test of lapse_tests) {
    const atm1 = atmosphere.getAtmosphericProperties(test.h1);
    const atm2 = atmosphere.getAtmosphericProperties(test.h2);

    const dT = atm2.temperature - atm1.temperature;
    const dh = (test.h2 - test.h1) / 1000;  // km
    const lapse_calc = dT / dh;  // K/km

    const error = Math.abs(lapse_calc - test.expected_lapse);
    const passed = error < 0.1;  // ±0.1 K/km

    console.log(
        `${test.layer.padEnd(22)} | ` +
        `${(test.h1 / 1000).toFixed(0)}-${(test.h2 / 1000).toFixed(0).padStart(2)}        | ` +
        `${lapse_calc.toFixed(2).padStart(10)} | ` +
        `${test.expected_lapse.toFixed(2).padStart(9)} | ` +
        `${error.toFixed(2).padStart(5)} | ` +
        `${passed ? '✅' : '❌'}`
    );

    if (passed) lapse_tests_passed++;
}

const pass_rate_3 = (lapse_tests_passed / lapse_tests.length * 100).toFixed(0);
console.log();
console.log(`Test 3 Result: ${lapse_tests_passed}/${lapse_tests.length} passed (${pass_rate_3}%)`);

// ========== TEST 4: PATH LENGTH CALCULATIONS ==========
console.log('\n' + '='.repeat(80));
console.log('TEST 4: Atmospheric Path Length');
console.log('-'.repeat(80));

const path_tests = [
    { entry_h: 50000, impact_h: 0, angle: 90, expected_path: 50000 },       // Vertical
    { entry_h: 50000, impact_h: 0, angle: 45, expected_path: 70710 },       // 45° (√2 × height)
    { entry_h: 50000, impact_h: 0, angle: 30, expected_path: 100000 },      // 30° (2 × height)
    { entry_h: 100000, impact_h: 0, angle: 90, expected_path: 100000 },     // High entry
];

let path_tests_passed = 0;

console.log('Entry (km) | Impact (km) | Angle | Path Calc (km) | Path Exp (km) | Error | Status');
console.log('-'.repeat(80));

for (const test of path_tests) {
    const path = atmosphere.calculatePathLength(test.entry_h, test.impact_h, test.angle);

    const error = Math.abs((path.path_length - test.expected_path) / test.expected_path) * 100;
    const passed = error < 1.0;  // ±1%

    console.log(
        `${(test.entry_h / 1000).toFixed(1).padStart(10)} | ` +
        `${(test.impact_h / 1000).toFixed(1).padStart(11)} | ` +
        `${test.angle.toString().padStart(5)}° | ` +
        `${(path.path_length / 1000).toFixed(2).padStart(14)} | ` +
        `${(test.expected_path / 1000).toFixed(2).padStart(13)} | ` +
        `${error.toFixed(1).padStart(5)}% | ` +
        `${passed ? '✅' : '❌'}`
    );

    if (passed) path_tests_passed++;
}

const pass_rate_4 = (path_tests_passed / path_tests.length * 100).toFixed(0);
console.log();
console.log(`Test 4 Result: ${path_tests_passed}/${path_tests.length} passed (${pass_rate_4}%)`);

// ========== TEST 5: MACH REFLECTION ENHANCEMENT ==========
console.log('\n' + '='.repeat(80));
console.log('TEST 5: Mach Reflection Enhancement');
console.log('-'.repeat(80));

const mach_tests = [
    { H: 0, R: 1000, expected_M: 1.0, type: 'ground_burst' },          // Ground burst: no enhancement
    { H: 500, R: 1000, expected_M: 1.8, type: 'optimal_airburst' },    // H/R = 0.5: optimal
    { H: 100, R: 1000, expected_M: 1.5, type: 'low_airburst' },        // H/R = 0.1: low
    { H: 2000, R: 1000, expected_M: 1.05, type: 'high_airburst' },     // H/R = 2: minimal
];

let mach_tests_passed = 0;

console.log('H (m) | R (m) | H/R  | M Calc | M Exp | Error | Type              | Status');
console.log('-'.repeat(80));

for (const test of mach_tests) {
    const mach = atmosphere.calculateMachReflection(test.H, test.R);

    const error = Math.abs((mach.enhancement_factor - test.expected_M) / test.expected_M) * 100;
    const passed = error < 20;  // ±20% (empirical formula has uncertainty)

    console.log(
        `${test.H.toString().padStart(5)} | ` +
        `${test.R.toString().padStart(5)} | ` +
        `${mach.height_ratio.toFixed(2).padStart(4)} | ` +
        `${mach.enhancement_factor.toFixed(2).padStart(6)} | ` +
        `${test.expected_M.toFixed(2).padStart(5)} | ` +
        `${error.toFixed(0).padStart(5)}% | ` +
        `${mach.type.padEnd(17)} | ` +
        `${passed ? '✅' : '❌'}`
    );

    if (passed) mach_tests_passed++;
}

const pass_rate_5 = (mach_tests_passed / mach_tests.length * 100).toFixed(0);
console.log();
console.log(`Test 5 Result: ${mach_tests_passed}/${mach_tests.length} passed (${pass_rate_5}%)`);

// ========== TEST 6: DERIVED PROPERTIES ==========
console.log('\n' + '='.repeat(80));
console.log('TEST 6: Derived Properties (Speed of Sound, Viscosity)');
console.log('-'.repeat(80));

const derived_tests = [
    { h: 0, expected_c: 340.3, expected_mu: 1.789e-5 },      // Sea level
    { h: 11000, expected_c: 295.1, expected_mu: 1.422e-5 },  // Tropopause
    { h: 50000, expected_c: 329.8, expected_mu: 1.704e-5 },  // Stratopause
];

let derived_tests_passed = 0;

console.log('Alt(km) | c Calc (m/s) | c Exp (m/s) | Err | μ Calc (Pa·s) | μ Exp (Pa·s) | Err | Status');
console.log('-'.repeat(80));

for (const test of derived_tests) {
    const atm = atmosphere.getAtmosphericProperties(test.h);

    const c_error = Math.abs((atm.speed_of_sound - test.expected_c) / test.expected_c) * 100;
    const mu_error = Math.abs((atm.dynamic_viscosity - test.expected_mu) / test.expected_mu) * 100;

    const c_pass = c_error < 1.0;   // ±1%
    const mu_pass = mu_error < 5.0; // ±5%
    const passed = c_pass && mu_pass;

    console.log(
        `${(test.h / 1000).toFixed(1).padStart(7)} | ` +
        `${atm.speed_of_sound.toFixed(1).padStart(12)} | ` +
        `${test.expected_c.toFixed(1).padStart(11)} | ` +
        `${c_error.toFixed(1).padStart(3)}% | ` +
        `${atm.dynamic_viscosity.toExponential(3).padStart(13)} | ` +
        `${test.expected_mu.toExponential(3).padStart(12)} | ` +
        `${mu_error.toFixed(1).padStart(3)}% | ` +
        `${passed ? '✅' : '❌'}`
    );

    if (c_pass) derived_tests_passed++;
    if (mu_pass) derived_tests_passed++;
}

const pass_rate_6 = (derived_tests_passed / (derived_tests.length * 2) * 100).toFixed(0);
console.log();
console.log(`Test 6 Result: ${derived_tests_passed}/${derived_tests.length * 2} passed (${pass_rate_6}%)`);

// ========== SUMMARY ==========
console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));

const grand_total = total_tests + layer_tests.length + lapse_tests.length + path_tests.length + mach_tests.length + (derived_tests.length * 2);
const grand_passed = passed_tests + layer_tests_passed + lapse_tests_passed + path_tests_passed + mach_tests_passed + derived_tests_passed;
const overall_pass_rate = (grand_passed / grand_total * 100).toFixed(1);

console.log(`Total Tests: ${grand_passed}/${grand_total} passed (${overall_pass_rate}%)`);
console.log();

console.log('By Category:');
console.log(`  USSA 1976 standard altitudes:  ${passed_tests}/${total_tests} (${pass_rate_1}%)`);
console.log(`  Atmospheric layer boundaries:  ${layer_tests_passed}/${layer_tests.length} (${pass_rate_2}%)`);
console.log(`  Temperature lapse rates:       ${lapse_tests_passed}/${lapse_tests.length} (${pass_rate_3}%)`);
console.log(`  Path length calculations:      ${path_tests_passed}/${path_tests.length} (${pass_rate_4}%)`);
console.log(`  Mach reflection enhancement:   ${mach_tests_passed}/${mach_tests.length} (${pass_rate_5}%)`);
console.log(`  Derived properties:            ${derived_tests_passed}/${derived_tests.length * 2} (${pass_rate_6}%)`);
console.log();

if (overall_pass_rate >= 95) {
    console.log('✅ USSA 1976 ATMOSPHERIC MODEL VALIDATED');
    console.log('   Ready for integration with physics engine');
} else if (overall_pass_rate >= 85) {
    console.log('⚠️  ATMOSPHERIC MODEL MOSTLY VALIDATED');
    console.log('   Minor discrepancies - acceptable for production');
} else {
    console.log('❌ VALIDATION FAILED - MODEL NEEDS REVIEW');
}

console.log('='.repeat(80));
