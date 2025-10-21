// Quick test to verify iron composition is working via API
const axios = require('axios');

async function testIronAPI() {
    console.log('Testing Barringer (iron) via DIRECT Azure URL...\n');

    const response = await axios.post('https://ca-api-ckq6mn38.victoriousglacier-63962c13.canadacentral.azurecontainerapps.io/api/simulate/impact', {
        diameter: 50,
        velocity: 12.8,
        angle: 80,
        composition: 'iron',
        density: 7870,
        impactLocation: { lat: 35.0, lon: -111.0 }
    });

    console.log('Response structure:', JSON.stringify(response.data, null, 2));

    const crater = response.data.crater || response.data.impact?.crater;
    if (!crater) {
        console.error('No crater data in response');
        return;
    }

    console.log(`\nBarringer crater diameter: ${crater.diameter.toFixed(0)}m`);
    console.log(`Physics model: ${crater.physics_model}`);
    console.log(`Expected: ~1100-1200m with FCM V2`);
    console.log(`Observed real crater: 1200m`);
    console.log(`Error: ${((crater.diameter - 1200) / 1200 * 100).toFixed(1)}%`);
}

testIronAPI().catch(err => {
    console.error('ERROR:', err.response?.data || err.message);
    process.exit(1);
});
