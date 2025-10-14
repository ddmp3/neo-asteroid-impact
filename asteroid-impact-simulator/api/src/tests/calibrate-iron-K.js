/**
 * CALIBRATION RIGOUREUSE DES K POUR CRATÈRES FER
 *
 * Objectif: Trouver les VRAIS K nécessaires pour chaque cratère fer
 * Méthode: Inverse calculation depuis observations réelles
 */

// Base de données cratères fer (10 total)
const IRON_CRATERS = [
    // LARGE (≥50m)
    {name: 'Barringer', D_obs: 1200, D_imp: 50, E: 4.2e16, angle: 80, V: 12800},
    {name: 'Wolfe Creek', D_obs: 892, D_imp: 50, E: 4.2e16, angle: 45, V: 17000},
    {name: 'Roter Kamm', D_obs: 2500, D_imp: 150, E: 3.8e17, angle: 45, V: 15000},

    // SMALL (10-50m)
    {name: 'Odessa', D_obs: 168, D_imp: 12, E: 3.3e14, angle: 50, V: 14000},
    {name: 'Wabar', D_obs: 116, D_imp: 10, E: 1.7e14, angle: 45, V: 12000},
    {name: 'Boxhole', D_obs: 175, D_imp: 15, E: 6.1e14, angle: 45, V: 14000},
    {name: 'Monturaqui', D_obs: 460, D_imp: 20, E: 2.0e15, angle: 45, V: 17000},

    // TINY (<10m)
    {name: 'Henbury', D_obs: 180, D_imp: 6, E: 4.6e13, angle: 45, V: 15000},
    {name: 'Kaali', D_obs: 110, D_imp: 6, E: 2.0e13, angle: 45, V: 10000},
    {name: 'Sikhote-Alin', D_obs: 26, D_imp: 3, E: 1.0e13, angle: 45, V: 14000}
];

/**
 * Calcul INVERSE: Trouver K nécessaire pour reproduire D_obs
 */
function calculateRequiredK(crater) {
    const {D_obs, E, angle} = crater;

    // Formule: D_transient = K × (E/1e15)^0.25 × angleFactor
    const E_norm = E / 1e15;
    const E_factor = Math.pow(E_norm, 0.25);

    // Angle correction (simplifié 45° = sin^(1/3))
    const angleRad = angle * Math.PI / 180;
    const angleFactor = angle < 30 ? Math.pow(Math.sin(angleRad), 0.5) :
                        angle < 60 ? Math.pow(Math.sin(angleRad), 1/3) :
                        0.95 + 0.05 * Math.sin(angleRad);

    // D_transient = D_final / 1.25 (simple crater)
    // (Assume all < 3.2km donc simple)
    const D_transient = D_obs / 1.25;

    // Résoudre pour K
    const K_required = D_transient / (E_factor * angleFactor);

    return {
        ...crater,
        D_transient: D_transient,
        E_factor: E_factor,
        angleFactor: angleFactor,
        K_required: K_required
    };
}

console.log('═'.repeat(100));
console.log('CALIBRATION INVERSE - CRATÈRES FER');
console.log('Objectif: Trouver K réels depuis observations');
console.log('═'.repeat(100));
console.log();

// Calculer K requis pour chaque cratère
const results = IRON_CRATERS.map(calculateRequiredK);

// Grouper par catégorie de taille
const large = results.filter(r => r.D_imp >= 50);
const small = results.filter(r => r.D_imp >= 10 && r.D_imp < 50);
const tiny = results.filter(r => r.D_imp < 10);

console.log('LARGE IRON (≥50m)');
console.log('-'.repeat(100));
large.forEach(r => {
    console.log(`${r.name.padEnd(15)} | D_imp=${r.D_imp}m | D_obs=${r.D_obs}m | K_required=${r.K_required.toFixed(1)}`);
});
const K_large_mean = large.reduce((sum, r) => sum + r.K_required, 0) / large.length;
console.log(`MOYENNE K_large: ${K_large_mean.toFixed(1)}`);
console.log();

