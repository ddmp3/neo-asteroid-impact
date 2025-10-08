/**
 * Physics Engine for Asteroid Impact Simulation
 * Implements Keplerian orbital mechanics and impact physics calculations
 */

const populationService = require('./populationService');
const populationGridService = require('./populationGridService');
const casualtyModel = require('./casualtyModel');
const TerrainAnalysis = require('./terrainAnalysis');
const USGSService = require('./usgsService');

class PhysicsEngine {
    constructor() {
        // Constants
        this.G = 6.67430e-11; // Gravitational constant (m³/kg·s²)
        this.EARTH_MASS = 5.972e24; // kg
        this.EARTH_RADIUS = 6371000; // meters
        this.EARTH_SURFACE_GRAVITY = 9.81; // m/s²
        this.DEFAULT_ASTEROID_DENSITY = 3000; // kg/m³ (typical rocky asteroid)
        this.AU = 149597870700; // Astronomical Unit in meters

        // Initialize terrain analysis
        this.usgsService = new USGSService();
        this.terrainAnalysis = new TerrainAnalysis(this.usgsService);
    }

    /**
     * Calculate orbital position from Keplerian elements
     * @param {Object} elements - Keplerian orbital elements
     * @returns {Object} Position {x, y, z} in meters
     */
    calculateOrbitalPosition(elements) {
        const {
            semiMajorAxis,
            eccentricity,
            inclination,
            longitudeOfAscendingNode,
            argumentOfPeriapsis,
            trueAnomaly
        } = elements;

        // Convert to radians
        const i = inclination * Math.PI / 180;
        const omega = longitudeOfAscendingNode * Math.PI / 180;
        const w = argumentOfPeriapsis * Math.PI / 180;
        const nu = trueAnomaly * Math.PI / 180;

        // Calculate distance from focus
        const r = (semiMajorAxis * (1 - eccentricity * eccentricity)) /
                  (1 + eccentricity * Math.cos(nu));

        // Position in orbital plane
        const x_orb = r * Math.cos(nu);
        const y_orb = r * Math.sin(nu);

        // Rotation matrices to convert to 3D coordinates
        const x = (Math.cos(omega) * Math.cos(w) - Math.sin(omega) * Math.sin(w) * Math.cos(i)) * x_orb +
                  (-Math.cos(omega) * Math.sin(w) - Math.sin(omega) * Math.cos(w) * Math.cos(i)) * y_orb;

        const y = (Math.sin(omega) * Math.cos(w) + Math.cos(omega) * Math.sin(w) * Math.cos(i)) * x_orb +
                  (-Math.sin(omega) * Math.sin(w) + Math.cos(omega) * Math.cos(w) * Math.cos(i)) * y_orb;

        const z = (Math.sin(w) * Math.sin(i)) * x_orb + (Math.cos(w) * Math.sin(i)) * y_orb;

        return { x, y, z, distance: r };
    }

    /**
     * Calculate asteroid mass from diameter
     * @param {number} diameter - Asteroid diameter in meters
     * @param {number} density - Asteroid density in kg/m³ (default: 3000)
     * @returns {number} Mass in kg
     */
    calculateMass(diameter, density = this.DEFAULT_ASTEROID_DENSITY) {
        const radius = diameter / 2;
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        return volume * density;
    }

    /**
     * Calculate impact velocity accounting for Earth's gravity
     * @param {number} initialVelocity - Initial velocity in m/s
     * @param {number} angle - Impact angle in degrees (0 = horizontal, 90 = vertical)
     * @returns {number} Final impact velocity in m/s
     */
    calculateImpactVelocity(initialVelocity, angle = 45) {
        // Earth's escape velocity
        const escapeVelocity = Math.sqrt(2 * this.G * this.EARTH_MASS / this.EARTH_RADIUS);

        // Combine initial velocity with Earth's gravitational acceleration
        const angleRad = angle * Math.PI / 180;
        const verticalComponent = initialVelocity * Math.sin(angleRad);
        const horizontalComponent = initialVelocity * Math.cos(angleRad);

        // Approximate final velocity (simplified model)
        const finalVertical = Math.sqrt(verticalComponent * verticalComponent + escapeVelocity * escapeVelocity);
        const finalVelocity = Math.sqrt(finalVertical * finalVertical + horizontalComponent * horizontalComponent);

        return finalVelocity;
    }

