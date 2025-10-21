const axios = require('axios');
const NodeCache = require('node-cache');

/**
 * USGS Data Integration Service
 * Elevation data and earthquake information
 */
class USGSService {
    constructor() {
        this.elevationAPI = process.env.USGS_ELEVATION_API || 'https://epqs.nationalmap.gov/v1';
        this.earthquakeAPI = process.env.USGS_EARTHQUAKE_API || 'https://earthquake.usgs.gov/fdsnws/event/1';
        this.geonamesAPI = 'http://api.geonames.org';
        this.geonamesUsername = process.env.GEONAMES_USERNAME || 'demo'; // Free account: register at geonames.org
        this.cache = new NodeCache({ stdTTL: 7200 }); // 2 hour cache
        this.oceanCache = new NodeCache({ stdTTL: 86400 }); // 24 hour cache for ocean detection (more stable)
    }

    /**
     * Get elevation at specific coordinates
     * @param {number} latitude
     * @param {number} longitude
     * @returns {Promise<Object>} Elevation data
     */
    async getElevation(latitude, longitude) {
        const cacheKey = `elevation_${latitude}_${longitude}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        // Strategy: Try GeoNames FIRST (most reliable), then USGS for elevation details
        let elevation = null;
        let usgsAvailable = false;

        try {
            // Increase timeout to 3000ms to reduce fallbacks
            const response = await axios.get(`${this.elevationAPI}/json`, {
                params: {
                    x: longitude,
                    y: latitude,
                    units: 'Meters',
                    output: 'json'
                },
                timeout: 3000 // 3 second timeout (was 800ms - too aggressive)
            });

            elevation = response.data.value;
            usgsAvailable = true;
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                console.warn(`USGS API timeout for ${latitude}, ${longitude} - using GeoNames only`);
            } else {
                console.warn(`USGS API error for ${latitude}, ${longitude}: ${error.message}`);
            }
            // elevation stays null - will be handled by detectOceanGeoNames
        }

        // Use GeoNames for accurate ocean detection (ALWAYS, even if USGS failed)
        const oceanDetection = await this.detectOceanGeoNames(latitude, longitude, elevation);

        // If USGS failed but we have ocean detection, estimate elevation
        if (elevation === null || elevation === undefined) {
            elevation = oceanDetection.isOcean ? -1000 : 100;
        }

        const result = {
            latitude,
            longitude,
            elevation,
            isOcean: oceanDetection.isOcean,
            waterDepth: oceanDetection.waterDepth,
            oceanName: oceanDetection.oceanName,
            detectionSource: oceanDetection.source,
            terrainType: this.classifyTerrain(elevation, oceanDetection.isOcean),
            usgsAvailable // Flag to indicate if USGS provided real elevation
        };

        // Cache with appropriate TTL based on data quality
        const cacheTTL = usgsAvailable ? 7200 : 600; // 2h if full data, 10min if estimated
        this.cache.set(cacheKey, result, cacheTTL);

        return result;
    }

    /**
     * Detect ocean using GeoNames Ocean API (accurate land/ocean detection)
     * Fixes false positives like: Ganges Delta (India), Dead Sea, Caspian Sea
     * @param {number} latitude
     * @param {number} longitude
     * @param {number} elevation - USGS elevation (for hybrid approach)
     * @returns {Promise<Object>} {isOcean, oceanName, waterDepth, source}
     */
    async detectOceanGeoNames(latitude, longitude, elevation) {
        // Round coordinates to 0.01° (~1.1km) for better cache hit rate
        const lat = Math.round(latitude * 100) / 100;
        const lon = Math.round(longitude * 100) / 100;
        const cacheKey = `ocean_${lat}_${lon}`;

        // 1. Check cache first
        const cached = this.oceanCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // 2. If elevation is very negative (and available), it's definitely ocean (optimization)
        if (elevation !== null && elevation !== undefined && elevation < -10) {
            const result = {
                isOcean: true,
                oceanName: 'Unknown Ocean',
                waterDepth: Math.abs(elevation),
                source: 'USGS elevation (confirmed < -10m)'
            };
            this.oceanCache.set(cacheKey, result);
            return result;
        }

        // 3. Call GeoNames Ocean API (PRIMARY SOURCE - most reliable)
        try {
            const response = await axios.get(`${this.geonamesAPI}/oceanJSON`, {
                params: {
                    lat: latitude,
                    lng: longitude,
                    username: this.geonamesUsername
                },
                timeout: 3000 // 3 second timeout
            });

            // GeoNames returns:
            // - Ocean: {"ocean": {"name": "...", ...}}
            // - Land: {"status": {"message": "we are afraid...", "value": 15}}
            const isOcean = !!response.data.ocean;

            // Calculate water depth intelligently
            let waterDepth = 0;
            if (isOcean) {
                if (elevation !== null && elevation !== undefined && elevation < 0) {
                    waterDepth = Math.abs(elevation);
                } else {
                    // Ocean confirmed but no elevation data - use default
                    waterDepth = 1000; // Default ocean depth
                }
            }

            const result = {
                isOcean,
                oceanName: isOcean ? response.data.ocean.name : null,
                waterDepth,
                source: 'GeoNames Ocean API'
            };

            // Cache result for 24 hours
            this.oceanCache.set(cacheKey, result);
            return result;

        } catch (error) {
            // 4. Fallback: Use ONLY elevation if available (no geographic estimation)
            console.warn(`GeoNames API error for ${latitude}, ${longitude}:`, error.message);

            let isOcean;
            let fallbackSource;

            if (elevation !== null && elevation !== undefined) {
                // Use CONSERVATIVE elevation-based detection
                if (elevation < -50) {
                    // Very likely ocean (deeper than -50m)
                    isOcean = true;
                    fallbackSource = 'USGS elevation (< -50m, likely ocean)';
                } else if (elevation > 0) {
                    // Definitely land (above sea level)
                    isOcean = false;
                    fallbackSource = 'USGS elevation (> 0m, confirmed land)';
                } else {
                    // Edge case: -50m to 0m (coastal, below sea level land, or shallow ocean)
                    // Be conservative: assume LAND unless very negative
                    isOcean = false;
                    fallbackSource = 'USGS elevation (0 to -50m, assumed land - coastal/below sea level)';
                }
            } else {
                // No elevation data AND GeoNames failed - last resort
                // Default to LAND to avoid false ocean positives
                isOcean = false;
                fallbackSource = 'Conservative fallback (no data, assumed land)';
                console.error(`No elevation data AND GeoNames failed for ${latitude}, ${longitude} - defaulting to LAND`);
            }

            const result = {
                isOcean,
                oceanName: isOcean ? 'Unknown Ocean' : null,
                waterDepth: isOcean ? (elevation ? Math.abs(elevation) : 1000) : 0,
                source: fallbackSource,
                estimated: true
            };

            // Cache fallback result but with shorter TTL (10 minutes)
            this.oceanCache.set(cacheKey, result, 600);
            return result;
        }
    }

    /**
     * Get elevations for multiple points (impact zone analysis)
     * @param {Array} coordinates - Array of {lat, lon} objects
     * @returns {Promise<Array>} Elevation data for all points
     */
    async getElevationBatch(coordinates) {
        const promises = coordinates.map(coord =>
            this.getElevation(coord.lat, coord.lon)
        );

        return Promise.all(promises);
    }

    /**
     * Classify terrain based on elevation
     * @private
     */
    classifyTerrain(elevation, isOcean) {
        if (isOcean) {
            const depth = Math.abs(elevation);
            if (depth < 200) return 'Shallow Ocean/Continental Shelf';
            if (depth < 1000) return 'Ocean';
            if (depth < 4000) return 'Deep Ocean';
            return 'Abyssal Ocean';
        } else {
            if (elevation < 100) return 'Lowland/Plains';
            if (elevation < 500) return 'Hills';
            if (elevation < 1500) return 'Mountains';
            if (elevation < 3000) return 'High Mountains';
            return 'Extreme Altitude';
        }
    }

    /**
     * Get historical earthquake data for a region
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Earthquake catalog data
     */
    async getEarthquakes(params = {}) {
        const {
            minMagnitude = 5.0,
            maxMagnitude = 10.0,
            latitude = null,
            longitude = null,
            maxRadiusKm = 500,
            startTime = null,
            endTime = null,
            limit = 100
        } = params;

        const cacheKey = `earthquakes_${latitude}_${longitude}_${minMagnitude}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        try {
            const queryParams = {
                format: 'geojson',
                minmagnitude: minMagnitude,
                maxmagnitude: maxMagnitude,
                limit: limit
            };

            if (latitude && longitude) {
                queryParams.latitude = latitude;
                queryParams.longitude = longitude;
                queryParams.maxradiuskm = maxRadiusKm;
            }

            if (startTime) queryParams.starttime = startTime;
            if (endTime) queryParams.endtime = endTime;

            const response = await axios.get(`${this.earthquakeAPI}/query`, {
                params: queryParams
            });

            const formatted = this.formatEarthquakeData(response.data);
            this.cache.set(cacheKey, formatted);
            return formatted;
        } catch (error) {
            console.error('Error fetching earthquake data:', error.message);
            return {
                count: 0,
                events: [],
                error: 'API unavailable'
            };
        }
    }

