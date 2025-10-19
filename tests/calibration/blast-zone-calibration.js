/**
 * Blast Zone Calibration Script
 *
 * Purpose: Calibrate blast zone constants using historical asteroid impacts
 * References: Tunguska (1908), Chelyabinsk (2013), Hiroshima (1945)
 */

// Historical Data
const REFERENCE_EVENTS = {
    tunguska: {
        name: "Tunguska (1908)",
        energy_joules: 6.3e16,  // 15 MT
        energy_megatons: 15,
        observed: {
            fireball: 200,      // ~200m fireball diameter observed
            thermal: 20000,     // Trees scorched up to ~20 km
            airblast: 30000,    // Trees knocked down up to ~30 km radius
        },
        source: "Vasilyev, N. V. (1998). The Tunguska meteorite problem today"
    },
    chelyabinsk: {
        name: "Chelyabinsk (2013)",
        energy_joules: 2.1e15,  // 0.5 MT
        energy_megatons: 0.5,
        observed: {
            fireball: 17,       // ~17m fireball diameter
            thermal: 100000,    // Thermal burns reported up to ~100 km
            airblast: 20000,    // Window damage up to ~20 km
        },
        source: "Brown et al. (2013). A 500-kiloton airburst over Chelyabinsk"
    },
    hiroshima: {
        name: "Hiroshima (1945) - Nuclear reference",
        energy_joules: 6.3e13,  // 0.015 MT
        energy_megatons: 0.015,
        observed: {
            fireball: 200,      // ~200m fireball diameter
            thermal: 3500,      // 3rd degree burns up to 3.5 km
            airblast: 2000,     // Severe damage up to 2 km
        },
        source: "Glasstone & Dolan (1977). The Effects of Nuclear Weapons"
    }
};

// Current formula constants (from physicsEngine.js:261-286)
const CURRENT_CONSTANTS = {
    fireball: { multiplier: 40, exponent: 0.33 },
    thermal: { multiplier: 500, exponent: 0.41 },
    airblast: { multiplier: 350, exponent: 0.33 },
    radiation: { multiplier: 200, exponent: 0.41 }
};

// Calculate current predictions
function calculateBlastRadius(energy_joules, constants) {
    const megatons = energy_joules / 4.184e15;

    return {
        fireball: constants.fireball.multiplier * Math.pow(megatons, constants.fireball.exponent),
        thermal: constants.thermal.multiplier * Math.pow(megatons, constants.thermal.exponent),
        airblast: constants.airblast.multiplier * Math.pow(megatons, constants.airblast.exponent),
        radiation: constants.radiation.multiplier * Math.pow(megatons, constants.radiation.exponent)
    };
}

// Calculate error percentage
function calculateError(predicted, observed) {
    return ((predicted - observed) / observed) * 100;
}

// Analyze current model performance
console.log("=".repeat(80));
console.log("BLAST ZONE CALIBRATION ANALYSIS");
console.log("=".repeat(80));
console.log();

console.log("📊 CURRENT MODEL PERFORMANCE");
console.log("-".repeat(80));

let totalErrors = { fireball: [], thermal: [], airblast: [] };

for (const [key, event] of Object.entries(REFERENCE_EVENTS)) {
    console.log(`\n${event.name}`);
    console.log(`Energy: ${event.energy_megatons} MT (${event.energy_joules.toExponential(2)} J)`);
    console.log(`Source: ${event.source}`);
    console.log();

    const predicted = calculateBlastRadius(event.energy_joules, CURRENT_CONSTANTS);

    console.log("Zone         | Predicted | Observed | Error");
    console.log("-------------|-----------|----------|----------");

    const fireballError = calculateError(predicted.fireball, event.observed.fireball);
    console.log(`Fireball     | ${predicted.fireball.toFixed(0).padStart(7)}m | ${event.observed.fireball.toString().padStart(6)}m | ${fireballError > 0 ? '+' : ''}${fireballError.toFixed(1)}%`);
    totalErrors.fireball.push(Math.abs(fireballError));

    const thermalError = calculateError(predicted.thermal, event.observed.thermal);
    console.log(`Thermal      | ${(predicted.thermal/1000).toFixed(1).padStart(6)}km | ${(event.observed.thermal/1000).toFixed(0).padStart(5)}km | ${thermalError > 0 ? '+' : ''}${thermalError.toFixed(1)}%`);
    totalErrors.thermal.push(Math.abs(thermalError));

    const airblastError = calculateError(predicted.airblast, event.observed.airblast);
    console.log(`Airblast     | ${(predicted.airblast/1000).toFixed(1).padStart(6)}km | ${(event.observed.airblast/1000).toFixed(0).padStart(5)}km | ${airblastError > 0 ? '+' : ''}${airblastError.toFixed(1)}%`);
    totalErrors.airblast.push(Math.abs(airblastError));
}

