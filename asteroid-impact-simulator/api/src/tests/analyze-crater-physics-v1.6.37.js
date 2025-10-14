/**
 * CRATER PHYSICS ANALYSIS v1.6.37
 * Expert aerospace/physics approach to correct crater formation model
 *
 * Goals:
 * - <20% error for most craters
 * - <0.9 log error for small craters (factor of ~8)
 * - Identify physical patterns (not just empirical fitting)
 *
 * Methodology:
 * 1. Test all 20 craters with current model
 * 2. Analyze errors by size, composition, angle
 * 3. Apply physics-based corrections
 * 4. Validate on independent test set
 */

const axios = require('axios');

const API_URL = 'https://api.neo.lueger.fr';

// Complete 20-crater database (from CRATER_DATABASE.md)
const CRATER_DATABASE = {
    // TRAINING SET (8 craters - 40%)
    training: [
        {
            name: 'Barringer',
            diameter_m: 50,
            velocity_km_s: 12.8,
            angle_deg: 80,
            composition: 'iron',
            density: 7870,
            energy_MT: 10.09,
            observed_diameter_m: 1200,
            category: 'iron_large'
        },
        {
            name: 'Odessa',
            diameter_m: 12,
            velocity_km_s: 12.0,
            angle_deg: 45,
            composition: 'iron',
            density: 7870,
            energy_MT: 0.138,
            observed_diameter_m: 168,
            category: 'iron_small'
        },
        {
            name: 'Henbury',
            diameter_m: 6,
            velocity_km_s: 12.0,
            angle_deg: 45,
            composition: 'iron',
            density: 7870,
            energy_MT: 0.017,
            observed_diameter_m: 180,
            category: 'iron_tiny'
        },
        {
            name: 'Kaali',
            diameter_m: 6,
            velocity_km_s: 15.0,
            angle_deg: 45,
            composition: 'iron',
            density: 7870,
            energy_MT: 0.034,
            observed_diameter_m: 110,
            category: 'iron_tiny'
        },
        {
            name: 'Wolfe Creek',
            diameter_m: 50,
            velocity_km_s: 12.0,
            angle_deg: 45,
            composition: 'iron',
            density: 7870,
            energy_MT: 7.2,
            observed_diameter_m: 892,
            category: 'iron_large'
        },
        {
            name: 'Chicxulub',
            diameter_m: 11000,
            velocity_km_s: 20.0,
            angle_deg: 60,
            composition: 'rocky',
            density: 3000,
            energy_MT: 100e6,
            observed_diameter_m: 180000,
            category: 'rocky_giant'
        },
        {
            name: 'Ries',
            diameter_m: 1500,
            velocity_km_s: 20.0,
            angle_deg: 45,
            composition: 'rocky',
            density: 3000,
            energy_MT: 3.6e6,
            observed_diameter_m: 24000,
            category: 'rocky_large'
        },
        {
            name: 'Lonar',
            diameter_m: 60,
            velocity_km_s: 20.0,
            angle_deg: 45,
            composition: 'rocky',
            density: 3000,
            energy_MT: 0.216,
            observed_diameter_m: 1830,
            category: 'rocky_small'
        }
    ],

    // VALIDATION SET (6 craters - 30%)
    validation: [
        {
            name: 'Wabar',
            diameter_m: 10,
            velocity_km_s: 12.0,
            angle_deg: 45,
            composition: 'iron',
            density: 7870,
            energy_MT: 0.095,
            observed_diameter_m: 116,
            category: 'iron_small'
        },
        {
            name: 'Sikhote-Alin',
            diameter_m: 3,
            velocity_km_s: 14.0,
            angle_deg: 30,
            composition: 'iron',
            density: 7870,
            energy_MT: 0.002,
            observed_diameter_m: 26,
            category: 'iron_tiny'
        },
        {
            name: 'Boxhole',
            diameter_m: 15,
            velocity_km_s: 12.0,
            angle_deg: 45,
            composition: 'iron',
            density: 7870,
            energy_MT: 0.267,
            observed_diameter_m: 175,
            category: 'iron_small'
        },
        {
            name: 'Manicouagan',
            diameter_m: 5000,
            velocity_km_s: 20.0,
            angle_deg: 60,
            composition: 'rocky',
            density: 3000,
            energy_MT: 40e6,
            observed_diameter_m: 100000,
            category: 'rocky_giant'
        },
        {
            name: 'Clearwater West',
            diameter_m: 1800,
            velocity_km_s: 20.0,
            angle_deg: 45,
            composition: 'rocky',
            density: 3000,
            energy_MT: 5.8e6,
            observed_diameter_m: 36000,
            category: 'rocky_large'
        },
        {
            name: 'Rochechouart',
            diameter_m: 1500,
            velocity_km_s: 20.0,
            angle_deg: 45,
            composition: 'rocky',
            density: 3000,
            energy_MT: 3.6e6,
            observed_diameter_m: 25000,
            category: 'rocky_large'
        }
    ],

    // TEST SET (6 craters - 30%)
    test: [
        {
            name: 'Monturaqui',
            diameter_m: 20,
            velocity_km_s: 12.0,
            angle_deg: 45,
            composition: 'iron',
            density: 7870,
            energy_MT: 0.633,
            observed_diameter_m: 460,
            category: 'iron_small'
        },
        {
            name: 'Roter Kamm',
            diameter_m: 150,
            velocity_km_s: 15.0,
            angle_deg: 45,
            composition: 'iron',
            density: 7870,
            energy_MT: 352,
            observed_diameter_m: 2500,
            category: 'iron_large'
        },
        {
            name: 'Popigai',
            diameter_m: 8000,
            velocity_km_s: 20.0,
            angle_deg: 45,
            composition: 'rocky',
            density: 3000,
            energy_MT: 128e6,
            observed_diameter_m: 100000,
            category: 'rocky_giant'
        },
        {
            name: 'Bosumtwi',
            diameter_m: 500,
            velocity_km_s: 20.0,
            angle_deg: 45,
            composition: 'rocky',
            density: 3000,
            energy_MT: 125000,
            observed_diameter_m: 10500,
            category: 'rocky_large'
        },
        {
            name: 'Tenoumer',
            diameter_m: 100,
            velocity_km_s: 20.0,
            angle_deg: 45,
            composition: 'rocky',
            density: 3000,
            energy_MT: 1,
            observed_diameter_m: 1900,
            category: 'rocky_small'
        },
        {
            name: 'Vredefort',
            diameter_m: 15000,
            velocity_km_s: 20.0,
            angle_deg: 45,
            composition: 'rocky',
            density: 3000,
            energy_MT: 450e6,
            observed_diameter_m: 250000,
            category: 'rocky_giant'
        }
    ]
};

