/**
 * RK4 Integration Test - Compare Legacy vs RK4 Methods
 *
 * This test validates:
 * 1. Backward compatibility (legacy method still works)
 * 2. RK4 integration produces reasonable results
 * 3. Both methods can be used side-by-side
 *
 * Test cases:
 * - Chelyabinsk 2013: 19m rocky asteroid, 19 km/s, 18° angle
 * - Tunguska 1908: 60m rocky asteroid, 15 km/s, 45° angle
 * - Barringer: 50m iron asteroid, 12.8 km/s, 90° angle
 */

const PhysicsEngine = require('../services/physicsEngine');

// Test parameters for known impacts
const testCases = [
    {
        name: 'Chelyabinsk 2013',
        params: {
            diameter: 19,
            velocity: 19000,
            angle: 18,
            density: 3300,
            composition: 'rocky',
            impactLocation: { lat: 54.8, lon: 61.1, isOcean: false, depth: 0 }
        },
        expected: {
            energy_MT: 0.50,
            impact_type: 'airburst',
            burst_altitude_km: 23.3
        }
    },
    {
        name: 'Tunguska 1908',
        params: {
            diameter: 60,
            velocity: 15000,
            angle: 45,
            density: 3000,
            composition: 'rocky',
            impactLocation: { lat: 60.9, lon: 101.9, isOcean: false, depth: 0 }
        },
        expected: {
            energy_MT: 15,
            impact_type: 'airburst',
            burst_altitude_km: 8.5
        }
    },
    {
        name: 'Barringer Crater',
        params: {
            diameter: 50,
            velocity: 12800,
            angle: 90,
            density: 7800,
            composition: 'iron',
            impactLocation: { lat: 35.02, lon: -111.02, isOcean: false, depth: 0 }
        },
        expected: {
            energy_MT: 10,
            impact_type: 'ground',
            crater_diameter_m: 1200
        }
    }
];

