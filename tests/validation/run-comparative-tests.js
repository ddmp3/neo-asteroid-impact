const https = require('https');
const fs = require('fs');

// Load test samples
const samples = JSON.parse(fs.readFileSync('COMPARATIVE_TEST_SAMPLES.json', 'utf8')).samples;

// Function to simulate on our API
async function simulateOnOurAPI(sample) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      diameter: sample.diameter,
      velocity: sample.velocity, // API expects km/s
      angle: sample.angle,
      density: sample.density,
      composition: sample.composition,
      impactLocation: {
        lat: sample.impactLat,
        lon: sample.impactLon
      }
    });

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
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({
            sample: sample,
            result: result,
            status: 'success'
          });
        } catch (err) {
          reject({ sample: sample, error: err.message, status: 'parse_error' });
        }
      });
    });

    req.on('error', (err) => {
      reject({ sample: sample, error: err.message, status: 'network_error' });
    });

    req.write(data);
    req.end();
  });
}

// Run all simulations
async function runAllSimulations() {
  console.log('🚀 Starting comparative simulations on neo.lueger.fr...\n');

  const results = [];

  for (const sample of samples) {
    console.log(`[${sample.id}/10] Simulating: ${sample.name}...`);
    try {
      const result = await simulateOnOurAPI(sample);
      results.push(result);

      // Display key results
      const r = result.result;
      console.log(`  ✅ Energy: ${r.energy.totalEnergyMT.toFixed(2)} MT`);
      console.log(`  ✅ Crater: ${r.crater ? r.crater.diameter.toFixed(0) + 'm' : 'Airburst at ' + r.fragmentation.altitude.toFixed(0) + 'm'}`);
      console.log(`  ✅ Casualties: ${r.population.casualties.total.toLocaleString()}`);
      console.log('');
    } catch (err) {
      console.log(`  ❌ Error: ${err.error}\n`);
      results.push(err);
    }

    // Wait 500ms between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save results
  const output = {
    metadata: {
      simulator: 'Our Simulator (neo.lueger.fr)',
      version: '1.6.29',
      timestamp: new Date().toISOString(),
      samples_tested: samples.length,
      successful: results.filter(r => r.status === 'success').length
    },
    results: results
  };

  fs.writeFileSync('OUR_SIMULATOR_RESULTS.json', JSON.stringify(output, null, 2));
  console.log('✅ Results saved to OUR_SIMULATOR_RESULTS.json');

  return results;
}

// Run the tests
runAllSimulations()
  .then(results => {
    console.log('\n✅ All simulations completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
