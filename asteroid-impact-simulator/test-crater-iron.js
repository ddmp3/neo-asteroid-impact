/**
 * Test script to verify iron meteorite crater formation works correctly
 * Tests the NIVEAU 0 fixes for crater NaN bug
 */

const http = require('http');

const testCases = [
    {
        name: "Barringer-class (50m iron)",
        diameter: 50,
        velocity: 12800,
        angle: 80,
        density: 7800,
        composition: "iron",
        impactLocation: { lat: 35.0, lon: -111.0 }
    },
    {
        name: "Small iron (20m)",
        diameter: 20,
        velocity: 15000,
        angle: 45,
        density: 7800,
        composition: "iron",
        impactLocation: { lat: 40.0, lon: -100.0 }
    },
    {
        name: "Medium iron (30m)",
        diameter: 30,
        velocity: 18000,
        angle: 60,
        density: 7800,
        composition: "iron",
        impactLocation: { lat: 50.0, lon: -120.0 }
    }
];

function runTest(testCase) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(testCase);

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/impact',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(body);
                    resolve({ testCase, result, success: true });
                } else {
                    resolve({ testCase, error: body, success: false, statusCode: res.statusCode });
                }
            });
        });

        req.on('error', (error) => {
            reject({ testCase, error: error.message });
        });

        req.write(data);
        req.end();
    });
}

async function runAllTests() {
    console.log('=== IRON METEORITE CRATER TEST ===\n');
    console.log('Testing NIVEAU 0 fixes for crater NaN bug\n');

    for (const testCase of testCases) {
        try {
            console.log(`Testing: ${testCase.name}`);
            console.log(`  Params: D=${testCase.diameter}m, V=${testCase.velocity}m/s, angle=${testCase.angle}°, ρ=${testCase.density} kg/m³`);

            const { result, success, error, statusCode } = await runTest(testCase);

            if (!success) {
                console.log(`  ❌ FAILED (HTTP ${statusCode}): ${error}\n`);
                continue;
            }

            const fragmentation = result.fragmentation || {};
            const crater = result.crater || {};

            console.log(`  Fragmentation:`);
            console.log(`    - Will fragment: ${fragmentation.willFragment}`);
            console.log(`    - Crater formed: ${fragmentation.craterFormed}`);
            console.log(`    - Impact type: ${fragmentation.impactType}`);
            console.log(`    - Altitude: ${fragmentation.altitude ? Math.round(fragmentation.altitude) + 'm' : 'N/A'}`);

            console.log(`  Crater:`);
            if (crater.diameter && !isNaN(crater.diameter)) {
                console.log(`    ✅ Diameter: ${Math.round(crater.diameter)}m`);
                console.log(`    ✅ Depth: ${Math.round(crater.depth)}m`);
                console.log(`    ✅ Type: ${crater.craterType}`);
                console.log(`    ✅ SUCCESS - Crater formed correctly!`);
            } else if (crater.diameter === 0) {
                console.log(`    ℹ️  No crater (airburst expected)`);
            } else {
                console.log(`    ❌ FAILED - Crater is NaN or invalid`);
                console.log(`    Crater object:`, crater);
            }

            console.log('');

        } catch (error) {
            console.log(`  ❌ ERROR: ${error.error || error.message}\n`);
        }
    }

    console.log('=== TEST COMPLETE ===');
}

runAllTests().catch(console.error);
