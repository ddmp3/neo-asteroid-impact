/**
 * Test Top 10 Largest Craters via API
 * Calculate MAE (Mean Absolute Error) for crater diameter prediction
 */

const axios = require('axios');

const API_URL = 'https://ca-api-ckq6mn38.victoriousglacier-63962c13.canadacentral.azurecontainerapps.io';

// Top 10 largest craters from database (sorted by crater diameter)
const TOP_10_CRATERS = [
    {
        name: 'Vredefort',
        location: { lat: -27.000, lon: 27.500 },
        crater: { diameter_m: 300000 },
        impactor: { composition: 'rocky', diameter_m: 15000, velocity_m_s: 20000, angle_deg: 60, density_kg_m3: 3000 }
    },
    {
        name: 'Chicxulub',
        location: { lat: 21.300, lon: -89.500 },
        crater: { diameter_m: 180000 },
        impactor: { composition: 'rocky', diameter_m: 10000, velocity_m_s: 20000, angle_deg: 60, density_kg_m3: 3000 }
    },
    {
        name: 'Sudbury',
        location: { lat: 46.600, lon: -81.183 },
        crater: { diameter_m: 130000 },
        impactor: { composition: 'rocky', diameter_m: 10000, velocity_m_s: 20000, angle_deg: 60, density_kg_m3: 3000 }
    },
    {
        name: 'Popigai',
        location: { lat: 71.650, lon: 111.183 },
        crater: { diameter_m: 90000 },
        impactor: { composition: 'rocky', diameter_m: 8000, velocity_m_s: 20000, angle_deg: 60, density_kg_m3: 3000 }
    },
    {
        name: 'Acraman',
        location: { lat: -32.017, lon: 135.450 },
        crater: { diameter_m: 90000 },
        impactor: { composition: 'rocky', diameter_m: 8000, velocity_m_s: 20000, angle_deg: 60, density_kg_m3: 3000 }
    },
    {
        name: 'Manicouagan',
        location: { lat: 51.383, lon: -68.700 },
        crater: { diameter_m: 85000 },
        impactor: { composition: 'rocky', diameter_m: 7500, velocity_m_s: 20000, angle_deg: 60, density_kg_m3: 3000 }
    },
    {
        name: 'Chesapeake Bay',
        location: { lat: 37.283, lon: -76.017 },
        crater: { diameter_m: 85000 },
        impactor: { composition: 'rocky', diameter_m: 7500, velocity_m_s: 20000, angle_deg: 60, density_kg_m3: 3000 }
    },
    {
        name: 'Puchezh-Katunki',
        location: { lat: 56.967, lon: 43.633 },
        crater: { diameter_m: 80000 },
        impactor: { composition: 'rocky', diameter_m: 7000, velocity_m_s: 20000, angle_deg: 60, density_kg_m3: 3000 }
    },
    {
        name: 'Kara',
        location: { lat: 69.117, lon: 64.150 },
        crater: { diameter_m: 65000 },
        impactor: { composition: 'rocky', diameter_m: 5500, velocity_m_s: 20000, angle_deg: 60, density_kg_m3: 3000 }
    },
    {
        name: 'Tookoonooka',
        location: { lat: -27.100, lon: 142.833 },
        crater: { diameter_m: 55000 },
        impactor: { composition: 'rocky', diameter_m: 4600, velocity_m_s: 20000, angle_deg: 60, density_kg_m3: 3000 }
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
    console.log(`   Impactor: ${crater.impactor.diameter_m}m ${crater.impactor.composition} @ ${crater.impactor.velocity_m_s / 1000} km/s, ${crater.impactor.angle_deg}°`);
    console.log(`   Observed crater: ${crater.crater.diameter_m.toLocaleString()}m`);

    try {
        const response = await axios.post(`${API_URL}/api/simulate/impact`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        const predicted = response.data.simulation.crater.modifiedDiameter;
        const observed = crater.crater.diameter_m;
        const error = Math.abs(predicted - observed);
        const errorPct = (error / observed) * 100;

        console.log(`   ✅ Predicted crater: ${predicted.toFixed(0)}m`);
        console.log(`   📊 Error: ${error.toFixed(0)}m (${errorPct.toFixed(2)}%)`);

        return {
            name: crater.name,
            observed,
            predicted,
            error,
            errorPct
        };
    } catch (err) {
        console.error(`   ❌ ERROR: ${err.message}`);
        return {
            name: crater.name,
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
    console.log('TOP 10 LARGEST CRATERS - API VALIDATION');
    console.log('='.repeat(80));
    console.log(`API: ${API_URL}`);
    console.log(`Total craters: ${TOP_10_CRATERS.length}`);

    const results = [];

    for (const crater of TOP_10_CRATERS) {
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
        console.log('Name'.padEnd(25) + 'Observed (m)'.padEnd(15) + 'Predicted (m)'.padEnd(15) + 'Error (%)');
        console.log('-'.repeat(80));

        successful.forEach(r => {
            console.log(
                r.name.padEnd(25) +
                r.observed.toLocaleString().padEnd(15) +
                r.predicted.toFixed(0).padEnd(15) +
                r.errorPct.toFixed(2) + '%'
            );
        });

        // Calculate MAE
        const mae = successful.reduce((sum, r) => sum + r.errorPct, 0) / successful.length;
        const median = successful.map(r => r.errorPct).sort((a, b) => a - b)[Math.floor(successful.length / 2)];
        const min = Math.min(...successful.map(r => r.errorPct));
        const max = Math.max(...successful.map(r => r.errorPct));

        console.log('\n' + '='.repeat(80));
        console.log('📈 ERROR STATISTICS');
        console.log('='.repeat(80));
        console.log(`MAE (Mean Absolute Error):    ${mae.toFixed(2)}%`);
        console.log(`Median Error:                 ${median.toFixed(2)}%`);
        console.log(`Min Error:                    ${min.toFixed(2)}%`);
        console.log(`Max Error:                    ${max.toFixed(2)}%`);
        console.log(`Successful simulations:       ${successful.length}/${TOP_10_CRATERS.length}`);

        if (mae < 20) {
            console.log('\n✅ TARGET ACHIEVED: MAE < 20%');
        } else if (mae < 25) {
            console.log('\n⚠️  CLOSE TO TARGET: MAE < 25% (target: <20%)');
        } else {
            console.log('\n❌ NEEDS IMPROVEMENT: MAE > 25% (target: <20%)');
        }
    }

    if (failed.length > 0) {
        console.log('\n❌ FAILED SIMULATIONS:');
        failed.forEach(r => console.log(`   - ${r.name}`));
    }

    console.log('\n' + '='.repeat(80));
}

main().catch(console.error);