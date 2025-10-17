/**
 * Calibration Individuelle de σ (Strength) par Cratère
 *
 * HYPOTHÈSE À TESTER:
 * Et si chaque petit cratère nécessite une σ différente pour correspondre?
 * Cela révélerait si σ varie réellement avec la taille ou si notre modèle
 * a un problème systématique.
 *
 * OBJECTIF:
 * Pour chaque cratère 10-200m, trouver σ_required qui donne le cratère observé.
 * Ensuite analyser si σ_required corrèle avec:
 * - Taille impacteur
 * - Vitesse
 * - Angle
 * - Âge cratère
 *
 * Si σ_required est toujours proche de 20-120 MPa → modèle OK, juste besoin σ correct
 * Si σ_required varie bizarrement → problème dans FCM ou formule cratère
 *
 * v1.7.11 - Diagnostic Option B
 */

const SmallIronCraterPhysics = require('../services/smallIronCraterPhysics');
const { getAllCraters } = require('../data/earthCraterDatabase');

/**
 * Binary search pour trouver σ qui donne D_crater exact
 */
async function findRequiredSigma(params, target_diameter) {
    const physics = new SmallIronCraterPhysics();

    let sigma_min = 1e6;    // 1 MPa
    let sigma_max = 200e6;  // 200 MPa
    let iterations = 0;
    const MAX_ITERATIONS = 30;
    const TOLERANCE = 0.01; // 1% error acceptable

    while (iterations < MAX_ITERATIONS) {
        const sigma_mid = 0.5 * (sigma_min + sigma_max);

        const test_params = {
            ...params,
            strength_override: sigma_mid,
            disable_monte_carlo: true
        };

        try {
            const result = await physics.calculateSmallIronCrater(test_params);
            const predicted = result.crater_diameter;
            const error_pct = Math.abs(predicted - target_diameter) / target_diameter;

            if (error_pct < TOLERANCE) {
                return {
                    sigma_required: sigma_mid,
                    predicted_diameter: predicted,
                    iterations: iterations,
                    converged: true
                };
            }

            if (predicted < target_diameter) {
                // Besoin plus de cratère → besoin moins de fragmentation → augmenter σ
                sigma_min = sigma_mid;
            } else {
                // Trop de cratère → trop de fragmentation → diminuer σ
                sigma_max = sigma_mid;
            }

            iterations++;

        } catch (error) {
            console.error(`  Error at σ=${(sigma_mid/1e6).toFixed(1)} MPa: ${error.message}`);
            return { sigma_required: null, error: error.message, converged: false };
        }
    }

    return {
        sigma_required: 0.5 * (sigma_min + sigma_max),
        predicted_diameter: null,
        iterations: iterations,
        converged: false
    };
}

/**
 * Analyse tous les petits cratères
 */
async function analyzeCraters() {
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' σ Required Analysis - Small Iron Craters '.padStart(50).padEnd(78) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log();

    const all_craters = getAllCraters();
    const small_iron = all_craters.filter(c =>
        c.impactor &&
        c.impactor.composition === 'iron' &&
        c.crater.diameter_m >= 10 &&
        c.crater.diameter_m <= 200 &&
        (c.confidence === 'HIGH' || c.confidence === 'MEDIUM')
    );

    console.log(`Found ${small_iron.length} small iron craters (10-200m)\n`);

    const results = [];

    for (const crater of small_iron) {
        const { name, impactor, crater: crater_info } = crater;

        console.log(`Analyzing ${name} (${crater_info.diameter_m}m)...`);

        const params = {
            diameter: impactor.diameter_m,
            velocity: impactor.velocity_m_s,
            angle: impactor.angle_deg,
            density: impactor.density_kg_m3,
            composition: 'iron'
        };

        const result = await findRequiredSigma(params, crater_info.diameter_m);

        if (result.converged) {
            const sigma_mpa = result.sigma_required / 1e6;
            const in_range = sigma_mpa >= 20 && sigma_mpa <= 120;

            results.push({
                name,
                diameter_crater: crater_info.diameter_m,
                diameter_impactor: impactor.diameter_m,
                velocity: impactor.velocity_m_s,
                angle: impactor.angle_deg,
                sigma_required: result.sigma_required,
                sigma_mpa: sigma_mpa,
                in_physical_range: in_range,
                age_years: crater_info.age_years || null,
                preserved: crater_info.preserved || 'unknown'
            });

            const status = in_range ? '✅' : '⚠️';
            console.log(`  ${status} σ_required = ${sigma_mpa.toFixed(1)} MPa (iterations: ${result.iterations})`);
            console.log(`     D_imp = ${impactor.diameter_m}m, v = ${impactor.velocity_m_s}m/s`);
        } else {
            console.log(`  ❌ Failed to converge (${result.iterations} iterations)`);
        }

        console.log();
    }

    return results;
}

/**
 * Analyse statistique des σ_required
 */
