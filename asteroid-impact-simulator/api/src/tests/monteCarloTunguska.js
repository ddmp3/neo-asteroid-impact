/**
 * Monte Carlo Analysis - Tunguska 1908 Parameter Uncertainty
 *
 * OBJECTIF: Quantifier l'incertitude due aux paramètres historiques inconnus
 *
 * Paramètres incertains (1908 - pas de mesures directes):
 * - Diamètre: 40-80m (incertitude ±50%)
 * - Vitesse: 13-17 km/s (incertitude ±15%)
 * - Angle: 20-50° (très incertain!)
 * - Densité: 2000-3500 kg/m³ (rubble pile vs consolidé)
 * - Quality: rubble_pile, fractured, consolidated
 *
 * Cible observée:
 * - Altitude fragmentation: 8.0-9.0 km
 * - Énergie: 12-18 MT (range large!)
 *
 * v1.7.2 - Approche physique rigoureuse (Weibull + Monte Carlo)
 */

const AtmosphericTrajectory = require('../services/atmosphericTrajectory');

// Plages de paramètres basées sur littérature scientifique
// v1.7.3 - EXPANDED RANGES to explore extreme parameter combinations
const TUNGUSKA_PARAMETER_SPACE = {
    diameter: {
        min: 30,      // EXPANDED: Was 40
        max: 100,     // EXPANDED: Was 80
        best: 60,
        unit: 'm',
        uncertainty: '±65%',
        reference: 'Vasilyev (1998) - extreme uncertainty expanded'
    },
    velocity: {
        min: 12000,   // EXPANDED: Was 13000 (slower entry)
        max: 20000,   // EXPANDED: Was 17000 (faster entry)
        best: 15000,
        unit: 'm/s',
        uncertainty: '±25%',
        reference: 'Sekanina (1983) - expanded for uncertainty'
    },
    angle: {
        min: 10,      // EXPANDED: Was 20 (very grazing entry)
        max: 60,      // EXPANDED: Was 50 (steeper entry)
        best: 45,
        unit: 'degrees',
        uncertainty: '±80%',
        reference: 'Entry angle highly uncertain - extreme grazing possible'
    },
    density: {
        min: 1500,    // EXPANDED: Was 2000 (porous rubble)
        max: 4000,    // EXPANDED: Was 3500 (dense consolidated)
        best: 3000,
        unit: 'kg/m³',
        uncertainty: '±35%',
        reference: 'Rocky asteroid - rubble pile vs consolidated (expanded)'
    },
    quality: {
        values: ['rubble_pile', 'fractured', 'consolidated'],
        best: 'fractured',
        uncertainty: 'Unknown - major factor!',
        reference: 'Internal structure unknowable'
    }
};

const TUNGUSKA_OBSERVED = {
    altitude_min: 7000,
    altitude_max: 9500,
    altitude_best: 8000,
    energy_min: 12,
    energy_max: 18,
    energy_best: 15
};

async function runSingleSimulation(params) {
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

        return {
            success: true,
            altitude_fragmentation: result.summary.altitude_fragmentation,
            energy_fragmentation_MT: result.summary.energy_kinetic_fragmentation_MT,
            energy_initial_MT: result.summary.energy_initial_MT,
            impact_type: result.summary.impact_type,
            params: params
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            params: params
        };
    }
}

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

function isWithinObservedRange(result) {
    const alt_match = result.altitude_fragmentation >= TUNGUSKA_OBSERVED.altitude_min &&
                      result.altitude_fragmentation <= TUNGUSKA_OBSERVED.altitude_max;

    const energy_match = result.energy_fragmentation_MT >= TUNGUSKA_OBSERVED.energy_min &&
                         result.energy_fragmentation_MT <= TUNGUSKA_OBSERVED.energy_max;

    return {
        altitude_match: alt_match,
        energy_match: energy_match,
        both_match: alt_match && energy_match
    };
}

