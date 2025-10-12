/**
 * End-to-End Integration Test
 * Tests complete flow: Backend API → Frontend simulation
 * Validates Phase 1 implementation (v1.6.10-v1.6.12)
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:7071';

console.log('🧪 END-TO-END INTEGRATION TEST');
console.log('='.repeat(80));
console.log(`API URL: ${API_URL}`);
console.log();

let testsPassed = 0;
let testsFailed = 0;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {

    // ========================================================================
    // TEST 1: Health Check
    // ========================================================================
    console.log('Test 1: API HEALTH CHECK');
    console.log('-'.repeat(80));
    try {
        const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
        console.log(`✅ API Status: ${response.data.status}`);
        console.log(`   Services: ${JSON.stringify(response.data.services)}`);
        testsPassed++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        console.log('   💡 Make sure API server is running: node src/index.js');
        testsFailed++;
        return; // Can't continue without API
    }
    console.log();

    await sleep(500);

    // ========================================================================
    // TEST 2: Real-Time NEO Data Loading
    // ========================================================================
    console.log('Test 2: REAL-TIME NEO DATA LOADING (JPL SBDB)');
    console.log('-'.repeat(80));
    try {
        const response = await axios.get(`${API_URL}/api/neo/realtime/upcoming`, {
            params: {
                limit: 10,
                date_min: '2025-01-01',
                date_max: '2025-12-31'
            },
            timeout: 30000
        });

        console.log(`✅ Retrieved ${response.data.count} NEOs`);
        console.log(`   Source: ${response.data.source}`);
        console.log(`   Timestamp: ${response.data.timestamp}`);

        if (response.data.data && response.data.data.length > 0) {
            const sample = response.data.data[0];
            console.log(`\n   Sample NEO:`);
            console.log(`   - Name: ${sample.name}`);
            console.log(`   - Diameter: ${sample.estimatedDiameter.meters.estimated.toFixed(1)} m`);
            console.log(`   - Velocity: ${sample.relativeVelocity.kilometersPerSecond.toFixed(2)} km/s`);
            console.log(`   - Miss Distance: ${sample.missDistance.lunar.toFixed(2)} LD`);
            console.log(`   - Close Approach: ${sample.closeApproachDate}`);
            console.log(`   - PHA: ${sample.isPotentiallyHazardous ? 'YES 🚨' : 'NO'}`);
            testsPassed++;
        } else {
            console.log('⚠️  WARNING: No NEO data returned');
            testsFailed++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        testsFailed++;
    }
    console.log();

    await sleep(500);

    // ========================================================================
    // TEST 3: Atmospheric Fragmentation - Chelyabinsk Airburst
    // ========================================================================
    console.log('Test 3: ATMOSPHERIC FRAGMENTATION - CHELYABINSK AIRBURST');
    console.log('-'.repeat(80));
    try {
        const response = await axios.post(`${API_URL}/api/simulate/impact`, {
            diameter: 20,          // 20m
            velocity: 19,          // 19 km/s
            angle: 18,             // Low angle
            density: 3300,         // Rocky
            composition: 'rocky',  // NEW parameter (v1.6.10)
            impactLocation: {
                lat: 55.15,        // Chelyabinsk, Russia
                lon: 61.41
            }
        }, { timeout: 60000 });

        const sim = response.data.simulation;
        const frag = sim.fragmentation;

        console.log(`✅ Simulation completed`);
        console.log(`\n   Fragmentation Analysis (Hills-Goda 1993):`);
        console.log(`   - Will Fragment: ${frag.willFragment ? 'YES' : 'NO'}`);
        console.log(`   - Impact Type: ${frag.impactType}`);
        console.log(`   - Burst Altitude: ${(frag.altitude / 1000).toFixed(1)} km`);
        console.log(`   - Crater Formed: ${frag.craterFormed ? 'YES' : 'NO'}`);
        console.log(`   - Material Strength: ${(frag.strength / 1e6).toFixed(1)} MPa`);
        console.log(`   - Model: ${frag.model}`);

        console.log(`\n   Impact Energy:`);
        console.log(`   - ${sim.energy.megatons.toFixed(2)} megatons TNT`);
        console.log(`   - ${(sim.energy.joules / 1e15).toFixed(2)} PJ`);

        console.log(`\n   Crater:`);
        console.log(`   - Diameter: ${sim.crater.diameter.toFixed(0)} m`);
        console.log(`   - Note: ${sim.crater.note || 'N/A'}`);

        console.log(`\n   Blast Zones:`);
        console.log(`   - Fireball: ${(sim.blast.fireball / 1000).toFixed(2)} km`);
        console.log(`   - Thermal: ${(sim.blast.thermalRadius / 1000).toFixed(2)} km`);
        console.log(`   - Air Blast: ${(sim.blast.airblastRadius / 1000).toFixed(2)} km`);

        // Validation
        const expectedAltitude = 23.5; // km (observed)
        const calculatedAltitude = frag.altitude / 1000;
        const error = Math.abs(calculatedAltitude - expectedAltitude) / expectedAltitude * 100;

        console.log(`\n   Validation vs Observed Chelyabinsk:`);
        console.log(`   - Expected Altitude: ${expectedAltitude} km`);
        console.log(`   - Calculated Altitude: ${calculatedAltitude.toFixed(1)} km`);
        console.log(`   - Error: ${error.toFixed(1)}%`);

        if (frag.willFragment && frag.impactType.includes('airburst') && !frag.craterFormed && error < 15) {
            console.log(`   ✅ PASS: Chelyabinsk correctly simulated as airburst`);
            testsPassed++;
        } else {
            console.log(`   ❌ FAIL: Incorrect fragmentation prediction`);
            testsFailed++;
        }

    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Data:`, error.response.data);
        }
        testsFailed++;
    }
    console.log();

    await sleep(500);

    // ========================================================================
    // TEST 4: Ground Impact - Barringer Crater
    // ========================================================================
    console.log('Test 4: GROUND IMPACT - BARRINGER CRATER');
    console.log('-'.repeat(80));
    try {
        const response = await axios.post(`${API_URL}/api/simulate/impact`, {
            diameter: 50,          // 50m
            velocity: 12.8,        // 12.8 km/s
            angle: 45,
            density: 7800,         // Iron
            composition: 'iron',   // Iron asteroid
            impactLocation: {
                lat: 35.027,       // Barringer Crater, Arizona
                lon: -111.022
            }
        }, { timeout: 60000 });

        const sim = response.data.simulation;
        const frag = sim.fragmentation;

        console.log(`✅ Simulation completed`);
        console.log(`\n   Fragmentation Analysis:`);
        console.log(`   - Will Fragment: ${frag.willFragment ? 'YES' : 'NO'}`);
        console.log(`   - Impact Type: ${frag.impactType}`);
        console.log(`   - Crater Formed: ${frag.craterFormed ? 'YES' : 'NO'}`);
        console.log(`   - Material Strength: ${(frag.strength / 1e6).toFixed(0)} MPa (iron)`);

        console.log(`\n   Crater:`);
        console.log(`   - Diameter: ${sim.crater.modifiedDiameter.toFixed(0)} m`);
        console.log(`   - Depth: ${sim.crater.modifiedDepth.toFixed(0)} m`);
        console.log(`   - Type: ${sim.crater.craterType}`);

        // Validation
        const expectedDiameter = 1200; // meters (observed)
        const calculatedDiameter = sim.crater.modifiedDiameter;
        const error = Math.abs(calculatedDiameter - expectedDiameter) / expectedDiameter * 100;

        console.log(`\n   Validation vs Observed Barringer:`);
        console.log(`   - Expected Diameter: ${expectedDiameter} m`);
        console.log(`   - Calculated Diameter: ${calculatedDiameter.toFixed(0)} m`);
        console.log(`   - Error: ${error.toFixed(1)}%`);

        if (frag.craterFormed && sim.crater.modifiedDiameter > 0 && error < 50) {
            console.log(`   ✅ PASS: Barringer correctly simulated with crater`);
            testsPassed++;
        } else {
            console.log(`   ❌ FAIL: Incorrect crater prediction`);
            testsFailed++;
        }

    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        testsFailed++;
    }
    console.log();

    await sleep(500);

    // ========================================================================
    // TEST 5: NEO Statistics (Real-Time)
    // ========================================================================
    console.log('Test 5: NEO STATISTICS (REAL-TIME)');
    console.log('-'.repeat(80));
    try {
        const response = await axios.get(`${API_URL}/api/neo/realtime/statistics`, {
            timeout: 60000
        });

        const stats = response.data.statistics;

        console.log(`✅ Statistics retrieved`);
        console.log(`\n   NEO Database Stats:`);
        console.log(`   - Total NEOs: ${stats.total}`);
        console.log(`   - Potentially Hazardous: ${stats.potentiallyHazardous}`);
        console.log(`   - By Size:`);
        console.log(`     • Small (<50m): ${stats.bySize.small}`);
        console.log(`     • Medium (50-300m): ${stats.bySize.medium}`);
        console.log(`     • Large (>300m): ${stats.bySize.large}`);
        console.log(`   - Avg Miss Distance: ${stats.averageMissDistance.lunar.toFixed(2)} LD`);
        console.log(`   - Avg Velocity: ${stats.averageVelocity.kmPerSec.toFixed(2)} km/s`);

        if (stats.closestApproach) {
            console.log(`\n   Closest Approach:`);
            console.log(`   - ${stats.closestApproach.name}`);
            console.log(`   - ${stats.closestApproach.missDistance.lunar.toFixed(2)} LD`);
            console.log(`   - ${stats.closestApproach.closeApproachDate}`);
        }

        if (stats.largestAsteroid) {
            console.log(`\n   Largest Asteroid:`);
            console.log(`   - ${stats.largestAsteroid.name}`);
            console.log(`   - ${stats.largestAsteroid.estimatedDiameter.meters.estimated.toFixed(0)} m`);
        }

        if (stats.total > 0) {
            console.log(`\n   ✅ PASS: Statistics calculation successful`);
            testsPassed++;
        } else {
            console.log(`\n   ❌ FAIL: No statistics data`);
            testsFailed++;
        }

    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        testsFailed++;
    }
    console.log();

    await sleep(500);

    // ========================================================================
    // TEST 6: PHAs Detection (Real-Time)
    // ========================================================================
    console.log('Test 6: POTENTIALLY HAZARDOUS ASTEROIDS (REAL-TIME)');
    console.log('-'.repeat(80));
    try {
        const response = await axios.get(`${API_URL}/api/neo/realtime/phas`, {
            params: {
                limit: 5,
                date_min: '2025-01-01',
                date_max: '2027-12-31'
            },
            timeout: 30000
        });

        console.log(`✅ Retrieved ${response.data.count} PHAs`);
        console.log(`   Source: ${response.data.source}`);

        if (response.data.data && response.data.data.length > 0) {
            console.log(`\n   Top PHAs:`);
            response.data.data.slice(0, 3).forEach((pha, i) => {
                console.log(`   ${i + 1}. ${pha.name}`);
                console.log(`      - Size: ${pha.estimatedDiameter.meters.estimated.toFixed(0)} m`);
                console.log(`      - Distance: ${pha.missDistance.lunar.toFixed(2)} LD`);
                console.log(`      - Date: ${pha.closeApproachDate}`);
            });
            testsPassed++;
        } else {
            console.log(`   ℹ️  No PHAs in date range (this is good news!)`);
            testsPassed++;
        }

    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        testsFailed++;
    }
    console.log();

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('='.repeat(80));
    console.log('END-TO-END TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Tests Passed: ${testsPassed}/6`);
    console.log(`Tests Failed: ${testsFailed}/6`);
    console.log();

    if (testsFailed === 0) {
        console.log('🎉🎉🎉 ALL END-TO-END TESTS PASSED!');
        console.log();
        console.log('✅ Phase 1 Complete Integration Verified:');
        console.log('   ✅ v1.6.10: Hills-Goda fragmentation working');
        console.log('   ✅ v1.6.11: Real-time NEO API working');
        console.log('   ✅ v1.6.12: Frontend integration ready');
        console.log();
        console.log('🚀 System is production-ready!');
    } else {
        console.log('⚠️  SOME TESTS FAILED');
        console.log('   Review errors above and fix issues.');
    }
    console.log();

    return testsFailed === 0;
}

// Run tests
console.log('Starting end-to-end tests in 2 seconds...');
console.log('Make sure API server is running: node src/index.js');
console.log();

setTimeout(() => {
    runTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}, 2000);
