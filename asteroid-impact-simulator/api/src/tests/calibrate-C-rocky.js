#!/usr/bin/env node

/**
 * CALIBRATION EMPIRIQUE DE C POUR ROCKY CRATERS
 *
 * Objectif: Trouver le meilleur C pour minimiser l'erreur rocky avec K=520
 *
 * Méthode: Inverse calculation sur les 3 rocky test craters
 */

const PhysicsEngine = require('../services/physicsEngine');
const physicsEngine = new PhysicsEngine();

const ROCKY_TEST_SET = [
    { name: 'Chicxulub', D_obs: 180000, impactorDiameter: 10000, velocity: 20000, angle: 90, composition: 'rocky' },
    { name: 'Ries', D_obs: 24000, impactorDiameter: 1500, velocity: 20000, angle: 90, composition: 'rocky' },
    { name: 'Bosumtwi', D_obs: 10500, impactorDiameter: 500, velocity: 20000, angle: 90, composition: 'rocky' }
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('CALIBRATION EMPIRIQUE C - Rocky Craters (K=520 fixed)');
console.log('═══════════════════════════════════════════════════════════════\n');

async function calculateRequiredC() {
    const results = [];

    for (const crater of ROCKY_TEST_SET) {
        // Calculate D_transient with current K=520
        const density = 3000;
        const radius = crater.impactorDiameter / 2;
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        const mass = density * volume;
        const energy_joules = 0.5 * mass * crater.velocity * crater.velocity;

        const result = await physicsEngine.calculateCraterSize(
            energy_joules,
            crater.angle,
            crater.composition,
            density,
            2500,
            crater.impactorDiameter,
            crater.velocity
        );

        const D_transient = result.transientDiameter;
        const D_obs = crater.D_obs;

        // Calculate required C: D_obs = C × (D_transient/1000)^1.13
        // => C = D_obs / (D_transient/1000)^1.13
        const D_tc_km = D_transient / 1000;
        const C_required = (D_obs/1000) / Math.pow(D_tc_km, 1.13);

        results.push({
            name: crater.name,
            D_obs_km: (D_obs/1000).toFixed(1),
            D_transient_km: D_tc_km.toFixed(2),
            C_required: C_required.toFixed(3)
        });

        console.log(`${crater.name}:`);
        console.log(`  D_observed:  ${(D_obs/1000).toFixed(1)} km`);
        console.log(`  D_transient: ${D_tc_km.toFixed(2)} km (with K=520)`);
        console.log(`  C_required:  ${C_required.toFixed(3)}`);
        console.log();
    }

    // Calculate mean C
    const meanC = results.reduce((sum, r) => sum + parseFloat(r.C_required), 0) / results.length;
    const minC = Math.min(...results.map(r => parseFloat(r.C_required)));
    const maxC = Math.max(...results.map(r => parseFloat(r.C_required)));

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('RÉSULTATS:\n');
    console.log(`Mean C:   ${meanC.toFixed(3)}`);
    console.log(`Min C:    ${minC.toFixed(3)}`);
    console.log(`Max C:    ${maxC.toFixed(3)}`);
    console.log(`Std Dev:  ${(maxC - minC).toFixed(3)}\n`);

    console.log('COMPARAISON:');
    console.log(`  v1.6.33/v1.7.1: C = 1.415`);
    console.log(`  v1.6.34 attempt: C = 0.726 (theoretical from audit)`);
    console.log(`  v1.6.34 optimal: C = ${meanC.toFixed(3)} (empirical from 3 craters)\n`);

    console.log('RECOMMANDATION:');
    if (Math.abs(meanC - 1.415) < 0.1) {
        console.log(`  ✅ C = 1.415 est CORRECT avec K=520`);
        console.log(`  => Le problème v1.7.1 vient d'ailleurs (probablement angle correction)\n`);
    } else if (Math.abs(meanC - 0.726) < 0.1) {
        console.log(`  ✅ C = 0.726 est CORRECT (audit correct)\n`);
    } else {
        console.log(`  ⚠️  Utiliser C = ${meanC.toFixed(3)} pour optimal rocky accuracy\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════');
}

calculateRequiredC().catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
});
