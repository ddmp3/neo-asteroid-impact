/**
 * Terrain Analysis Service
 * Advanced terrain-based calculations for impact simulation
 */

class TerrainAnalysis {
    constructor(usgsService) {
        this.usgsService = usgsService;
        this.EARTH_RADIUS_KM = 6371;
    }

    /**
     * Calculate line-of-sight between two points considering terrain
     * @param {Object} point1 - {lat, lon, elevation}
     * @param {Object} point2 - {lat, lon, elevation}
     * @param {number} samples - Number of points to check along path
     * @returns {Promise<Object>} Line-of-sight analysis
     */
    async calculateLineOfSight(point1, point2, samples = 20) {
        const distance = this.calculateDistance(point1.lat, point1.lon, point2.lat, point2.lon);

        // Generate points along the path
        const pathPoints = this.generatePathPoints(point1, point2, samples);

        // Get elevations for all points
        const elevations = await this.usgsService.getElevationBatch(
            pathPoints.map(p => ({ lat: p.lat, lon: p.lon }))
        );

        // Calculate line-of-sight elevation at each point
        const blocked = this.checkLineBlocking(point1, point2, elevations, pathPoints);

        return {
            distance: distance,
            isBlocked: blocked.isBlocked,
            blockingFactor: blocked.blockingFactor, // 0-1, how much is blocked
            highestObstacle: blocked.highestPoint,
            pathElevations: elevations.map((e, i) => ({
                distance: (i / samples) * distance,
                elevation: e.elevation,
                expected: this.linearInterpolation(
                    0, point1.elevation,
                    distance, point2.elevation,
                    (i / samples) * distance
                )
            }))
        };
    }

    /**
     * Check if terrain blocks line-of-sight
     * @private
     */
    checkLineBlocking(point1, point2, elevations, pathPoints) {
        let maxExcess = 0;
        let blockedCount = 0;
        let highestPoint = null;

        for (let i = 1; i < elevations.length - 1; i++) {
            const fraction = i / (elevations.length - 1);
            const expectedElevation = this.linearInterpolation(
                0, point1.elevation,
                1, point2.elevation,
                fraction
            );

            const actualElevation = elevations[i].elevation;
            const excess = actualElevation - expectedElevation;

            if (excess > 0) {
                blockedCount++;
                if (excess > maxExcess) {
                    maxExcess = excess;
                    highestPoint = {
                        lat: pathPoints[i].lat,
                        lon: pathPoints[i].lon,
                        elevation: actualElevation,
                        excess: excess
                    };
                }
            }
        }

        return {
            isBlocked: blockedCount > 0,
            blockingFactor: Math.min(1.0, maxExcess / 1000), // Normalize to 0-1
            blockingPercentage: (blockedCount / (elevations.length - 2)) * 100,
            highestPoint: highestPoint
        };
    }

    /**
     * Calculate blast zone attenuation based on terrain
     * @param {Object} impact - Impact point {lat, lon, elevation}
     * @param {Object} target - Target point {lat, lon, elevation}
     * @param {number} blastPressure - Initial blast pressure (Pa)
     * @returns {Promise<Object>} Attenuated blast effects
     */
    async calculateTerrainAttenuatedBlast(impact, target, blastPressure) {
        const los = await this.calculateLineOfSight(impact, target);

        // Attenuation factors
        let attenuationFactor = 1.0;

        // Distance attenuation (inverse square law)
        const distanceAttenuation = 1 / Math.pow(Math.max(1, los.distance), 2);

        // Terrain blocking
        if (los.isBlocked) {
            // Reduce pressure based on blocking factor
            // Mountains can reduce blast by 50-90%
            const terrainReduction = 0.1 + (0.4 * (1 - los.blockingFactor));
            attenuationFactor *= terrainReduction;
        }

        // Elevation difference effect
        const elevationDiff = target.elevation - impact.elevation;
        if (elevationDiff > 0) {
            // Uphill blast is weaker
            const uphillFactor = Math.exp(-elevationDiff / 5000); // 5km scale
            attenuationFactor *= uphillFactor;
        } else {
            // Downhill blast can be slightly stronger (gravity assist)
            const downhillFactor = 1 + Math.abs(elevationDiff) / 10000;
            attenuationFactor *= Math.min(1.2, downhillFactor);
        }

        const finalPressure = blastPressure * distanceAttenuation * attenuationFactor;

        return {
            originalPressure: blastPressure,
            finalPressure: finalPressure,
            attenuationFactor: attenuationFactor,
            distanceAttenuation: distanceAttenuation,
            terrainBlocking: los.isBlocked,
            blockingFactor: los.blockingFactor,
            elevationEffect: elevationDiff > 0 ? 'uphill' : 'downhill'
        };
    }