async function runMonteCarloAnalysis(n_samples = 100) {
    console.log('='.repeat(80));
    console.log('MONTE CARLO ANALYSIS - Tunguska 1908 Parameter Uncertainty');
    console.log('='.repeat(80));
    console.log('');
    console.log('Objectif: Trouver combinaisons de paramètres compatibles avec observations');
    console.log('');
    console.log('Plages de paramètres:');
    console.log('  Diamètre:', TUNGUSKA_PARAMETER_SPACE.diameter.min, '-', TUNGUSKA_PARAMETER_SPACE.diameter.max, 'm');
    console.log('  Vitesse:', TUNGUSKA_PARAMETER_SPACE.velocity.min/1000, '-', TUNGUSKA_PARAMETER_SPACE.velocity.max/1000, 'km/s');
    console.log('  Angle:', TUNGUSKA_PARAMETER_SPACE.angle.min, '-', TUNGUSKA_PARAMETER_SPACE.angle.max, '°');
    console.log('  Densité:', TUNGUSKA_PARAMETER_SPACE.density.min, '-', TUNGUSKA_PARAMETER_SPACE.density.max, 'kg/m³');
    console.log('  Quality:', TUNGUSKA_PARAMETER_SPACE.quality.values.join(', '));
    console.log('');
    console.log('Observations cibles:');
    console.log('  Altitude:', TUNGUSKA_OBSERVED.altitude_min/1000, '-', TUNGUSKA_OBSERVED.altitude_max/1000, 'km');
    console.log('  Énergie:', TUNGUSKA_OBSERVED.energy_min, '-', TUNGUSKA_OBSERVED.energy_max, 'MT');
    console.log('');
    console.log(`Échantillons: ${n_samples}`);
    console.log('');
    console.log('En cours...');

    const results = [];
    const matches = {
        altitude_only: [],
        energy_only: [],
        both: []
    };

    for (let i = 0; i < n_samples; i++) {
        const params = generateRandomParams();
        const result = await runSingleSimulation(params);

        if (result.success) {
            results.push(result);

            const match = isWithinObservedRange(result);
            if (match.both_match) {
                matches.both.push(result);
            } else if (match.altitude_match) {
                matches.altitude_only.push(result);
            } else if (match.energy_match) {
                matches.energy_only.push(result);
            }
        }

        // Progress
        if ((i + 1) % 20 === 0) {
            console.log(`  ${i + 1}/${n_samples} simulations complétées...`);
        }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('RÉSULTATS MONTE CARLO');
    console.log('='.repeat(80));
    console.log('');
    console.log(`Total simulations: ${results.length}`);
    console.log(`  Match altitude seule: ${matches.altitude_only.length} (${(matches.altitude_only.length/results.length*100).toFixed(1)}%)`);
    console.log(`  Match énergie seule: ${matches.energy_only.length} (${(matches.energy_only.length/results.length*100).toFixed(1)}%)`);
    console.log(`  Match ALTITUDE + ÉNERGIE: ${matches.both.length} (${(matches.both.length/results.length*100).toFixed(1)}%)`);
    console.log('');

    if (matches.both.length > 0) {
        console.log('✅ CONFIGURATIONS COMPATIBLES (altitude + énergie):');
        console.log('');
        matches.both.slice(0, 10).forEach((r, i) => {
            console.log(`#${i + 1}:`);
            console.log(`  D=${r.params.diameter.toFixed(0)}m, V=${(r.params.velocity/1000).toFixed(1)}km/s, θ=${r.params.angle.toFixed(0)}°`);
            console.log(`  ρ=${r.params.density.toFixed(0)}kg/m³, quality=${r.params.quality}`);
            console.log(`  → Altitude: ${(r.altitude_fragmentation/1000).toFixed(1)} km, Énergie: ${r.energy_fragmentation_MT.toFixed(1)} MT`);
            console.log('');
        });

        // Statistiques sur matches
        const avg_diameter = matches.both.reduce((s, r) => s + r.params.diameter, 0) / matches.both.length;
        const avg_velocity = matches.both.reduce((s, r) => s + r.params.velocity, 0) / matches.both.length;
        const avg_angle = matches.both.reduce((s, r) => s + r.params.angle, 0) / matches.both.length;
        const avg_density = matches.both.reduce((s, r) => s + r.params.density, 0) / matches.both.length;

        const quality_counts = {};
        matches.both.forEach(r => {
            quality_counts[r.params.quality] = (quality_counts[r.params.quality] || 0) + 1;
        });

        console.log('📊 STATISTIQUES CONFIGURATIONS COMPATIBLES:');
        console.log('');
        console.log(`  Diamètre moyen: ${avg_diameter.toFixed(0)} m`);
        console.log(`  Vitesse moyenne: ${(avg_velocity/1000).toFixed(1)} km/s`);
        console.log(`  Angle moyen: ${avg_angle.toFixed(0)}°`);
        console.log(`  Densité moyenne: ${avg_density.toFixed(0)} kg/m³`);
        console.log('');
        console.log('  Distribution quality:');
        Object.entries(quality_counts).forEach(([q, count]) => {
            console.log(`    ${q}: ${count} (${(count/matches.both.length*100).toFixed(1)}%)`);
        });
    } else {
        console.log('❌ AUCUNE CONFIGURATION COMPATIBLE trouvée!');
        console.log('');
        console.log('Suggestions:');
        console.log('  1. Élargir plages de paramètres');
        console.log('  2. Ajuster module Weibull (m)');
        console.log('  3. Vérifier coefficients physiques (C_h, C_D)');
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('ANALYSE COMPLÈTE');
    console.log('='.repeat(80));
    console.log('');

    return {
        results,
        matches,
        statistics: {
            total: results.length,
            match_rate_both: matches.both.length / results.length
        }
    };
}

// Fonction pour tester configuration spécifique
async function testSpecificConfiguration(params) {
    console.log('Test configuration spécifique:');
    console.log('  Diamètre:', params.diameter, 'm');
    console.log('  Vitesse:', params.velocity/1000, 'km/s');
    console.log('  Angle:', params.angle, '°');
    console.log('  Densité:', params.density, 'kg/m³');
    console.log('  Quality:', params.quality);
    console.log('');

    const result = await runSingleSimulation(params);

    if (result.success) {
        console.log('Résultats:');
        console.log('  Altitude fragmentation:', (result.altitude_fragmentation/1000).toFixed(1), 'km');
        console.log('  Énergie fragmentation:', result.energy_fragmentation_MT.toFixed(1), 'MT');
        console.log('  Type impact:', result.impact_type);
        console.log('');

        const match = isWithinObservedRange(result);
        console.log('Compatibilité avec observations:');
        console.log('  Altitude:', match.altitude_match ? '✅' : '❌');
        console.log('  Énergie:', match.energy_match ? '✅' : '❌');
    } else {
        console.log('❌ Erreur:', result.error);
    }

    return result;
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const n_samples = args[0] ? parseInt(args[0]) : 100;

    runMonteCarloAnalysis(n_samples).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runMonteCarloAnalysis, testSpecificConfiguration, TUNGUSKA_PARAMETER_SPACE };