/**
 * Test single crater via API
 */
async function testCrater(crater) {
    try {
        const response = await axios.post(`${API_URL}/api/simulate/impact`, {
            diameter: crater.diameter_m,
            velocity: crater.velocity_km_s,
            angle: crater.angle_deg,
            composition: crater.composition,
            density: crater.density,
            impactLocation: { lat: 0, lon: 0 }
        }, { timeout: 15000 });

        const sim = response.data.simulation;
        const craterData = sim.crater;

        // Use modified diameter (includes terrain effects)
        const calculated = craterData.modifiedDiameter;
        const observed = crater.observed_diameter_m;

        // Linear error
        const error_linear = ((calculated - observed) / observed * 100);

        // Log error (for small craters, more intuitive)
        const error_log = Math.log10(calculated / observed);

        return {
            name: crater.name,
            category: crater.category,
            energy_MT: crater.energy_MT,
            observed_m: observed,
            calculated_m: Math.round(calculated),
            error_linear_pct: Math.round(error_linear * 10) / 10,
            error_log: Math.round(error_log * 1000) / 1000,
            success: true
        };
    } catch (error) {
        return {
            name: crater.name,
            category: crater.category,
            error: error.message,
            success: false
        };
    }
}

/**
 * Analyze patterns in errors
 */
function analyzePatterns(results) {
    const byCategory = {};

    results.forEach(r => {
        if (!r.success) return;

        if (!byCategory[r.category]) {
            byCategory[r.category] = {
                count: 0,
                total_error_linear: 0,
                total_error_log: 0,
                errors: []
            };
        }

        byCategory[r.category].count++;
        byCategory[r.category].total_error_linear += Math.abs(r.error_linear_pct);
        byCategory[r.category].total_error_log += Math.abs(r.error_log);
        byCategory[r.category].errors.push({
            name: r.name,
            error_linear: r.error_linear_pct,
            error_log: r.error_log
        });
    });

    // Calculate means
    Object.keys(byCategory).forEach(cat => {
        const data = byCategory[cat];
        data.mean_error_linear = data.total_error_linear / data.count;
        data.mean_error_log = data.total_error_log / data.count;
    });

    return byCategory;
}

