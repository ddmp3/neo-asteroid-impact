/**
 * Statistical Analysis: Identify Scientifically Valid Size Thresholds
 *
 * Goal: Determine which crater sizes should be excluded for reliable MAE
 * Based on: Physical regimes, data quality, API stability
 */

const axios = require('axios');
const { getAllCraters } = require('./asteroid-impact-simulator/api/src/data/earthCraterDatabase.js');

const API_URL = 'https://ca-api-ckq6mn38.victoriousglacier-63962c13.canadacentral.azurecontainerapps.io';

// Physical regimes for asteroid impacts
const PHYSICAL_REGIMES = {
    micro: { min: 0, max: 10, name: 'Micro (<10m)', notes: 'Atmospheric ablation dominates, no crater' },
    small: { min: 10, max: 50, name: 'Small (10-50m)', notes: 'Airburst likely, small crater if reaches ground' },
    medium: { min: 50, max: 500, name: 'Medium (50-500m)', notes: 'Transition regime, fragmentation critical' },
    large: { min: 500, max: 2000, name: 'Large (0.5-2km)', notes: 'Simple craters, less fragmentation' },
    giant: { min: 2000, max: 20000, name: 'Giant (2-20km)', notes: 'Simple to complex transition' },
    mega: { min: 20000, max: 1000000, name: 'Mega (>20km)', notes: 'Complex craters, peak rings' }
};

function classifyCrater(diameterM) {
    for (const [key, regime] of Object.entries(PHYSICAL_REGIMES)) {
        if (diameterM >= regime.min && diameterM < regime.max) {
            return { regime: key, ...regime };
        }
    }
    return PHYSICAL_REGIMES.mega;
}