// Calculate average errors
console.log("\n" + "=".repeat(80));
console.log("📈 AVERAGE ERRORS (Current Model)");
console.log("=".repeat(80));

const avgFireballError = totalErrors.fireball.reduce((a,b) => a+b, 0) / totalErrors.fireball.length;
const avgThermalError = totalErrors.thermal.reduce((a,b) => a+b, 0) / totalErrors.thermal.length;
const avgAirblastError = totalErrors.airblast.reduce((a,b) => a+b, 0) / totalErrors.airblast.length;
const overallError = (avgFireballError + avgThermalError + avgAirblastError) / 3;

console.log(`Fireball:  ${avgFireballError.toFixed(1)}%`);
console.log(`Thermal:   ${avgThermalError.toFixed(1)}%`);
console.log(`Airblast:  ${avgAirblastError.toFixed(1)}%`);
console.log(`Overall:   ${overallError.toFixed(1)}%`);

// Calibrate new constants using least-squares optimization
console.log("\n" + "=".repeat(80));
console.log("🔧 CALIBRATING NEW CONSTANTS");
console.log("=".repeat(80));

// For formulas: radius = K × Energy^n
// We can solve for K using observed data points

function calibrateConstant(exponent, dataPoints) {
    // Calculate optimal K for each data point, then average
    const K_values = dataPoints.map(point => {
        return point.observed / Math.pow(point.energy_megatons, exponent);
    });

    // Use median instead of mean to reduce outlier impact
    K_values.sort((a, b) => a - b);
    const median = K_values[Math.floor(K_values.length / 2)];

    return Math.round(median);
}

// Prepare data points for calibration
const fireballData = Object.values(REFERENCE_EVENTS).map(e => ({
    energy_megatons: e.energy_megatons,
    observed: e.observed.fireball
}));

const thermalData = Object.values(REFERENCE_EVENTS).map(e => ({
    energy_megatons: e.energy_megatons,
    observed: e.observed.thermal
}));

const airblastData = Object.values(REFERENCE_EVENTS).map(e => ({
    energy_megatons: e.energy_megatons,
    observed: e.observed.airblast
}));

// Calibrate (keeping exponents the same for physical consistency)
const CALIBRATED_CONSTANTS = {
    fireball: {
        multiplier: calibrateConstant(0.33, fireballData),
        exponent: 0.33
    },
    thermal: {
        multiplier: calibrateConstant(0.41, thermalData),
        exponent: 0.41
    },
    airblast: {
        multiplier: calibrateConstant(0.33, airblastData),
        exponent: 0.33
    },
    radiation: CURRENT_CONSTANTS.radiation // Keep radiation as-is (no good reference data)
};

console.log("\nCalibrated Constants:");
console.log(`Fireball:  K = ${CALIBRATED_CONSTANTS.fireball.multiplier} (was ${CURRENT_CONSTANTS.fireball.multiplier})`);
console.log(`Thermal:   K = ${CALIBRATED_CONSTANTS.thermal.multiplier} (was ${CURRENT_CONSTANTS.thermal.multiplier})`);
console.log(`Airblast:  K = ${CALIBRATED_CONSTANTS.airblast.multiplier} (was ${CURRENT_CONSTANTS.airblast.multiplier})`);
console.log(`Radiation: K = ${CALIBRATED_CONSTANTS.radiation.multiplier} (unchanged - no reference data)`);

// Test calibrated model
console.log("\n" + "=".repeat(80));
console.log("✅ CALIBRATED MODEL PERFORMANCE");
console.log("=".repeat(80));

let calibratedErrors = { fireball: [], thermal: [], airblast: [] };

