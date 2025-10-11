/**
 * Test PopulationCityService with Paris 2360m iron asteroid scenario
 */

const populationService = require('./src/services/populationCityService');

async function testParisScenario() {
    console.log('\n=== Testing Paris 2360m Iron Asteroid Scenario ===\n');

    const parisLat = 48.8566;
    const parisLon = 2.3522;

    // Test different blast radii
    const testRadii = [50, 100, 200, 300, 500];

    for (const radiusKm of testRadii) {
        console.log(`\n--- Blast Radius: ${radiusKm} km ---`);

        const startTime = Date.now();
        const result = await populationService.getPopulationInRadius(parisLat, parisLon, radiusKm);
        const elapsedMs = Date.now() - startTime;

        console.log(`Total Population: ${result.totalPopulation.toLocaleString()}`);
        console.log(`Estimated Casualties: ${result.estimatedCasualties.toLocaleString()}`);
        console.log(`Affected Cities: ${result.totalAffectedCities}`);
        console.log(`Calculation Time: ${elapsedMs}ms`);
        console.log(`Data Source: ${result.dataSource}`);

        console.log('\nTop 10 Most Affected Cities:');
        result.affectedCities.slice(0, 10).forEach((city, i) => {
            console.log(`  ${i + 1}. ${city.name} (${city.country}): ${city.casualties.toLocaleString()} casualties (${city.casualtyRate}% of ${city.population.toLocaleString()}) - ${city.distance}km away`);
        });
    }

    // Test stats
    console.log('\n=== Database Statistics ===');
    const stats = populationService.getStats();
    console.log(`Loaded: ${stats.loaded}`);
    console.log(`Total Cities: ${stats.totalCities.toLocaleString()}`);
    console.log(`Total Population Covered: ${stats.totalPopulation.toLocaleString()}`);
    console.log(`Population Range: ${stats.minPopulation.toLocaleString()} - ${stats.maxPopulation.toLocaleString()}`);

    console.log('\nLargest 10 Cities in Database:');
    stats.largestCities.forEach((city, i) => {
        console.log(`  ${i + 1}. ${city.name} (${city.country}): ${city.population.toLocaleString()}`);
    });
}

// Run test
testParisScenario().catch(console.error);
