// Test Ries crater prediction using Collins et al. (2005) formula

// Ries crater (Germany) parameters
const L = 1500;            // 1.5 km impactor diameter (m)
const v = 20000;           // 20 km/s velocity (m/s)
const angle = 30;          // 30° oblique impact (estimated)
const rho_i = 3000;        // rocky asteroid density (kg/m³)
const rho_t = 2500;        // Earth crust density (kg/m³)
const g = 9.81;            // Earth gravity (m/s²)

console.log('=== RIES CRATER TEST - Collins et al. (2005) Formula ===\n');
console.log('Input parameters:');
console.log(`  Impactor diameter: ${L/1000} km`);
console.log(`  Velocity: ${v/1000} km/s`);
console.log(`  Angle: ${angle}°`);
console.log(`  Impactor density: ${rho_i} kg/m³ (rocky)`);
console.log(`  Target density: ${rho_t} kg/m³`);

// Collins et al. (2005) transient crater formula
const thetaRad = angle * Math.PI / 180;
const sinTheta = Math.sin(thetaRad);

const D_tc = 1.161 *
             Math.pow(L, 0.78) *
             Math.pow(rho_i / rho_t, 1/3) *
             Math.pow(v, 0.44) *
             Math.pow(g, -0.22) *
             Math.pow(sinTheta, 1/3);

console.log('\n=== Collins Formula Calculation ===');
console.log(`D_tc = 1.161 × L^0.78 × (ρ_i/ρ_t)^(1/3) × v^0.44 × g^(-0.22) × sin(θ)^(1/3)`);
console.log(`\nTerm-by-term:`);
console.log(`  L^0.78 = ${L}^0.78 = ${Math.pow(L, 0.78).toFixed(2)}`);
console.log(`  (ρ_i/ρ_t)^(1/3) = (${rho_i}/${rho_t})^0.333 = ${Math.pow(rho_i/rho_t, 1/3).toFixed(4)}`);
console.log(`  v^0.44 = ${v}^0.44 = ${Math.pow(v, 0.44).toFixed(2)}`);
console.log(`  g^(-0.22) = ${g}^(-0.22) = ${Math.pow(g, -0.22).toFixed(4)}`);
console.log(`  sin(${angle}°)^(1/3) = ${sinTheta.toFixed(4)}^0.333 = ${Math.pow(sinTheta, 1/3).toFixed(4)}`);

console.log(`\n=== RESULT ===`);
console.log(`Transient crater diameter: ${D_tc.toFixed(2)} m = ${(D_tc/1000).toFixed(2)} km`);

// Complex crater scaling (D_tc > 3.2 km)
if (D_tc > 3200) {
    const D_tc_km = D_tc / 1000;
    const D_final = 1.17 * Math.pow(D_tc_km, 1.13);
    console.log(`\nComplex crater (D_tc > 3.2 km):`);
    console.log(`  D_final = 1.17 × D_tc^1.13`);
    console.log(`  D_final = 1.17 × ${D_tc_km.toFixed(2)}^1.13`);
    console.log(`  D_final = ${D_final.toFixed(2)} km`);

    console.log(`\n=== VALIDATION ===`);
    console.log(`Observed Ries diameter: 24 km`);
    console.log(`Predicted final diameter: ${D_final.toFixed(2)} km`);
    console.log(`Error: ${((D_final - 24) / 24 * 100).toFixed(1)}%`);
} else {
    const D_final = 1.25 * D_tc;
    console.log(`\nSimple crater (D_tc < 3.2 km):`);
    console.log(`  D_final = 1.25 × D_tc = ${(D_final/1000).toFixed(2)} km`);

    console.log(`\n=== VALIDATION ===`);
    console.log(`Observed Ries diameter: 24 km`);
    console.log(`Predicted final diameter: ${(D_final/1000).toFixed(2)} km`);
    console.log(`Error: ${(((D_final/1000) - 24) / 24 * 100).toFixed(1)}%`);
}

console.log(`\n=== REFERENCE ===`);
console.log(`Collins, Melosh & Marcus (2005)`);
console.log(`"Earth Impact Effects Program"`);
console.log(`Meteoritics & Planetary Science 40(6), 817-840`);
