/**
 * Analyze Altitude Distribution - Understand why NO configurations match Tunguska
 *
 * QUESTION CLEF: Quelle est la distribution réelle des altitudes?
 * Sommes-nous systématiquement trop HAUT (30-40 km)?
 *
 * v1.7.3 - Diagnostic complet
 */

const AtmosphericTrajectory = require('../services/atmosphericTrajectory');

// Expanded parameter space
const TUNGUSKA_PARAMETER_SPACE = {
    diameter: { min: 30, max: 100 },
    velocity: { min: 12000, max: 20000 },
    angle: { min: 10, max: 60 },
    density: { min: 1500, max: 4000 },
    quality: { values: ['rubble_pile', 'fractured', 'consolidated'] }
};

const TUNGUSKA_OBSERVED = {
    altitude_min: 7000,
    altitude_max: 9500,
    energy_min: 12,
    energy_max: 18
};

function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generateRandomParams() {
    return {
        diameter: randomInRange(TUNGUSKA_PARAMETER_SPACE.diameter.min, TUNGUSKA_PARAMETER_SPACE.diameter.max),
        velocity: randomInRange(TUNGUSKA_PARAMETER_SPACE.velocity.min, TUNGUSKA_PARAMETER_SPACE.velocity.max),
        angle: randomInRange(TUNGUSKA_PARAMETER_SPACE.angle.min, TUNGUSKA_PARAMETER_SPACE.angle.max),
        density: randomInRange(TUNGUSKA_PARAMETER_SPACE.density.min, TUNGUSKA_PARAMETER_SPACE.density.max),
        quality: randomChoice(TUNGUSKA_PARAMETER_SPACE.quality.values)
    };
}