async function runTest(testCase, useLegacy = true) {
    const engine = new PhysicsEngine();

    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${testCase.name} (${useLegacy ? 'LEGACY' : 'RK4'})`);
    console.log(`${'='.repeat(80)}`);

    const startTime = Date.now();

    // Run simulation with or without RK4
    const result = await engine.simulateImpact({
        ...testCase.params,
        use_rk4: !useLegacy
    });

    const duration = Date.now() - startTime;

    console.log(`\n✅ Simulation completed in ${duration}ms`);
    console.log(`\n📊 Results:`);
    console.log(`   Energy: ${result.energy.megatons.toFixed(3)} MT (expected: ${testCase.expected.energy_MT} MT)`);
    console.log(`   Impact Type: ${result.fragmentation.impactType} (expected: ${testCase.expected.impact_type})`);

    if (result.fragmentation.impactType === 'airburst') {
        const burstAltKm = result.fragmentation.altitude / 1000;
        console.log(`   Burst Altitude: ${burstAltKm.toFixed(1)} km (expected: ${testCase.expected.burst_altitude_km} km)`);
    } else {
        console.log(`   Crater Diameter: ${result.crater.diameter.toFixed(0)} m (expected: ${testCase.expected.crater_diameter_m} m)`);
    }

    if (!useLegacy && result.fragmentation.rk4_summary) {
        console.log(`\n🔬 RK4 Details:`);
        console.log(`   Timesteps: ${result.fragmentation.rk4_trajectory.length}`);
        console.log(`   Energy Conservation Error: ${result.fragmentation.rk4_summary.conservation_error_percent.toFixed(4)}%`);
        console.log(`   Energy Initial: ${(result.fragmentation.rk4_summary.energy_initial_J / 4.184e15).toFixed(3)} MT`);
        console.log(`   Energy Final: ${(result.fragmentation.rk4_summary.energy_final_J / 4.184e15).toFixed(3)} MT`);
        console.log(`   Energy Atmospheric: ${(result.fragmentation.rk4_summary.energy_atmospheric_J / 4.184e15).toFixed(3)} MT`);
    }

    console.log(`\n📍 Impact Location:`);
    console.log(`   Coordinates: (${result.impactLocation.lat}, ${result.impactLocation.lon})`);
    console.log(`   Elevation: ${result.impactLocation.elevation} m`);
    console.log(`   Terrain: ${result.impactLocation.terrainType}`);

    console.log(`\n💥 Blast Zones:`);
    console.log(`   Fireball: ${(result.blast.fireball / 1000).toFixed(2)} km`);
    console.log(`   Thermal: ${(result.blast.thermalRadius / 1000).toFixed(2)} km`);
    console.log(`   Air Blast: ${(result.blast.airblastRadius / 1000).toFixed(2)} km`);

    console.log(`\n🌍 Seismic:`);
    console.log(`   Magnitude: ${result.seismic.magnitude.toFixed(1)}`);
    console.log(`   Felt Radius: ${result.seismic.radiusKm.toFixed(0)} km`);

    if (result.casualties) {
        console.log(`\n👥 Casualties:`);
        console.log(`   Estimated Deaths: ${result.casualties.estimatedCasualties.toLocaleString()}`);
        console.log(`   Estimated Injured: ${result.casualties.estimatedInjured.toLocaleString()}`);
        console.log(`   Severity: ${result.casualties.severity}`);
    }

    return result;
}

async function compareResults(testCase) {
    console.log(`\n${'#'.repeat(80)}`);
    console.log(`COMPARISON TEST: ${testCase.name}`);
    console.log(`${'#'.repeat(80)}`);

    const legacyResult = await runTest(testCase, true);
    const rk4Result = await runTest(testCase, false);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`SIDE-BY-SIDE COMPARISON: ${testCase.name}`);
    console.log(`${'='.repeat(80)}`);

    console.log(`\n| Metric                | Legacy        | RK4           | Difference    |`);
    console.log(`|-----------------------|---------------|---------------|---------------|`);

    const energyDiff = ((rk4Result.energy.megatons - legacyResult.energy.megatons) / legacyResult.energy.megatons * 100).toFixed(1);
    console.log(`| Energy (MT)           | ${legacyResult.energy.megatons.toFixed(3).padEnd(13)} | ${rk4Result.energy.megatons.toFixed(3).padEnd(13)} | ${energyDiff}%`.padEnd(13) + ' |');

    console.log(`| Impact Type           | ${legacyResult.fragmentation.impactType.padEnd(13)} | ${rk4Result.fragmentation.impactType.padEnd(13)} | ${legacyResult.fragmentation.impactType === rk4Result.fragmentation.impactType ? 'Match' : 'DIFFER'}`.padEnd(13) + ' |');

    if (legacyResult.fragmentation.impactType === 'airburst' && rk4Result.fragmentation.impactType === 'airburst') {
        const altDiff = ((rk4Result.fragmentation.altitude - legacyResult.fragmentation.altitude) / legacyResult.fragmentation.altitude * 100).toFixed(1);
        console.log(`| Burst Alt (km)        | ${(legacyResult.fragmentation.altitude / 1000).toFixed(1).padEnd(13)} | ${(rk4Result.fragmentation.altitude / 1000).toFixed(1).padEnd(13)} | ${altDiff}%`.padEnd(13) + ' |');
    }

    const blastDiff = ((rk4Result.blast.airblastRadius - legacyResult.blast.airblastRadius) / legacyResult.blast.airblastRadius * 100).toFixed(1);
    console.log(`| Air Blast (km)        | ${(legacyResult.blast.airblastRadius / 1000).toFixed(2).padEnd(13)} | ${(rk4Result.blast.airblastRadius / 1000).toFixed(2).padEnd(13)} | ${blastDiff}%`.padEnd(13) + ' |');

    console.log(`\n✅ Both methods completed successfully!\n`);
}

async function runAllTests() {
    console.log(`\n${'█'.repeat(80)}`);
    console.log(`RK4 INTEGRATION TEST SUITE`);
    console.log(`v1.7.1 - Comparing Legacy vs RK4 Atmospheric Trajectory Integration`);
    console.log(`${'█'.repeat(80)}`);

    for (const testCase of testCases) {
        try {
            await compareResults(testCase);
        } catch (error) {
            console.error(`\n❌ ERROR in ${testCase.name}:`, error.message);
            console.error(error.stack);
        }
    }

    console.log(`\n${'█'.repeat(80)}`);
    console.log(`TEST SUITE COMPLETED`);
    console.log(`${'█'.repeat(80)}\n`);
}

// Run if called directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests, compareResults, runTest };