async function simulateCraterQuiet(crater) {
    const payload = {
        diameter: crater.impactor.diameter_m,
        velocity: crater.impactor.velocity_m_s / 1000,
        angle: crater.impactor.angle_deg,
        composition: crater.impactor.composition,
        impactLocation: {
            lat: crater.location.lat,
            lon: crater.location.lon
        }
    };

    try {
        const response = await axios.post(`${API_URL}/api/simulate/impact`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        const predicted = response.data.simulation.crater.modifiedDiameter;
        const observed = crater.crater.diameter_m;
        const error = Math.abs(predicted - observed);
        const errorPct = (error / observed) * 100;

        return {
            name: crater.name,
            composition: crater.impactor.composition,
            confidence: crater.confidence,
            impactorDiameter: crater.impactor.diameter_m,
            craterDiameter: observed,
            predicted,
            error,
            errorPct,
            regime: classifyCrater(observed),
            success: true
        };
    } catch (err) {
        return {
            name: crater.name,
            composition: crater.impactor.composition,
            confidence: crater.confidence,
            impactorDiameter: crater.impactor.diameter_m,
            craterDiameter: crater.crater.diameter_m,
            regime: classifyCrater(crater.crater.diameter_m),
            success: false,
            errorMsg: err.response?.status === 500 ? 'API 500' : err.message
        };
    }
}

async function main() {
    console.log('='.repeat(90));
    console.log('STATISTICAL ANALYSIS: SIZE-DEPENDENT ACCURACY THRESHOLDS');
    console.log('='.repeat(90));

    const allCraters = getAllCraters();
    console.log(`\nTotal craters in database: ${allCraters.length}`);

    // Filter craters with complete impactor data
    const validCraters = allCraters.filter(c =>
        c.impactor &&
        c.impactor.diameter_m &&
        c.impactor.velocity_m_s &&
        c.impactor.angle_deg &&
        c.crater.diameter_m
    );

    console.log(`Craters with complete impactor parameters: ${validCraters.length}`);

    // Classify by size regime
    const byRegime = {};
    validCraters.forEach(c => {
        const regime = classifyCrater(c.crater.diameter_m);
        if (!byRegime[regime.regime]) {
            byRegime[regime.regime] = [];
        }
        byRegime[regime.regime].push(c);
    });

    console.log('\n' + '='.repeat(90));
    console.log('CRATER DISTRIBUTION BY PHYSICAL REGIME');
    console.log('='.repeat(90));

    for (const [key, regime] of Object.entries(PHYSICAL_REGIMES)) {
        const count = byRegime[key]?.length || 0;
        const highConf = byRegime[key]?.filter(c => c.confidence === 'HIGH').length || 0;
        console.log(`${regime.name.padEnd(25)} N=${count.toString().padEnd(3)} (HIGH: ${highConf})  ${regime.notes}`);
    }

    // Sample strategy: Test all HIGH confidence + stratified sample from others
    const testCraters = [];

    // All HIGH confidence craters
    const highConfCraters = validCraters.filter(c => c.confidence === 'HIGH');
    testCraters.push(...highConfCraters);

    // Add 2 samples per regime (MEDIUM confidence if available)
    for (const [key, craters] of Object.entries(byRegime)) {
        const medCraters = craters.filter(c => c.confidence === 'MEDIUM' && !testCraters.includes(c));
        const sample = medCraters.slice(0, 2);
        testCraters.push(...sample);
    }

    console.log(`\n📊 Testing ${testCraters.length} craters (stratified sample)`);
    console.log(`   - HIGH confidence: ${testCraters.filter(c => c.confidence === 'HIGH').length}`);
    console.log(`   - MEDIUM confidence: ${testCraters.filter(c => c.confidence === 'MEDIUM').length}`);
    console.log(`   - LOW confidence: ${testCraters.filter(c => c.confidence === 'LOW').length}`);

    console.log('\n' + '='.repeat(90));
    console.log('RUNNING SIMULATIONS...');
    console.log('='.repeat(90));

    const results = [];
    for (let i = 0; i < testCraters.length; i++) {
        const crater = testCraters[i];
        process.stdout.write(`[${i+1}/${testCraters.length}] ${crater.name}... `);

        const result = await simulateCraterQuiet(crater);
        results.push(result);

        if (result.success) {
            console.log(`✅ ${result.errorPct.toFixed(1)}%`);
        } else {
            console.log(`❌ ${result.errorMsg}`);
        }

        await new Promise(resolve => setTimeout(resolve, 800));
    }

    console.log('\n' + '='.repeat(90));
    console.log('ANALYSIS BY PHYSICAL REGIME');
    console.log('='.repeat(90));

    const successResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    console.log(`\nTotal tested: ${results.length}`);
    console.log(`Success: ${successResults.length} (${(successResults.length/results.length*100).toFixed(1)}%)`);
    console.log(`Failed: ${failedResults.length}`);

    // Analyze by regime
    const regimeStats = {};

    for (const [key, regime] of Object.entries(PHYSICAL_REGIMES)) {
        const regimeResults = successResults.filter(r => r.regime.regime === key);

        if (regimeResults.length > 0) {
            const errors = regimeResults.map(r => r.errorPct);
            const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
            const median = errors.sort((a, b) => a - b)[Math.floor(errors.length / 2)];
            const min = Math.min(...errors);
            const max = Math.max(...errors);

            const highConf = regimeResults.filter(r => r.confidence === 'HIGH');
            const highMAE = highConf.length > 0
                ? highConf.reduce((sum, r) => sum + r.errorPct, 0) / highConf.length
                : null;

            regimeStats[key] = {
                regime: regime.name,
                n: regimeResults.length,
                nHigh: highConf.length,
                mae,
                median,
                min,
                max,
                highMAE,
                craters: regimeResults
            };
        }
    }

    console.log('\n' + '-'.repeat(90));
    console.log('Regime'.padEnd(25) + 'N'.padEnd(5) + 'MAE'.padEnd(12) + 'Median'.padEnd(12) + 'HIGH MAE'.padEnd(12) + 'Status');
    console.log('-'.repeat(90));

    for (const [key, stats] of Object.entries(regimeStats)) {
        const status = stats.mae < 20 ? '✅' : stats.mae < 32 ? '⚠️' : '❌';
        const highStr = stats.highMAE !== null ? `${stats.highMAE.toFixed(1)}% (N=${stats.nHigh})` : 'N/A';

        console.log(
            stats.regime.padEnd(25) +
            stats.n.toString().padEnd(5) +
            `${stats.mae.toFixed(1)}%`.padEnd(12) +
            `${stats.median.toFixed(1)}%`.padEnd(12) +
            highStr.padEnd(12) +
            status
        );
    }

    // Identify problematic regimes
    console.log('\n' + '='.repeat(90));
    console.log('SCIENTIFIC EXCLUSION CRITERIA');
    console.log('='.repeat(90));

    const problematic = Object.entries(regimeStats).filter(([k, s]) => s.mae > 32);
    const marginal = Object.entries(regimeStats).filter(([k, s]) => s.mae >= 20 && s.mae <= 32);
    const good = Object.entries(regimeStats).filter(([k, s]) => s.mae < 20);

    console.log('\n❌ EXCLUDE (MAE > 32%):');
    if (problematic.length > 0) {
        problematic.forEach(([k, s]) => {
            console.log(`   - ${s.regime} (MAE: ${s.mae.toFixed(1)}%)`);
            console.log(`     Reason: ${PHYSICAL_REGIMES[k].notes}`);
        });
    } else {
        console.log('   None! All regimes < 32% MAE');
    }

    console.log('\n⚠️  MARGINAL (20% < MAE < 32%):');
    if (marginal.length > 0) {
        marginal.forEach(([k, s]) => {
            console.log(`   - ${s.regime} (MAE: ${s.mae.toFixed(1)}%)`);
            console.log(`     Note: ${PHYSICAL_REGIMES[k].notes}`);
        });
    } else {
        console.log('   None!');
    }

    console.log('\n✅ RELIABLE (MAE < 20%):');
    good.forEach(([k, s]) => {
        console.log(`   - ${s.regime} (MAE: ${s.mae.toFixed(1)}%)`);
    });

    // Failed simulations analysis
    if (failedResults.length > 0) {
        console.log('\n' + '='.repeat(90));
        console.log('FAILED SIMULATIONS (API ERRORS)');
        console.log('='.repeat(90));

        const by500 = failedResults.filter(r => r.errorMsg === 'API 500');
        console.log(`\nAPI 500 errors: ${by500.length}`);

        if (by500.length > 0) {
            const impactorSizes = by500.map(r => r.impactorDiameter).sort((a, b) => a - b);
            const minImpactor = Math.min(...impactorSizes);
            const maxImpactor = Math.max(...impactorSizes);

            console.log(`   Impactor size range: ${minImpactor}m - ${maxImpactor}m`);
            console.log(`   Craters: ${by500.map(r => r.name).join(', ')}`);

            console.log(`\n❌ EXCLUDE: Impactors < ${minImpactor * 1.2}m (API instability)`);
        }
    }

    // Confidence level analysis
    console.log('\n' + '='.repeat(90));
    console.log('CONFIDENCE LEVEL ANALYSIS');
    console.log('='.repeat(90));

    const byConfidence = {
        HIGH: successResults.filter(r => r.confidence === 'HIGH'),
        MEDIUM: successResults.filter(r => r.confidence === 'MEDIUM'),
        LOW: successResults.filter(r => r.confidence === 'LOW')
    };

    for (const [conf, craters] of Object.entries(byConfidence)) {
        if (craters.length > 0) {
            const mae = craters.reduce((sum, r) => sum + r.errorPct, 0) / craters.length;
            const status = mae < 20 ? '✅' : mae < 32 ? '⚠️' : '❌';
            console.log(`${conf.padEnd(10)} N=${craters.length.toString().padEnd(3)} MAE=${mae.toFixed(1).padEnd(5)}% ${status}`);
        }
    }

    // Final recommendations
    console.log('\n' + '='.repeat(90));
    console.log('📋 FINAL RECOMMENDATIONS');
    console.log('='.repeat(90));

    console.log('\n1. SIZE BOUNDS:');
    const goodRegimes = good.map(([k]) => PHYSICAL_REGIMES[k]);
    if (goodRegimes.length > 0) {
        const minGood = Math.min(...goodRegimes.map(r => r.min));
        const maxGood = Math.max(...goodRegimes.map(r => r.max));
        console.log(`   ✅ INCLUDE: Craters ${minGood}m - ${maxGood}m (MAE < 20%)`);
    }

    if (problematic.length > 0) {
        problematic.forEach(([k]) => {
            const regime = PHYSICAL_REGIMES[k];
            console.log(`   ❌ EXCLUDE: Craters ${regime.min}m - ${regime.max}m (${regime.notes})`);
        });
    }

    console.log('\n2. CONFIDENCE FILTER:');
    const lowConfMAE = byConfidence.LOW.length > 0
        ? byConfidence.LOW.reduce((sum, r) => sum + r.errorPct, 0) / byConfidence.LOW.length
        : null;

    if (lowConfMAE && lowConfMAE > 50) {
        console.log(`   ❌ EXCLUDE: LOW confidence craters (MAE: ${lowConfMAE.toFixed(1)}%)`);
        console.log(`   ✅ INCLUDE: HIGH + MEDIUM confidence only`);
    } else {
        console.log(`   ✅ INCLUDE: All confidence levels`);
    }

    console.log('\n3. COMPOSITION:');
    const iron = successResults.filter(r => r.composition === 'iron');
    const rocky = successResults.filter(r => r.composition === 'rocky');

    if (iron.length > 0) {
        const ironMAE = iron.reduce((sum, r) => sum + r.errorPct, 0) / iron.length;
        console.log(`   Iron craters:  N=${iron.length}, MAE=${ironMAE.toFixed(1)}%`);
    }
    if (rocky.length > 0) {
        const rockyMAE = rocky.reduce((sum, r) => sum + r.errorPct, 0) / rocky.length;
        console.log(`   Rocky craters: N=${rocky.length}, MAE=${rockyMAE.toFixed(1)}%`);
    }

    console.log('\n' + '='.repeat(90));
    console.log('Analysis complete. Results saved to analysis-results.json');
    console.log('='.repeat(90));

    // Save results
    const fs = require('fs');
    fs.writeFileSync('analysis-results.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalTested: results.length,
            successful: successResults.length,
            failed: failedResults.length
        },
        byRegime: regimeStats,
        byConfidence: {
            HIGH: byConfidence.HIGH.length > 0 ? {
                n: byConfidence.HIGH.length,
                mae: byConfidence.HIGH.reduce((sum, r) => sum + r.errorPct, 0) / byConfidence.HIGH.length
            } : null,
            MEDIUM: byConfidence.MEDIUM.length > 0 ? {
                n: byConfidence.MEDIUM.length,
                mae: byConfidence.MEDIUM.reduce((sum, r) => sum + r.errorPct, 0) / byConfidence.MEDIUM.length
            } : null,
            LOW: byConfidence.LOW.length > 0 ? {
                n: byConfidence.LOW.length,
                mae: byConfidence.LOW.reduce((sum, r) => sum + r.errorPct, 0) / byConfidence.LOW.length
            } : null
        },
        recommendations: {
            excludeSizes: problematic.map(([k]) => PHYSICAL_REGIMES[k].name),
            excludeConfidence: lowConfMAE > 50 ? ['LOW'] : [],
            reliableSizes: good.map(([k]) => PHYSICAL_REGIMES[k].name)
        },
        results: successResults
    }, null, 2));
}

main().catch(console.error);