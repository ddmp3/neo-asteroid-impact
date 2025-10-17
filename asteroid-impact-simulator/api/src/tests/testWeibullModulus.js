/**
 * Test Different Weibull Moduli - Find optimal m value
 *
 * HYPOTHÈSE: m=18 (ordinary chondrites) donne trop peu de différence
 * entre Chelyabinsk (19m) et Tunguska (60m).
 *
 * Test: m = 10, 12, 15, 18, 22 pour voir sensibilité
 *
 * v1.7.3 - Diagnostic Weibull modulus
 */

const AtmosphericTrajectory = require('../services/atmosphericTrajectory');

// Test configurations
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
        name: 'Tunguska',
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
    }
];

const WEIBULL_MODULI_TO_TEST = [10, 12, 15, 18, 22];

async function testWeibullModulus(m_value) {
    console.log('═'.repeat(80));
    console.log(`TEST WEIBULL MODULUS m = ${m_value}`);
    console.log('═'.repeat(80));
    console.log('');

    const results = [];

    for (const testCase of TEST_CASES) {
        const traj = new AtmosphericTrajectory();

        // Override Weibull modulus for rocky
        traj.WEIBULL_MODULUS.rocky = m_value;

        // Calculate material strength with this m
        const sigma = traj.getMaterialStrength(
            testCase.params.composition,
            testCase.params.diameter,
            testCase.params.quality
        );

        console.log(`${testCase.name} (D=${testCase.params.diameter}m):`);
        console.log(`  Weibull strength: ${(sigma / 1e6).toFixed(3)} MPa`);

        try {
            const result = await traj.integrateTrajectory(testCase.params);

            const altitude_km = result.summary.altitude_fragmentation / 1000;
            const energy_MT = result.summary.energy_kinetic_fragmentation_MT;

            const altitude_error = Math.abs(altitude_km - testCase.observed.altitude/1000) / (testCase.observed.altitude/1000) * 100;
            const energy_error = Math.abs(energy_MT - testCase.observed.energy_MT) / testCase.observed.energy_MT * 100;

            console.log(`  Altitude: ${altitude_km.toFixed(1)} km (attendu ${testCase.observed.altitude/1000} km) → ${altitude_error.toFixed(0)}% erreur`);
            console.log(`  Énergie: ${energy_MT.toFixed(2)} MT (attendu ${testCase.observed.energy_MT} MT) → ${energy_error.toFixed(0)}% erreur`);
            console.log('');

            results.push({
                test: testCase.name,
                m: m_value,
                sigma_MPa: sigma / 1e6,
                altitude_km: altitude_km,
                altitude_error_pct: altitude_error,
                energy_MT: energy_MT,
                energy_error_pct: energy_error
            });
        } catch (error) {
            console.log(`  ❌ Erreur: ${error.message}`);
            console.log('');
        }
    }

    return results;
}

async function runComparison() {
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║       TEST SENSIBILITÉ WEIBULL MODULUS - Diagnostic Altitude Tunguska       ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('OBJECTIF: Trouver si m plus faible améliore prédiction altitude Tunguska');
    console.log('');
    console.log('THÉORIE:');
    console.log('  m élevé (18-28) → Peu de différence entre petits/grands astéroïdes');
    console.log('  m faible (10-12) → Grande différence (grands objets BEAUCOUP plus faibles)');
    console.log('');
    console.log('FORMULE: σ(D) = σ₀ × (D₀/D)^(1/m)');
    console.log('  Si m=18: σ(60m)/σ(19m) = (19/60)^(1/18) = 0.936 → 6% plus faible');
    console.log('  Si m=10: σ(60m)/σ(19m) = (19/60)^(1/10) = 0.889 → 11% plus faible');
    console.log('');

    const allResults = [];

    for (const m of WEIBULL_MODULI_TO_TEST) {
        const results = await testWeibullModulus(m);
        allResults.push(...results);
    }

    console.log('═'.repeat(80));
    console.log('COMPARAISON RÉSULTATS');
    console.log('═'.repeat(80));
    console.log('');

    // Chelyabinsk comparison
    console.log('CHELYABINSK (19m):');
    console.log('─'.repeat(80));
    console.log('m      σ(MPa)    Alt(km)   Alt Error%   Energy(MT)   Energy Error%');
    console.log('─'.repeat(80));
    const chelyabinsk = allResults.filter(r => r.test === 'Chelyabinsk');
    chelyabinsk.forEach(r => {
        console.log(`${r.m.toString().padEnd(6)} ${r.sigma_MPa.toFixed(2).padEnd(9)} ${r.altitude_km.toFixed(1).padEnd(9)} ${r.altitude_error_pct.toFixed(0).padEnd(12)} ${r.energy_MT.toFixed(2).padEnd(12)} ${r.energy_error_pct.toFixed(0).padEnd(13)}`);
    });
    console.log('');

    // Tunguska comparison
    console.log('TUNGUSKA (60m):');
    console.log('─'.repeat(80));
    console.log('m      σ(MPa)    Alt(km)   Alt Error%   Energy(MT)   Energy Error%');
    console.log('─'.repeat(80));
    const tunguska = allResults.filter(r => r.test === 'Tunguska');
    tunguska.forEach(r => {
        console.log(`${r.m.toString().padEnd(6)} ${r.sigma_MPa.toFixed(2).padEnd(9)} ${r.altitude_km.toFixed(1).padEnd(9)} ${r.altitude_error_pct.toFixed(0).padEnd(12)} ${r.energy_MT.toFixed(2).padEnd(12)} ${r.energy_error_pct.toFixed(0).padEnd(13)}`);
    });
    console.log('');

    // Find best m for Tunguska altitude
    const tunguska_sorted = tunguska.sort((a, b) => a.altitude_error_pct - b.altitude_error_pct);
    const best_m_altitude = tunguska_sorted[0];

    console.log('═'.repeat(80));
    console.log('CONCLUSION:');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`Meilleur m pour altitude Tunguska: m=${best_m_altitude.m}`);
    console.log(`  → Altitude: ${best_m_altitude.altitude_km.toFixed(1)} km (erreur ${best_m_altitude.altitude_error_pct.toFixed(0)}%)`);
    console.log(`  → Énergie: ${best_m_altitude.energy_MT.toFixed(2)} MT (erreur ${best_m_altitude.energy_error_pct.toFixed(0)}%)`);
    console.log('');

    // Check if any m gives <15% error on BOTH altitude and energy for Tunguska
    const good_matches = tunguska.filter(r => r.altitude_error_pct < 20 && r.energy_error_pct < 20);
    if (good_matches.length > 0) {
        console.log('✅ Configurations avec <20% erreur sur ALTITUDE ET ÉNERGIE:');
        good_matches.forEach(r => {
            console.log(`  m=${r.m}: Alt ${r.altitude_error_pct.toFixed(0)}%, Energy ${r.energy_error_pct.toFixed(0)}%`);
        });
    } else {
        console.log('❌ AUCUNE valeur de m ne donne <20% erreur sur les DEUX métriques');
        console.log('');
        console.log('IMPLICATIONS:');
        console.log('  1. Weibull seul insuffisant pour Tunguska');
        console.log('  2. Autres paramètres (angle, density, quality) doivent être ajustés');
        console.log('  3. Ou physique manquante (C_D variable, rotation, etc.)');
    }
    console.log('');

    return allResults;
}

// Run if called directly
if (require.main === module) {
    runComparison().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { testWeibullModulus, runComparison, WEIBULL_MODULI_TO_TEST };
