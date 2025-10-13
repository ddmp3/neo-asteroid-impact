/**
 * SCIENTIFIC VALIDATION SCRIPT v1.6.33
 * Train/Test Split for Crater Formation Model
 *
 * Purpose: Independent validation of crater scaling laws
 * Methodology: 40% train, 30% validation, 30% test
 * Success Criteria: <15% mean error on test set
 */

const axios = require('axios');

// Configuration
const API_BASE = process.env.API_URL || 'https://api.neo.lueger.fr';
const USE_LOCAL = process.argv.includes('--local');
const API_URL = USE_LOCAL ? 'http://localhost:3000' : API_BASE;

console.log(`\n${'='.repeat(80)}`);
console.log(`CRATER VALIDATION v1.6.33 - TRAIN/TEST SPLIT METHODOLOGY`);
console.log(`${'='.repeat(80)}`);
console.log(`API: ${API_URL}`);
console.log(`Timestamp: ${new Date().toISOString()}\n`);

// ===========================================================================
// CRATER DATABASE (20 craters)
// ===========================================================================

const TRAINING_SET = [
    {
        name: 'Barringer (Meteor Crater)',
        location: 'Arizona, USA',
        composition: 'iron',
        density: 7870,
        diameter: 50, // meters
        velocity: 12.8, // km/s
        angle: 80,
        energy_MT: 10.09,
        observed_diameter: 1200, // meters
        crater_type: 'simple',
        reference: 'Shoemaker 1963, Kring 2017',
        quality: 5
    },
    {
        name: 'Odessa',
        location: 'Texas, USA',
        composition: 'iron',
        density: 7870,
        diameter: 12,
        velocity: 12.0,
        angle: 45,
        energy_MT: 0.138,
        observed_diameter: 168,
        crater_type: 'simple',
        reference: 'Evans & Goodwin 1987',
        quality: 4
    },
    {
        name: 'Henbury (Largest)',
        location: 'Australia',
        composition: 'iron',
        density: 7870,
        diameter: 8,
        velocity: 15.0,
        angle: 45,
        energy_MT: 0.086,
        observed_diameter: 180,
        crater_type: 'simple',
        reference: 'Milton 1968',
        quality: 4
    },
    {
        name: 'Kaali',
        location: 'Estonia',
        composition: 'iron',
        density: 7870,
        diameter: 6,
        velocity: 15.0,
        angle: 60,
        energy_MT: 0.016,
        observed_diameter: 110,
        crater_type: 'simple',
        reference: 'Losiak et al. 2016',
        quality: 4
    },
    {
        name: 'Wolfe Creek',
        location: 'Australia',
        composition: 'iron',
        density: 7870,
        diameter: 15,
        velocity: 17.0,
        angle: 70,
        energy_MT: 0.48,
        observed_diameter: 892,
        crater_type: 'simple',
        reference: 'Barrows et al. 2019',
        quality: 4
    },
    {
        name: 'Chicxulub',
        location: 'Mexico',
        composition: 'rocky',
        density: 3000,
        diameter: 12000, // 12 km
        velocity: 20.0,
        angle: 60,
        energy_MT: 47800000, // 47.8 million MT
        observed_diameter: 180000, // 180 km
        crater_type: 'complex',
        reference: 'Hildebrand et al. 1991',
        quality: 5
    },
    {
        name: 'Ries (Nördlinger Ries)',
        location: 'Germany',
        composition: 'rocky',
        density: 3000,
        diameter: 1500, // 1.5 km
        velocity: 20.0,
        angle: 45,
        energy_MT: 253000, // 253,000 MT
        observed_diameter: 24000, // 24 km
        crater_type: 'complex',
        reference: 'Stöffler et al. 2002',
        quality: 5
    },
    {
        name: 'Lonar',
        location: 'India',
        composition: 'rocky',
        density: 3000,
        diameter: 60,
        velocity: 18.0,
        angle: 45,
        energy_MT: 13.15,
        observed_diameter: 1830,
        crater_type: 'simple',
        reference: 'Maloof et al. 2010',
        quality: 4
    }
];

