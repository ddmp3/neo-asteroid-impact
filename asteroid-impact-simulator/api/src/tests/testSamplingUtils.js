/**
 * Test Sampling Utilities
 *
 * Validates statistical sampling functions
 * Phase 1.3 - v1.7.11
 */

const {
    normalRandom,
    uniformRandom,
    normalSamples,
    uniformSamples,
    computeStatistics,
    inConfidenceInterval
} = require('../utils/sampling');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║          Test Sampling Utilities - Phase 1.3                  ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log();

// Test 1: Normal Distribution
console.log('TEST 1: Normal Distribution N(14.10, 1.13)');
console.log('─'.repeat(70));

const mean_C = 14.10;
const std_C = 1.13;
const N = 10000;

const C_samples = normalSamples(N, mean_C, std_C, { min: 11, max: 17 });
const C_stats = computeStatistics(C_samples);

console.log(`Generated ${N} samples from N(${mean_C}, ${std_C}²)`);
console.log();
console.log('Statistics:');
console.log(`  Mean:   ${C_stats.mean.toFixed(3)} (expected: ${mean_C})`);
console.log(`  Std:    ${C_stats.std.toFixed(3)} (expected: ${std_C})`);
console.log(`  Median: ${C_stats.median.toFixed(3)}`);
console.log();
console.log('Percentiles:');
console.log(`  P05:  ${C_stats.percentiles.P05.toFixed(3)}`);
console.log(`  P10:  ${C_stats.percentiles.P10.toFixed(3)}`);
console.log(`  P50:  ${C_stats.percentiles.P50.toFixed(3)}`);
console.log(`  P90:  ${C_stats.percentiles.P90.toFixed(3)}`);
console.log(`  P95:  ${C_stats.percentiles.P95.toFixed(3)}`);
console.log();
console.log('Confidence Intervals:');
console.log(`  80% CI: [${C_stats.confidence_intervals.CI_80[0].toFixed(2)}, ${C_stats.confidence_intervals.CI_80[1].toFixed(2)}]`);
console.log(`  90% CI: [${C_stats.confidence_intervals.CI_90[0].toFixed(2)}, ${C_stats.confidence_intervals.CI_90[1].toFixed(2)}]`);
console.log();

// Validation
const mean_error = Math.abs(C_stats.mean - mean_C) / mean_C * 100;
const std_error = Math.abs(C_stats.std - std_C) / std_C * 100;

console.log('Validation:');
console.log(`  Mean error: ${mean_error.toFixed(2)}% ${mean_error < 2 ? '✅' : '❌'}`);
console.log(`  Std error:  ${std_error.toFixed(2)}% ${std_error < 5 ? '✅' : '❌'}`);
console.log();
console.log();

// Test 2: Uniform Distribution
console.log('TEST 2: Uniform Distribution U(20, 120) MPa');
console.log('─'.repeat(70));

const sigma_min = 20;
const sigma_max = 120;

const sigma_samples = uniformSamples(N, sigma_min, sigma_max);
const sigma_stats = computeStatistics(sigma_samples);

console.log(`Generated ${N} samples from U(${sigma_min}, ${sigma_max})`);
console.log();
console.log('Statistics:');
console.log(`  Mean:   ${sigma_stats.mean.toFixed(2)} (expected: ${(sigma_min + sigma_max) / 2})`);
console.log(`  Std:    ${sigma_stats.std.toFixed(2)} (expected: ${((sigma_max - sigma_min) / Math.sqrt(12)).toFixed(2)})`);
console.log(`  Median: ${sigma_stats.median.toFixed(2)}`);
console.log(`  Min:    ${sigma_stats.min.toFixed(2)} (expected: ${sigma_min})`);
console.log(`  Max:    ${sigma_stats.max.toFixed(2)} (expected: ${sigma_max})`);
console.log();

// Expected for Uniform: mean = (a+b)/2, std = (b-a)/sqrt(12)
const expected_mean = (sigma_min + sigma_max) / 2;
const expected_std = (sigma_max - sigma_min) / Math.sqrt(12);

const mean_error_u = Math.abs(sigma_stats.mean - expected_mean) / expected_mean * 100;
const std_error_u = Math.abs(sigma_stats.std - expected_std) / expected_std * 100;

console.log('Validation:');
console.log(`  Mean error: ${mean_error_u.toFixed(2)}% ${mean_error_u < 2 ? '✅' : '❌'}`);
console.log(`  Std error:  ${std_error_u.toFixed(2)}% ${std_error_u < 5 ? '✅' : '❌'}`);
console.log();
console.log();

// Test 3: Confidence Interval Check
console.log('TEST 3: Confidence Interval Coverage');
console.log('─'.repeat(70));

// Generate samples and check if theoretical value is in CI
const test_value = 14.10;  // Mean of Normal distribution

