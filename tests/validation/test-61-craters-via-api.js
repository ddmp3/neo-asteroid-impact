#!/usr/bin/env node
/**
 * 61-Crater Validation via Azure API
 *
 * Tests physics corrections against full Earth crater database
 * using deployed Azure Container App API.
 *
 * ADVANTAGES OF API APPROACH:
 * - Distributed processing (fast)
 * - Tests real production code
 * - No local compute constraints
 * - Parallel requests possible
 */

const axios = require('axios');
const { getAllCraters } = require('../../asteroid-impact-simulator/api/src/data/earthCraterDatabase');

// Azure API endpoint
const API_URL = process.env.API_URL || 'https://ca-api-ckq6mn38.victoriousglacier-63962c13.canadacentral.azurecontainerapps.io';

// ========== API REQUEST FUNCTION ==========

async function simulateCraterViaAPI(crater) {
    try {
        const response = await axios.post(`${API_URL}/api/simulate/impact`, {
            diameter: crater.impactor.diameter_m,
            velocity: crater.impactor.velocity_m_s / 1000,  // Convert m/s to km/s
            angle: crater.impactor.angle_deg,
            density: crater.impactor.density_kg_m3,
            composition: crater.impactor.composition,
            impactLocation: { lat: 0, lon: 0, elevation: 0 }
        }, {
            timeout: 60000, // 60s timeout
            headers: { 'Content-Type': 'application/json' }
        });

        const result = response.data;

        // Extract crater diameter
        let predicted_diameter = null;
        if (result.crater && result.crater.diameter) {
            predicted_diameter = result.crater.diameter;
        } else if (result.craterDiameter) {
            predicted_diameter = result.craterDiameter;
        }

        if (!predicted_diameter) {
            console.warn(`⚠️  ${crater.name}: No crater diameter in response`);
            return null;
        }

        const observed_diameter = crater.crater.diameter_m;
        const error_pct = Math.abs(predicted_diameter - observed_diameter) / observed_diameter * 100;

        return {
            name: crater.name,
            observed: observed_diameter,
            predicted: predicted_diameter,
            error_pct: error_pct,
            confidence: crater.confidence,
            composition: crater.impactor.composition,
            angle: crater.impactor.angle_deg,
            velocity_km_s: crater.impactor.velocity_m_s / 1000,
            crater_type: crater.crater.type
        };
    } catch (error) {
        console.error(`❌ ${crater.name}: ${error.message}`);
        return null;
    }
}

// ========== PARALLEL PROCESSING WITH RATE LIMITING ==========