const VALIDATION_SET = [
    {
        name: 'Wabar',
        location: 'Saudi Arabia',
        composition: 'iron',
        density: 7870,
        diameter: 10,
        velocity: 14.0,
        angle: 45,
        energy_MT: 0.094,
        observed_diameter: 116,
        crater_type: 'simple',
        reference: 'Gnos et al. 2013',
        quality: 4
    },
    {
        name: 'Sikhote-Alin',
        location: 'Russia',
        composition: 'iron',
        density: 7870,
        diameter: 3, // largest fragment
        velocity: 14.0,
        angle: 45,
        energy_MT: 0.0021,
        observed_diameter: 26,
        crater_type: 'simple',
        reference: 'Krinov 1966',
        quality: 5
    },
    {
        name: 'Boxhole',
        location: 'Australia',
        composition: 'iron',
        density: 7870,
        diameter: 10,
        velocity: 13.0,
        angle: 60,
        energy_MT: 0.085,
        observed_diameter: 175,
        crater_type: 'simple',
        reference: 'Milton & Michel 1965',
        quality: 3
    },
    {
        name: 'Manicouagan',
        location: 'Canada',
        composition: 'rocky',
        density: 3000,
        diameter: 5000, // 5 km
        velocity: 20.0,
        angle: 45,
        energy_MT: 9370000, // 9.37 million MT
        observed_diameter: 100000, // 100 km
        crater_type: 'complex',
        reference: 'Grieve et al. 1991',
        quality: 4
    },
    {
        name: 'Clearwater West',
        location: 'Canada',
        composition: 'rocky',
        density: 3000,
        diameter: 1800, // 1.8 km
        velocity: 18.0,
        angle: 50,
        energy_MT: 349000, // 349,000 MT
        observed_diameter: 36000, // 36 km
        crater_type: 'complex',
        reference: 'Dence 1965',
        quality: 4
    },
    {
        name: 'Rochechouart',
        location: 'France',
        composition: 'rocky',
        density: 3000,
        diameter: 1500, // 1.5 km
        velocity: 18.0,
        angle: 45,
        energy_MT: 205000, // 205,000 MT
        observed_diameter: 25000, // 25 km (original)
        crater_type: 'complex',
        reference: 'Lambert 2010',
        quality: 3
    }
];

const TEST_SET = [
    {
        name: 'Monturaqui',
        location: 'Chile',
        composition: 'iron',
        density: 7870,
        diameter: 11,
        velocity: 14.0,
        angle: 60,
        energy_MT: 0.129,
        observed_diameter: 460,
        crater_type: 'simple',
        reference: 'Cassidy et al. 1965',
        quality: 4
    },
    {
        name: 'Roter Kamm',
        location: 'Namibia',
        composition: 'iron',
        density: 7870,
        diameter: 18,
        velocity: 15.0,
        angle: 70,
        energy_MT: 0.65,
        observed_diameter: 2500,
        crater_type: 'simple',
        reference: 'Koeberl et al. 1989',
        quality: 4
    },
    {
        name: 'Popigai',
        location: 'Russia',
        composition: 'rocky',
        density: 3000,
        diameter: 7500, // 7.5 km
        velocity: 20.0,
        angle: 60,
        energy_MT: 24900000, // 24.9 million MT
        observed_diameter: 100000, // 100 km
        crater_type: 'complex',
        reference: 'Masaitis 1999',
        quality: 4
    },
    {
        name: 'Bosumtwi',
        location: 'Ghana',
        composition: 'rocky',
        density: 3000,
        diameter: 500, // 0.5 km
        velocity: 20.0,
        angle: 45,
        energy_MT: 9370, // 9,370 MT
        observed_diameter: 10500, // 10.5 km
        crater_type: 'complex',
        reference: 'Koeberl et al. 2007',
        quality: 5
    },
    {
        name: 'Tenoumer',
        location: 'Mauritania',
        composition: 'rocky',
        density: 3000,
        diameter: 50,
        velocity: 18.0,
        angle: 45,
        energy_MT: 7.6,
        observed_diameter: 1900,
        crater_type: 'simple',
        reference: 'Pratesi et al. 2005',
        quality: 3
    },
    {
        name: 'Vredefort',
        location: 'South Africa',
        composition: 'rocky',
        density: 3000,
        diameter: 20000, // 20 km
        velocity: 20.0,
        angle: 45,
        energy_MT: 751000000, // 751 million MT
        observed_diameter: 250000, // 250 km (original)
        crater_type: 'complex',
        reference: 'Allen et al. 2022',
        quality: 4
    }
];

// ===========================================================================
// UTILITY FUNCTIONS
// ===========================================================================

function calculateError(calculated, observed) {
    return ((calculated - observed) / observed) * 100;
}

