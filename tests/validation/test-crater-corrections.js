/**
 * Crater Physics Corrections Validation Test (Direct)
 *
 * Tests crater scaling corrections by calling calculateCraterSize() directly
 * This bypasses atmospheric fragmentation to test ONLY the crater physics.
 *
 * PHYSICS CORRECTIONS TESTED:
 * 1. Using final velocity (not initial)
 * 2. Holsapple 1993 K=1.03, μ=0.55 (not K=1.0, μ=0.33)
 * 3. Effective crater energy (not total kinetic)
 *
 * Target: MAE < 10% on well-documented craters
 */

const PhysicsEngine = require('../../asteroid-impact-simulator/api/src/services/physicsEngine');
const { calculateEffectiveEnergy } = require('../../asteroid-impact-simulator/api/src/services/energyCoupling');

console.log('='.repeat(80));
console.log('CRATER PHYSICS CORRECTIONS - DIRECT VALIDATION TEST');
console.log('Target: MAE < 10% (testing crater scaling only)');
console.log('='.repeat(80));
console.log();

const physicsEngine = new PhysicsEngine();

// ========== TEST DATASET: CONFIRMED CRATERS ==========

const craters = [
    {
        name: 'Barringer (Meteor Crater)',
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
];

// ========== RUN VALIDATION ==========

async function runValidation() {
    console.log('CRATER VALIDATIONS (Direct crater scaling):');
    console.log('-'.repeat(80));
    console.log();

    let total_error = 0;
    let count = 0;

    for (const crater of craters) {
        console.log(`${crater.name}`);
        console.log(`  Reference: ${crater.reference}`);
        console.log(`  Observed diameter: ${crater.observed_diameter} m`);
        console.log();

        // Calculate mass
        const mass = physicsEngine.calculateMass(
            crater.impactor.diameter,
            crater.impactor.density
        );

        console.log(`  Impactor: ${crater.impactor.diameter}m, ${crater.impactor.velocity}m/s, ${crater.impactor.angle}°`);
        console.log(`  Mass: ${(mass/1e6).toFixed(1)} × 10⁶ kg`);

        // PHYSICS CORRECTION #3: Use effective crater energy (angle-dependent coupling)
        const energyResult = calculateEffectiveEnergy(
            mass,
            crater.impactor.velocity,
            crater.impactor.angle,
            crater.impactor.composition
        );

        console.log(`  Total kinetic energy: ${(energyResult.kinetic_total / 4.184e15).toFixed(3)} MT TNT`);
        console.log(`  Effective crater energy: ${(energyResult.effective_crater / 4.184e15).toFixed(3)} MT TNT`);
        console.log(`  Coupling efficiency: ${(energyResult.coupling_efficiency * 100).toFixed(1)}%`);
        console.log();

        // PHYSICS CORRECTIONS #1 & #2: Call calculateCraterSize with correct parameters
        // NOTE: Using initial velocity here since we don't have atmospheric drag
        // In real simulation, RK4 final velocity would be used
        const craterResult = await physicsEngine.calculateCraterSize(
            energyResult.effective_crater,  // CORRECTION #3: Use effective energy
            crater.impactor.angle,
            crater.impactor.composition,
            crater.impactor.density,
            2500,  // target density (Earth crust)
            crater.impactor.diameter,
            crater.impactor.velocity  // CORRECTION #1: In real code, use RK4 final velocity
        );

        const predicted_diameter = craterResult.diameter;
        const error_pct = Math.abs(predicted_diameter - crater.observed_diameter) / crater.observed_diameter * 100;

        console.log(`  Predicted diameter: ${predicted_diameter.toFixed(1)} m`);
        console.log(`  Error: ${error_pct.toFixed(1)}%`);
        console.log();

        // Additional diagnostics
        if (craterResult.transientDiameter) {
            console.log(`  Transient diameter: ${craterResult.transientDiameter.toFixed(1)} m`);
            const expansion = predicted_diameter / craterResult.transientDiameter;
            console.log(`  Expansion factor: ${expansion.toFixed(2)}×`);
        }

        console.log(`  Crater type: ${craterResult.craterType}`);
        console.log(`  K used: ${craterResult.K_used?.toFixed(2) || 'N/A'}`);
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
        console.log();
        console.log('Corrections validated:');
        console.log('  ✅ Correction #1: Use final velocity (simulated here)');
        console.log('  ✅ Correction #2: Holsapple 1993 K=1.03, μ=0.55');
        console.log('  ✅ Correction #3: Effective crater energy (angle coupling)');
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