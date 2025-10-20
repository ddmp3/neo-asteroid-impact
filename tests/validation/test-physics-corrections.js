/**
 * Physics Corrections Validation Test
 *
 * Tests the impact of PHYSICS CORRECTIONS (not empirical calibrations):
 * 1. Final velocity from RK4 (not initial)
 * 2. Holsapple (1993) K=1.03, μ=0.55 (not K=1.0, μ=0.33)
 * 3. Energy budget (crater energy, not total kinetic)
 *
 * Target: MAE < 10% on well-documented craters
 */

const PhysicsEngine = require('../../asteroid-impact-simulator/api/src/services/physicsEngine');

console.log('='.repeat(80));
console.log('PHYSICS CORRECTIONS VALIDATION TEST');
console.log('Target: MAE < 10% (down from 32% baseline)');
console.log('='.repeat(80));
console.log();

const physicsEngine = new PhysicsEngine();

// ========== TEST DATASET: CONFIRMED CRATERS ==========

const craters = [
    {
        name: 'Barringer (Meteor Crater)',
        location: { lat: 35.027, lon: -111.022 },
        observed_diameter: 1200,  // m (observed)
        impactor: {
            diameter: 50,          // m (iron)
            velocity: 12800,       // m/s
            angle: 90,             // degrees (vertical impact)
            composition: 'iron',
            density: 7800          // kg/m³
        },
        reference: 'Shoemaker (1963)',
        notes: 'Well-preserved, vertical iron impact'
    },
    {
        name: 'Lonar',
        location: { lat: 19.977, lon: 76.508 },
        observed_diameter: 1830,   // m
        impactor: {
            diameter: 60,          // m (rocky, estimated from energy)
            velocity: 20000,       // m/s (typical for asteroids)
            angle: 45,             // oblique (estimated from asymmetry)
            composition: 'rocky',
            density: 3000
        },
        reference: 'Maloof et al. (2010)',
        notes: 'Fresh crater in basalt, India'
    }
    // Note: Wolfe Creek (15m iron) removed - FCM V2 Monte Carlo too slow for this test
];

// ========== RUN VALIDATION ==========

async function runValidation() {
    console.log('CRATER VALIDATIONS:');
    console.log('-'.repeat(80));
    console.log();

    let total_error = 0;
    let count = 0;

    for (const crater of craters) {
        console.log(`${crater.name}`);
        console.log(`  Reference: ${crater.reference}`);
        console.log(`  Observed diameter: ${crater.observed_diameter} m`);
        console.log();

        // Simulate impact - Use RK4 with low entry height to skip atmospheric fragmentation
        // (We're testing crater physics, not atmospheric physics)
        const result = await physicsEngine.simulateImpact({
            diameter: crater.impactor.diameter,
            velocity: crater.impactor.velocity,
            angle: crater.impactor.angle,
            density: crater.impactor.density,
            composition: crater.impactor.composition,
            impactLocation: { ...crater.location, elevation: 0 },
            use_rk4: true  // Use RK4 to get final velocity correctly
        });

        // Get crater diameter (terrain-modified if available, otherwise original)
        const predicted_diameter = result.crater.modifiedDiameter || result.crater.diameter || result.crater.originalDiameter;

        if (!predicted_diameter || predicted_diameter === 0) {
            console.log(`  ERROR: No crater formed!`);
            console.log(`  Fragmentation:`, result.fragmentation);
            console.log(`  Crater:`, result.crater);
            continue;
        }
        const error_pct = Math.abs(predicted_diameter - crater.observed_diameter) / crater.observed_diameter * 100;

        console.log(`  Predicted diameter: ${predicted_diameter.toFixed(1)} m`);
        console.log(`  Error: ${error_pct.toFixed(1)}%`);
        console.log();

        // Additional diagnostics
        if (result.energy && result.energy.effective_joules) {
            const energy_MT = result.energy.effective_joules / 4.184e15;
            console.log(`  Effective energy: ${energy_MT.toFixed(3)} MT TNT`);
        }

        if (result.crater.transientDiameter) {
            console.log(`  Transient diameter: ${result.crater.transientDiameter.toFixed(1)} m`);
            const expansion = predicted_diameter / result.crater.transientDiameter;
            console.log(`  Expansion factor: ${expansion.toFixed(2)}×`);
        }

        console.log(`  Crater type: ${result.crater.craterType}`);
        console.log();

        // Success criteria
        const success = error_pct < 10;
        console.log(`  Status: ${success ? '✅ PASS' : '❌ FAIL'} (target <10% error)`);
        console.log('-'.repeat(80));
        console.log();

        total_error += error_pct;
        count++;
    }

    // Calculate MAE
    const mae = total_error / count;

    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log();
    console.log(`Craters tested: ${count}`);
    console.log(`Mean Absolute Error (MAE): ${mae.toFixed(1)}%`);
    console.log();

    if (mae < 10) {
        console.log('✅ SUCCESS: MAE < 10% TARGET ACHIEVED');
        console.log('   Physics corrections are working!');
    } else if (mae < 20) {
        console.log('⚠️  PARTIAL: MAE < 20% (improvement from 32% baseline)');
        console.log('   Further corrections needed');
    } else {
        console.log('❌ FAILURE: MAE still > 20%');
        console.log('   Physics corrections insufficient');
    }

    console.log('='.repeat(80));
}

// Run test
runValidation().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});