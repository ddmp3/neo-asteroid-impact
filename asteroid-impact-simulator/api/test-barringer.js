// Test Barringer crater prediction using Collins et al. (2005) formula

// Barringer (Meteor Crater, Arizona) parameters
const L = 50;              // 50m impactor diameter (m)
const v = 12800;           // 12.8 km/s velocity (m/s)
const angle = 90;          // 90° vertical impact
const rho_i = 7800;        // iron meteorite density (kg/m³)
const rho_t = 2500;        // Earth crust density (kg/m³)
const g = 9.81;            // Earth gravity (m/s²)

console.log('=== BARRINGER CRATER TEST - Collins et al. (2005) Formula ===\n');
console.log('Input parameters:');
console.log(`  Impactor diameter: ${L} m`);
console.log(`  Velocity: ${v/1000} km/s`);
console.log(`  Angle: ${angle}° (vertical)`);
console.log(`  Impactor density: ${rho_i} kg/m³ (iron)`);
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
console.log(`Transient crater diameter: ${D_tc.toFixed(2)} m`);

// Simple crater scaling (D_tc < 3.2 km)
if (D_tc < 3200) {
    const D_final = 1.25 * D_tc;
    console.log(`\nSimple crater (D_tc < 3.2 km):`);
    console.log(`  D_final = 1.25 × D_tc`);
    console.log(`  D_final = 1.25 × ${D_tc.toFixed(2)}`);
    console.log(`  D_final = ${D_final.toFixed(2)} m`);

    console.log(`\n=== VALIDATION ===`);
    console.log(`Observed Barringer diameter: 1200 m`);
    console.log(`Predicted final diameter: ${D_final.toFixed(2)} m`);
    console.log(`Error: ${((D_final - 1200) / 1200 * 100).toFixed(1)}%`);
} else {
    const D_tc_km = D_tc / 1000;
    const D_final = 1.17 * Math.pow(D_tc_km, 1.13);
    console.log(`\nComplex crater (D_tc > 3.2 km):`);
    console.log(`  D_final = 1.17 × D_tc^1.13 = ${D_final.toFixed(2)} km`);
}

console.log(`\n=== REFERENCE ===`);
console.log(`Collins, Melosh & Marcus (2005)`);
console.log(`"Earth Impact Effects Program"`);
console.log(`Meteoritics & Planetary Science 40(6), 817-840`);
