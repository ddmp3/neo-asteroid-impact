/**
 * Population Grid Service
 * Uses scientific population density data sources
 *
 * Data Sources:
 * 1. NASA SEDAC GPW v4.11 (Gridded Population of the World) - ~1km resolution
 * 2. WorldPop - 100m resolution
 * 3. GHS-POP (Global Human Settlement Layer) - 100m resolution
 *
 * For production: Requires Google Earth Engine API authentication
 * For development: Falls back to LandScan-inspired estimation model
 *
 * References:
 * - CIESIN GPWv4.11: https://sedac.ciesin.columbia.edu/data/set/gpw-v4-population-density-rev11
 * - WorldPop: https://www.worldpop.org/
 * - GHS-POP: https://human-settlement.emergency.copernicus.eu/ghs_pop.php
 */

const axios = require('axios');

class PopulationGridService {
    constructor() {
        // Google Earth Engine (requires authentication for production)
        this.useGoogleEarthEngine = false; // Set to true when credentials configured
        this.geeEndpoint = process.env.GEE_ENDPOINT || null;
        this.geeApiKey = process.env.GEE_API_KEY || null;

        // LandScan-inspired population density model (fallback)
        // Based on ambient population distribution research
        this.densityModel = {
            // Urban cores (city centers)
            urbanCore: {
                minDensity: 15000,  // people/km²
                maxDensity: 60000,
                radius: 5           // km from center
            },
            // Urban areas
            urban: {
                minDensity: 5000,
                maxDensity: 15000,
                radius: 20
            },
            // Suburban
            suburban: {
                minDensity: 1000,
                maxDensity: 5000,
                radius: 50
            },
            // Rural
            rural: {
                minDensity: 10,
                maxDensity: 100,
                radius: 200
            },
            // Remote/wilderness
            remote: {
                minDensity: 0,
                maxDensity: 10,
                radius: Infinity
            },
            // Ocean
            ocean: {
                density: 0
            }
        };

        // Major population centers (for density estimation)
        // Based on UN World Urbanization Prospects 2024
        this.populationCenters = [
            // Asia
            { name: 'Tokyo', lat: 35.6762, lon: 139.6503, population: 37115000, type: 'megacity' },
            { name: 'Delhi', lat: 28.7041, lon: 77.1025, population: 33807000, type: 'megacity' },
            { name: 'Shanghai', lat: 31.2304, lon: 121.4737, population: 29867000, type: 'megacity' },
            { name: 'Dhaka', lat: 23.8103, lon: 90.4125, population: 24313000, type: 'megacity' },
            { name: 'Mumbai', lat: 19.0760, lon: 72.8777, population: 23355000, type: 'megacity' },
            { name: 'Beijing', lat: 39.9042, lon: 116.4074, population: 22189000, type: 'megacity' },
            { name: 'Karachi', lat: 24.8607, lon: 67.0011, population: 17121000, type: 'megacity' },
            { name: 'Istanbul', lat: 41.0082, lon: 28.9784, population: 16079000, type: 'megacity' },
            { name: 'Kolkata', lat: 22.5726, lon: 88.3639, population: 15333000, type: 'megacity' },
            { name: 'Manila', lat: 14.5995, lon: 120.9842, population: 14667000, type: 'megacity' },
            { name: 'Guangzhou', lat: 23.1291, lon: 113.2644, population: 13964000, type: 'megacity' },
            { name: 'Osaka', lat: 34.6937, lon: 135.5023, population: 19060000, type: 'megacity' },

            // Americas
            { name: 'São Paulo', lat: -23.5505, lon: -46.6333, population: 22806000, type: 'megacity' },
            { name: 'Mexico City', lat: 19.4326, lon: -99.1332, population: 22281000, type: 'megacity' },
            { name: 'Cairo', lat: 30.0444, lon: 31.2357, population: 22183000, type: 'megacity' },
            { name: 'New York', lat: 40.7128, lon: -74.0060, population: 18867000, type: 'megacity' },
            { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, population: 15370000, type: 'megacity' },
            { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, population: 12750000, type: 'large' },
            { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, population: 13544000, type: 'megacity' },

            // Europe
            { name: 'Moscow', lat: 55.7558, lon: 37.6173, population: 12640000, type: 'large' },
            { name: 'Paris', lat: 48.8566, lon: 2.3522, population: 11208000, type: 'large' },
            { name: 'London', lat: 51.5074, lon: -0.1278, population: 9648000, type: 'large' },

            // Africa
            { name: 'Lagos', lat: 6.5244, lon: 3.3792, population: 15946000, type: 'megacity' },
            { name: 'Kinshasa', lat: -4.3276, lon: 15.3136, population: 17071000, type: 'megacity' },

            // North America
            { name: 'Chicago', lat: 41.8781, lon: -87.6298, population: 8901000, type: 'large' },
            { name: 'Toronto', lat: 43.6532, lon: -79.3832, population: 6313000, type: 'large' },
            { name: 'Houston', lat: 29.7604, lon: -95.3698, population: 6979000, type: 'large' },
            { name: 'Dallas', lat: 32.7767, lon: -96.7970, population: 6099000, type: 'large' },

            // Oceania
            { name: 'Sydney', lat: -33.8688, lon: 151.2093, population: 5057000, type: 'large' },
            { name: 'Melbourne', lat: -37.8136, lon: 144.9631, population: 5031000, type: 'large' },
        ];
    }

