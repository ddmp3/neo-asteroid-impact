/**
 * Script de Test de Performance Local
 * Analyse détaillée des temps d'exécution de chaque étape
 */

const PhysicsEngine = require('./src/services/physicsEngine');

// Fonction helper pour mesurer le temps
function measure(name) {
    const start = Date.now();
    return {
        end: () => {
            const duration = Date.now() - start;
            console.log(`  ⏱️  ${name}: ${duration}ms`);
            return duration;
        }
    };
}

async function testPerformance() {
    console.log('\n🔬 TEST DE PERFORMANCE - PhysicsEngine\n');
    console.log('==========================================\n');

    const engine = new PhysicsEngine();

    // Test 1: Petit impact (20m - Chelyabinsk)
    console.log('📍 Test 1: Petit Impact (20m - Chelyabinsk)');
    const totalTimer1 = measure('TOTAL');

    const params1 = {
        diameter: 20,
        velocity: 19000,
        angle: 18,
        density: 3300,
        impactLocation: { lat: 55.15, lon: 61.41 }
    };

    const result1 = await engine.simulateImpact(params1);
    totalTimer1.end();
    console.log(`  ✅ Victimes: ${result1.casualties.estimatedCasualties}`);
    console.log('');

    // Test 2: Moyen impact (100m - Paris)
    console.log('📍 Test 2: Moyen Impact (100m - Paris)');
    const totalTimer2 = measure('TOTAL');

    const params2 = {
        diameter: 100,
        velocity: 20000,
        angle: 45,
        density: 3000,
        impactLocation: { lat: 48.8566, lon: 2.3522 }
    };

    const result2 = await engine.simulateImpact(params2);
    totalTimer2.end();
    console.log(`  ✅ Victimes: ${result2.casualties.estimatedCasualties}`);
    console.log('');

    // Test 3: Gros impact (1000m - New York)
    console.log('📍 Test 3: Gros Impact (1000m - New York)');
    const totalTimer3 = measure('TOTAL');

    const params3 = {
        diameter: 1000,
        velocity: 25000,
        angle: 45,
        density: 3000,
        impactLocation: { lat: 40.7128, lon: -74.0060 }
    };

    const result3 = await engine.simulateImpact(params3);
    totalTimer3.end();
    console.log(`  ✅ Energie: ${result3.energy.megatons.toFixed(2)} MT`);
    console.log('');

    console.log('==========================================');
    console.log('✅ Tests terminés\n');
}

// Wrapper les fonctions du PhysicsEngine pour tracer
function instrumentPhysicsEngine() {
    const engine = new PhysicsEngine();
    const originalSimulate = engine.simulateImpact.bind(engine);

    engine.simulateImpact = async function(params) {
        console.log('  🔹 Début simulation...');

        const t1 = measure('  1. USGS Elevation');
        const terrainData = await this.usgsService.getElevation(
            params.impactLocation.lat,
            params.impactLocation.lon
        );
        t1.end();

        const t2 = measure('  2. Calculs basiques (masse, vélocité, énergie)');
        const mass = this.calculateMass(params.diameter, params.density || 3000);
        const finalVelocity = this.calculateImpactVelocity(params.velocity, params.angle || 45);
        const energy = this.calculateImpactEnergy(mass, finalVelocity);
        t2.end();

        const t3 = measure('  3. Cratère (basique + terrain)');
        const baseCrater = this.calculateCraterSize(energy.joules, params.angle || 45);
        const crater = await this.terrainAnalysis.calculateTerrainModifiedCrater(
            { lat: params.impactLocation.lat, lon: params.impactLocation.lon },
            baseCrater.diameter,
            baseCrater.depth
        );
        t3.end();

        const t4 = measure('  4. Effets sismiques');
        const seismic = this.calculateSeismicEffects(energy.joules);
        t4.end();

        const t5 = measure('  5. Blast radius');
        const blast = this.calculateBlastRadius(energy.joules);
        t5.end();

        const t6 = measure('  6. Tsunami (si océan)');
        const tsunami = terrainData.isOcean ?
            this.terrainAnalysis.calculateTsunamiEffects(
                params.impactLocation,
                energy.joules,
                Math.abs(terrainData.elevation)
            ) : null;
        t6.end();

        const t7 = measure('  7. Casualties (4x getPopulationInRadius)');
        const casualties = await this.calculateCasualties(
            blast,
            params.impactLocation,
            crater
        );
        t7.end();

        return {
            asteroidProperties: {
                diameter: params.diameter,
                mass,
                velocity: finalVelocity,
                density: params.density || 3000,
                angle: params.angle || 45
            },
            energy,
            crater,
            seismic,
            blast,
            tsunami,
            casualties,
            impactLocation: {
                ...params.impactLocation,
                elevation: terrainData.elevation,
                terrainType: terrainData.terrainType,
                isOcean: terrainData.isOcean,
                waterDepth: terrainData.waterDepth
            },
            terrainEffects: {
                craterModification: {
                    original: baseCrater,
                    modified: crater,
                    terrainInfluence: crater.modifiers
                }
            }
        };
    };

    return engine;
}

// Run avec instrumentation
async function runInstrumentedTests() {
    console.log('\n🔬 TEST DE PERFORMANCE DÉTAILLÉ\n');
    console.log('==========================================\n');

    const PhysicsEngineClass = require('./src/services/physicsEngine');
    const originalPrototype = Object.getPrototypeOf(new PhysicsEngineClass());

    // Override simulateImpact
    const engine = instrumentPhysicsEngine();

    // Test Paris (cas typique)
    console.log('📍 Simulation Paris (100m) - DÉTAILLÉE');
    const totalTimer = measure('⏱️  TOTAL SIMULATION');

    const params = {
        diameter: 100,
        velocity: 20000,
        angle: 45,
        density: 3000,
        impactLocation: { lat: 48.8566, lon: 2.3522 }
    };

    const result = await engine.simulateImpact(params);
    const total = totalTimer.end();

    console.log(`\n  ✅ Résultats:`);
    console.log(`     - Victimes: ${result.casualties.estimatedCasualties.toLocaleString()}`);
    console.log(`     - Energie: ${result.energy.megatons.toFixed(2)} MT`);
    console.log(`     - Magnitude sismique: M${result.seismic.magnitude.toFixed(2)}`);
    console.log('');
    console.log('==========================================\n');
}

runInstrumentedTests().catch(console.error);
