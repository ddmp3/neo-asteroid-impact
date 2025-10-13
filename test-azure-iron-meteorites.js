/**
 * Test des météorites en fer sur Azure API (api.neo.lueger.fr)
 * Validation des corrections NIVEAU 0 (v1.6.30)
 */

const https = require('https');

const testCases = [
    {
        name: "Barringer-class (50m fer)",
        diameter: 50,
        velocity: 12.8, // km/s
        angle: 80,
        density: 7800,
        composition: "iron",
        impactLocation: { lat: 35.0, lon: -111.0 }
    },
    {
        name: "Petit fer (20m)",
        diameter: 20,
        velocity: 15, // km/s
        angle: 45,
        density: 7800,
        composition: "iron",
        impactLocation: { lat: 40.0, lon: -100.0 }
    },
    {
        name: "Moyen fer (30m)",
        diameter: 30,
        velocity: 18, // km/s
        angle: 60,
        density: 7800,
        composition: "iron",
        impactLocation: { lat: 50.0, lon: -120.0 }
    },
    {
        name: "Chelyabinsk (20m rocheux)",
        diameter: 20,
        velocity: 19, // km/s
        angle: 18,
        density: 3300,
        composition: "rocky",
        impactLocation: { lat: 55.1544, lon: 61.4296 }
    }
];

function runTest(testCase) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(testCase);

        const options = {
            hostname: 'api.neo.lueger.fr',
            port: 443,
            path: '/api/simulate/impact',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(body);
                        resolve({ testCase, result, success: true });
                    } catch (e) {
                        resolve({ testCase, error: 'Invalid JSON', success: false, statusCode: res.statusCode });
                    }
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
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  TEST MÉTÉORITES EN FER - Azure API v1.6.30                   ║');
    console.log('║  Validation des corrections NIVEAU 0                          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    let totalTests = testCases.length;
    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
        try {
            console.log(`\n📍 Test: ${testCase.name}`);
            console.log(`   Params: D=${testCase.diameter}m, V=${testCase.velocity}m/s, angle=${testCase.angle}°, ρ=${testCase.density}kg/m³, composition=${testCase.composition}`);

            const { result, success, error, statusCode } = await runTest(testCase);

            if (!success) {
                console.log(`   ❌ ÉCHEC (HTTP ${statusCode}): ${error}`);
                failed++;
                continue;
            }

            // L'API retourne les données sous result.simulation
            const simulation = result.simulation || result;
            const fragmentation = simulation.fragmentation || {};
            const crater = simulation.crater || {};
            const energy = simulation.energy || {};

            console.log(`\n   📊 Résultats:`);
            console.log(`      Énergie: ${energy.megatons ? energy.megatons.toFixed(2) + ' MT' : 'N/A'}`);

            console.log(`\n      Fragmentation:`);
            console.log(`        - Va fragmenter: ${fragmentation.willFragment ? 'OUI' : 'NON'}`);
            console.log(`        - Cratère formé: ${fragmentation.craterFormed ? 'OUI' : 'NON'}`);
            console.log(`        - Type d'impact: ${fragmentation.impactType || 'N/A'}`);
            console.log(`        - Altitude: ${fragmentation.altitude ? Math.round(fragmentation.altitude) + 'm' : 'N/A'}`);
            console.log(`        - Méthode: ${fragmentation.interpolationMethod || 'N/A'}`);

            console.log(`\n      Cratère:`);
            // L'API retourne modifiedDiameter et modifiedDepth (terrain-aware)
            const diametre = crater.modifiedDiameter || crater.diameter;
            const profondeur = crater.modifiedDepth || crater.depth;

            if (diametre && !isNaN(diametre) && diametre > 0) {
                console.log(`        ✅ Diamètre: ${Math.round(diametre)}m`);
                console.log(`        ✅ Profondeur: ${Math.round(profondeur)}m`);
                console.log(`        ✅ Type: ${crater.craterType}`);
                if (crater.transientDiameter) {
                    console.log(`        ✅ Diamètre transitoire: ${Math.round(crater.transientDiameter)}m`);
                }
                console.log(`        ✅ SUCCÈS - Cratère formé correctement!`);
                passed++;
            } else if ((diametre === 0 || !diametre) && !fragmentation.craterFormed) {
                console.log(`        ℹ️  Pas de cratère (airburst attendu)`);
                console.log(`        ℹ️  Note: ${crater.note || 'N/A'}`);
                passed++;
            } else {
                console.log(`        ❌ ÉCHEC - Cratère invalide (NaN ou incohérent)`);
                console.log(`        ❌ crater.modifiedDiameter = ${crater.modifiedDiameter}`);
                console.log(`        ❌ fragmentation.craterFormed = ${fragmentation.craterFormed}`);
                failed++;
            }

        } catch (error) {
            console.log(`   ❌ ERREUR: ${error.error || error.message}`);
            failed++;
        }
    }

    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log(`║  RÉSULTATS FINAUX                                              ║`);
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  Tests réussis: ${passed}/${totalTests}                                            ║`);
    console.log(`║  Tests échoués: ${failed}/${totalTests}                                            ║`);
    console.log('╠════════════════════════════════════════════════════════════════╣');
    if (failed === 0) {
        console.log(`║  ✅ TOUS LES TESTS PASSÉS - v1.6.30 fonctionne correctement   ║`);
    } else {
        console.log(`║  ⚠️  ${failed} test(s) échoué(s) - des corrections sont nécessaires    ║`);
    }
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

runAllTests().catch(console.error);
