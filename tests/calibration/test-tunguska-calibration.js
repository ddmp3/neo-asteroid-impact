/**
 * Test Tunguska-calibrated blast zone constants
 */

const EVENTS = {
    tunguska: {
        name: "Tunguska (1908)",
        energy_mt: 15,
        observed: {
            fireball: 200,      // meters
            thermal: 20000,     // meters (20 km scorch radius)
            airblast: 30000,    // meters (30 km trees flattened)
        }
    },
    chelyabinsk: {
        name: "Chelyabinsk (2013)",
        energy_mt: 0.44,
        observed: {
            fireball: 17,       // meters
            thermal: 100000,    // meters (100 km thermal effects)
            airblast: 90000,    // meters (90 km window damage)
        }
    }
};

// Current constants (physicsEngine.js)
const CURRENT = {
    fireball: { k: 40, n: 0.33 },
    thermal: { k: 500, n: 0.41 },
    airblast: { k: 350, n: 0.33 },
};

// Proposed Tunguska-calibrated constants
const CALIBRATED = {
    fireball: { k: 80, n: 0.33 },
    thermal: { k: 5300, n: 0.41 },
    airblast: { k: 12000, n: 0.33 },
};

function calculate(mt, constants) {
    return {
        fireball: constants.fireball.k * Math.pow(mt, constants.fireball.n),
        thermal: constants.thermal.k * Math.pow(mt, constants.thermal.n),
        airblast: constants.airblast.k * Math.pow(mt, constants.airblast.n),
    };
}

function error(predicted, observed) {
    return ((predicted - observed) / observed * 100).toFixed(1);
}

console.log("=".repeat(80));
console.log("BLAST ZONE CALIBRATION TEST");
console.log("=".repeat(80));

for (const [key, event] of Object.entries(EVENTS)) {
    console.log(`\n${event.name} (${event.energy_mt} MT)`);
    console.log("=".repeat(80));

    const current = calculate(event.energy_mt, CURRENT);
    const calibrated = calculate(event.energy_mt, CALIBRATED);

    console.log("\nFIREBALL:");
    console.log(`  Current:    ${current.fireball.toFixed(0)}m (error: ${error(current.fireball, event.observed.fireball)}%)`);
    console.log(`  Calibrated: ${calibrated.fireball.toFixed(0)}m (error: ${error(calibrated.fireball, event.observed.fireball)}%)`);
    console.log(`  Observed:   ${event.observed.fireball}m`);

    console.log("\nTHERMAL:");
    console.log(`  Current:    ${(current.thermal/1000).toFixed(1)}km (error: ${error(current.thermal, event.observed.thermal)}%)`);
    console.log(`  Calibrated: ${(calibrated.thermal/1000).toFixed(1)}km (error: ${error(calibrated.thermal, event.observed.thermal)}%)`);
    console.log(`  Observed:   ${(event.observed.thermal/1000).toFixed(0)}km`);

    console.log("\nAIRBLAST:");
    console.log(`  Current:    ${(current.airblast/1000).toFixed(1)}km (error: ${error(current.airblast, event.observed.airblast)}%)`);
    console.log(`  Calibrated: ${(calibrated.airblast/1000).toFixed(1)}km (error: ${error(calibrated.airblast, event.observed.airblast)}%)`);
    console.log(`  Observed:   ${(event.observed.airblast/1000).toFixed(0)}km`);
}

// Calculate average errors
console.log("\n" + "=".repeat(80));
console.log("SUMMARY");
console.log("=".repeat(80));

const current_tunguska = calculate(15, CURRENT);
const calibrated_tunguska = calculate(15, CALIBRATED);

const current_errors_tunguska = [
    Math.abs(parseFloat(error(current_tunguska.fireball, 200))),
    Math.abs(parseFloat(error(current_tunguska.thermal, 20000))),
    Math.abs(parseFloat(error(current_tunguska.airblast, 30000))),
];

const calibrated_errors_tunguska = [
    Math.abs(parseFloat(error(calibrated_tunguska.fireball, 200))),
    Math.abs(parseFloat(error(calibrated_tunguska.thermal, 20000))),
    Math.abs(parseFloat(error(calibrated_tunguska.airblast, 30000))),
];

const avg_current = (current_errors_tunguska.reduce((a,b) => a+b) / 3).toFixed(1);
const avg_calibrated = (calibrated_errors_tunguska.reduce((a,b) => a+b) / 3).toFixed(1);

console.log(`\nTunguska Average Error:`);
console.log(`  Current:    ${avg_current}%`);
console.log(`  Calibrated: ${avg_calibrated}%`);
console.log(`  Improvement: ${(avg_current - avg_calibrated).toFixed(1)} percentage points`);

console.log(`\n✅ Recommendation: Use calibrated constants`);
console.log(`   - Tunguska error reduced from ${avg_current}% to ${avg_calibrated}%`);
console.log(`   - Suitable for most dangerous asteroids (>50m)`);
console.log(`   - Document limitation for high-altitude airbursts`);

console.log("\n" + "=".repeat(80));
