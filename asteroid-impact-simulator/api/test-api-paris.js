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

        const { simulation, zoneAnalysis } = response.data;

        console.log('✓ API Response received\n');
        console.log('Impact Energy:', simulation.impactEnergy.joules.toExponential(2), 'J');
        console.log('Impact Energy:', simulation.impactEnergy.megatonsTNT.toLocaleString(), 'MT TNT');
        console.log('');
        console.log('Crater:');
        console.log('  Diameter:', simulation.crater.modifiedDiameter.toFixed(1), 'km');
        console.log('  Depth:', simulation.crater.modifiedDepth.toFixed(1), 'km');
        console.log('');
        console.log('Blast Zones:');
        console.log('  Fireball:', simulation.blastZones.fireball.radiusKm.toFixed(1), 'km');
        console.log('  Thermal:', simulation.blastZones.thermal.radiusKm.toFixed(1), 'km');
        console.log('  Air Blast:', simulation.blastZones.airBlast.radiusKm.toFixed(1), 'km');
        console.log('  Seismic Felt:', simulation.seismic.feltRadiusKm.toFixed(1), 'km');
        console.log('');
        console.log('=== HUMAN IMPACT (NEW) ===');
        console.log('Total Casualties:', zoneAnalysis.totalCasualties.toLocaleString());
        console.log('Total Population in Zones:', zoneAnalysis.totalPopulation.toLocaleString());
        console.log('Affected Cities:', zoneAnalysis.affectedCities);
        console.log('Data Source:', zoneAnalysis.dataSource);
        console.log('');
        console.log('Top 10 Affected Cities:');
        zoneAnalysis.casualties.slice(0, 10).forEach((city, i) => {
            console.log(`  ${i + 1}. ${city.name} (${city.country}): ${city.casualties.toLocaleString()} casualties - ${city.distance}km away`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testParisAPI();