async function processCratersInBatches(craters, batchSize = 5, delayMs = 2000) {
    const results = [];

    for (let i = 0; i < craters.length; i += batchSize) {
        const batch = craters.slice(i, i + batchSize);
        console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(craters.length / batchSize)} (craters ${i + 1}-${Math.min(i + batchSize, craters.length)})...`);

        const batchPromises = batch.map(crater => simulateCraterViaAPI(crater));
        const batchResults = await Promise.all(batchPromises);

        results.push(...batchResults.filter(r => r !== null));

        console.log(`  ✓ Completed ${results.length}/${craters.length} craters`);

        // Rate limiting delay between batches
        if (i + batchSize < craters.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}

// ========== MAIN VALIDATION ==========

async function runFullValidation() {
    console.log('='.repeat(80));
    console.log('61-CRATER VALIDATION VIA AZURE API');
    console.log('='.repeat(80));
    console.log();
    console.log(`API Endpoint: ${API_URL}`);
    console.log();

    // Test API connectivity
    console.log('Testing API connectivity...');
    try {
        const healthCheck = await axios.get(`${API_URL}/api/health`, { timeout: 10000 });
        console.log(`✓ API is available (status: ${healthCheck.status})`);
    } catch (error) {
        console.error(`❌ API not available: ${error.message}`);
        console.error('Please ensure Azure deployment is complete and API_URL is correct.');
        process.exit(1);
    }
    console.log();

    // Load craters
    const allCraters = getAllCraters();
    console.log(`Loaded ${allCraters.length} craters from database`);
    console.log();
    console.log('='.repeat(80));
    console.log('PROCESSING CRATERS');
    console.log('='.repeat(80));

    // Process in batches
    const startTime = Date.now();
    const results = await processCratersInBatches(allCraters, 5, 2000);
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log();
    console.log(`\n✓ Processed ${results.length}/${allCraters.length} craters in ${elapsedSec}s`);
    console.log();
    console.log('='.repeat(80));
    console.log('RESULTS');
    console.log('='.repeat(80));
    console.log();

    // ========== OVERALL STATISTICS ==========
    const errors = results.map(r => r.error_pct);
    const mae_overall = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const median_error = [...errors].sort((a, b) => a - b)[Math.floor(errors.length / 2)];
    const max_error = Math.max(...errors);
    const min_error = Math.min(...errors);

    console.log('OVERALL STATISTICS:');
    console.log(`  Craters validated: ${results.length}`);
    console.log(`  Mean Absolute Error (MAE): ${mae_overall.toFixed(2)}%`);
    console.log(`  Median Error: ${median_error.toFixed(2)}%`);
    console.log(`  Min Error: ${min_error.toFixed(2)}%`);
    console.log(`  Max Error: ${max_error.toFixed(2)}%`);
    console.log();

    // ========== BY CONFIDENCE LEVEL ==========
    console.log('BY CONFIDENCE LEVEL:');
    for (const conf of ['HIGH', 'MEDIUM', 'LOW']) {
        const conf_results = results.filter(r => r.confidence === conf);
        if (conf_results.length === 0) continue;

        const conf_errors = conf_results.map(r => r.error_pct);
        const conf_mae = conf_errors.reduce((sum, e) => sum + e, 0) / conf_errors.length;

        console.log(`  ${conf.padEnd(6)} (N=${conf_results.length.toString().padStart(2)}): MAE = ${conf_mae.toFixed(2)}%`);
    }
    console.log();

    // ========== BY COMPOSITION ==========
    console.log('BY COMPOSITION:');
    for (const comp of ['iron', 'rocky']) {
        const comp_results = results.filter(r => r.composition === comp);
        if (comp_results.length === 0) continue;

        const comp_errors = comp_results.map(r => r.error_pct);
        const comp_mae = comp_errors.reduce((sum, e) => sum + e, 0) / comp_errors.length;

        console.log(`  ${comp.toUpperCase().padEnd(5)} (N=${comp_results.length.toString().padStart(2)}): MAE = ${comp_mae.toFixed(2)}%`);
    }
    console.log();

    // ========== BY CRATER TYPE ==========
    console.log('BY CRATER TYPE:');
    for (const type of ['simple', 'complex']) {
        const type_results = results.filter(r => r.crater_type === type);
        if (type_results.length === 0) continue;

        const type_errors = type_results.map(r => r.error_pct);
        const type_mae = type_errors.reduce((sum, e) => sum + e, 0) / type_errors.length;

        console.log(`  ${type.toUpperCase().padEnd(7)} (N=${type_results.length.toString().padStart(2)}): MAE = ${type_mae.toFixed(2)}%`);
    }
    console.log();

    // ========== TOP 10 BEST ==========
    console.log('TOP 10 BEST PREDICTIONS:');
    const sorted_best = [...results].sort((a, b) => a.error_pct - b.error_pct).slice(0, 10);
    sorted_best.forEach((r, i) => {
        console.log(`  ${(i+1).toString().padStart(2)}. ${r.name.padEnd(30)}: ${r.error_pct.toFixed(2).padStart(6)}% (${r.predicted.toFixed(0)}m vs ${r.observed}m)`);
    });
    console.log();

    // ========== TOP 10 WORST ==========
    console.log('TOP 10 WORST PREDICTIONS:');
    const sorted_worst = [...results].sort((a, b) => b.error_pct - a.error_pct).slice(0, 10);
    sorted_worst.forEach((r, i) => {
        console.log(`  ${(i+1).toString().padStart(2)}. ${r.name.padEnd(30)}: ${r.error_pct.toFixed(2).padStart(6)}% (${r.predicted.toFixed(0)}m vs ${r.observed}m)`);
        console.log(`      [${r.confidence} confidence, ${r.composition}, ${r.angle}°, ${r.velocity_km_s.toFixed(1)} km/s]`);
    });
    console.log();

    // ========== ERROR DISTRIBUTION ==========
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
        console.log(`  ${bin.label.padEnd(8)}: ${count.toString().padStart(2)} craters (${pct.padStart(5)}%) ${bar}`);
    }
    console.log();

    // ========== FINAL ASSESSMENT ==========
    console.log('='.repeat(80));
    console.log('FINAL ASSESSMENT');
    console.log('='.repeat(80));
    console.log();

    if (mae_overall < 10) {
        console.log(`✅ SUCCESS: MAE ${mae_overall.toFixed(2)}% < 10% target`);
    } else if (mae_overall < 20) {
        console.log(`⚠️  PARTIAL: MAE ${mae_overall.toFixed(2)}% < 20%`);
    } else {
        console.log(`❌ FAIL: MAE ${mae_overall.toFixed(2)}% > 20%`);
    }
    console.log();

    // High confidence subset
    const high_conf = results.filter(r => r.confidence === 'HIGH');
    if (high_conf.length > 0) {
        const high_conf_mae = high_conf.map(r => r.error_pct).reduce((sum, e) => sum + e, 0) / high_conf.length;
        console.log(`HIGH CONFIDENCE SUBSET (N=${high_conf.length}): MAE = ${high_conf_mae.toFixed(2)}%`);
        if (high_conf_mae < 10) {
            console.log('✅ Physics model validated on well-constrained craters');
        }
    }
    console.log();

    // Comparison with 2-crater baseline
    console.log('COMPARISON WITH 2-CRATER BASELINE:');
    console.log(`  Previous MAE (2 craters): 10.4%`);
    console.log(`  Current MAE (${results.length} craters): ${mae_overall.toFixed(2)}%`);
    console.log(`  Difference: ${(mae_overall - 10.4).toFixed(2)}%`);
    console.log();

    console.log('='.repeat(80));

    return {
        mae_overall,
        results_count: results.length,
        elapsed_sec: elapsedSec,
        results: results
    };
}

// ========== RUN ==========

runFullValidation()
    .then(stats => {
        console.log(`\n✓ Validation complete: MAE = ${stats.mae_overall.toFixed(2)}% (N=${stats.results_count})`);
        process.exit(0);
    })
    .catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });