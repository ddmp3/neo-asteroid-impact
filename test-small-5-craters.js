/**
 * Test 5 Smallest Craters via API
 * Calculate MAE (Mean Absolute Error) for small crater diameter prediction
 */

const axios = require('axios');

const API_URL = 'https://ca-api-ckq6mn38.victoriousglacier-63962c13.canadacentral.azurecontainerapps.io';

// 5 smallest craters from database (sorted by crater diameter - ascending)
const SMALL_5_CRATERS = [
    {
        name: 'Haviland',
        location: { lat: 37.583, lon: -99.100 },
        crater: { diameter_m: 11 },
        impactor: { composition: 'iron', diameter_m: 1.5, velocity_m_s: 16000, angle_deg: 50, density_kg_m3: 7800 },
        confidence: 'LOW'
    },
    {
        name: 'Dalgaranga',
        location: { lat: -27.683, lon: 117.050 },
        crater: { diameter_m: 24 },
        impactor: { composition: 'iron', diameter_m: 2, velocity_m_s: 15000, angle_deg: 60, density_kg_m3: 7800 },
        confidence: 'MEDIUM'
    },
    {
        name: 'Sikhote-Alin (largest)',
        location: { lat: 46.133, lon: 134.650 },
        crater: { diameter_m: 26 },
        impactor: { composition: 'iron', diameter_m: 10, velocity_m_s: 14000, angle_deg: 45, density_kg_m3: 7800 },
        confidence: 'HIGH',
        notes: 'Witnessed fall 1947. Crater field of 122 craters.'
    },
    {
        name: 'Whitecourt',
        location: { lat: 54.133, lon: -115.583 },
        crater: { diameter_m: 36 },
        impactor: { composition: 'iron', diameter_m: 3, velocity_m_s: 13000, angle_deg: 50, density_kg_m3: 7800 },
        confidence: 'MEDIUM',
        notes: 'Well-preserved young crater'
    },
    {
        name: 'Sobolev',
        location: { lat: 46.183, lon: 137.883 },
        crater: { diameter_m: 53 },
        impactor: { composition: 'iron', diameter_m: 3.5, velocity_m_s: 15000, angle_deg: 60, density_kg_m3: 7800 },
        confidence: 'LOW',
        notes: 'Part of Sikhote-Alin crater field region'
    }
];

