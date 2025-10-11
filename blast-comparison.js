/**
 * Compare current code vs documentation formulas
 */

const EVENTS = {
    chelyabinsk: {
        name: "Chelyabinsk (2013)",
        energy_mt: 0.44,
        observed: {
            fireball: 17,
            thermal: 100000,  // burns up to 100 km
            airblast: 90000,  // damage up to 90 km
        }
    },
    tunguska: {
        name: "Tunguska (1908)",
        energy_mt: 15,
        observed: {
            fireball: 200,
            thermal: 20000,   // scorch up to 20 km
            airblast: 30000,  // trees down to 30 km
        }
    }
};

console.log("=".repeat(80));
console.log("BLAST ZONE COMPARISON: Current Code vs Documentation");
console.log("=".repeat(80));

for (const [key, event] of Object.entries(EVENTS)) {
    const mt = event.energy_mt;

    // CURRENT CODE (physicsEngine.js lines 268-275)
    const code_fireball = 40 * Math.pow(mt, 0.33);
    const code_thermal = 500 * Math.pow(mt, 0.41);
    const code_airblast = 350 * Math.pow(mt, 0.33);

    // DOCUMENTATION (SCIENTIFIC_DOCUMENTATION.md lines 322-343)
    const doc_fireball = 800 * Math.pow(mt, 0.33);
    const doc_thermal = doc_fireball * 3.5;
    const doc_airblast = doc_fireball * 7;

    console.log(`\n${event.name} (${mt} MT)`);
    console.log("=".repeat(80));

    console.log("\nFIREBALL:");
    console.log(`  Current Code: ${code_fireball.toFixed(0)}m (error: ${Math.abs((code_fireball - event.observed.fireball)/event.observed.fireball * 100).toFixed(1)}%)`);
    console.log(`  Documentation: ${doc_fireball.toFixed(0)}m (error: ${Math.abs((doc_fireball - event.observed.fireball)/event.observed.fireball * 100).toFixed(1)}%)`);
    console.log(`  Observed: ${event.observed.fireball}m`);

    console.log("\nTHERMAL:");
    console.log(`  Current Code: ${(code_thermal/1000).toFixed(1)}km (error: ${Math.abs((code_thermal - event.observed.thermal)/event.observed.thermal * 100).toFixed(1)}%)`);
    console.log(`  Documentation: ${(doc_thermal/1000).toFixed(1)}km (error: ${Math.abs((doc_thermal - event.observed.thermal)/event.observed.thermal * 100).toFixed(1)}%)`);
    console.log(`  Observed: ${(event.observed.thermal/1000).toFixed(0)}km`);

    console.log("\nAIRBLAST:");
    console.log(`  Current Code: ${(code_airblast/1000).toFixed(1)}km (error: ${Math.abs((code_airblast - event.observed.airblast)/event.observed.airblast * 100).toFixed(1)}%)`);
    console.log(`  Documentation: ${(doc_airblast/1000).toFixed(1)}km (error: ${Math.abs((doc_airblast - event.observed.airblast)/event.observed.airblast * 100).toFixed(1)}%)`);
    console.log(`  Observed: ${(event.observed.airblast/1000).toFixed(0)}km`);
}

console.log("\n" + "=".repeat(80));
console.log("CONCLUSION");
console.log("=".repeat(80));
console.log(`
Le code actuel utilise des constantes BEAUCOUP plus petites que la documentation.
Les deux sont trop petits pour les airbursts (Chelyabinsk, Tunguska).

Cela suggère que :
1. Les constantes actuelles sont peut-être calibrées pour les IMPACTS AU SOL
2. Les airbursts nécessitent des constantes plus grandes
3. Il faut un modèle qui distingue airburst vs ground impact

Regardons maintenant si des documents de calibration existent déjà...
`);