    /**
     * Calculate kinetic energy of impact
     * @param {number} mass - Asteroid mass in kg
     * @param {number} velocity - Impact velocity in m/s
     * @returns {Object} Energy in Joules and TNT equivalent in megatons
     */
    calculateImpactEnergy(mass, velocity) {
        const energyJoules = 0.5 * mass * velocity * velocity;

        // Convert to TNT equivalent (1 ton TNT = 4.184e9 J)
        const tntTons = energyJoules / 4.184e9;
        const tntMegatons = tntTons / 1e6;

        return {
            joules: energyJoules,
            tntTons: tntTons,
            megatons: tntMegatons
        };
    }

    /**
     * Calculate crater dimensions using scaling laws
     * Based on Collins et al. (2005) crater scaling
     * @param {number} energy - Impact energy in Joules
     * @param {number} angle - Impact angle in degrees
     * @param {number} targetDensity - Target rock density in kg/m³ (default: 2500)
     * @returns {Object} Crater dimensions {diameter, depth} in meters
     */
    calculateCraterSize(energy, angle = 45, targetDensity = 2500) {
        const angleRad = angle * Math.PI / 180;

        // Simplified crater scaling law
        // D ∝ E^0.25 (approximate)
        const baseDiameter = 1.8 * Math.pow(energy / 1e15, 0.25);

        // Adjust for angle (vertical impacts create larger craters)
        const angleFactor = Math.pow(Math.sin(angleRad), 1/3);
        const diameter = baseDiameter * angleFactor;

        // Depth is typically 1/5 to 1/3 of diameter
        const depth = diameter / 5;

        return {
            diameter: diameter,
            depth: depth,
            volume: Math.PI * Math.pow(diameter/2, 2) * depth / 3 // Approximate cone volume
        };
    }

    /**
     * Estimate seismic magnitude from impact energy
     * Based on empirical relationships
     * @param {number} energy - Impact energy in Joules
     * @returns {Object} Seismic information {magnitude, description}
     */
    calculateSeismicEffects(energy) {
        // Richter magnitude from energy: M = (2/3) * log10(E) - 4.8
        const magnitude = (2/3) * Math.log10(energy) - 4.8;

        let description = '';
        if (magnitude < 4) {
            description = 'Minor - Often felt, but rarely causes damage';
        } else if (magnitude < 5) {
            description = 'Light - Noticeable shaking, minor damage';
        } else if (magnitude < 6) {
            description = 'Moderate - Can cause damage to buildings';
        } else if (magnitude < 7) {
            description = 'Strong - Major damage in populated areas';
        } else if (magnitude < 8) {
            description = 'Major - Serious damage over large areas';
        } else {
            description = 'Great - Catastrophic destruction';
        }

        return {
            magnitude: Math.max(0, magnitude),
            description: description,
            radiusKm: Math.pow(10, magnitude - 1) // Approximate felt radius in km
        };
    }

    /**
     * Calculate blast radius and overpressure zones
     * Based on NASA/Imperial College asteroid impact models
     * @param {number} energy - Impact energy in Joules
     * @returns {Object} Blast zones with radii in meters
     */
    calculateBlastRadius(energy) {
        const megatons = energy / (4.184e15);

        // Asteroid impact scaling laws (different from nuclear explosions)
        // Based on Collins et al. (2005) and NASA NEO impact studies

        // Fireball radius - initial vaporization zone
        const fireball = 40 * Math.pow(megatons, 0.33); // meters (cube root scaling)

        // Thermal radiation - 3rd degree burns
        // Air burst is more efficient at thermal radiation than ground burst
        const thermalRadiation = 500 * Math.pow(megatons, 0.41); // meters

        // Air blast overpressure (20 psi - building collapse)
        const airblast = 350 * Math.pow(megatons, 0.33); // meters

        // Ionizing radiation zone (less important for asteroids vs nuclear)
        const radiation = 200 * Math.pow(megatons, 0.41); // meters

        return {
            fireball: fireball,
            radiationRadius: radiation,
            airblastRadius: airblast,
            thermalRadius: thermalRadiation
        };
    }