async function simulateCrater(crater) {
    const payload = {
        diameter: crater.impactor.diameter_m,
        velocity: crater.impactor.velocity_m_s / 1000, // Convert m/s to km/s
        angle: crater.impactor.angle_deg,
        composition: crater.impactor.composition,
        impactLocation: {
            lat: crater.location.lat,
            lon: crater.location.lon
        }
    };

    console.log(`\n📍 Simulating ${crater.name}...`);
    console.log(`   Confidence: ${crater.confidence}`);
    console.log(`   Impactor: ${crater.impactor.diameter_m}m ${crater.impactor.composition} @ ${crater.impactor.velocity_m_s / 1000} km/s, ${crater.impactor.angle_deg}°`);
    console.log(`   Observed crater: ${crater.crater.diameter_m}m`);
    if (crater.notes) console.log(`   Note: ${crater.notes}`);

    try {
        const response = await axios.post(`${API_URL}/api/simulate/impact`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        const predicted = response.data.simulation.crater.modifiedDiameter;
        const observed = crater.crater.diameter_m;
        const error = Math.abs(predicted - observed);
        const errorPct = (error / observed) * 100;

        console.log(`   ✅ Predicted crater: ${predicted.toFixed(1)}m`);
        console.log(`   📊 Error: ${error.toFixed(1)}m (${errorPct.toFixed(2)}%)`);

        return {
            name: crater.name,
            confidence: crater.confidence,
            observed,
            predicted,
            error,
            errorPct
        };
    } catch (err) {
        console.error(`   ❌ ERROR: ${err.message}`);
        return {
            name: crater.name,
            confidence: crater.confidence,
            observed: crater.crater.diameter_m,
            predicted: null,
            error: null,
            errorPct: null,
            failed: true
        };
    }
}

async function main() {
    console.log('='.repeat(80));
    console.log('5 SMALLEST CRATERS - API VALIDATION');
    console.log('='.repeat(80));
    console.log(`API: ${API_URL}`);
    console.log(`Total craters: ${SMALL_5_CRATERS.length}`);

    const results = [];

    for (const crater of SMALL_5_CRATERS) {
        const result = await simulateCrater(crater);
        results.push(result);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY RESULTS');
    console.log('='.repeat(80));

    const successful = results.filter(r => !r.failed);
    const failed = results.filter(r => r.failed);

    if (successful.length > 0) {
        console.log('\n📊 SUCCESSFUL SIMULATIONS:');
        console.log('-'.repeat(80));
        console.log('Name'.padEnd(25) + 'Conf'.padEnd(8) + 'Obs (m)'.padEnd(10) + 'Pred (m)'.padEnd(12) + 'Error (%)');
        console.log('-'.repeat(80));

        successful.forEach(r => {
            console.log(
                r.name.padEnd(25) +
                r.confidence.padEnd(8) +
                r.observed.toFixed(0).padEnd(10) +
                r.predicted.toFixed(1).padEnd(12) +
                r.errorPct.toFixed(2) + '%'
            );
        });

        // Calculate MAE
        const mae = successful.reduce((sum, r) => sum + r.errorPct, 0) / successful.length;
        const median = successful.map(r => r.errorPct).sort((a, b) => a - b)[Math.floor(successful.length / 2)];
        const min = Math.min(...successful.map(r => r.errorPct));
        const max = Math.max(...successful.map(r => r.errorPct));

        // Stats by confidence level
        const highConf = successful.filter(r => r.confidence === 'HIGH');
        const medConf = successful.filter(r => r.confidence === 'MEDIUM');
        const lowConf = successful.filter(r => r.confidence === 'LOW');

        console.log('\n' + '='.repeat(80));
        console.log('📈 ERROR STATISTICS');
        console.log('='.repeat(80));
        console.log(`MAE (Mean Absolute Error):    ${mae.toFixed(2)}%`);
        console.log(`Median Error:                 ${median.toFixed(2)}%`);
        console.log(`Min Error:                    ${min.toFixed(2)}%`);
        console.log(`Max Error:                    ${max.toFixed(2)}%`);
        console.log(`Successful simulations:       ${successful.length}/${SMALL_5_CRATERS.length}`);

        console.log('\n📊 BY CONFIDENCE LEVEL:');
        if (highConf.length > 0) {
            const highMAE = highConf.reduce((sum, r) => sum + r.errorPct, 0) / highConf.length;
            console.log(`HIGH confidence (N=${highConf.length}):      MAE = ${highMAE.toFixed(2)}%`);
        }
        if (medConf.length > 0) {
            const medMAE = medConf.reduce((sum, r) => sum + r.errorPct, 0) / medConf.length;
            console.log(`MEDIUM confidence (N=${medConf.length}):    MAE = ${medMAE.toFixed(2)}%`);
        }
        if (lowConf.length > 0) {
            const lowMAE = lowConf.reduce((sum, r) => sum + r.errorPct, 0) / lowConf.length;
            console.log(`LOW confidence (N=${lowConf.length}):       MAE = ${lowMAE.toFixed(2)}%`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('🎯 EVALUATION');
        console.log('='.repeat(80));

        if (mae < 20) {
            console.log('✅ TARGET ACHIEVED: MAE < 20%');
        } else if (mae < 25) {
            console.log('⚠️  CLOSE TO TARGET: MAE < 25% (target: <20%)');
        } else if (mae < 32) {
            console.log('⚠️  BASELINE LEVEL: MAE < 32% (needs improvement)');
        } else {
            console.log('❌ NEEDS IMPROVEMENT: MAE > 32% (target: <20%)');
        }

        console.log('\n💡 NOTE: Small iron craters (<100m) are challenging due to:');
        console.log('   - Fragmentation uncertainty (σ range 20-120 MPa)');
        console.log('   - High sensitivity to impact angle');
        console.log('   - Terrain elevation effects');
        console.log('   - Ejecta/deformation partitioning');
    }

    if (failed.length > 0) {
        console.log('\n❌ FAILED SIMULATIONS:');
        failed.forEach(r => console.log(`   - ${r.name}`));
    }

    console.log('\n' + '='.repeat(80));
}

main().catch(console.error);