/**
 * API Endpoints Test
 * Tests the new real-time NEO endpoints
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'https://api.neo.lueger.fr';

console.log('🧪 API ENDPOINTS TEST');
console.log('='.repeat(70));
console.log(`Base URL: ${BASE_URL}`);
console.log();

async function testEndpoints() {
    const tests = [];

    // Test 1: Health check
    console.log('Test 1: Health Check');
    console.log('-'.repeat(70));
    try {
        const response = await axios.get(`${BASE_URL}/api/health`);
        console.log(`✅ Status: ${response.data.status}`);
        console.log(`   Services: ${JSON.stringify(response.data.services)}`);
        tests.push({ name: 'Health Check', passed: true });
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        tests.push({ name: 'Health Check', passed: false });
    }
    console.log();

    // Test 2: Real-time upcoming NEOs
    console.log('Test 2: Real-Time Upcoming NEOs');
    console.log('-'.repeat(70));
    try {
        const response = await axios.get(`${BASE_URL}/api/neo/realtime/upcoming`, {
            params: {
                limit: 5,
                date_min: '2025-01-01',
                date_max: '2025-03-31'
            }
        });
        console.log(`✅ Retrieved ${response.data.count} NEOs`);
        console.log(`   Source: ${response.data.source}`);
        if (response.data.data && response.data.data.length > 0) {
            const sample = response.data.data[0];
            console.log(`   Sample: ${sample.name} - ${sample.estimatedDiameter.meters.estimated.toFixed(0)}m`);
        }
        tests.push({ name: 'Real-Time Upcoming', passed: true });
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        tests.push({ name: 'Real-Time Upcoming', passed: false });
    }
    console.log();

    // Test 3: Asteroid details
    console.log('Test 3: Asteroid Details');
    console.log('-'.repeat(70));
    try {
        const response = await axios.get(`${BASE_URL}/api/neo/realtime/details/2023%20DW`);
        console.log(`✅ Retrieved details for ${response.data.data.fullname}`);
        console.log(`   NEO: ${response.data.data.isNEO}`);
        console.log(`   Source: ${response.data.source}`);
        tests.push({ name: 'Asteroid Details', passed: true });
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        tests.push({ name: 'Asteroid Details', passed: false });
    }
    console.log();

    // Test 4: PHAs
    console.log('Test 4: Potentially Hazardous Asteroids');
    console.log('-'.repeat(70));
    try {
        const response = await axios.get(`${BASE_URL}/api/neo/realtime/phas`, {
            params: {
                limit: 10,
                date_min: '2025-01-01',
                date_max: '2026-12-31'
            }
        });
        console.log(`✅ Retrieved ${response.data.count} PHAs`);
        console.log(`   Source: ${response.data.source}`);
        tests.push({ name: 'PHAs', passed: true });
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        tests.push({ name: 'PHAs', passed: false });
    }
    console.log();

    // Test 5: NEOs by size
    console.log('Test 5: NEOs by Size (medium)');
    console.log('-'.repeat(70));
    try {
        const response = await axios.get(`${BASE_URL}/api/neo/realtime/by-size/medium`, {
            params: {
                limit: 10,
                date_min: '2025-01-01',
                date_max: '2025-12-31'
            }
        });
        console.log(`✅ Retrieved ${response.data.count} medium NEOs`);
        console.log(`   Category: ${response.data.category}`);
        tests.push({ name: 'NEOs by Size', passed: true });
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        tests.push({ name: 'NEOs by Size', passed: false });
    }
    console.log();

    // Test 6: Statistics
    console.log('Test 6: NEO Statistics');
    console.log('-'.repeat(70));
    try {
        const response = await axios.get(`${BASE_URL}/api/neo/realtime/statistics`);
        const stats = response.data.statistics;
        console.log(`✅ Statistics retrieved`);
        console.log(`   Total NEOs: ${stats.total}`);
        console.log(`   PHAs: ${stats.potentiallyHazardous}`);
        console.log(`   Avg Miss Distance: ${stats.averageMissDistance.lunar.toFixed(2)} LD`);
        tests.push({ name: 'Statistics', passed: true });
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        tests.push({ name: 'Statistics', passed: false });
    }
    console.log();

    // Summary
    console.log('='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    console.log(`Passed: ${passed}/${tests.length}`);
    console.log(`Failed: ${failed}/${tests.length}`);
    console.log();

    tests.forEach(test => {
        console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
    });
    console.log();

    return failed === 0;
}

// Run tests
testEndpoints()
    .then(success => {
        if (success) {
            console.log('🎉 All API endpoint tests passed!');
        } else {
            console.log('⚠️  Some tests failed. Make sure the API server is running.');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Fatal error:', error.message);
        process.exit(1);
    });
