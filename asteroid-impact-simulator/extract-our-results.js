const fs = require('fs');

// Load our simulator results
const data = JSON.parse(fs.readFileSync('OUR_SIMULATOR_RESULTS.json', 'utf8'));

console.log('📊 OUR SIMULATOR RESULTS (v1.6.29)\n');
console.log('=' .repeat(120));

const results = [];

data.results.forEach((item) => {
  if (!item || !item.sample) {
    console.log(`\nERREUR: Item invalide`);
    return;
  }
  const sample = item.sample;
  if (!item.result || !item.result.simulation) {
    console.log(`\n[${sample.id}] ${sample.name} - ERREUR: Pas de résultat de simulation`);
    return;
  }
  const sim = item.result.simulation;

  const result = {
    id: sample.id,
    name: sample.name,
    diameter_m: sample.diameter,
    velocity_kms: sample.velocity,
    angle_deg: sample.angle,
    composition: sample.composition,
    density_kgm3: sample.density,

    // Our Results
    energy_MT: sim.energy.megatons,
    impactType: sim.fragmentation.impactType,
    burstAltitude_m: sim.fragmentation.altitude,
    craterDiameter_m: sim.crater ? sim.crater.diameter : 'Airburst',
    craterDepth_m: sim.crater ? sim.crater.depth : 'N/A',
    fireball_km: sim.blast.fireball / 1000,
    thermal_km: sim.blast.thermalRadius / 1000,
    airblast_km: sim.blast.airblastRadius / 1000,
    seismicMag: sim.seismic.magnitude,
    casualties: sim.casualties.totalAffected || 0,
    affectedCities: sim.casualties.affectedCities ? sim.casualties.affectedCities.length : 0
  };

  results.push(result);

  console.log(`\n[${result.id}] ${result.name}`);
  console.log(`    Location: ${sample.location}`);
  console.log(`    Input: D=${result.diameter_m}m, V=${result.velocity_kms}km/s, θ=${result.angle_deg}°, ρ=${result.density_kgm3}kg/m³, ${result.composition}`);
  console.log(`    Energy: ${result.energy_MT.toFixed(2)} MT`);
  console.log(`    Type: ${result.impactType}`);
  if (result.craterDiameter_m !== 'Airburst') {
    console.log(`    Crater: D=${(result.craterDiameter_m/1000).toFixed(2)}km, depth=${(result.craterDepth_m/1000).toFixed(2)}km`);
  } else {
    console.log(`    Burst Altitude: ${(result.burstAltitude_m/1000).toFixed(2)}km`);
  }
  console.log(`    Blast Zones: Fireball ${result.fireball_km.toFixed(1)}km, Thermal ${result.thermal_km.toFixed(1)}km, Airblast ${result.airblast_km.toFixed(1)}km`);
  console.log(`    Seismic: M${result.seismicMag.toFixed(1)}`);
  console.log(`    Casualties: ${result.casualties.toLocaleString()} (${result.affectedCities} cities affected)`);
});

console.log('\n' + '='.repeat(120));

// Save summary table
fs.writeFileSync('OUR_RESULTS_SUMMARY.json', JSON.stringify(results, null, 2));
console.log('\n✅ Summary saved to OUR_RESULTS_SUMMARY.json\n');
