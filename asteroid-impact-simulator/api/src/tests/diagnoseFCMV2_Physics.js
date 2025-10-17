/**
 * Diagnostic FCM V2 - Physics Analysis
 *
 * Test ONE STEP to understand the physics
 */

const CONSTANTS = {
    G_0: 9.81,
    C_D: 1.0,
    R_EARTH: 6371000
};

// Wheeler atmospheric density
function rho_air(h) {
    return -140.2 * Math.exp(-0.000187 * h) + 141.4 * Math.exp(-0.000186 * h);
}

function g(h) {
    const ratio = CONSTANTS.R_EARTH / (CONSTANTS.R_EARTH + h);
    return CONSTANTS.G_0 * ratio * ratio;
}

// Chelyabinsk parameters
const D_0 = 19.8;  // m
const v_0 = 19160;  // m/s
const theta_0_deg = 18.3;  // deg
const theta_0 = theta_0_deg * Math.PI / 180;
const rho_m = 3300;  // kg/m³

const m_0 = (4/3) * Math.PI * Math.pow(D_0/2, 3) * rho_m;
const r_0 = D_0 / 2;
const A_0 = Math.PI * r_0 * r_0;

console.log('═'.repeat(80));
console.log('DIAGNOSTIC FCM V2 - Physics Analysis');
console.log('═'.repeat(80));
console.log('');
console.log('Initial conditions:');
console.log(`  D_0 = ${D_0} m`);
console.log(`  v_0 = ${v_0} m/s`);
console.log(`  θ_0 = ${theta_0_deg}° = ${theta_0.toFixed(4)} rad`);
console.log(`  m_0 = ${m_0.toFixed(0)} kg`);
console.log(`  A_0 = ${A_0.toFixed(2)} m²`);
console.log('');

// Test ONE step from h = 50 km
const h_start = 50000;  // m
const dh = -10;  // m (descending)

console.log('═'.repeat(80));
console.log(`ONE STEP TEST: h = ${h_start/1000} km → ${(h_start+dh)/1000} km`);
console.log('═'.repeat(80));
console.log('');

// Atmospheric conditions
const rho = rho_air(h_start);
const g_val = g(h_start);

console.log(`Atmospheric density: ρ = ${rho.toFixed(6)} kg/m³`);
console.log(`Gravity: g = ${g_val.toFixed(3)} m/s²`);
console.log('');

// Timestep calculation
const sin_theta = Math.sin(theta_0);
const cos_theta = Math.cos(theta_0);

console.log(`sin(θ) = ${sin_theta.toFixed(4)}`);
console.log(`cos(θ) = ${cos_theta.toFixed(4)}`);
console.log('');

// TIME STEP
console.log('─'.repeat(80));
console.log('TIMESTEP CALCULATION');
console.log('─'.repeat(80));

// Method 1: dh = v * sin(θ) * dt  →  dt = dh / (v * sin(θ))
const dt_method1 = dh / (v_0 * sin_theta);
console.log(`Method 1: dt = dh / (v sin θ) = ${dh} / (${v_0} × ${sin_theta.toFixed(4)})`);
console.log(`  dt = ${dt_method1.toFixed(6)} s`);
console.log(`  ${dt_method1 < 0 ? 'NEGATIVE (correct for descending)' : 'POSITIVE (ERROR!)'}`);

// Method 2: If dh is negative, need |dt| positive
const dt_method2 = -dh / (v_0 * sin_theta);
console.log(`Method 2: dt = -dh / (v sin θ) = ${-dh} / (${v_0} × ${sin_theta.toFixed(4)})`);
console.log(`  dt = ${dt_method2.toFixed(6)} s`);
console.log(`  ${dt_method2 > 0 ? 'POSITIVE (physical time)' : 'NEGATIVE (ERROR!)'}`);
console.log('');

// Use Method 2 (physical time)
const dt = dt_method2;

// FORCES
console.log('─'.repeat(80));
console.log('FORCES AND ACCELERATIONS');
console.log('─'.repeat(80));

// Dynamic pressure
const P_dyn = rho * v_0 * v_0;
console.log(`Dynamic pressure: P_dyn = ρv² = ${rho.toFixed(6)} × ${v_0}² = ${P_dyn.toFixed(2)} Pa`);
console.log('');

// Drag force (always opposes motion, so negative)
const F_drag = -0.5 * CONSTANTS.C_D * rho * A_0 * v_0 * v_0;
const a_drag = F_drag / m_0;

console.log(`Drag force: F_drag = -½ C_D ρ A v²`);
console.log(`  F_drag = ${F_drag.toFixed(2)} N (negative = opposes motion)`);
console.log(`  a_drag = F_drag / m = ${a_drag.toFixed(6)} m/s²`);
console.log('');

// Gravity component
// Wheeler Eq. 1a: dv/dt = -C_D ρ A v²/(2m) - g sin(θ)
// The "- g sin(θ)" term is ALWAYS negative (decelerates)
console.log(`Gravity component (Wheeler Eq. 1a):`);
console.log(`  dv/dt includes: -g sin(θ)`);