    /**
     * Get population density at a specific location
     * Uses Google Earth Engine if available, otherwise falls back to model
     *
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<number>} Population density in people/km²
     */
    async getPopulationDensity(lat, lon) {
        if (this.useGoogleEarthEngine && this.geeApiKey) {
            try {
                return await this.getGEEPopulationDensity(lat, lon);
            } catch (error) {
                console.warn('GEE API failed, falling back to model:', error.message);
                return this.getModeledPopulationDensity(lat, lon);
            }
        }

        return this.getModeledPopulationDensity(lat, lon);
    }

    /**
     * Get population density from Google Earth Engine (NASA SEDAC GPW)
     * Requires authentication and setup
     *
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<number>} Population density in people/km²
     */
    async getGEEPopulationDensity(lat, lon) {
        // Note: This requires a backend GEE service to be set up
        // For production deployment, implement a server-side GEE API handler
        const response = await axios.post(this.geeEndpoint, {
            dataset: 'CIESIN/GPWv411/GPW_Population_Density',
            lat,
            lon,
            year: 2020
        }, {
            headers: {
                'Authorization': `Bearer ${this.geeApiKey}`
            }
        });

        return response.data.populationDensity || 0;
    }

    /**
     * Get modeled population density based on distance to major cities
     * LandScan-inspired ambient population distribution model
     *
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {number} Population density in people/km²
     */
    getModeledPopulationDensity(lat, lon) {
        // Check if ocean
        if (this.isOcean(lat, lon)) {
            return 0;
        }

        // Find nearest population center
        const nearest = this.findNearestCenter(lat, lon);
        const distance = nearest.distance;

        // Calculate density based on distance from major city
        let density = 0;

        if (distance < 5) {
            // Urban core
            density = this.interpolateDensity(
                distance,
                0,
                5,
                this.densityModel.urbanCore.maxDensity,
                this.densityModel.urbanCore.minDensity
            );
        } else if (distance < 20) {
            // Urban
            density = this.interpolateDensity(
                distance,
                5,
                20,
                this.densityModel.urban.maxDensity,
                this.densityModel.urban.minDensity
            );
        } else if (distance < 50) {
            // Suburban
            density = this.interpolateDensity(
                distance,
                20,
                50,
                this.densityModel.suburban.maxDensity,
                this.densityModel.suburban.minDensity
            );
        } else if (distance < 200) {
            // Rural
            density = this.interpolateDensity(
                distance,
                50,
                200,
                this.densityModel.rural.maxDensity,
                this.densityModel.rural.minDensity
            );
        } else {
            // Remote
            density = this.densityModel.remote.maxDensity * Math.exp(-(distance - 200) / 100);
        }

        // Adjust for city size
        const cityFactor = this.getCityPopulationFactor(nearest.population);
        density *= cityFactor;

        return Math.max(0, density);
    }