    /**
     * Estimate tsunami potential for ocean impacts
     * @param {number} energy - Impact energy in Joules
     * @param {number} waterDepth - Ocean depth at impact point in meters
     * @returns {Object} Tsunami characteristics
     */
    calculateTsunamiEffects(energy, waterDepth = 4000) {
        const megatons = energy / (4.184e15);

        // Simplified tsunami wave height estimation
        const waveHeight = Math.sqrt(megatons) * 10; // meters
        const wavelength = waterDepth * 50; // meters
        const speed = Math.sqrt(this.EARTH_SURFACE_GRAVITY * waterDepth); // m/s

        return {
            initialWaveHeight: waveHeight,
            wavelength: wavelength,
            propagationSpeed: speed,
            speedKmh: speed * 3.6,
            affectedRadiusKm: megatons * 100 // Rough estimate
        };
    }

    /**
     * Simulate complete impact scenario
     * @param {Object} params - Impact parameters
     * @returns {Object} Complete impact analysis
     */
    async simulateImpact(params) {
        const {
            diameter, // meters
            velocity, // m/s
            angle = 45, // degrees
            density = this.DEFAULT_ASTEROID_DENSITY,
            impactLocation = { lat: 0, lon: 0, isOcean: false, depth: 0 }
        } = params;

        // Get detailed terrain data for impact location
        const terrainData = await this.usgsService.getElevation(
            impactLocation.lat,
            impactLocation.lon
        );

        // Calculate mass
        const mass = this.calculateMass(diameter, density);

        // Calculate final impact velocity
        const finalVelocity = this.calculateImpactVelocity(velocity, angle);

        // Calculate impact energy
        const energy = this.calculateImpactEnergy(mass, finalVelocity);

        // Calculate terrain-modified crater
        const baseCrater = this.calculateCraterSize(energy.joules, angle);
        const crater = await this.terrainAnalysis.calculateTerrainModifiedCrater(
            { lat: impactLocation.lat, lon: impactLocation.lon },
            baseCrater.diameter,
            baseCrater.depth
        );

        // Calculate seismic effects
        const seismic = this.calculateSeismicEffects(energy.joules);

        // Calculate blast effects
        const blast = this.calculateBlastRadius(energy.joules);

        // Enhanced tsunami calculation for ocean impacts
        const tsunami = terrainData.isOcean ?
            this.terrainAnalysis.calculateTsunamiEffects(
                impactLocation,
                energy.joules,
                Math.abs(terrainData.elevation)
            ) : null;

        // Calculate casualties (use legacy model by default for stability)
        const useScientificModel = process.env.USE_SCIENTIFIC_CASUALTIES === 'true';

        let casualties;

        if (useScientificModel) {
            try {
                console.log('Using SCIENTIFIC casualty model (Rumpf et al. 2017)');
                casualties = await this.calculateScientificCasualties(
                    energy,
                    blast,
                    crater,
                    { ...impactLocation, elevation: terrainData.elevation },
                    seismic,
                    tsunami
                );
            } catch (error) {
                console.error('Scientific casualties failed, using legacy:', error.message);
                casualties = await this.calculateCasualtiesWithTerrain(
                    blast,
                    { ...impactLocation, elevation: terrainData.elevation },
                    crater
                );
            }
        } else {
            // Use simple, stable legacy model
            casualties = await this.calculateCasualties(
                blast,
                impactLocation,
                crater
            );
        }

        return {
            asteroidProperties: {
                diameter,
                mass,
                velocity: finalVelocity,
                density,
                angle
            },
            energy,
            crater,
            seismic,
            blast,
            tsunami,
            casualties: casualties,
            impactLocation: {
                ...impactLocation,
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
    }

    /**
     * Calculate potential human casualties
     * @param {Object} blast - Blast zones
     * @param {Object} impactLocation - Impact coordinates
     * @param {Object} crater - Crater data
     * @returns {Object} Casualties estimation
     */
    async calculateCasualties(blast, impactLocation, crater) {
        // Zones de destruction avec taux de mortalité
        const zones = {
            fireball: {
                radius: blast.fireball / 1000, // km
                mortalityRate: 1.0, // 100% dans la boule de feu
                description: 'Total vaporization'
            },
            thermal: {
                radius: blast.thermalRadius / 1000, // km
                mortalityRate: 0.9, // 90% brûlures 3ème degré
                description: 'Severe burns, fires'
            },
            airblast: {
                radius: blast.airblastRadius / 1000, // km
                mortalityRate: 0.7, // 70% surpression létale
                description: 'Building collapse, flying debris'
            },
            radiation: {
                radius: blast.radiationRadius / 1000, // km
                mortalityRate: 0.3, // 30% radiation + effets secondaires
                description: 'Radiation sickness, structural damage'
            }
        };

        // Calcul des victimes par zone avec VRAIE POPULATION
        let totalCasualties = 0;
        let totalInjured = 0;
        const detailedZones = {};
        let largestZoneCities = [];
        let maxRadius = 0;

        for (const [zoneName, zone] of Object.entries(zones)) {
            // Obtenir la VRAIE population dans ce rayon
            const popData = await populationService.getPopulationInRadius(
                impactLocation.lat,
                impactLocation.lon,
                zone.radius
            );

            const casualties = Math.round(popData.totalPopulation * zone.mortalityRate);
            const injured = Math.round(popData.totalPopulation * (1 - zone.mortalityRate) * 0.8);

            detailedZones[zoneName] = {
                radius: zone.radius,
                area: Math.PI * zone.radius * zone.radius,
                populationAffected: popData.totalPopulation,
                casualties: casualties,
                injured: injured,
                mortalityRate: zone.mortalityRate,
                description: zone.description,
                affectedCities: popData.affectedCities
            };

            // Garder les villes de la plus grande zone (contient toutes les autres)
            if (zone.radius > maxRadius) {
                maxRadius = zone.radius;
                largestZoneCities = popData.affectedCities || [];
            }

            totalCasualties += casualties;
            totalInjured += injured;
        }

        const severity = this.getCasualtySeverity(totalCasualties);

        return {
            estimatedCasualties: totalCasualties,
            estimatedInjured: totalInjured,
            totalAffected: totalCasualties + totalInjured,
            zones: detailedZones,
            affectedCities: largestZoneCities,
            severity: severity,
            note: impactLocation.isOcean ?
                'Ocean impact - tsunami and coastal effects primary concern' :
                `Direct land impact - ${largestZoneCities.length} major cities affected`
        };
    }

    /**
     * Calculate casualties with terrain-aware blast propagation
     * @param {Object} blast - Blast zones
     * @param {Object} impactLocation - Impact coordinates with elevation
     * @param {Object} crater - Crater data
     * @returns {Object} Casualties estimation with terrain effects
     */
    async calculateCasualtiesWithTerrain(blast, impactLocation, crater) {
        // Get all cities in blast radius
        const maxRadius = Math.max(
            blast.fireball,
            blast.thermalRadius,
            blast.airblastRadius,
            blast.radiationRadius
        ) / 1000; // Convert to km

        const citiesInRange = await populationService.getCitiesInRadius(
            impactLocation.lat,
            impactLocation.lon,
            maxRadius
        );

        // Calculate terrain-modified effects for each city
        const cityEffects = [];
        let totalCasualties = 0;
        let totalInjured = 0;
        let totalProtected = 0;

        for (const city of citiesInRange) {
            // Calculate distance from impact
            const distance = this.terrainAnalysis.calculateDistance(
                impactLocation.lat,
                impactLocation.lon,
                city.lat,
                city.lon
            );

            // Get city elevation (if not already present)
            const cityElevation = city.elevation || (await this.usgsService.getElevation(city.lat, city.lon)).elevation;

            // Calculate line-of-sight and terrain blocking
            const terrainBlocking = await this.terrainAnalysis.calculateTerrainAttenuatedBlast(
                { lat: impactLocation.lat, lon: impactLocation.lon, elevation: impactLocation.elevation },
                { lat: city.lat, lon: city.lon, elevation: cityElevation },
                1e6 // Base blast pressure in Pa
            );

            // Determine which zone this city is in
            let zone = null;
            let baseMultiplier = 0;

            if (distance <= blast.fireball / 1000) {
                zone = 'fireball';
                baseMultiplier = 1.0;
            } else if (distance <= blast.thermalRadius / 1000) {
                zone = 'thermal';
                baseMultiplier = 0.9;
            } else if (distance <= blast.airblastRadius / 1000) {
                zone = 'airblast';
                baseMultiplier = 0.7;
            } else if (distance <= blast.radiationRadius / 1000) {
                zone = 'radiation';
                baseMultiplier = 0.3;
            }

            if (zone) {
                // Apply terrain attenuation
                const terrainProtection = 1 - terrainBlocking.attenuationFactor;
                const effectiveMultiplier = baseMultiplier * terrainBlocking.attenuationFactor;

                const casualties = Math.round(city.population * effectiveMultiplier);
                const protectedCount = Math.round(city.population * baseMultiplier * terrainProtection);
                const injured = Math.round((city.population - casualties - protectedCount) * 0.8);

                totalCasualties += casualties;
                totalProtected += protectedCount;
                totalInjured += injured;

                cityEffects.push({
                    city: city.name,
                    population: city.population,
                    distance: distance.toFixed(1),
                    zone: zone,
                    casualties: casualties,
                    injured: injured,
                    protectedByTerrain: protectedCount,
                    terrainBlocking: terrainBlocking.terrainBlocking,
                    blockingFactor: terrainBlocking.blockingFactor.toFixed(2),
                    protectionPercentage: (terrainProtection * 100).toFixed(1)
                });
            }
        }

        // Sort cities by casualties
        cityEffects.sort((a, b) => b.casualties - a.casualties);

        return {
            estimatedCasualties: totalCasualties,
            estimatedInjured: totalInjured,
            totalProtected: totalProtected,
            totalAffected: totalCasualties + totalInjured,
            affectedCities: cityEffects,
            terrainProtectionSummary: {
                citiesWithProtection: cityEffects.filter(c => c.protectedByTerrain > 0).length,
                totalLivesSaved: totalProtected,
                averageProtection: cityEffects.length > 0 ?
                    (cityEffects.reduce((sum, c) => sum + parseFloat(c.protectionPercentage), 0) / cityEffects.length).toFixed(1) : 0
            },
            note: impactLocation.isOcean ?
                'Ocean impact - tsunami effects calculated separately' :
                `Terrain-aware simulation: ${totalProtected.toLocaleString()} lives potentially saved by topographic protection`
        };
    }

    /**
     * Calculate casualties using scientific models (Rumpf et al. 2017)
     * Implements seven impact effects with probit lethality functions
     *
     * @param {Object} energy - Impact energy object
     * @param {Object} blast - Blast zones
     * @param {Object} crater - Crater data
     * @param {Object} impactLocation - Impact coordinates
     * @param {Object} seismic - Seismic data
     * @param {Object} tsunami - Tsunami data (if ocean impact)
     * @returns {Promise<Object>} Scientific casualty estimation
     */
    async calculateScientificCasualties(energy, blast, crater, impactLocation, seismic, tsunami) {
        // Get population data in affected area
        const maxRadius = Math.max(
            blast.thermalRadius,
            blast.airblastRadius,
            seismic.radiusKm
        ) / 1000; // Convert to km

        // Simplified: Use coarse grid sampling to avoid memory issues
        const popData = await populationGridService.getPopulationInRadius(
            impactLocation.lat,
            impactLocation.lon,
            maxRadius,
            5.0 // 5km grid resolution (coarser for performance)
        );

        console.log(`Scientific casualty calculation: ${popData.totalPopulation.toLocaleString()} people in ${maxRadius.toFixed(1)}km radius`);

        // Calculate effect severity and lethality at different distances
        const casualties = {
            byEffect: {},
            total: 0,
            totalInjured: 0,
            affectedPopulation: popData.totalPopulation
        };

        // Sample points in concentric rings (limit to 20 rings max for performance)
        const rings = [];
        const ringSpacing = Math.max(2, maxRadius / 20); // Max 20 rings, min 2km spacing
        const numRings = Math.min(20, Math.ceil(maxRadius / ringSpacing));

        console.log(`Calculating casualties in ${numRings} rings, spacing: ${ringSpacing.toFixed(2)}km`);

        //Get average density once (not in loop to save memory)
        const avgDensity = popData.averageDensity || 100;

        for (let i = 0; i < numRings; i++) {
            const innerRadius = i * ringSpacing;
            const outerRadius = (i + 1) * ringSpacing;
            const midRadius = (innerRadius + outerRadius) / 2;

            // Ring area
            const ringAreaKm2 = Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius);
            const ringPop = Math.round(avgDensity * ringAreaKm2);

            if (ringPop <= 0) continue;

            // Calculate distance in meters for models
            const distanceM = midRadius * 1000;

            // 1. CRATER LETHALITY (immediate zone)
            const craterRadius = crater.modifiedDiameter / 2000; // Convert to km
            const craterLethality = casualtyModel.calculateCraterLethality(distanceM, crater.modifiedDiameter / 2);

            // 2. THERMAL RADIATION LETHALITY
            const thermalFlux = casualtyModel.calculateThermalFluxAtDistance(energy.joules, distanceM);
            const thermalLethality = casualtyModel.calculateThermalLethality(thermalFlux);

            // 3. OVERPRESSURE LETHALITY
            const overpressure = casualtyModel.calculateOverpressureAtDistance(energy.joules, distanceM);
            const overpressureLethality = casualtyModel.calculateOverpressureLethality(overpressure);

            // 4. WIND BLAST LETHALITY
            const windSpeed = casualtyModel.calculateWindSpeedFromOverpressure(overpressure);
            const windLethality = casualtyModel.calculateWindLethality(windSpeed);

            // 5. SEISMIC LETHALITY
            const seismicLethality = casualtyModel.calculateSeismicLethality(seismic.magnitude, midRadius);

            // 6. EJECTA LETHALITY
            const ejectaThickness = casualtyModel.calculateEjectaThickness(
                crater.modifiedDiameter,
                crater.modifiedDepth,
                distanceM
            );
            const ejectaLethality = casualtyModel.calculateEjectaLethality(ejectaThickness);

            // 7. TSUNAMI LETHALITY (if ocean impact)
            let tsunamiLethality = 0;
            if (tsunami && tsunami.waveHeight > 0) {
                // Estimate distance from coast (simplified)
                const distanceFromCoast = 0; // Would need coastline data
                tsunamiLethality = casualtyModel.calculateTsunamiLethality(tsunami.waveHeight, distanceFromCoast);
            }

            // Combine all lethalities using competitive risk model
            const combinedLethality = casualtyModel.combineLethalities([
                craterLethality,
                thermalLethality,
                overpressureLethality,
                windLethality,
                seismicLethality,
                ejectaLethality,
                tsunamiLethality
            ]);

            // Calculate casualties in this ring
            const ringCasualties = Math.round(ringPop * combinedLethality);
            const ringInjured = Math.round(ringPop * (1 - combinedLethality) * 0.7); // 70% of survivors injured

            casualties.total += ringCasualties;
            casualties.totalInjured += ringInjured;

            // Track dominant effect (highest lethality)
            const effects = [
                { name: 'crater', lethality: craterLethality },
                { name: 'thermal', lethality: thermalLethality },
                { name: 'overpressure', lethality: overpressureLethality },
                { name: 'wind', lethality: windLethality },
                { name: 'seismic', lethality: seismicLethality },
                { name: 'ejecta', lethality: ejectaLethality },
                { name: 'tsunami', lethality: tsunamiLethality }
            ];

            const dominantEffect = effects.reduce((max, e) => e.lethality > max.lethality ? e : max);

            rings.push({
                distance: midRadius,
                population: ringPop,
                casualties: ringCasualties,
                injured: ringInjured,
                lethality: combinedLethality,
                dominantEffect: dominantEffect.name,
                effects: {
                    crater: craterLethality,
                    thermal: thermalLethality,
                    overpressure: overpressureLethality,
                    wind: windLethality,
                    seismic: seismicLethality,
                    ejecta: ejectaLethality,
                    tsunami: tsunamiLethality
                }
            });
        }

        // Aggregate by effect type
        const effectTypes = ['crater', 'thermal', 'overpressure', 'wind', 'seismic', 'ejecta', 'tsunami'];
        for (const effect of effectTypes) {
            const effectCasualties = rings.reduce((sum, ring) => {
                if (ring.dominantEffect === effect) {
                    return sum + ring.casualties;
                }
                return sum;
            }, 0);

            if (effectCasualties > 0) {
                casualties.byEffect[effect] = effectCasualties;
            }
        }

        return {
            estimatedCasualties: casualties.total,
            estimatedInjured: casualties.totalInjured,
            totalAffected: casualties.total + casualties.totalInjured,
            affectedPopulation: popData.affectedPopulation,
            affectedCities: popData.affectedCities,
            casualtiesByEffect: casualties.byEffect,
            severity: this.getCasualtySeverity(casualties.total),
            model: 'Rumpf et al. (2017) - Scientific vulnerability model',
            rings: rings.slice(0, 10), // Return first 10 rings for debugging
            note: `Based on ${popData.sampledPoints} grid points at ${popData.gridResolution}km resolution`
        };
    }

    /**
     * Get population in an annular ring
     *
     * @param {number} lat - Center latitude
     * @param {number} lon - Center longitude
     * @param {number} innerRadiusKm - Inner radius in km
     * @param {number} outerRadiusKm - Outer radius in km
     * @returns {Promise<number>} Population in ring
     */
    async getPopulationInRing(lat, lon, innerRadiusKm, outerRadiusKm) {
        // Sample points in ring (simplified - in production use proper integration)
        const numSamples = 12; // Sample at 12 angles
        let totalPop = 0;

        const midRadius = (innerRadiusKm + outerRadiusKm) / 2;

        for (let i = 0; i < numSamples; i++) {
            const angle = (i / numSamples) * 2 * Math.PI;

            // Calculate point coordinates
            const dLat = (midRadius * Math.cos(angle)) / 111; // 1° ≈ 111 km
            const dLon = (midRadius * Math.sin(angle)) / (111 * Math.cos(lat * Math.PI / 180));

            const sampleLat = lat + dLat;
            const sampleLon = lon + dLon;

            // Get density at this point
            const density = await populationGridService.getPopulationDensity(sampleLat, sampleLon);

            // Area of ring segment
            const ringArea = Math.PI * (outerRadiusKm * outerRadiusKm - innerRadiusKm * innerRadiusKm) / numSamples;

            totalPop += density * ringArea;
        }

        return Math.round(totalPop);
    }

    /**
     * Estimate population density based on coordinates
     * @private
     */
    estimatePopulationDensity(lat, lon, isOcean) {
        if (isOcean) return 0;

        // Zones métropolitaines majeures (densité très élevée)
        const majorCities = [
            { lat: 40.7, lon: -74.0, density: 11000, name: 'New York' },
            { lat: 34.0, lon: -118.2, density: 3200, name: 'Los Angeles' },
            { lat: 51.5, lon: -0.1, density: 5700, name: 'London' },
            { lat: 48.8, lon: 2.3, density: 21000, name: 'Paris' },
            { lat: 35.7, lon: 139.7, density: 6400, name: 'Tokyo' },
            { lat: 31.2, lon: 121.5, density: 3800, name: 'Shanghai' },
            { lat: 19.4, lon: -99.1, density: 6000, name: 'Mexico City' },
            { lat: 28.6, lon: 77.2, density: 11000, name: 'Delhi' },
            { lat: -23.5, lon: -46.6, density: 7900, name: 'São Paulo' },
            { lat: 55.7, lon: 37.6, density: 4900, name: 'Moscow' },
            { lat: -33.9, lon: 151.2, density: 2100, name: 'Sydney' },
        ];

        // Chercher la ville la plus proche
        let closestCity = null;
        let minDistance = Infinity;

        for (const city of majorCities) {
            const distance = Math.sqrt(
                Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestCity = city;
            }
        }

        // Si très proche d'une grande ville (< 2°)
        if (minDistance < 2) {
            return closestCity.density;
        }

        // Si proche (< 5°)
        if (minDistance < 5) {
            return closestCity.density * 0.3; // Banlieue
        }

        // Estimation par latitude (zones habitables)
        const absLat = Math.abs(lat);

        if (absLat > 70) return 0.1; // Zones polaires
        if (absLat > 60) return 2; // Zones subpolaires
        if (absLat > 50) return 30; // Zones tempérées nord
        if (absLat > 30) return 50; // Zones tempérées
        if (absLat > 20) return 40; // Zones subtropicales
        return 35; // Zones tropicales
    }

    /**
     * Get urban density factor
     * @private
     */
    getUrbanFactor(lat, lon) {
        // Facteur multiplicateur selon la proximité urbaine
        const majorCities = [
            { lat: 40.7, lon: -74.0, factor: 2.5 },
            { lat: 35.7, lon: 139.7, factor: 3.0 },
            { lat: 28.6, lon: 77.2, factor: 2.8 },
            { lat: 31.2, lon: 121.5, factor: 2.7 },
        ];

        for (const city of majorCities) {
            const distance = Math.sqrt(
                Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2)
            );
            if (distance < 1) return city.factor;
        }

        return 1.0; // Facteur normal
    }