for (const [key, event] of Object.entries(REFERENCE_EVENTS)) {
    console.log(`\n${event.name}`);

    const predicted = calculateBlastRadius(event.energy_joules, CALIBRATED_CONSTANTS);

    console.log("Zone         | Predicted | Observed | Error");
    console.log("-------------|-----------|----------|----------");

    const fireballError = calculateError(predicted.fireball, event.observed.fireball);
    console.log(`Fireball     | ${predicted.fireball.toFixed(0).padStart(7)}m | ${event.observed.fireball.toString().padStart(6)}m | ${fireballError > 0 ? '+' : ''}${fireballError.toFixed(1)}%`);
    calibratedErrors.fireball.push(Math.abs(fireballError));

    const thermalError = calculateError(predicted.thermal, event.observed.thermal);
    console.log(`Thermal      | ${(predicted.thermal/1000).toFixed(1).padStart(6)}km | ${(event.observed.thermal/1000).toFixed(0).padStart(5)}km | ${thermalError > 0 ? '+' : ''}${thermalError.toFixed(1)}%`);
    calibratedErrors.thermal.push(Math.abs(thermalError));

    const airblastError = calculateError(predicted.airblast, event.observed.airblast);
    console.log(`Airblast     | ${(predicted.airblast/1000).toFixed(1).padStart(6)}km | ${(event.observed.airblast/1000).toFixed(0).padStart(5)}km | ${airblastError > 0 ? '+' : ''}${airblastError.toFixed(1)}%`);
    calibratedErrors.airblast.push(Math.abs(airblastError));
}

// Calculate improved errors
console.log("\n" + "=".repeat(80));
console.log("📈 AVERAGE ERRORS (Calibrated Model)");
console.log("=".repeat(80));

const newAvgFireballError = calibratedErrors.fireball.reduce((a,b) => a+b, 0) / calibratedErrors.fireball.length;
const newAvgThermalError = calibratedErrors.thermal.reduce((a,b) => a+b, 0) / calibratedErrors.thermal.length;
const newAvgAirblastError = calibratedErrors.airblast.reduce((a,b) => a+b, 0) / calibratedErrors.airblast.length;
const newOverallError = (newAvgFireballError + newAvgThermalError + newAvgAirblastError) / 3;

console.log(`Fireball:  ${newAvgFireballError.toFixed(1)}% (was ${avgFireballError.toFixed(1)}%)`);
console.log(`Thermal:   ${newAvgThermalError.toFixed(1)}% (was ${avgThermalError.toFixed(1)}%)`);
console.log(`Airblast:  ${newAvgAirblastError.toFixed(1)}% (was ${avgAirblastError.toFixed(1)}%)`);
console.log(`Overall:   ${newOverallError.toFixed(1)}% (was ${overallError.toFixed(1)}%)`);

const improvement = overallError - newOverallError;
console.log(`\n🎯 Improvement: ${improvement.toFixed(1)} percentage points`);

// Generate code snippet for physicsEngine.js
console.log("\n" + "=".repeat(80));
console.log("📝 CODE UPDATE FOR physicsEngine.js");
console.log("=".repeat(80));
console.log(`
Replace lines 268-278 in physicsEngine.js with:

    calculateBlastRadius(energy) {
        const megatons = energy / (4.184e15);

        // Calibrated asteroid impact scaling laws
        // Based on historical events: Tunguska (1908), Chelyabinsk (2013), Hiroshima (1945)
        // Average error reduced from ${overallError.toFixed(1)}% to ${newOverallError.toFixed(1)}%

        // Fireball radius - initial vaporization zone
        const fireball = ${CALIBRATED_CONSTANTS.fireball.multiplier} * Math.pow(megatons, ${CALIBRATED_CONSTANTS.fireball.exponent}); // meters

        // Thermal radiation - 3rd degree burns
        const thermalRadiation = ${CALIBRATED_CONSTANTS.thermal.multiplier} * Math.pow(megatons, ${CALIBRATED_CONSTANTS.thermal.exponent}); // meters

        // Air blast overpressure (20 psi - building collapse)
        const airblast = ${CALIBRATED_CONSTANTS.airblast.multiplier} * Math.pow(megatons, ${CALIBRATED_CONSTANTS.airblast.exponent}); // meters

        // Ionizing radiation zone (less important for asteroids vs nuclear)
        const radiation = ${CALIBRATED_CONSTANTS.radiation.multiplier} * Math.pow(megatons, ${CALIBRATED_CONSTANTS.radiation.exponent}); // meters

        return {
            fireball: fireball,
            radiationRadius: radiation,
            airblastRadius: airblast,
            thermalRadius: thermalRadiation
        };
    }
`);

console.log("=".repeat(80));
console.log("✅ CALIBRATION COMPLETE");
console.log("=".repeat(80));
