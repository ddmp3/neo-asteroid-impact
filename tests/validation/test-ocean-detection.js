/**
 * Test script for ocean detection function
 * Tests critical ocean coordinates to verify heuristic logic
 */

// Simulate the detectOcean function from physicsEngine.js
function detectOcean(lat, lon, elevation = null, usgsTimeout = true) {
    // If USGS responded successfully and elevation < 0 → confirmed ocean
    if (!usgsTimeout && elevation < 0) {
        return {
            isOcean: true,
            waterDepth: Math.abs(elevation),
            source: 'USGS (confirmed)'
        };
    }

    // Geographic heuristics for major oceans and seas

    // Mediterranean Sea
    if (lon >= -6 && lon <= 37 && lat >= 30 && lat <= 46) {
        return { isOcean: true, waterDepth: 1500, source: 'Mediterranean Sea (heuristic)' };
    }

    // Black Sea
    if (lon >= 27 && lon <= 42 && lat >= 41 && lat <= 47) {
        return { isOcean: true, waterDepth: 1200, source: 'Black Sea (heuristic)' };
    }

    // Gulf of Mexico
    if (lon >= -98 && lon <= -80 && lat >= 18 && lat <= 31) {
        return { isOcean: true, waterDepth: 1600, source: 'Gulf of Mexico (heuristic)' };
    }

    // Caribbean Sea
    if (lon >= -85 && lon <= -60 && lat >= 10 && lat <= 23) {
        return { isOcean: true, waterDepth: 2500, source: 'Caribbean Sea (heuristic)' };
    }

    // North Atlantic
    if (lon >= -75 && lon <= -6 && lat >= 25 && lat <= 65) {
        // Exclude eastern US mainland
        if (!(lon >= -80 && lon <= -70 && lat >= 30 && lat <= 45)) {
            return { isOcean: true, waterDepth: 4000, source: 'North Atlantic Ocean (heuristic)' };
        }
    }

    // Pacific Ocean (largest ocean)
    // Eastern Pacific: -180 to -100 (excluding western North America coast)
    if (lon < -100 && lon > -180) {
        // Exclude western North America coast
        if (!(lat > 30 && lat < 60 && lon > -130 && lon < -100)) {
            return { isOcean: true, waterDepth: 4000, source: 'Pacific Ocean (heuristic)' };
        }
    }

    // Western Pacific: 120 to 180 (excluding Japan, Philippines, Australia, New Zealand)
    if (lon > 120 && lon < 180) {
        // Exclude Japan (lat 30-46, lon 128-146)
        if (lat >= 30 && lat <= 46 && lon >= 128 && lon <= 146) {
            return { isOcean: false, waterDepth: 0, source: 'land' };
        }
        // Exclude Philippines (lat 5-20, lon 118-127)
        if (lat >= 5 && lat <= 20 && lon >= 118 && lon <= 127) {
            return { isOcean: false, waterDepth: 0, source: 'land' };
        }
        // Exclude eastern Australia (lat -44 to -10, lon 142-154)
        if (lat >= -44 && lat <= -10 && lon >= 142 && lon <= 154) {
            return { isOcean: false, waterDepth: 0, source: 'land' };
        }
        // Exclude New Zealand (lat -47 to -34, lon 166-179)
        if (lat >= -47 && lat <= -34 && lon >= 166 && lon <= 179) {
            return { isOcean: false, waterDepth: 0, source: 'land' };
        }
        return { isOcean: true, waterDepth: 4000, source: 'Pacific Ocean (heuristic)' };
    }

    // Indian Ocean
    if (lon > 40 && lon < 100 && lat < 0 && lat > -60) {
        return { isOcean: true, waterDepth: 4000, source: 'Indian Ocean (heuristic)' };
    }

    // Arctic Ocean
    if (lat > 70) {
        return { isOcean: true, waterDepth: 1000, source: 'Arctic Ocean (heuristic)' };
    }

    // Southern Ocean / Antarctic
    if (lat < -60) {
        return { isOcean: true, waterDepth: 4000, source: 'Southern Ocean (heuristic)' };
    }

    // Bay of Bengal
    if (lon >= 80 && lon <= 95 && lat >= 5 && lat <= 22) {
        return { isOcean: true, waterDepth: 2600, source: 'Bay of Bengal (heuristic)' };
    }

    // South China Sea
    if (lon >= 105 && lon <= 120 && lat >= 0 && lat <= 23) {
        return { isOcean: true, waterDepth: 1200, source: 'South China Sea (heuristic)' };
    }

    // Not an ocean
    return { isOcean: false, waterDepth: 0, source: 'land' };
}

// Test cases
const testCases = [
    // Pacific Ocean
    { name: 'Pacific Equator West', lat: 0, lon: -140, expected: true },
    { name: 'Pacific Equator East', lat: 0, lon: 150, expected: true },
    { name: 'Pacific North', lat: 20, lon: -150, expected: true },
    { name: 'Pacific South', lat: -20, lon: 170, expected: true },

    // Atlantic Ocean
    { name: 'Atlantic Mid', lat: 35, lon: -50, expected: true },
    { name: 'Atlantic North', lat: 50, lon: -30, expected: true },

    // Indian Ocean
    { name: 'Indian Mid', lat: -20, lon: 70, expected: true },
    { name: 'Indian East', lat: -30, lon: 90, expected: true },

    // Mediterranean
    { name: 'Mediterranean Central', lat: 36, lon: 15, expected: true },

    // Gulf of Mexico (important for Chicxulub)
    { name: 'Gulf of Mexico North', lat: 28, lon: -90, expected: true },
    { name: 'Chicxulub Impact Site', lat: 21.3, lon: -89.5, expected: true },

    // Land (should be false)
    { name: 'New York', lat: 40.7, lon: -74, expected: false },
    { name: 'Paris', lat: 48.8, lon: 2.3, expected: false },
    { name: 'Tokyo', lat: 35.6, lon: 139.6, expected: false },
    { name: 'Sydney', lat: -33.8, lon: 151.2, expected: false },
];

console.log('=== OCEAN DETECTION TEST SUITE ===\n');

let passed = 0;
let failed = 0;
const failures = [];

testCases.forEach(test => {
    const result = detectOcean(test.lat, test.lon);
    const success = result.isOcean === test.expected;

    if (success) {
        passed++;
        console.log(`✅ ${test.name}: ${result.isOcean ? 'OCEAN' : 'LAND'} (${result.source})`);
    } else {
        failed++;
        failures.push({
            name: test.name,
            coords: `(${test.lat}, ${test.lon})`,
            expected: test.expected ? 'OCEAN' : 'LAND',
            actual: result.isOcean ? 'OCEAN' : 'LAND',
            source: result.source
        });
        console.log(`❌ ${test.name}: Expected ${test.expected ? 'OCEAN' : 'LAND'}, got ${result.isOcean ? 'OCEAN' : 'LAND'} (${result.source})`);
    }
});

console.log(`\n=== RESULTS ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

if (failures.length > 0) {
    console.log(`\n=== FAILURES ===`);
    failures.forEach(f => {
        console.log(`❌ ${f.name} ${f.coords}`);
        console.log(`   Expected: ${f.expected}`);
        console.log(`   Actual: ${f.actual} (${f.source})`);
    });
}

console.log(`\n=== VERDICT ===`);
if (failed === 0) {
    console.log('✅ All tests passed! Ocean detection is working correctly.');
} else {
    console.log(`⚠️  ${failed} test(s) failed. Ocean detection needs fixes.`);
}
