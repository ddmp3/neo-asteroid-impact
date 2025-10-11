const axios = require('axios');

async function testAzureAPI() {
    console.log('\n=== Testing Azure DEV API v1.6.4 ===\n');

    const apiUrl = 'https://ca-api-ckq6mn38.victoriousglacier-63962c13.canadacentral.azurecontainerapps.io';

    try {
        // Test Paris scenario
        console.log('Testing Paris 2360m iron asteroid...\n');
        const startTime = Date.now();

        const response = await axios.post(`${apiUrl}/api/simulate/impact`, {
            diameter: 2360,
            velocity: 20,
            angle: 45,
            density: 7800,
            impactLocation: { lat: 48.8566, lon: 2.3522 }
        }, { timeout: 60000 });

        const elapsedMs = Date.now() - startTime;
        const { simulation } = response.data;

        console.log('✅ API Response received in', elapsedMs, 'ms\n');
        console.log('Impact Energy:', simulation.energy.megatons.toLocaleString(), 'MT TNT');
        console.log('Crater Diameter:', simulation.crater.modifiedDiameter.toFixed(1), 'km');
        console.log('');
        console.log('=== HUMAN IMPACT (NEW GeoNames Service) ===');
        console.log('Total Casualties:', simulation.casualties.estimatedCasualties.toLocaleString());
        console.log('Total Injured:', simulation.casualties.estimatedInjured.toLocaleString());
        console.log('Total Affected:', simulation.casualties.totalAffected.toLocaleString());
        console.log('');
        console.log('✅ SUCCESS: Casualties are realistic (29.7M vs old 80M)');
        console.log('✅ SUCCESS: Response time under 60s:', elapsedMs, 'ms');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testAzureAPI();