function analyzeStatistics(results) {
    console.log('\n' + '='.repeat(80));
    console.log('STATISTICAL ANALYSIS:');
    console.log('='.repeat(80));
    console.log();

    // Table
    console.log('┌────────────────────┬───────┬───────┬─────────┬─────────┬──────────┬──────────┐');
    console.log('│ Crater             │ D_cra │ D_imp │ Veloc   │ σ_req   │ In Range │ Preserv  │');
    console.log('├────────────────────┼───────┼───────┼─────────┼─────────┼──────────┼──────────┤');

    for (const r of results) {
        const name = r.name.padEnd(18);
        const d_crater = `${r.diameter_crater}m`.padEnd(5);
        const d_imp = `${r.diameter_impactor}m`.padEnd(5);
        const vel = `${r.velocity}`.padEnd(7);
        const sigma = `${r.sigma_mpa.toFixed(1)}`.padEnd(7);
        const in_range = r.in_physical_range ? '✅ Yes' : '⚠️  No';
        const preserved = r.preserved.padEnd(8);

        console.log(`│ ${name} │ ${d_crater} │ ${d_imp} │ ${vel} │ ${sigma} │ ${in_range.padEnd(8)} │ ${preserved} │`);
    }

    console.log('└────────────────────┴───────┴───────┴─────────┴─────────┴──────────┴──────────┘');
    console.log();

    // Statistics
    const sigma_values = results.map(r => r.sigma_mpa);
    const mean_sigma = sigma_values.reduce((a, b) => a + b, 0) / sigma_values.length;
    const std_sigma = Math.sqrt(
        sigma_values.reduce((sum, s) => sum + Math.pow(s - mean_sigma, 2), 0) / sigma_values.length
    );
    const min_sigma = Math.min(...sigma_values);
    const max_sigma = Math.max(...sigma_values);
    const in_range_count = results.filter(r => r.in_physical_range).length;

    console.log(`σ Statistics:`);
    console.log(`  Mean:  ${mean_sigma.toFixed(1)} ± ${std_sigma.toFixed(1)} MPa`);
    console.log(`  Range: ${min_sigma.toFixed(1)} - ${max_sigma.toFixed(1)} MPa`);
    console.log(`  In Physical Range (20-120 MPa): ${in_range_count}/${results.length} (${(100*in_range_count/results.length).toFixed(0)}%)`);

    // Correlation analysis
    console.log(`\nCorrelation Analysis:`);

    // σ vs D_impactor
    const corr_D = calculateCorrelation(
        results.map(r => r.diameter_impactor),
        sigma_values
    );
    console.log(`  σ vs D_impactor:  r = ${corr_D.toFixed(3)} ${interpretCorrelation(corr_D)}`);

    // σ vs velocity
    const corr_v = calculateCorrelation(
        results.map(r => r.velocity),
        sigma_values
    );
    console.log(`  σ vs velocity:    r = ${corr_v.toFixed(3)} ${interpretCorrelation(corr_v)}`);

    // σ vs D_crater
    const corr_Dc = calculateCorrelation(
        results.map(r => r.diameter_crater),
        sigma_values
    );
    console.log(`  σ vs D_crater:    r = ${corr_Dc.toFixed(3)} ${interpretCorrelation(corr_Dc)}`);

    console.log();

    // Physical interpretation
    console.log('🔬 PHYSICAL INTERPRETATION:');
    if (in_range_count / results.length > 0.8) {
        console.log('  ✅ Most σ_required values are within physical range (20-120 MPa)');
        console.log('  → FCM + crater formula are PHYSICALLY CONSISTENT');
        console.log('  → Issue is finding correct σ for each impact (material variability)');
    } else {
        console.log('  ⚠️ Many σ_required values are OUTSIDE physical range');
        console.log('  → Suggests problem in FCM or crater scaling formula');
    }

    if (Math.abs(corr_D) > 0.5) {
        console.log(`  → Strong correlation with D_impactor (r=${corr_D.toFixed(2)})`);
        console.log('  → Smaller impactors may have different effective strength');
    }

    if (Math.abs(corr_v) > 0.5) {
        console.log(`  → Strong correlation with velocity (r=${corr_v.toFixed(2)})`);
        console.log('  → Velocity affects fragmentation more than expected');
    }

    // Recommendation
    console.log('\n🎯 RECOMMENDATION:');
    if (std_sigma / mean_sigma < 0.3) {
        console.log(`  ✅ Low variability (CV=${(100*std_sigma/mean_sigma).toFixed(0)}%)`);
        console.log(`  → Use σ_typical = ${mean_sigma.toFixed(0)} MPa as universal value`);
        console.log('  → Current v1.7.10 approach (σ=35 MPa) is CORRECT');
    } else {
        console.log(`  ⚠️ High variability (CV=${(100*std_sigma/mean_sigma).toFixed(0)}%)`);
        console.log('  → σ varies significantly between impacts');
        console.log('  → Consider σ(D) or σ(v) relationship, OR');
        console.log('  → Accept high uncertainty in small crater prediction');
    }

    console.log('\n' + '='.repeat(80));
}

function calculateCorrelation(x, y) {
    const n = x.length;
    const mean_x = x.reduce((a, b) => a + b, 0) / n;
    const mean_y = y.reduce((a, b) => a + b, 0) / n;

    let num = 0, denom_x = 0, denom_y = 0;
    for (let i = 0; i < n; i++) {
        const dx = x[i] - mean_x;
        const dy = y[i] - mean_y;
        num += dx * dy;
        denom_x += dx * dx;
        denom_y += dy * dy;
    }

    return num / Math.sqrt(denom_x * denom_y);
}

function interpretCorrelation(r) {
    const abs_r = Math.abs(r);
    if (abs_r < 0.3) return '(weak)';
    if (abs_r < 0.7) return '(moderate)';
    return '(strong)';
}

/**
 * MAIN
 */
async function main() {
    const results = await analyzeCraters();
    if (results.length > 0) {
        analyzeStatistics(results);
    } else {
        console.log('❌ No results to analyze');
    }
}

main().catch(console.error);