    /**
     * Analyze crater formation based on terrain type
     * @param {Object} impactLocation - {lat, lon, elevation, terrainType}
     * @param {number} baseD diameter - Base crater diameter (m)
     * @param {number} baseDepth - Base crater depth (m)
     * @returns {Object} Modified crater dimensions
     */
    async calculateTerrainModifiedCrater(impactLocation, baseDiameter, baseDepth) {
        const elevation = await this.usgsService.getElevation(
            impactLocation.lat,
            impactLocation.lon
        );

        // Terrain-specific modifiers
        const modifiers = this.getCraterModifiers(elevation);

        const modifiedDiameter = baseDiameter * modifiers.diameterMultiplier;
        const modifiedDepth = baseDepth * modifiers.depthMultiplier;

        // Additional effects
        const effects = [];

        if (elevation.isOcean) {
            effects.push('Underwater crater with tsunami generation');
            effects.push(`Water depth: ${Math.abs(elevation.elevation).toFixed(0)}m`);
        }

        if (modifiers.terrainType === 'Mountains') {
            effects.push('Crater formation modified by hard bedrock');
            effects.push('Increased ejecta velocity due to dense target');
        }

        if (modifiers.terrainType === 'Lowland/Plains') {
            effects.push('Sedimentary layers may increase crater diameter');
            effects.push('Potential for secondary cratering from ejecta');
        }

        return {
            originalDiameter: baseDiameter,
            originalDepth: baseDepth,
            modifiedDiameter: modifiedDiameter,
            modifiedDepth: modifiedDepth,
            terrainType: modifiers.terrainType,
            modifiers: modifiers,
            effects: effects,
            volume: Math.PI * Math.pow(modifiedDiameter / 2, 2) * modifiedDepth / 3
        };
    }

    /**
     * Get crater modification factors based on terrain
     * @private
     */
    getCraterModifiers(elevation) {
        let diameterMultiplier = 1.0;
        let depthMultiplier = 1.0;
        let terrainType = elevation.terrainType;

        if (elevation.isOcean) {
            // Ocean impacts
            const waterDepth = Math.abs(elevation.elevation);
            if (waterDepth < 200) {
                // Shallow water
                diameterMultiplier = 0.8;
                depthMultiplier = 1.5;
                terrainType = 'Shallow Ocean';
            } else if (waterDepth < 1000) {
                diameterMultiplier = 0.6;
                depthMultiplier = 2.0;
                terrainType = 'Ocean';
            } else {
                // Deep ocean
                diameterMultiplier = 0.5;
                depthMultiplier = 2.5;
                terrainType = 'Deep Ocean';
            }
        } else {
            // Land impacts - based on terrain type
            switch (elevation.terrainType) {
                case 'Lowland/Plains':
                    // Sedimentary rock - larger, shallower craters
                    diameterMultiplier = 1.2;
                    depthMultiplier = 0.8;
                    break;
                case 'Hills':
                    diameterMultiplier = 1.1;
                    depthMultiplier = 0.9;
                    break;
                case 'Mountains':
                case 'High Mountains':
                    // Hard bedrock - smaller, deeper craters
                    diameterMultiplier = 0.9;
                    depthMultiplier = 1.2;
                    break;
                case 'Extreme Altitude':
                    // Very dense rock
                    diameterMultiplier = 0.85;
                    depthMultiplier = 1.3;
                    break;
                default:
                    diameterMultiplier = 1.0;
                    depthMultiplier = 1.0;
            }
        }

        return {
            diameterMultiplier,
            depthMultiplier,
            terrainType,
            isOcean: elevation.isOcean,
            waterDepth: elevation.isOcean ? Math.abs(elevation.elevation) : 0
        };
    }

    /**
     * Calculate enhanced tsunami effects
     * @param {Object} impact - Impact location
     * @param {number} energy - Impact energy (Joules)
     * @param {number} waterDepth - Depth in meters
     * @returns {Object} Tsunami predictions
     */
    calculateTsunamiEffects(impact, energy, waterDepth) {
        if (waterDepth <= 0) {
            return { risk: 'None', reason: 'Land impact' };
        }

        // Simplified tsunami energy conversion
        // Roughly 1-10% of impact energy goes into tsunami
        const tsunamiEnergy = energy * 0.05;

        // Tsunami height depends on water depth and energy
        // Deep water: h ∝ √(E/depth)
        const waveHeight = Math.sqrt(tsunamiEnergy / (waterDepth * 1e12));

        // Wave speed in deep water: v = √(g * depth)
        const waveSpeed = Math.sqrt(9.81 * waterDepth); // m/s

        // Estimated maximum run-up on coastlines (2-5x wave height)
        const maxRunup = waveHeight * 3.5;

        // Affected radius (simplified)
        const affectedRadiusKm = Math.min(5000, Math.sqrt(energy / 1e18));

        return {
            risk: waveHeight > 1 ? 'Extreme' : waveHeight > 0.5 ? 'High' : 'Moderate',
            waveHeight: waveHeight,
            maxRunup: maxRunup,
            waveSpeed: waveSpeed,
            affectedRadiusKm: affectedRadiusKm,
            waterDepth: waterDepth,
            estimatedArrivalTime: (coastalDistanceKm) => {
                return (coastalDistanceKm * 1000) / waveSpeed; // seconds
            }
        };
    }

    /**
     * Generate points along a path between two locations
     * @private
     */
    generatePathPoints(point1, point2, samples) {
        const points = [];
        for (let i = 0; i <= samples; i++) {
            const fraction = i / samples;
            points.push({
                lat: point1.lat + (point2.lat - point1.lat) * fraction,
                lon: point1.lon + (point2.lon - point1.lon) * fraction
            });
        }
        return points;
    }

    /**
     * Linear interpolation
     * @private
     */
    linearInterpolation(x0, y0, x1, y1, x) {
        return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
    }

    /**
     * Calculate great circle distance
     * @private
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = this.EARTH_RADIUS_KM;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

module.exports = TerrainAnalysis;