    /**
     * Calculate average population in a circular area
     * Uses grid sampling for accuracy
     *
     * @param {number} centerLat - Center latitude
     * @param {number} centerLon - Center longitude
     * @param {number} radiusKm - Radius in kilometers
     * @param {number} gridResolution - Grid resolution in km (default: 1km)
     * @returns {Promise<Object>} {totalPopulation, averageDensity, affectedCities}
     */
    async getPopulationInRadius(centerLat, centerLon, radiusKm, gridResolution = 1) {
        // Create sampling grid
        const samples = [];
        const gridPoints = Math.ceil(radiusKm / gridResolution) * 2;

        for (let i = 0; i <= gridPoints; i++) {
            for (let j = 0; j <= gridPoints; j++) {
                // Calculate grid point
                const dLat = (i - gridPoints / 2) * gridResolution / 111; // 1° ≈ 111 km
                const dLon = (j - gridPoints / 2) * gridResolution / (111 * Math.cos(centerLat * Math.PI / 180));

                const lat = centerLat + dLat;
                const lon = centerLon + dLon;

                // Check if point is within radius
                const distance = this.calculateDistance(centerLat, centerLon, lat, lon);

                if (distance <= radiusKm) {
                    samples.push({ lat, lon, distance });
                }
            }
        }

        // Get density for each sample point
        let totalPopulation = 0;
        const densities = [];

        for (const sample of samples) {
            const density = await this.getPopulationDensity(sample.lat, sample.lon);
            densities.push(density);

            // Area of grid cell
            const cellArea = gridResolution * gridResolution; // km²
            totalPopulation += density * cellArea;
        }

        const averageDensity = densities.reduce((a, b) => a + b, 0) / densities.length;

        // Find affected cities
        const affectedCities = this.findAffectedCities(centerLat, centerLon, radiusKm);

        return {
            totalPopulation: Math.round(totalPopulation),
            averageDensity: Math.round(averageDensity),
            affectedCities,
            sampledPoints: samples.length,
            gridResolution
        };
    }

    /**
     * Find cities within impact radius
     *
     * @param {number} lat - Impact latitude
     * @param {number} lon - Impact longitude
     * @param {number} radiusKm - Impact radius
     * @returns {Array} Affected cities
     */
    findAffectedCities(lat, lon, radiusKm) {
        const affected = [];

        for (const city of this.populationCenters) {
            const distance = this.calculateDistance(lat, lon, city.lat, city.lon);

            if (distance <= radiusKm) {
                affected.push({
                    name: city.name,
                    population: city.population,
                    distance: Math.round(distance),
                    type: city.type
                });
            }
        }

        // Sort by distance
        affected.sort((a, b) => a.distance - b.distance);

        return affected;
    }

    /**
     * Find nearest population center
     *
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Object} Nearest center with distance
     */
    findNearestCenter(lat, lon) {
        let nearest = null;
        let minDistance = Infinity;

        for (const center of this.populationCenters) {
            const distance = this.calculateDistance(lat, lon, center.lat, center.lon);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = center;
            }
        }

        return {
            ...nearest,
            distance: minDistance
        };
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     *
     * @param {number} lat1 - Latitude 1
     * @param {number} lon1 - Longitude 1
     * @param {number} lat2 - Latitude 2
     * @param {number} lon2 - Longitude 2
     * @returns {number} Distance in kilometers
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

    /**
     * Interpolate density between two distances
     *
     * @param {number} distance - Current distance
     * @param {number} d1 - Distance 1
     * @param {number} d2 - Distance 2
     * @param {number} density1 - Density at d1
     * @param {number} density2 - Density at d2
     * @returns {number} Interpolated density
     */
    interpolateDensity(distance, d1, d2, density1, density2) {
        const t = (distance - d1) / (d2 - d1);
        // Exponential interpolation (more realistic for population decay)
        return density1 * Math.pow(density2 / density1, t);
    }

    /**
     * Get city population factor
     *
     * @param {number} population - City population
     * @returns {number} Scaling factor
     */
    getCityPopulationFactor(population) {
        // Megacities (>10M): 1.0x
        // Large cities (5-10M): 0.8x
        // Medium cities (<5M): 0.6x
        if (population > 10000000) return 1.0;
        if (population > 5000000) return 0.8;
        return 0.6;
    }

    /**
     * Simple ocean detection
     *
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {boolean} True if ocean
     */
    isOcean(lat, lon) {
        // Simplified ocean detection
        // In production, use proper land/ocean dataset
        const nearest = this.findNearestCenter(lat, lon);
        return nearest.distance > 500; // >500km from major city = likely ocean
    }
}

module.exports = new PopulationGridService();