function calculateStatistics(errors) {
    const absErrors = errors.map(Math.abs);
    const mean = absErrors.reduce((a, b) => a + b, 0) / absErrors.length;
    const signedMean = errors.reduce((a, b) => a + b, 0) / errors.length;

    const sorted = [...absErrors].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    const variance = absErrors.reduce((sum, err) => sum + Math.pow(err - mean, 2), 0) / absErrors.length;
    const stdDev = Math.sqrt(variance);

    const max = Math.max(...absErrors);
    const min = Math.min(...absErrors);

    return {
        mean_absolute: mean,
        mean_signed: signedMean,
        median,
        std_dev: stdDev,
        max,
        min,
        count: errors.length
    };
}

async function testCrater(crater) {
    try {
        const response = await axios.post(`${API_URL}/api/simulate/impact`, {
            diameter: crater.diameter,
            velocity: crater.velocity, // API expects km/s directly
            angle: crater.angle,
            composition: crater.composition,
            density: crater.density,
            impactLocation: { lat: 0, lon: 0 } // Not important for crater calculation
        }, {
            timeout: 30000
        });

        const result = response.data;
        const craterData = result.simulation?.crater || result.crater;
        const calculatedDiameter = craterData?.modifiedDiameter || craterData?.diameter || null;

        return {
            success: true,
            calculated: calculatedDiameter,
            observed: crater.observed_diameter,
            error: calculatedDiameter ? calculateError(calculatedDiameter, crater.observed_diameter) : null,
            data: result
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            calculated: null,
            observed: crater.observed_diameter
        };
    }
}

// ===========================================================================
// VALIDATION PHASES
// ===========================================================================

