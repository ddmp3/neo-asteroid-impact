/**
 * Test Reduced Material Strength - Fix systematic altitude bias
 *
 * PROBLÈME IDENTIFIÉ: Altitude minimum = 26 km (cible: 7-9.5 km)
 * → Material strength (σ) systématiquement TROP ÉLEVÉE
 *
 * SOLUTION PROPOSÉE: Réduire σ₀ de 10 MPa à 5 MPa (factor 2)
 *
 * JUSTIFICATION SCIENTIFIQUE:
 * - Bruck Syal et al. (2016): Vraies météorites ont σ = 1-10 MPa
 * - Valeur actuelle (10 MPa) est optimiste pour astéroïdes friables
 * - Tunguska probablement comète ou rubble pile très faible
 *
 * v1.7.3 - Test empirique calibration
 */

const AtmosphericTrajectory = require('../services/atmosphericTrajectory');

// Test cases
const TEST_CASES = [
    {
        name: 'Chelyabinsk',
        params: {
            diameter: 19,
            velocity: 19000,
            angle: 18,
            density: 3300,
            composition: 'rocky',
            quality: 'consolidated'
        },
        observed: {
            altitude: 23000,
            energy_MT: 0.5
        }
    },
    {
        name: 'Tunguska (consolidated)',
        params: {
            diameter: 60,
            velocity: 15000,
            angle: 45,
            density: 3000,
            composition: 'rocky',
            quality: 'consolidated'
        },
        observed: {
            altitude: 8500,
            energy_MT: 15
        }
    },
    {
        name: 'Tunguska (rubble_pile)',
        params: {
            diameter: 60,
            velocity: 15000,
            angle: 45,
            density: 3000,
            composition: 'rocky',
            quality: 'rubble_pile'
        },
        observed: {
            altitude: 8500,
            energy_MT: 15
        }
    }
];

const STRENGTH_VALUES = [
    { label: 'Actuel (10 MPa)', sigma_0: 10e6 },
    { label: 'Réduit 50% (5 MPa)', sigma_0: 5e6 },
    { label: 'Réduit 70% (3 MPa)', sigma_0: 3e6 },
    { label: 'Très faible (1 MPa)', sigma_0: 1e6 }
];

