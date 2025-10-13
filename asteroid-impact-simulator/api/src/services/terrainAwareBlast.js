const USGSService = require('./usgsService');

/**
 * Terrain-Aware Blast Zone Calculator
 * Calculates realistic blast zones that respect terrain topology (mountains, valleys)
 * Uses line-of-sight analysis to determine blocked/shadowed areas
 *
 * Scientific Basis:
 * - Shock waves travel in straight lines from burst altitude
 * - Mountains and terrain features can block/shadow blast effects
 * - Line-of-sight methodology: if terrain blocks view from burst point → reduced/zero effect
 *
 * References:
 * - Glasstone & Dolan (1977) - Effects of Nuclear Weapons
 * - Collins et al. (2005) - Earth Impact Effects Program
 */
class TerrainAwareBlastService {
    constructor() {
        this.usgsService = new USGSService();
        this.EARTH_RADIUS_KM = 6371;
    }

    /**
     * Calculate terrain-aware blast zones using line-of-sight analysis
     *
     * @param {Object} blast - Standard circular blast zones (fireball, thermal, airblast, radiation)
     * @param {Object} impactLocation - { latitude, longitude, elevation }
     * @param {number} burstAltitude - Height above ground where energy is deposited (meters)
     * @param {Object} options - { radialSamples: 36, rangeSteps: 10 }
     * @returns {Promise<Object>} Terrain-aware blast zones as polygons
     */
    async calculateTerrainAwareBlastZones(blast, impactLocation, burstAltitude, options = {}) {
        const {
            radialSamples = 36, // Number of rays to cast (every 10 degrees)
            rangeSteps = 15      // Number of elevation checks per ray
        } = options;

        const { latitude, longitude, elevation: groundElevation } = impactLocation;

        // Burst point altitude above sea level
        const burstAltitudeASL = (groundElevation || 0) + burstAltitude;

        // Calculate terrain-aware zones for each blast type
        const zones = {};

        for (const [zoneName, radiusMeters] of Object.entries(blast)) {
            // Skip non-radius fields
            if (typeof radiusMeters !== 'number') continue;

            const radiusKm = radiusMeters / 1000;

            // Calculate polygon points for this zone
            const polygonPoints = await this.calculateZonePolygon(
                latitude,
                longitude,
                burstAltitudeASL,
                radiusKm,
                radialSamples,
                rangeSteps
            );

            zones[zoneName] = {
                originalRadius: radiusMeters,
                polygon: polygonPoints,
                terrainAdjusted: true
            };
        }

        return {
            zones,
            burstPoint: {
                latitude,
                longitude,
                altitudeASL: burstAltitudeASL,
                burstHeight: burstAltitude
            },
            metadata: {
                radialSamples,
                rangeSteps,
                method: 'line-of-sight'
            }
        };
    }

    /**
     * Calculate polygon for a single blast zone using line-of-sight
     *
     * @private
     * @param {number} lat - Impact latitude
     * @param {number} lon - Impact longitude
     * @param {number} burstAltitudeASL - Burst altitude above sea level (meters)
     * @param {number} maxRangeKm - Maximum blast range (km)
     * @param {number} radialSamples - Number of radial rays
     * @param {number} rangeSteps - Elevation samples per ray
     * @returns {Promise<Array>} Array of {lat, lon} polygon points
     */
    async calculateZonePolygon(lat, lon, burstAltitudeASL, maxRangeKm, radialSamples, rangeSteps) {
        const polygonPoints = [];

        // Cast rays in all directions
        for (let i = 0; i < radialSamples; i++) {
            const angle = (i / radialSamples) * 360; // Degrees

            // Find maximum unblocked distance along this ray
            const maxDistance = await this.findMaxUnblockedDistance(
                lat,
                lon,
                burstAltitudeASL,
                angle,
                maxRangeKm,
                rangeSteps
            );

            // Calculate point at max distance along this bearing
            const point = this.calculateDestinationPoint(lat, lon, maxDistance, angle);
            polygonPoints.push(point);
        }

        return polygonPoints;
    }