async function validateSet(setName, craters, color) {
    console.log(`\n${color}${'─'.repeat(80)}`);
    console.log(`${setName.toUpperCase()}`);
    console.log(`${'─'.repeat(80)}\x1b[0m\n`);

    const results = [];
    const errors = [];

    for (const crater of craters) {
        process.stdout.write(`Testing ${crater.name.padEnd(25)} ... `);

        const result = await testCrater(crater);
        results.push({ crater, ...result });

        if (result.success && result.calculated !== null) {
            const errorStr = result.error.toFixed(2);
            const absError = Math.abs(result.error);

            let status;
            if (absError < 5) {
                status = '\x1b[32m✅ EXCELLENT\x1b[0m';
            } else if (absError < 15) {
                status = '\x1b[33m✅ GOOD\x1b[0m';
            } else if (absError < 30) {
                status = '\x1b[33m⚠️  ACCEPTABLE\x1b[0m';
            } else {
                status = '\x1b[31m❌ POOR\x1b[0m';
            }

            console.log(`${result.calculated.toFixed(0)}m vs ${result.observed}m → ${errorStr}% ${status}`);
            errors.push(result.error);
        } else {
            console.log(`\x1b[31m❌ FAILED: ${result.error}\x1b[0m`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Statistics
    if (errors.length > 0) {
        const stats = calculateStatistics(errors);

        console.log(`\n${color}STATISTICS:\x1b[0m`);
        console.log(`  Mean Absolute Error: ${stats.mean_absolute.toFixed(2)}%`);
        console.log(`  Mean Signed Error:   ${stats.mean_signed.toFixed(2)}%`);
        console.log(`  Median Error:        ${stats.median.toFixed(2)}%`);
        console.log(`  Std Deviation:       ${stats.std_dev.toFixed(2)}%`);
        console.log(`  Min Error:           ${stats.min.toFixed(2)}%`);
        console.log(`  Max Error:           ${stats.max.toFixed(2)}%`);
        console.log(`  Success Rate:        ${errors.length}/${craters.length} (${(errors.length/craters.length*100).toFixed(0)}%)`);

        return { results, stats, errors };
    }

    return { results, stats: null, errors: [] };
}

// ===========================================================================
// MAIN VALIDATION
// ===========================================================================

async function main() {
    console.log(`📊 CRATER DATABASE STATISTICS`);
    console.log(`   Training Set:   ${TRAINING_SET.length} craters (40%)`);
    console.log(`   Validation Set: ${VALIDATION_SET.length} craters (30%)`);
    console.log(`   Test Set:       ${TEST_SET.length} craters (30%)`);
    console.log(`   Total:          ${TRAINING_SET.length + VALIDATION_SET.length + TEST_SET.length} craters\n`);

    // Phase 1: Training Set
    console.log(`\n🔴 PHASE 1: TRAINING SET (Calibration)`);
    console.log(`Purpose: Calibrate K coefficients for iron and rocky impactors`);
    const trainResults = await validateSet('Training Set', TRAINING_SET, '\x1b[31m');

    // Phase 2: Validation Set
    console.log(`\n\n🟡 PHASE 2: VALIDATION SET (Hyperparameter Tuning)`);
    console.log(`Purpose: Adjust angle corrections and complex crater scaling`);
    const valResults = await validateSet('Validation Set', VALIDATION_SET, '\x1b[33m');

    // Phase 3: Test Set
    console.log(`\n\n🟢 PHASE 3: TEST SET (Independent Validation)`);
    console.log(`Purpose: Final evaluation on unseen craters`);
    const testResults = await validateSet('Test Set', TEST_SET, '\x1b[32m');

    // ===========================================================================
    // FINAL REPORT
    // ===========================================================================

    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`FINAL VALIDATION REPORT v1.6.33`);
    console.log(`${'='.repeat(80)}\n`);

    const allErrors = [
        ...(trainResults.errors || []),
        ...(valResults.errors || []),
        ...(testResults.errors || [])
    ];
    const overallStats = calculateStatistics(allErrors);

    console.log(`📈 OVERALL PERFORMANCE (All 20 Craters):`);
    console.log(`   Mean Absolute Error: ${overallStats.mean_absolute.toFixed(2)}%`);
    console.log(`   Mean Signed Error:   ${overallStats.mean_signed.toFixed(2)}% ${Math.abs(overallStats.mean_signed) < 3 ? '✅' : '⚠️'}`);
    console.log(`   Median Error:        ${overallStats.median.toFixed(2)}%`);
    console.log(`   Std Deviation:       ${overallStats.std_dev.toFixed(2)}%`);
    console.log(`   Max Error:           ${overallStats.max.toFixed(2)}%`);

    // Success criteria
    console.log(`\n✅ SUCCESS CRITERIA EVALUATION:`);

    const meanOK = overallStats.mean_absolute < 15;
    const biasOK = Math.abs(overallStats.mean_signed) < 3;
    const maxOK = overallStats.max < 30;
    const testMeanOK = testResults.stats ? testResults.stats.mean_absolute < 15 : false;

    console.log(`   ${meanOK ? '✅' : '❌'} Mean Error < 15%: ${overallStats.mean_absolute.toFixed(2)}%`);
    console.log(`   ${biasOK ? '✅' : '❌'} No Systematic Bias (<3%): ${Math.abs(overallStats.mean_signed).toFixed(2)}%`);
    console.log(`   ${maxOK ? '✅' : '❌'} Max Error < 30%: ${overallStats.max.toFixed(2)}%`);
    console.log(`   ${testMeanOK ? '✅' : '❌'} Test Set Mean < 15%: ${testResults.stats ? testResults.stats.mean_absolute.toFixed(2) : 'N/A'}%`);

    const allPassed = meanOK && biasOK && maxOK && testMeanOK;

    console.log(`\n${'='.repeat(80)}`);
    if (allPassed) {
        console.log(`\x1b[32m✅ VALIDATION PASSED - Model is scientifically validated\x1b[0m`);
    } else {
        console.log(`\x1b[31m❌ VALIDATION FAILED - Model requires calibration improvements\x1b[0m`);
    }
    console.log(`${'='.repeat(80)}\n`);

    // Breakdown by composition
    const ironResults = testResults.results.filter(r => r.crater.composition === 'iron' && r.success);
    const rockyResults = testResults.results.filter(r => r.crater.composition === 'rocky' && r.success);

    if (ironResults.length > 0) {
        const ironErrors = ironResults.map(r => r.error);
        const ironStats = calculateStatistics(ironErrors);
        console.log(`🔧 IRON IMPACTORS (Test Set):`);
        console.log(`   Mean Error: ${ironStats.mean_absolute.toFixed(2)}%`);
        console.log(`   Count: ${ironErrors.length} craters`);
    }

    if (rockyResults.length > 0) {
        const rockyErrors = rockyResults.map(r => r.error);
        const rockyStats = calculateStatistics(rockyErrors);
        console.log(`\n🪨 ROCKY IMPACTORS (Test Set):`);
        console.log(`   Mean Error: ${rockyStats.mean_absolute.toFixed(2)}%`);
        console.log(`   Count: ${rockyErrors.length} craters`);
    }

    console.log(`\n📝 RECOMMENDATIONS:`);
    if (!testMeanOK) {
        console.log(`   ⚠️  Test set mean error too high - recalibrate K coefficients`);
    }
    if (!biasOK) {
        console.log(`   ⚠️  Systematic bias detected - check angle corrections`);
    }
    if (!maxOK) {
        console.log(`   ⚠️  Outliers detected - investigate extreme cases`);
    }
    if (allPassed) {
        console.log(`   ✅ Model validated - ready for production deployment`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`Validation completed: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(80)}\n`);
}

// Run validation
main().catch(console.error);