async function runDistributionAnalysis(n_samples = 100) {
    console.log('═'.repeat(80));
    console.log('ANALYSE DISTRIBUTION ALTITUDE - Diagnostic Tunguska');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`Échantillons: ${n_samples}`);
    console.log('');

    const altitudes = [];
    const energies = [];

    for (let i = 0; i < n_samples; i++) {
        const params = generateRandomParams();
        const traj = new AtmosphericTrajectory();

        try {
            const result = await traj.integrateTrajectory({
                diameter: params.diameter,
                velocity: params.velocity,
                angle: params.angle,
                density: params.density,
                composition: 'rocky',
                quality: params.quality
            });

            if (result.summary.fragmented) {
                altitudes.push(result.summary.altitude_fragmentation / 1000); // km
                energies.push(result.summary.energy_kinetic_fragmentation_MT);
            }
        } catch (error) {
            // Skip failures
        }

        if ((i + 1) % 25 === 0) {
            console.log(`  ${i + 1}/${n_samples} complétées...`);
        }
    }

    console.log('');
    console.log('═'.repeat(80));
    console.log('STATISTIQUES ALTITUDE');
    console.log('═'.repeat(80));
    console.log('');

    altitudes.sort((a, b) => a - b);
    energies.sort((a, b) => a - b);

    const alt_min = Math.min(...altitudes);
    const alt_max = Math.max(...altitudes);
    const alt_mean = altitudes.reduce((s, a) => s + a, 0) / altitudes.length;
    const alt_median = altitudes[Math.floor(altitudes.length / 2)];
    const alt_p5 = altitudes[Math.floor(altitudes.length * 0.05)];
    const alt_p95 = altitudes[Math.floor(altitudes.length * 0.95)];

    console.log(`Altitude fragmentation (${altitudes.length} échantillons):`);
    console.log(`  Minimum:       ${alt_min.toFixed(1)} km`);
    console.log(`  P5 (5%):       ${alt_p5.toFixed(1)} km`);
    console.log(`  Médiane (50%): ${alt_median.toFixed(1)} km`);
    console.log(`  Moyenne:       ${alt_mean.toFixed(1)} km`);
    console.log(`  P95 (95%):     ${alt_p95.toFixed(1)} km`);
    console.log(`  Maximum:       ${alt_max.toFixed(1)} km`);
    console.log('');
    console.log(`Cible Tunguska: 7.0 - 9.5 km`);
    console.log('');

    // Count altitudes in ranges
    const below_10 = altitudes.filter(a => a < 10).length;
    const range_10_20 = altitudes.filter(a => a >= 10 && a < 20).length;
    const range_20_30 = altitudes.filter(a => a >= 20 && a < 30).length;
    const range_30_40 = altitudes.filter(a => a >= 30 && a < 40).length;
    const above_40 = altitudes.filter(a => a >= 40).length;

    console.log('Distribution:');
    console.log(`  < 10 km:     ${below_10.toString().padStart(3)} (${(below_10/altitudes.length*100).toFixed(1)}%)  ${'█'.repeat(Math.floor(below_10/altitudes.length*50))}`);
    console.log(`  10-20 km:    ${range_10_20.toString().padStart(3)} (${(range_10_20/altitudes.length*100).toFixed(1)}%)  ${'█'.repeat(Math.floor(range_10_20/altitudes.length*50))}`);
    console.log(`  20-30 km:    ${range_20_30.toString().padStart(3)} (${(range_20_30/altitudes.length*100).toFixed(1)}%)  ${'█'.repeat(Math.floor(range_20_30/altitudes.length*50))}`);
    console.log(`  30-40 km:    ${range_30_40.toString().padStart(3)} (${(range_30_40/altitudes.length*100).toFixed(1)}%)  ${'█'.repeat(Math.floor(range_30_40/altitudes.length*50))}`);
    console.log(`  > 40 km:     ${above_40.toString().padStart(3)} (${(above_40/altitudes.length*100).toFixed(1)}%)  ${'█'.repeat(Math.floor(above_40/altitudes.length*50))}`);
    console.log('');

    console.log('═'.repeat(80));
    console.log('STATISTIQUES ÉNERGIE');
    console.log('═'.repeat(80));
    console.log('');

    const energy_min = Math.min(...energies);
    const energy_max = Math.max(...energies);
    const energy_mean = energies.reduce((s, e) => s + e, 0) / energies.length;
    const energy_median = energies[Math.floor(energies.length / 2)];

    console.log(`Énergie fragmentation (${energies.length} échantillons):`);
    console.log(`  Minimum: ${energy_min.toFixed(1)} MT`);
    console.log(`  Médiane: ${energy_median.toFixed(1)} MT`);
    console.log(`  Moyenne: ${energy_mean.toFixed(1)} MT`);
    console.log(`  Maximum: ${energy_max.toFixed(1)} MT`);
    console.log('');
    console.log(`Cible Tunguska: 12 - 18 MT`);
    console.log('');

    const energy_match = energies.filter(e => e >= 12 && e <= 18).length;
    console.log(`Énergies dans range cible: ${energy_match} (${(energy_match/energies.length*100).toFixed(1)}%)`);
    console.log('');

    console.log('═'.repeat(80));
    console.log('CONCLUSION DIAGNOSTIC');
    console.log('═'.repeat(80));
    console.log('');

    if (alt_min > 9.5) {
        console.log('❌ PROBLÈME CRITIQUE: Altitude MINIMUM (', alt_min.toFixed(1), 'km) est AU-DESSUS de la cible (9.5 km)!');
        console.log('');
        console.log('Implications:');
        console.log('  1. AUCUNE combinaison de paramètres ne peut atteindre 7-9.5 km');
        console.log('  2. Physique sous-jacente a un biais systématique HAUT');
        console.log('  3. Causes possibles:');
        console.log('     a) Material strength (σ) systématiquement trop ÉLEVÉE');
        console.log('     b) Drag coefficient (C_D) trop faible (devrait être plus haut)');
        console.log('     c) Heat transfer (C_h) pas assez d\'ablation');
        console.log('     d) Physique manquante (rotation, fragmentation en cascade, etc.)');
        console.log('');
        console.log('Recommandations:');
        console.log('  → NIVEAU 1: Réduire σ₀ de 10 MPa à 5 MPa (factor 2)');
        console.log('  → NIVEAU 2: Augmenter C_D de 0.7 à 1.0 (plus de décélération)');
        console.log('  → NIVEAU 3: Accepter limite du modèle pour événements historiques incertains');
    } else {
        console.log(`✅ Altitude minimum atteint: ${alt_min.toFixed(1)} km (below 9.5 km target)`);
        console.log('');
        console.log('  → Configurations compatibles EXISTENT mais sont RARES');
        console.log('  → Augmenter n_samples dans Monte Carlo pour les trouver');
    }
    console.log('');

    return { altitudes, energies };
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const n_samples = args[0] ? parseInt(args[0]) : 100;

    runDistributionAnalysis(n_samples).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runDistributionAnalysis };