    /**
     * Find maximum distance along a ray before terrain blocks line-of-sight
     *
     * @private
     * @param {number} lat - Start latitude
     * @param {number} lon - Start longitude
     * @param {number} burstAltitudeASL - Burst point altitude (meters ASL)
     * @param {number} bearing - Direction in degrees (0 = north, 90 = east)
     * @param {number} maxRangeKm - Maximum range to check
     * @param {number} steps - Number of sample points
     * @returns {Promise<number>} Maximum unblocked distance (km)
     */
    async findMaxUnblockedDistance(lat, lon, burstAltitudeASL, bearing, maxRangeKm, steps) {
        const samplePoints = [];

        // Generate sample points along the ray
        for (let step = 1; step <= steps; step++) {
            const distance = (step / steps) * maxRangeKm;
            const point = this.calculateDestinationPoint(lat, lon, distance, bearing);
            samplePoints.push({ ...point, distance });
        }

        // Fetch elevations for all sample points (batch request)
        const elevationData = await this.usgsService.getElevationBatch(samplePoints);

        // Check line-of-sight from burst point to each sample point
        let maxUnblockedDistance = maxRangeKm; // Default: full range

        for (let i = 0; i < samplePoints.length; i++) {
            const point = samplePoints[i];
            const terrainElevation = elevationData[i].elevation || 0;

            // Calculate required altitude for line-of-sight at this distance
            const requiredAltitude = this.calculateRequiredLineOfSightAltitude(
                burstAltitudeASL,
                point.distance,
                lat,
                lon,
                point.lat,
                point.lon
            );

            // If terrain is higher than line-of-sight → blocked
            if (terrainElevation > requiredAltitude) {
                // Blast is blocked at this distance
                // Interpolate to find exact blocking distance
                if (i > 0) {
                    const prevPoint = samplePoints[i - 1];
                    const prevElevation = elevationData[i - 1].elevation || 0;
                    const prevRequired = this.calculateRequiredLineOfSightAltitude(
                        burstAltitudeASL,
                        prevPoint.distance,
                        lat,
                        lon,
                        prevPoint.lat,
                        prevPoint.lon
                    );

                    // Linear interpolation to find exact blocking point
                    if (prevElevation <= prevRequired) {
                        // Blocked between prevPoint and point
                        const fraction = (prevRequired - prevElevation) /
                                        ((requiredAltitude - terrainElevation) - (prevRequired - prevElevation));
                        maxUnblockedDistance = prevPoint.distance + fraction * (point.distance - prevPoint.distance);
                    } else {
                        maxUnblockedDistance = prevPoint.distance;
                    }
                } else {
                    // Blocked at first sample point
                    maxUnblockedDistance = point.distance * 0.5; // Estimate halfway
                }
                break;
            }
        }

        return maxUnblockedDistance;
    }

    /**
     * Calculate required altitude for line-of-sight from burst to target
     * Takes into account Earth's curvature
     *
     * @private
     * @param {number} burstAltitudeASL - Burst altitude (meters ASL)
     * @param {number} distanceKm - Horizontal distance from burst point
     * @param {number} startLat - Burst latitude
     * @param {number} startLon - Burst longitude
     * @param {number} targetLat - Target latitude
     * @param {number} targetLon - Target longitude
     * @returns {number} Required altitude at target point (meters ASL)
     */
    calculateRequiredLineOfSightAltitude(burstAltitudeASL, distanceKm, startLat, startLon, targetLat, targetLon) {
        // For short distances (< 100 km), Earth curvature is negligible
        // We use straight-line approximation for simplicity

        // For longer distances, we'd need to account for curvature:
        // h_required = h_burst - (distance^2 / (2 * R_earth))

        if (distanceKm < 100) {
            // Straight line from burst point → drops to ground level at max range
            // For intermediate points, linear interpolation
            // This is conservative (overestimates blocking)
            return burstAltitudeASL; // Horizontal line from burst point
        } else {
            // Account for Earth curvature (horizon effect)
            const horizonDrop = (distanceKm * distanceKm * 1000) / (2 * this.EARTH_RADIUS_KM * 1000);
            return burstAltitudeASL - horizonDrop;
        }
    }

    /**
     * Calculate destination point given start point, distance, and bearing
     * Uses Haversine formula
     *
     * @private
     * @param {number} lat - Start latitude (degrees)
     * @param {number} lon - Start longitude (degrees)
     * @param {number} distanceKm - Distance to travel
     * @param {number} bearing - Direction (degrees, 0 = north)
     * @returns {Object} {lat, lon} of destination point
     */
    calculateDestinationPoint(lat, lon, distanceKm, bearing) {
        const latRad = lat * Math.PI / 180;
        const lonRad = lon * Math.PI / 180;
        const bearingRad = bearing * Math.PI / 180;
        const angularDistance = distanceKm / this.EARTH_RADIUS_KM;

        const newLatRad = Math.asin(
            Math.sin(latRad) * Math.cos(angularDistance) +
            Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
        );

        const newLonRad = lonRad + Math.atan2(
            Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
            Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
        );

        return {
            lat: newLatRad * 180 / Math.PI,
            lon: newLonRad * 180 / Math.PI
        };
    }

    /**
     * Calculate area reduction due to terrain shadowing
     * Compares terrain-aware polygon area to circular area
     *
     * @param {Array} polygonPoints - Array of {lat, lon} points
     * @param {number} circularRadiusKm - Original circular radius
     * @returns {Object} { polygonArea, circularArea, reductionPercent }
     */
    calculateAreaReduction(polygonPoints, circularRadiusKm) {
        // Approximate polygon area using shoelace formula
        // Note: This is approximate for lat/lon coordinates
        let area = 0;
        const n = polygonPoints.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += polygonPoints[i].lat * polygonPoints[j].lon;
            area -= polygonPoints[j].lat * polygonPoints[i].lon;
        }

        area = Math.abs(area / 2);

        // Convert to km² (rough approximation)
        const latToKm = 111; // 1 degree latitude ≈ 111 km
        const polygonAreaKm2 = area * latToKm * latToKm;

        const circularArea = Math.PI * circularRadiusKm * circularRadiusKm;
        const reductionPercent = ((circularArea - polygonAreaKm2) / circularArea) * 100;

        return {
            polygonAreaKm2,
            circularAreaKm2: circularArea,
            reductionPercent: Math.max(0, reductionPercent)
        };
    }
}

module.exports = TerrainAwareBlastService;