    /**
     * Classify casualty severity
     * @private
     */
    getCasualtySeverity(casualties) {
        if (casualties < 100) return 'Minor';
        if (casualties < 1000) return 'Moderate';
        if (casualties < 10000) return 'Serious';
        if (casualties < 100000) return 'Severe';
        if (casualties < 1000000) return 'Catastrophic';
        if (casualties < 10000000) return 'Mass Casualty Event';
        return 'Extinction-Level Event';
    }

    /**
     * Calculate deflection delta-v required
     * @param {Object} params - Deflection parameters
     * @returns {Object} Deflection analysis
     */
    calculateDeflection(params) {
        const {
            asteroidMass,
            warningTime, // days
            missDistance, // desired miss distance in km
            method = 'kinetic' // 'kinetic', 'gravity', 'nuclear'
        } = params;

        const warningTimeSeconds = warningTime * 24 * 3600;
        const requiredDeltaV = (missDistance * 1000) / warningTimeSeconds; // m/s

        let efficiency = 1;
        let description = '';

        switch(method) {
            case 'kinetic':
                efficiency = 0.5; // Momentum transfer efficiency
                description = 'Kinetic Impactor: High-speed spacecraft collision';
                break;
            case 'gravity':
                efficiency = 0.01; // Very gradual but precise
                description = 'Gravity Tractor: Spacecraft gravitational pull';
                break;
            case 'nuclear':
                efficiency = 10; // High energy release
                description = 'Nuclear Deflection: Standoff nuclear detonation';
                break;
        }

        const impactorMass = (asteroidMass * requiredDeltaV) / (efficiency * 1000);

        return {
            method,
            description,
            requiredDeltaV,
            impactorMass,
            feasible: warningTime > 30 && impactorMass < 50000,
            warningTimeNeeded: Math.ceil((missDistance * 1000 * asteroidMass) / (efficiency * 1000 * 100)),
            successProbability: warningTime > 365 ? 0.9 : warningTime > 180 ? 0.7 : warningTime > 90 ? 0.5 : 0.2
        };
    }
}

module.exports = PhysicsEngine;