    /**
     * Format earthquake data from USGS API
     * @private
     */
    formatEarthquakeData(data) {
        if (!data.features) return { count: 0, events: [] };

        const events = data.features.map(feature => ({
            id: feature.id,
            magnitude: feature.properties.mag,
            place: feature.properties.place,
            time: new Date(feature.properties.time),
            coordinates: {
                longitude: feature.geometry.coordinates[0],
                latitude: feature.geometry.coordinates[1],
                depth: feature.geometry.coordinates[2]
            },
            type: feature.properties.type,
            tsunami: feature.properties.tsunami === 1
        }));

        return {
            count: events.length,
            events: events
        };
    }

    /**
     * Analyze impact zone characteristics
     * @param {number} latitude - Impact latitude
     * @param {number} longitude - Impact longitude
     * @param {number} radiusKm - Analysis radius
     * @returns {Promise<Object>} Zone analysis
     */
    async analyzeImpactZone(latitude, longitude, radiusKm = 100) {
        const cacheKey = `zone_${latitude}_${longitude}_${radiusKm}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        // Get elevation at impact point
        const centerElevation = await this.getElevation(latitude, longitude);

        // Sample points around the impact zone (8 directions)
        const samplePoints = this.generateSamplePoints(latitude, longitude, radiusKm);
        const elevations = await this.getElevationBatch(samplePoints);

        // Analyze terrain
        const terrainAnalysis = this.analyzeTerrain(centerElevation, elevations);

        // Get historical seismic activity
        const earthquakes = await this.getEarthquakes({
            latitude,
            longitude,
            maxRadiusKm: radiusKm * 2,
            minMagnitude: 4.0
        });

        const result = {
            impactPoint: centerElevation,
            terrainAnalysis,
            historicalSeismicity: {
                eventCount: earthquakes.count,
                maxMagnitude: earthquakes.events.length > 0 ?
                    Math.max(...earthquakes.events.map(e => e.magnitude)) : 0,
                tsunamiHistory: earthquakes.events.filter(e => e.tsunami).length
            },
            populationRisk: this.estimatePopulationRisk(latitude, longitude, centerElevation.isOcean),
            tsunamiRisk: this.assessTsunamiRisk(centerElevation, elevations)
        };

        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * Generate sample points in a circle around center
     * @private
     */
    generateSamplePoints(lat, lon, radiusKm) {
        const points = [];
        const earthRadiusKm = 6371;

        // 8 cardinal and intercardinal directions
        for (let angle = 0; angle < 360; angle += 45) {
            const angleRad = angle * Math.PI / 180;

            // Calculate new position
            const latRad = lat * Math.PI / 180;
            const lonRad = lon * Math.PI / 180;
            const angularDistance = radiusKm / earthRadiusKm;

            const newLat = Math.asin(
                Math.sin(latRad) * Math.cos(angularDistance) +
                Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(angleRad)
            );

            const newLon = lonRad + Math.atan2(
                Math.sin(angleRad) * Math.sin(angularDistance) * Math.cos(latRad),
                Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLat)
            );

            points.push({
                lat: newLat * 180 / Math.PI,
                lon: newLon * 180 / Math.PI
            });
        }

        return points;
    }

    /**
     * Analyze terrain characteristics
     * @private
     */
    analyzeTerrain(center, surroundingPoints) {
        const elevations = surroundingPoints.map(p => p.elevation);
        const avgElevation = elevations.reduce((a, b) => a + b, 0) / elevations.length;
        const elevationRange = Math.max(...elevations) - Math.min(...elevations);

        const oceanPoints = surroundingPoints.filter(p => p.isOcean).length;
        const landPoints = surroundingPoints.length - oceanPoints;

        return {
            averageElevation: avgElevation,
            elevationRange: elevationRange,
            terrainRoughness: elevationRange > 500 ? 'Rough' : elevationRange > 100 ? 'Moderate' : 'Flat',
            coastalProximity: (oceanPoints > 0 && landPoints > 0) ? 'Coastal' : center.isOcean ? 'Ocean' : 'Inland',
            oceanPercentage: (oceanPoints / surroundingPoints.length) * 100
        };
    }

    /**
     * Estimate population risk category
     * @private
     */
    estimatePopulationRisk(lat, lon, isOcean) {
        // Simplified population density estimation based on coordinates
        // In a real implementation, this would use actual population data

        if (isOcean) return 'Low (Ocean impact)';

        // Major population centers (very simplified)
        const majorCities = [
            { lat: 40.7, lon: -74.0, name: 'New York' },
            { lat: 34.0, lon: -118.2, name: 'Los Angeles' },
            { lat: 51.5, lon: -0.1, name: 'London' },
            { lat: 35.7, lon: 139.7, name: 'Tokyo' },
            { lat: -33.9, lon: 151.2, name: 'Sydney' }
        ];

        for (const city of majorCities) {
            const distance = this.calculateDistance(lat, lon, city.lat, city.lon);
            if (distance < 100) return `Extreme (Near ${city.name})`;
            if (distance < 500) return `Very High (${city.name} region)`;
        }

        // General latitude-based estimation
        if (Math.abs(lat) < 60) return 'Moderate to High';
        return 'Low (Remote area)';
    }

    /**
     * Assess tsunami risk
     * @private
     */
    assessTsunamiRisk(center, surroundingPoints) {
        if (!center.isOcean) {
            return {
                risk: 'None',
                reason: 'Land impact'
            };
        }

        const coastalPoints = surroundingPoints.filter(p => !p.isOcean).length;

        if (coastalPoints === 0) {
            return {
                risk: 'Low',
                reason: 'Open ocean, distant from coastlines'
            };
        }

        if (center.waterDepth < 200) {
            return {
                risk: 'Moderate',
                reason: 'Shallow water near coast'
            };
        }

        return {
            risk: 'High',
            reason: 'Deep water impact near populated coastlines'
        };
    }

    /**
     * Calculate great circle distance between two points
     * @private
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

module.exports = USGSService;