async function testStrengthValue(sigma_0, testCase) {
    const traj = new AtmosphericTrajectory();

    // Override material strength
    traj.MATERIAL_STRENGTH_BASE.rocky = sigma_0;
    traj.MATERIAL_STRENGTH_BASE.stony = sigma_0;

    try {
        const result = await traj.integrateTrajectory(testCase.params);

        const altitude_km = result.summary.altitude_fragmentation / 1000;
        const energy_MT = result.summary.energy_kinetic_fragmentation_MT;

        const altitude_error = Math.abs(altitude_km - testCase.observed.altitude/1000) / (testCase.observed.altitude/1000) * 100;
        const energy_error = Math.abs(energy_MT - testCase.observed.energy_MT) / testCase.observed.energy_MT * 100;

        return {
            success: true,
            altitude_km: altitude_km,
            altitude_error_pct: altitude_error,
            energy_MT: energy_MT,
            energy_error_pct: energy_error,
            sigma_MPa: traj.getMaterialStrength(testCase.params.composition, testCase.params.diameter, testCase.params.quality) / 1e6
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function runStrengthCalibration() {
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║         CALIBRATION MATERIAL STRENGTH - Fix Systematic Altitude Bias         ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('PROBLÈME IDENTIFIÉ:');
    console.log('  Monte Carlo (150 échantillons): Altitude minimum = 26.1 km');
    console.log('  Cible Tunguska: 7.0 - 9.5 km');
    console.log('  → Biais systématique: +17 km (+180%)');
    console.log('');
    console.log('HYPOTHÈSE:');
    console.log('  σ₀ actuel (10 MPa) est trop élevé pour astéroïdes friables');
    console.log('  → Réduire σ₀ pour permettre fragmentation plus basse');
    console.log('');
    console.log('JUSTIFICATION:');
    console.log('  - Bruck Syal et al. (2016): σ réel = 1-10 MPa (large range!)');
    console.log('  - Tunguska probablement objet TRÈS faible (comète ou rubble pile)');
    console.log('  - Chelyabinsk = LL chondrite ordinaire (plus fort)');
    console.log('');

    const allResults = [];

    for (const strengthConfig of STRENGTH_VALUES) {
        console.log('═'.repeat(80));
        console.log(`TEST: ${strengthConfig.label}`);
        console.log('═'.repeat(80));
        console.log('');

        for (const testCase of TEST_CASES) {
            const result = await testStrengthValue(strengthConfig.sigma_0, testCase);

            if (result.success) {
                console.log(`${testCase.name}:`);
                console.log(`  σ effective: ${result.sigma_MPa.toFixed(2)} MPa`);
                console.log(`  Altitude: ${result.altitude_km.toFixed(1)} km (attendu ${testCase.observed.altitude/1000} km) → ${result.altitude_error_pct.toFixed(0)}% erreur`);
                console.log(`  Énergie: ${result.energy_MT.toFixed(2)} MT (attendu ${testCase.observed.energy_MT} MT) → ${result.energy_error_pct.toFixed(0)}% erreur`);

                if (result.altitude_error_pct < 20 && result.energy_error_pct < 20) {
                    console.log('  ✅ EXCELLENT (<20% erreur sur les deux)');
                } else if (result.altitude_error_pct < 50) {
                    console.log('  ⚠️  Altitude acceptable, énergie à améliorer');
                } else {
                    console.log('  ❌ Erreur trop élevée');
                }
                console.log('');

                allResults.push({
                    ...result,
                    testCase: testCase.name,
                    sigma_0_MPa: strengthConfig.sigma_0 / 1e6,
                    label: strengthConfig.label
                });
            } else {
                console.log(`${testCase.name}: ❌ ${result.error}`);
                console.log('');
            }
        }
    }

    console.log('═'.repeat(80));
    console.log('ANALYSE COMPARATIVE');
    console.log('═'.repeat(80));
    console.log('');

    // Find best for Chelyabinsk
    const chelyabinsk_results = allResults.filter(r => r.testCase === 'Chelyabinsk');
    chelyabinsk_results.sort((a, b) => (a.altitude_error_pct + a.energy_error_pct) - (b.altitude_error_pct + b.energy_error_pct));

    console.log('CHELYABINSK - Meilleure configuration:');
    const best_chel = chelyabinsk_results[0];
    console.log(`  ${best_chel.label}`);
    console.log(`  Erreur totale: ${(best_chel.altitude_error_pct + best_chel.energy_error_pct).toFixed(0)}%`);
    console.log(`    Altitude: ${best_chel.altitude_error_pct.toFixed(0)}%`);
    console.log(`    Énergie: ${best_chel.energy_error_pct.toFixed(0)}%`);
    console.log('');

    // Find best for Tunguska
    const tunguska_results = allResults.filter(r => r.testCase.includes('Tunguska'));
    tunguska_results.sort((a, b) => a.altitude_error_pct - b.altitude_error_pct);

    console.log('TUNGUSKA - Meilleure altitude:');
    const best_tung = tunguska_results[0];
    console.log(`  ${best_tung.label} (${best_tung.testCase})`);
    console.log(`  Altitude: ${best_tung.altitude_km.toFixed(1)} km (erreur ${best_tung.altitude_error_pct.toFixed(0)}%)`);
    console.log(`  Énergie: ${best_tung.energy_MT.toFixed(1)} MT (erreur ${best_tung.energy_error_pct.toFixed(0)}%)`);
    console.log('');

    // Recommendation
    console.log('═'.repeat(80));
    console.log('RECOMMANDATION');
    console.log('═'.repeat(80));
    console.log('');

    // Find configuration with best compromise
    const compromise = allResults.filter(r =>
        r.altitude_error_pct < 50 && r.energy_error_pct < 50
    );

    if (compromise.length > 0) {
        compromise.sort((a, b) =>
            (a.altitude_error_pct + a.energy_error_pct) - (b.altitude_error_pct + b.energy_error_pct)
        );

        const rec = compromise[0];
        console.log(`✅ CONFIGURATION RECOMMANDÉE: ${rec.label}`);
        console.log('');
        console.log('Performances:');
        console.log(`  Chelyabinsk: ${chelyabinsk_results.find(r => r.sigma_0_MPa === rec.sigma_0_MPa)?.altitude_error_pct.toFixed(0)}% altitude, ${chelyabinsk_results.find(r => r.sigma_0_MPa === rec.sigma_0_MPa)?.energy_error_pct.toFixed(0)}% énergie`);

        const tung_with_this = tunguska_results.filter(r => r.sigma_0_MPa === rec.sigma_0_MPa);
        console.log(`  Tunguska consolidated: ${tung_with_this.find(r => r.testCase.includes('consolidated'))?.altitude_error_pct.toFixed(0)}% altitude`);
        console.log(`  Tunguska rubble_pile: ${tung_with_this.find(r => r.testCase.includes('rubble_pile'))?.altitude_error_pct.toFixed(0)}% altitude`);
        console.log('');
        console.log('Action:');
        console.log(`  → Modifier MATERIAL_STRENGTH_BASE.rocky de 10e6 à ${rec.sigma_0_MPa}e6 Pa`);
    } else {
        console.log('⚠️  AUCUNE configuration satisfaisante trouvée');
        console.log('');
        console.log('Dilemme:');
        console.log('  - Réduire σ améliore Tunguska MAIS dégrade Chelyabinsk');
        console.log('  - Pas de valeur unique compatible avec TOUS les cas');
        console.log('');
        console.log('Solutions possibles:');
        console.log('  1. Accepter erreur >50% sur événements historiques incertains');
        console.log('  2. Utiliser composition différente (icy pour Tunguska?)');
        console.log('  3. Ajouter physique manquante (fragmentation en cascade)');
    }

    console.log('');

    return allResults;
}

// Run if called directly
if (require.main === module) {
    runStrengthCalibration().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runStrengthCalibration, testStrengthValue, STRENGTH_VALUES };