/**
 * Main analysis
 */
async function runAnalysis() {
    console.log('='.repeat(80));
    console.log('CRATER PHYSICS ANALYSIS v1.6.37');
    console.log('Expert Aerospace/Physics Approach');
    console.log('='.repeat(80));
    console.log('');

    // Test all craters
    console.log('📊 TESTING ALL 20 CRATERS...\n');

    const allCraters = [
        ...CRATER_DATABASE.training,
        ...CRATER_DATABASE.validation,
        ...CRATER_DATABASE.test
    ];

    const results = [];
    for (const crater of allCraters) {
        process.stdout.write(`Testing ${crater.name}...`);
        const result = await testCrater(crater);
        results.push(result);

        if (result.success) {
            const status = Math.abs(result.error_linear_pct) < 20 ? '✅' :
                          Math.abs(result.error_log) < 0.9 ? '⚠️' : '❌';
            console.log(` ${status} ${result.error_linear_pct > 0 ? '+' : ''}${result.error_linear_pct}% (log: ${result.error_log})`);
        } else {
            console.log(` ❌ FAILED`);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('PATTERN ANALYSIS BY CATEGORY');
    console.log('='.repeat(80));

    const patterns = analyzePatterns(results);

    Object.keys(patterns).sort().forEach(cat => {
        const data = patterns[cat];
        console.log(`\n📌 ${cat.toUpperCase()} (n=${data.count})`);
        console.log(`   Mean Linear Error: ${data.mean_error_linear.toFixed(1)}%`);
        console.log(`   Mean Log Error: ${data.mean_error_log.toFixed(3)}`);
        console.log(`   Craters:`);
        data.errors.forEach(e => {
            console.log(`     - ${e.name}: ${e.error_linear > 0 ? '+' : ''}${e.error_linear.toFixed(1)}% (log: ${e.error_log.toFixed(3)})`);
        });
    });

    // Overall statistics
    const successful = results.filter(r => r.success);
    const mean_linear = successful.reduce((sum, r) => sum + Math.abs(r.error_linear_pct), 0) / successful.length;
    const mean_log = successful.reduce((sum, r) => sum + Math.abs(r.error_log), 0) / successful.length;

    const within_20pct = successful.filter(r => Math.abs(r.error_linear_pct) < 20).length;
    const within_09log = successful.filter(r => Math.abs(r.error_log) < 0.9).length;

    console.log('\n' + '='.repeat(80));
    console.log('OVERALL STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total Craters Tested: ${results.length}`);
    console.log(`Successful Tests: ${successful.length}`);
    console.log(`Mean Absolute Linear Error: ${mean_linear.toFixed(1)}%`);
    console.log(`Mean Absolute Log Error: ${mean_log.toFixed(3)}`);
    console.log(``);
    console.log(`✅ Within 20% error: ${within_20pct}/${successful.length} (${(within_20pct/successful.length*100).toFixed(0)}%)`);
    console.log(`✅ Within 0.9 log error: ${within_09log}/${successful.length} (${(within_09log/successful.length*100).toFixed(0)}%)`);

    // Acceptance criteria
    console.log('\n' + '='.repeat(80));
    const pass_20 = within_20pct >= successful.length * 0.8; // 80% within 20%
    const pass_log = within_09log >= successful.length * 0.9; // 90% within 0.9 log

    console.log(`ACCEPTANCE CRITERIA:`);
    console.log(`  ${pass_20 ? '✅' : '❌'} 80%+ craters with <20% error: ${pass_20}`);
    console.log(`  ${pass_log ? '✅' : '❌'} 90%+ craters with <0.9 log error: ${pass_log}`);

    if (pass_20 && pass_log) {
        console.log(`\n🎉 MODEL VALIDATED - Ready for production`);
    } else {
        console.log(`\n⚠️  MODEL NEEDS IMPROVEMENT - See patterns above`);
    }

    console.log('='.repeat(80));
}

// Run analysis
runAnalysis().catch(console.error);