console.log('SMALL IRON (10-50m)');
console.log('-'.repeat(100));
small.forEach(r => {
    console.log(`${r.name.padEnd(15)} | D_imp=${r.D_imp}m | D_obs=${r.D_obs}m | K_required=${r.K_required.toFixed(1)}`);
});
const K_small_mean = small.reduce((sum, r) => sum + r.K_required, 0) / small.length;
console.log(`MOYENNE K_small: ${K_small_mean.toFixed(1)}`);
console.log();

// Analyse régression linéaire pour small iron
console.log('RÉGRESSION LINÉAIRE SMALL IRON: K = a + b×D_imp');
const n = small.length;
const sum_x = small.reduce((sum, r) => sum + r.D_imp, 0);
const sum_y = small.reduce((sum, r) => sum + r.K_required, 0);
const sum_xy = small.reduce((sum, r) => sum + r.D_imp * r.K_required, 0);
const sum_xx = small.reduce((sum, r) => sum + r.D_imp * r.D_imp, 0);

const b = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
const a = (sum_y - b * sum_x) / n;

console.log(`a (intercept) = ${a.toFixed(1)}`);
console.log(`b (slope) = ${b.toFixed(2)}`);
console.log(`Formule: K_small = ${a.toFixed(1)} + ${b.toFixed(2)} × D_imp`);
console.log();

console.log('TINY IRON (<10m)');
console.log('-'.repeat(100));
tiny.forEach(r => {
    console.log(`${r.name.padEnd(15)} | D_imp=${r.D_imp}m | D_obs=${r.D_obs}m | K_required=${r.K_required.toFixed(1)}`);
});
const K_tiny_mean = tiny.reduce((sum, r) => sum + r.K_required, 0) / tiny.length;
console.log(`MOYENNE K_tiny: ${K_tiny_mean.toFixed(1)}`);
console.log();

// Régression linéaire pour tiny iron
const n_tiny = tiny.length;
const sum_x_tiny = tiny.reduce((sum, r) => sum + r.D_imp, 0);
const sum_y_tiny = tiny.reduce((sum, r) => sum + r.K_required, 0);
const sum_xy_tiny = tiny.reduce((sum, r) => sum + r.D_imp * r.K_required, 0);
const sum_xx_tiny = tiny.reduce((sum, r) => sum + r.D_imp * r.D_imp, 0);

const b_tiny = (n_tiny * sum_xy_tiny - sum_x_tiny * sum_y_tiny) / (n_tiny * sum_xx_tiny - sum_x_tiny * sum_x_tiny);
const a_tiny = (sum_y_tiny - b_tiny * sum_x_tiny) / n_tiny;

console.log(`Formule: K_tiny = ${a_tiny.toFixed(1)} + ${b_tiny.toFixed(2)} × D_imp`);
console.log();

console.log('═'.repeat(100));
console.log('RECOMMANDATIONS FINALES');
console.log('═'.repeat(100));
console.log();
console.log(`K_large (≥50m): ${K_large_mean.toFixed(0)} (constant)`);
console.log(`K_small (10-50m): ${a.toFixed(0)} + ${b.toFixed(1)}×D (linéaire)`);
console.log(`K_tiny (<10m): ${a_tiny.toFixed(0)} + ${b_tiny.toFixed(1)}×D (linéaire)`);
console.log();
console.log('ACTUEL v1.7.0:');
console.log('K_large = 380');
console.log('K_small = 140 + 4.8×D');
console.log('K_tiny = 120 + 5.0×D');
console.log();
console.log('ÉCART vs OPTIMAL:');
console.log(`Large: ${((380 - K_large_mean) / K_large_mean * 100).toFixed(1)}%`);
console.log(`Small intercept: ${((140 - a) / a * 100).toFixed(1)}%`);
console.log(`Small slope: ${((4.8 - b) / b * 100).toFixed(1)}%`);
console.log(`Tiny intercept: ${((120 - a_tiny) / a_tiny * 100).toFixed(1)}%`);
console.log(`Tiny slope: ${((5.0 - b_tiny) / b_tiny * 100).toFixed(1)}%`);