// Option 1: -g sin(θ) with θ > 0 for descending
const a_grav_option1 = -g_val * sin_theta;
console.log(`  Option 1: a_grav = -g sin(θ) = -${g_val.toFixed(3)} × ${sin_theta.toFixed(4)} = ${a_grav_option1.toFixed(6)} m/s²`);

// Option 2: -g |sin(θ)|
const a_grav_option2 = -g_val * Math.abs(sin_theta);
console.log(`  Option 2: a_grav = -g |sin(θ)| = -${g_val.toFixed(3)} × ${Math.abs(sin_theta).toFixed(4)} = ${a_grav_option2.toFixed(6)} m/s²`);
console.log('');

// VELOCITY CHANGE
console.log('─'.repeat(80));
console.log('VELOCITY CHANGE');
console.log('─'.repeat(80));

for (const [name, a_grav] of [['Option 1', a_grav_option1], ['Option 2', a_grav_option2]]) {
    const dv = (a_drag + a_grav) * dt;
    const v_new = v_0 + dv;

    console.log(`${name}: a_grav = ${a_grav.toFixed(6)} m/s²`);
    console.log(`  a_total = a_drag + a_grav = ${a_drag.toFixed(6)} + ${a_grav.toFixed(6)} = ${(a_drag+a_grav).toFixed(6)} m/s²`);
    console.log(`  dv = a_total × dt = ${(a_drag+a_grav).toFixed(6)} × ${dt.toFixed(6)} = ${dv.toFixed(6)} m/s`);
    console.log(`  v_new = v_0 + dv = ${v_0} + ${dv.toFixed(6)} = ${v_new.toFixed(2)} m/s`);
    console.log(`  ${dv < 0 ? '✓ DECELERATION (correct)' : '✗ ACCELERATION (ERROR!)'}`);
    console.log('');
}

// ABLATION
console.log('─'.repeat(80));
console.log('ABLATION');
console.log('─'.repeat(80));

const sigma_ab = 1e-8;  // s²/m²
const dm = -0.5 * rho * A_0 * v_0 * v_0 * v_0 * sigma_ab * dt;
const m_new = m_0 + dm;

console.log(`Ablation coefficient: σ_ab = ${sigma_ab} s²/m²`);
console.log(`dm = -½ ρ A v³ σ_ab dt`);
console.log(`  dm = ${dm.toFixed(6)} kg`);
console.log(`  m_new = ${m_new.toFixed(0)} kg`);
console.log(`  Mass loss: ${(dm/m_0*100).toFixed(6)}%`);
console.log('');

// ENERGY
console.log('─'.repeat(80));
console.log('ENERGY BALANCE');
console.log('─'.repeat(80));

// Option 1
const dv_opt1 = (a_drag + a_grav_option1) * dt;
const v_new_opt1 = v_0 + dv_opt1;
const E_before = 0.5 * m_0 * v_0 * v_0;
const E_after_opt1 = 0.5 * m_new * v_new_opt1 * v_new_opt1;
const dE_opt1 = E_before - E_after_opt1;

console.log(`Option 1: a_grav = -g sin(θ)`);
console.log(`  E_before = ½ m v² = ${E_before.toFixed(2)} J`);
console.log(`  E_after = ½ m_new v_new² = ${E_after_opt1.toFixed(2)} J`);
console.log(`  dE = E_before - E_after = ${dE_opt1.toFixed(2)} J`);
console.log(`  ${dE_opt1 > 0 ? '✓ Energy deposited (correct)' : '✗ Energy gained (ERROR!)'}`);
console.log('');

// Option 2
const dv_opt2 = (a_drag + a_grav_option2) * dt;
const v_new_opt2 = v_0 + dv_opt2;
const E_after_opt2 = 0.5 * m_new * v_new_opt2 * v_new_opt2;
const dE_opt2 = E_before - E_after_opt2;

console.log(`Option 2: a_grav = -g |sin(θ)|`);
console.log(`  E_before = ½ m v² = ${E_before.toFixed(2)} J`);
console.log(`  E_after = ½ m_new v_new² = ${E_after_opt2.toFixed(2)} J`);
console.log(`  dE = E_before - E_after = ${dE_opt2.toFixed(2)} J`);
console.log(`  ${dE_opt2 > 0 ? '✓ Energy deposited (correct)' : '✗ Energy gained (ERROR!)'}`);
console.log('');

console.log('═'.repeat(80));
console.log('CONCLUSION');
console.log('═'.repeat(80));
console.log('');
console.log('The correct physics should show:');
console.log('  1. dt > 0 (physical time always positive)');
console.log('  2. dv < 0 (meteor decelerates)');
console.log('  3. dE > 0 (energy deposited into atmosphere)');
console.log('');
console.log(`Option ${dE_opt1 > 0 && dv_opt1 < 0 ? '1' : '2'} satisfies all conditions.`);
