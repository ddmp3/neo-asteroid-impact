#!/usr/bin/env node
/**
 * Direct 61-Crater Validation (No Atmospheric Fragmentation)
 *
 * Tests crater physics formulas directly without API overhead
 * or Monte Carlo atmospheric fragmentation
 */

const PhysicsEngine = require('../../asteroid-impact-simulator/api/src/services/physicsEngine');
const { getAllCraters } = require('../../asteroid-impact-simulator/api/src/data/earthCraterDatabase');
const { calculateEffectiveEnergy } = require('../../asteroid-impact-simulator/api/src/services/energyCoupling');

const physicsEngine = new PhysicsEngine();

async function validateCrater(crater) {
    // Calculate mass
    const radius = crater.impactor.diameter_m / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    const mass = volume * crater.impactor.density_kg_m3;

    // Calculate effective energy with angle coupling
    const energyResult = calculateEffectiveEnergy(
        mass,
        crater.impactor.velocity_m_s,
        crater.impactor.angle_deg,
        crater.impactor.composition
    );

    // Direct crater calculation (bypass atmospheric fragmentation)
    const craterResult = await physicsEngine.calculateCraterSize(
        energyResult.effective_crater,
        crater.impactor.angle_deg,
        crater.impactor.composition,
        crater.impactor.density_kg_m3,
        2500,  // target density
        crater.impactor.diameter_m,
        crater.impactor.velocity_m_s
    );

    const predicted = craterResult.diameter;
    const observed = crater.crater.diameter_m;
    const error_pct = Math.abs(predicted - observed) / observed * 100;

    return {
        name: crater.name,
        observed,
        predicted,
        error_pct,
        confidence: crater.confidence,
        composition: crater.impactor.composition,
        angle: crater.impactor.angle_deg,
        type: crater.crater.type
    };
}

async function runValidation() {
    console.log('='.repeat(80));
    console.log('61-CRATER DIRECT VALIDATION');
    console.log('Method: Direct crater physics (no atmospheric fragmentation)');
    console.log('='.repeat(80));
    console.log();

    const craters = getAllCraters();
    console.log(`Total craters: ${craters.length}\n`);

    const results = [];
    for (const crater of craters) {
        try {
            const result = await validateCrater(crater);
            results.push(result);
            const status = result.error_pct < 10 ? '✅' : result.error_pct < 20 ? '⚠️ ' : '❌';
            console.log(`${status} ${result.name.padEnd(30)} ${result.error_pct.toFixed(1).padStart(6)}% (${result.predicted.toFixed(0)}m vs ${result.observed}m)`);
        } catch (error) {
            console.error(`❌ ${crater.name}: ${error.message}`);
        }
    }

    console.log();
    console.log('='.repeat(80));
    console.log('RESULTS');
    console.log('='.repeat(80));
    console.log();

    // Overall stats
    const errors = results.map(r => r.error_pct);
    const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const median = [...errors].sort((a, b) => a - b)[Math.floor(errors.length / 2)];

    console.log('OVERALL:');
    console.log(`  Craters: ${results.length}`);
    console.log(`  MAE: ${mae.toFixed(2)}%`);
    console.log(`  Median: ${median.toFixed(2)}%`);
    console.log();

    // By confidence
    console.log('BY CONFIDENCE:');
    for (const conf of ['HIGH', 'MEDIUM', 'LOW']) {
        const subset = results.filter(r => r.confidence === conf);
        if (subset.length === 0) continue;
        const conf_mae = subset.map(r => r.error_pct).reduce((s, e) => s + e, 0) / subset.length;
        console.log(`  ${conf.padEnd(6)} (N=${subset.length.toString().padStart(2)}): ${conf_mae.toFixed(2)}%`);
    }
    console.log();

    // By composition
    console.log('BY COMPOSITION:');
    for (const comp of ['iron', 'rocky']) {
        const subset = results.filter(r => r.composition === comp);
        if (subset.length === 0) continue;
        const comp_mae = subset.map(r => r.error_pct).reduce((s, e) => s + e, 0) / subset.length;
        console.log(`  ${comp.toUpperCase().padEnd(5)} (N=${subset.length.toString().padStart(2)}): ${comp_mae.toFixed(2)}%`);
    }
    console.log();

    // By crater type
    console.log('BY CRATER TYPE:');
    for (const type of ['simple', 'complex']) {
        const subset = results.filter(r => r.type === type);
        if (subset.length === 0) continue;
        const type_mae = subset.map(r => r.error_pct).reduce((s, e) => s + e, 0) / subset.length;
        console.log(`  ${type.toUpperCase().padEnd(7)} (N=${subset.length.toString().padStart(2)}): ${type_mae.toFixed(2)}%`);
    }
    console.log();

    // Top 10 best
    console.log('TOP 10 BEST:');
    [...results].sort((a, b) => a.error_pct - b.error_pct).slice(0, 10).forEach((r, i) => {
        console.log(`  ${(i+1).toString().padStart(2)}. ${r.name.padEnd(30)} ${r.error_pct.toFixed(2).padStart(6)}%`);
    });
    console.log();

    // Top 10 worst
    console.log('TOP 10 WORST:');
    [...results].sort((a, b) => b.error_pct - a.error_pct).slice(0, 10).forEach((r, i) => {
        console.log(`  ${(i+1).toString().padStart(2)}. ${r.name.padEnd(30)} ${r.error_pct.toFixed(2).padStart(6)}% [${r.confidence}, ${r.composition}, ${r.angle}°]`);
    });
    console.log();

    // Error distribution
    console.log('ERROR DISTRIBUTION:');
    const bins = [
        { label: '<5%', min: 0, max: 5 },
        { label: '5-10%', min: 5, max: 10 },
        { label: '10-20%', min: 10, max: 20 },
        { label: '20-30%', min: 20, max: 30 },
        { label: '30-50%', min: 30, max: 50 },
        { label: '>50%', min: 50, max: Infinity }
    ];
    for (const bin of bins) {
        const count = results.filter(r => r.error_pct >= bin.min && r.error_pct < bin.max).length;
        const pct = (count / results.length * 100).toFixed(1);
        const bar = '█'.repeat(Math.floor(count / 2));
        console.log(`  ${bin.label.padEnd(8)}: ${count.toString().padStart(2)} (${pct.padStart(5)}%) ${bar}`);
    }
    console.log();

    console.log('='.repeat(80));
    console.log('ASSESSMENT');
    console.log('='.repeat(80));
    console.log();

    if (mae < 10) {
        console.log(`✅ SUCCESS: MAE ${mae.toFixed(2)}% < 10% target`);
    } else if (mae < 20) {
        console.log(`⚠️  PARTIAL: MAE ${mae.toFixed(2)}% < 20%`);
    } else {
        console.log(`❌ FAIL: MAE ${mae.toFixed(2)}% > 20%`);
    }

    const high_conf = results.filter(r => r.confidence === 'HIGH');
    if (high_conf.length > 0) {
        const high_mae = high_conf.map(r => r.error_pct).reduce((s, e) => s + e, 0) / high_conf.length;
        console.log(`\nHIGH CONFIDENCE (N=${high_conf.length}): MAE = ${high_mae.toFixed(2)}%`);
    }

    console.log();
    console.log('Comparison with 2-crater baseline:');
    console.log(`  Previous (2 craters): 10.4%`);
    console.log(`  Current (${results.length} craters): ${mae.toFixed(2)}%`);
    console.log();
    console.log('='.repeat(80));
}

runValidation()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
