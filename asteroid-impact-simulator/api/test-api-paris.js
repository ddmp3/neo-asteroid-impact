const axios = require('axios');

async function testParisAPI() {
    console.log('\n=== Testing Full API with Paris 2360m Iron Asteroid ===\n');

    try {
        const response = await axios.post('http://localhost:7071/api/simulate/impact', {
            diameter: 2360,
            velocity: 20,
            angle: 45,
            density: 7800,
            impactLocation: { lat: 48.8566, lon: 2.3522 }
        });

        const { simulation } = response.data;

        console.log('✓ API Response received\n');
        console.log('Impact Energy:', simulation.energy.joules.toExponential(2), 'J');
        console.log('Impact Energy:', simulation.energy.megatons.toLocaleString(), 'MT TNT');
        console.log('');
        console.log('Crater:');
        console.log('  Diameter:', simulation.crater.modifiedDiameter.toFixed(1), 'km');
        console.log('  Depth:', simulation.crater.modifiedDepth.toFixed(1), 'km');
        console.log('');
        console.log('=== CASUALTIES (DEDUPLICATED) ===');
        console.log('Total Casualties:', simulation.casualties.estimatedCasualties.toLocaleString());
        console.log('Total Injured:', simulation.casualties.estimatedInjured.toLocaleString());
        console.log('');
        console.log('Top 10 Affected Cities (Fireball Zone):');
        simulation.casualties.zones.fireball.affectedCities.slice(0, 10).forEach((city, i) => {
            console.log(`  ${i + 1}. ${city.name} (${city.country}): ${city.casualties.toLocaleString()} casualties (${city.casualtyRate}%) - ${city.distance}km away`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testParisAPI();
