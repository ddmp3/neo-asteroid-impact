/**
 * Population City Service
 *
 * Optimized service for fast casualty calculations using GeoNames cities database
 * - 32,686 cities worldwide with population >15,000
 * - Fast radius-based queries with distance calculations
 * - No grid sampling, direct city-based calculations
 * - Target: <5 seconds for any impact scenario
 *
 * Data source: GeoNames cities15000.txt (updated 2025-10-08)
 * License: Creative Commons Attribution 4.0
 */

const fs = require('fs');
const path = require('path');

class PopulationCityService {
    constructor() {
        this.cities = [];
        this.loaded = false;
        this.loadCities();
    }

    /**
     * Load cities database from JSON
     */
    loadCities() {
        try {
            const dataPath = path.join(__dirname, '../data/cities.json');
            const rawData = fs.readFileSync(dataPath, 'utf-8');
            this.cities = JSON.parse(rawData);
            this.loaded = true;
            console.log(`✓ Loaded ${this.cities.length} cities from GeoNames database`);
        } catch (error) {
            console.error('Failed to load cities database:', error.message);
            this.cities = [];
            this.loaded = false;
        }
    }

    /**
     * Calculate distance between two points using Haversine formula
     * @param {number} lat1 - Latitude of first point
     * @param {number} lon1 - Longitude of first point
     * @param {number} lat2 - Latitude of second point
     * @param {number} lon2 - Longitude of second point
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Get population and affected cities within a radius
     * Uses optimized algorithm:
     * 1. Quick bounding box filter to eliminate distant cities
     * 2. Precise distance calculation only for candidates
     * 3. Exponential decay for casualties based on distance from center
     *
     * @param {number} centerLat - Impact latitude
     * @param {number} centerLon - Impact longitude
     * @param {number} radiusKm - Impact radius in kilometers
     * @returns {Promise<Object>} Population statistics and affected cities
     */
    async getPopulationInRadius(centerLat, centerLon, radiusKm) {
        if (!this.loaded) {
            throw new Error('Cities database not loaded');
        }

        const startTime = Date.now();

        // Quick bounding box filter (approximate degrees per km: 1° ≈ 111km at equator)
        const latDelta = (radiusKm / 111.32) * 1.5; // 1.5x margin for safety
        const lonDelta = (radiusKm / (111.32 * Math.cos(this.toRadians(centerLat)))) * 1.5;

        const minLat = centerLat - latDelta;
        const maxLat = centerLat + latDelta;
        const minLon = centerLon - lonDelta;
        const maxLon = centerLon + lonDelta;

        // Filter cities within bounding box (very fast)
        const candidateCities = this.cities.filter(city =>
            city.lat >= minLat && city.lat <= maxLat &&
            city.lon >= minLon && city.lon <= maxLon
        );

        console.log(`  Bounding box filter: ${this.cities.length} → ${candidateCities.length} candidates`);

        // Calculate precise distances and casualties
        const affectedCities = [];
        let totalCasualties = 0;
        let totalPopulation = 0;

        for (const city of candidateCities) {
            const distance = this.calculateDistance(centerLat, centerLon, city.lat, city.lon);

            if (distance <= radiusKm) {
                // Calculate casualties with exponential decay based on distance
                // - Center (0-10% radius): 95% casualties
                // - Inner zone (10-40% radius): 70% casualties
                // - Mid zone (40-70% radius): 40% casualties
                // - Outer zone (70-100% radius): 10% casualties

                const distanceRatio = distance / radiusKm;
                let casualtyRate;

                if (distanceRatio < 0.1) {
                    casualtyRate = 0.95; // 95% in center
                } else if (distanceRatio < 0.4) {
                    casualtyRate = 0.95 - (distanceRatio - 0.1) * 0.833; // 95% → 70%
                } else if (distanceRatio < 0.7) {
                    casualtyRate = 0.70 - (distanceRatio - 0.4) * 1.0;   // 70% → 40%
                } else {
                    casualtyRate = 0.40 - (distanceRatio - 0.7) * 1.0;   // 40% → 10%
                }

                casualtyRate = Math.max(0.05, Math.min(0.95, casualtyRate)); // Clamp between 5-95%

                const casualties = Math.round(city.pop * casualtyRate);

                affectedCities.push({
                    name: city.name,
                    country: city.country,
                    lat: city.lat,
                    lon: city.lon,
                    population: city.pop,
                    distance: Math.round(distance * 10) / 10, // 1 decimal
                    casualties: casualties,
                    casualtyRate: Math.round(casualtyRate * 100) // percentage
                });

                totalCasualties += casualties;
                totalPopulation += city.pop;
            }
        }

        // Sort by casualties (highest first)
        affectedCities.sort((a, b) => b.casualties - a.casualties);

        const elapsedMs = Date.now() - startTime;
        console.log(`  Population calculation: ${elapsedMs}ms for ${affectedCities.length} affected cities`);

        return {
            totalPopulation,
            estimatedCasualties: totalCasualties,
            affectedCities: affectedCities.slice(0, 50), // Top 50 most affected
            totalAffectedCities: affectedCities.length,
            calculationTimeMs: elapsedMs,
            dataSource: 'GeoNames cities15000 (32,686 cities >15k pop)'
        };
    }

    /**
     * Get cities by minimum population threshold
     * @param {number} minPopulation - Minimum population
     * @returns {Array} Filtered cities
     */
    getCitiesByPopulation(minPopulation) {
        return this.cities.filter(city => city.pop >= minPopulation);
    }

    /**
     * Find nearest city to coordinates
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Object} Nearest city with distance
     */
    findNearestCity(lat, lon) {
        if (!this.loaded || this.cities.length === 0) {
            return null;
        }

        let nearest = null;
        let minDistance = Infinity;

        for (const city of this.cities) {
            const distance = this.calculateDistance(lat, lon, city.lat, city.lon);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = city;
            }
        }

        return {
            ...nearest,
            distance: Math.round(minDistance * 10) / 10
        };
    }

    /**
     * Get statistics about loaded database
     */
    getStats() {
        if (!this.loaded) {
            return { loaded: false };
        }

        const populations = this.cities.map(c => c.pop);

        return {
            loaded: true,
            totalCities: this.cities.length,
            totalPopulation: populations.reduce((sum, pop) => sum + pop, 0),
            minPopulation: Math.min(...populations),
            maxPopulation: Math.max(...populations),
            largestCities: this.cities.slice(0, 10).map(c => ({
                name: c.name,
                country: c.country,
                population: c.pop
            }))
        };
    }
}

// Singleton instance
const populationCityService = new PopulationCityService();

module.exports = populationCityService;
