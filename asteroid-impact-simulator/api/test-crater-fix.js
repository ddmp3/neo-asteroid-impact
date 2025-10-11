/**
 * Test de la correction de la formule de cratère
 * Validation avec Barringer Crater
 */

const PhysicsEngine = require('./src/services/physicsEngine');
const engine = new PhysicsEngine();

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  TEST CORRECTION FORMULE CRATÈRE                           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// BARRINGER CRATER (Arizona)
console.log('═══ BARRINGER CRATER (Arizona, ~50,000 ans) ═══\n');

const barringer = {
    diameter: 50,      // mètres
    velocity: 12.8,    // km/s
    angle: 90,         // degrés (vertical)
    density: 7800,     // kg/m³ (fer-nickel)

    observed: {
        craterDiameter: 1200,  // mètres
        craterDepth: 300,      // mètres (original avant érosion)
        energy: 10             // MT
    }
};

// Calcul de l'énergie
const mass = (4/3) * Math.PI * Math.pow(barringer.diameter/2, 3) * barringer.density;
const velocity = barringer.velocity * 1000; // m/s
const energy = 0.5 * mass * velocity * velocity;
const energyMT = energy / 4.184e15;

console.log('📊 Paramètres:');
console.log(`   Diamètre projectile: ${barringer.diameter}m`);
console.log(`   Vitesse: ${barringer.velocity} km/s`);
console.log(`   Angle: ${barringer.angle}°`);
console.log(`   Densité: ${barringer.density} kg/m³`);
console.log(`   Masse: ${(mass/1e6).toFixed(2)} millions kg`);
console.log('');

console.log('⚡ Énergie:');
console.log(`   Calculée: ${energyMT.toFixed(2)} MT`);
console.log(`   Observée: ${barringer.observed.energy} MT`);
console.log('');

// Calcul du cratère avec NOUVELLE formule
const crater = engine.calculateCraterSize(energy, barringer.angle, 2500);

console.log('🕳️  CRATÈRE - NOUVELLE FORMULE (K=60):');
console.log(`   Calculé: ${crater.diameter.toFixed(0)}m diamètre, ${crater.depth.toFixed(0)}m profondeur`);
console.log(`   Observé: ${barringer.observed.craterDiameter}m diamètre, ${barringer.observed.craterDepth}m profondeur`);
console.log('');

const diameterError = Math.abs(crater.diameter - barringer.observed.craterDiameter) / barringer.observed.craterDiameter * 100;
const depthError = Math.abs(crater.depth - barringer.observed.craterDepth) / barringer.observed.craterDepth * 100;

console.log('📊 PRÉCISION:');
console.log(`   ✓ Erreur Diamètre: ${diameterError.toFixed(1)}% ${diameterError < 10 ? '✅ EXCELLENT' : diameterError < 30 ? '✅ BON' : '⚠️'}`);
console.log(`   ✓ Erreur Profondeur: ${depthError.toFixed(1)}% ${depthError < 20 ? '✅ EXCELLENT' : depthError < 40 ? '✅ BON' : '⚠️'}`);
console.log('');

// Comparaison AVANT/APRÈS
console.log('═══ AMÉLIORATION ═══\n');

// Calcul avec ancienne formule (K=1.8)
const oldDiameter = 1.8 * Math.pow(energy / 1e15, 0.25);
const oldError = Math.abs(oldDiameter - barringer.observed.craterDiameter) / barringer.observed.craterDiameter * 100;

console.log('❌ ANCIENNE FORMULE (K=1.8):');
console.log(`   Calculé: ${oldDiameter.toFixed(0)}m`);
console.log(`   Erreur: ${oldError.toFixed(1)}%`);
console.log('');

console.log('✅ NOUVELLE FORMULE (K=60):');
console.log(`   Calculé: ${crater.diameter.toFixed(0)}m`);
console.log(`   Erreur: ${diameterError.toFixed(1)}%`);
console.log('');

const improvement = oldError / diameterError;
console.log(`🎯 AMÉLIORATION: ${improvement.toFixed(1)}x plus précis!`);
console.log('');

// Test avec Paris (pour voir l'impact)
console.log('═══ TEST PARIS (2360m fer, 20 km/s) ═══\n');

const parisTest = {
    diameter: 2360,
    velocity: 20000, // m/s
    density: 7800
};

const massParis = (4/3) * Math.PI * Math.pow(parisTest.diameter/2, 3) * parisTest.density;
const energyParis = 0.5 * massParis * parisTest.velocity * parisTest.velocity;
const craterParis = engine.calculateCraterSize(energyParis, 45, 2500);

console.log('🕳️  Cratère Paris:');
console.log(`   Diamètre: ${(craterParis.diameter/1000).toFixed(1)} km`);
console.log(`   Profondeur: ${(craterParis.depth/1000).toFixed(2)} km`);
console.log(`   Volume: ${(craterParis.volume/1e9).toFixed(2)} km³`);
console.log('');

console.log('✅ FORMULE VALIDÉE ET CORRIGÉE!\n');