const samples_for_ci = normalSamples(100, test_value, 1.13);
const ci_stats = computeStatistics(samples_for_ci);

const in_80 = inConfidenceInterval(test_value, ci_stats.confidence_intervals.CI_80);
const in_90 = inConfidenceInterval(test_value, ci_stats.confidence_intervals.CI_90);

console.log(`Test value: ${test_value}`);
console.log(`80% CI: [${ci_stats.confidence_intervals.CI_80[0].toFixed(2)}, ${ci_stats.confidence_intervals.CI_80[1].toFixed(2)}]`);
console.log(`90% CI: [${ci_stats.confidence_intervals.CI_90[0].toFixed(2)}, ${ci_stats.confidence_intervals.CI_90[1].toFixed(2)}]`);
console.log();
console.log(`Value in 80% CI: ${in_80 ? '✅ YES' : '❌ NO'}`);
console.log(`Value in 90% CI: ${in_90 ? '✅ YES' : '❌ NO'}`);
console.log();

// Repeat many times to check coverage
console.log('Coverage test (1000 repetitions):');
let coverage_80 = 0;
let coverage_90 = 0;

for (let rep = 0; rep < 1000; rep++) {
    const samples = normalSamples(100, test_value, 1.13);
    const stats = computeStatistics(samples);

    if (inConfidenceInterval(test_value, stats.confidence_intervals.CI_80)) {
        coverage_80++;
    }
    if (inConfidenceInterval(test_value, stats.confidence_intervals.CI_90)) {
        coverage_90++;
    }
}

const coverage_80_pct = coverage_80 / 1000 * 100;
const coverage_90_pct = coverage_90 / 1000 * 100;

console.log(`  80% CI coverage: ${coverage_80_pct.toFixed(1)}% ${Math.abs(coverage_80_pct - 80) < 5 ? '✅' : '⚠️'} (expected: 80%)`);
console.log(`  90% CI coverage: ${coverage_90_pct.toFixed(1)}% ${Math.abs(coverage_90_pct - 90) < 5 ? '✅' : '⚠️'} (expected: 90%)`);
console.log();

// Test 4: Angle sampling (with clamping)
console.log('TEST 4: Angle Sampling with Bounds');
console.log('─'.repeat(70));

const angle_mean = 45;  // degrees
const angle_std = 10;

const angle_samples = normalSamples(N, angle_mean, angle_std, { min: 10, max: 90 });
const angle_stats = computeStatistics(angle_samples);

console.log(`Generated ${N} samples from N(${angle_mean}°, ${angle_std}°²) clamped to [10°, 90°]`);
console.log();
console.log('Statistics:');
console.log(`  Mean:   ${angle_stats.mean.toFixed(2)}° (slightly biased due to clamping)`);
console.log(`  Median: ${angle_stats.median.toFixed(2)}°`);
console.log(`  Min:    ${angle_stats.min.toFixed(2)}° (expected: ≥10)`);
console.log(`  Max:    ${angle_stats.max.toFixed(2)}° (expected: ≤90)`);
console.log();
console.log('80% CI: [${angle_stats.confidence_intervals.CI_80[0].toFixed(2)}°, ${angle_stats.confidence_intervals.CI_80[1].toFixed(2)}°]');
console.log();

const bounds_ok = angle_stats.min >= 10 && angle_stats.max <= 90;
console.log(`Bounds respected: ${bounds_ok ? '✅ YES' : '❌ NO'}`);
console.log();

// Summary
console.log('═'.repeat(70));
console.log('SUMMARY: All Tests');
console.log('═'.repeat(70));
console.log();

const all_tests = [
    { name: 'Normal mean accuracy', pass: mean_error < 2 },
    { name: 'Normal std accuracy', pass: std_error < 5 },
    { name: 'Uniform mean accuracy', pass: mean_error_u < 2 },
    { name: 'Uniform std accuracy', pass: std_error_u < 5 },
    { name: '80% CI coverage', pass: Math.abs(coverage_80_pct - 80) < 5 },
    { name: '90% CI coverage', pass: Math.abs(coverage_90_pct - 90) < 5 },
    { name: 'Bounds clamping', pass: bounds_ok }
];

all_tests.forEach(test => {
    const status = test.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status} - ${test.name}`);
});

const pass_count = all_tests.filter(t => t.pass).length;
const total_count = all_tests.length;

console.log();
console.log(`Results: ${pass_count}/${total_count} tests passed`);

if (pass_count === total_count) {
    console.log();
    console.log('✅ ALL TESTS PASSED - Sampling utilities ready for Phase 1.3!');
} else {
    console.log();
    console.log(`⚠️  ${total_count - pass_count} test(s) failed - review implementation`);
}

console.log();
console.log('═'.repeat(70));
