/**
 * Real-Time NEO Service (Phase 1 Part 2)
 * Integrates with JPL SBDB for up-to-date asteroid data
 *
 * APIs Used:
 * - JPL SBDB Close Approach Data (CAD): https://ssd-api.jpl.nasa.gov/cad.api
 * - JPL SBDB: https://ssd-api.jpl.nasa.gov/sbdb.api
 *
 * Replaces static asteroid data with real-time NASA data
 *
 * @version 1.0.0
 * @date 2025-10-11
 */

const axios = require('axios');
const NodeCache = require('node-cache');

class RealTimeNeoService {
    constructor() {
        // JPL Solar System Dynamics APIs (No authentication required!)
        this.cadAPI = 'https://ssd-api.jpl.nasa.gov/cad.api'; // Close Approach Data
        this.sbdbAPI = 'https://ssd-api.jpl.nasa.gov/sbdb.api'; // Small-Body Database

        // Cache configuration
        // Real-time data cached for 6 hours (NEO data updates daily)
        this.cache = new NodeCache({
            stdTTL: 21600, // 6 hours in seconds
            checkperiod: 600 // Check for expired keys every 10 minutes
        });

        // Default query parameters
        this.DEFAULT_DIST_MAX = '0.05'; // 0.05 AU (~19.5 lunar distances)
        this.DEFAULT_H_MAX = 25; // Absolute magnitude (smaller = bigger asteroid)

        console.log('✅ Real-Time NEO Service initialized (JPL SBDB API)');
    }

    /**
     * Get upcoming close approaches to Earth
     * @param {Object} options - Query options
     * @returns {Promise<Array>} List of NEOs with close approaches
     */
    async getUpcomingCloseApproaches(options = {}) {
        const {
            dateMin = new Date().toISOString().split('T')[0], // Today
            dateMax = null, // No limit (use null for all future)
            distMax = this.DEFAULT_DIST_MAX, // AU
            hMax = this.DEFAULT_H_MAX, // Magnitude filter (size)
            limit = 200, // Max results to return
            sort = 'date' // Sort by approach date
        } = options;

        const cacheKey = `close_approaches_${dateMin}_${dateMax}_${distMax}_${hMax}_${limit}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            console.log(`📦 Cache HIT: ${cached.length} NEOs (key: ${cacheKey})`);
            return cached;
        }

        try {
            console.log(`🌍 Fetching close approaches from JPL SBDB CAD API...`);
            console.log(`   Date range: ${dateMin} to ${dateMax || 'future'}`);
            console.log(`   Distance: ≤ ${distMax} AU`);
            console.log(`   Size filter: H ≤ ${hMax} (magnitude)`);

            // Query JPL CAD API
            const params = {
                'date-min': dateMin,
                'dist-max': distMax,
                'h-max': hMax,
                'sort': sort,
                'fullname': true, // Include full names
                'body': 'Earth' // Close approaches to Earth
            };

            if (dateMax) {
                params['date-max'] = dateMax;
            }

            const response = await axios.get(this.cadAPI, {
                params,
                timeout: 30000 // 30 second timeout for large queries
            });

            const data = response.data;

            if (!data.data || data.data.length === 0) {
                console.log('⚠️  No close approaches found for given criteria');
                return [];
            }

            console.log(`✅ Received ${data.count} close approaches from JPL`);

            // Parse and format data
            const neos = this.parseCloseApproachData(data, limit);

            console.log(`📊 Formatted ${neos.length} NEO entries`);

            // Cache results
            this.cache.set(cacheKey, neos);

            return neos;

        } catch (error) {
            console.error('❌ Error fetching close approaches:', error.message);
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', error.response.data);
            }
            throw new Error(`Failed to fetch real-time NEO data: ${error.message}`);
        }
    }

    /**
     * Get detailed data for specific asteroid
     * @param {string} designation - Asteroid designation (e.g., "2023 DW", "433")
     * @returns {Promise<Object>} Detailed asteroid data
     */
    async getAsteroidDetails(designation) {
        const cacheKey = `asteroid_details_${designation}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            console.log(`📦 Cache HIT: Asteroid ${designation}`);
            return cached;
        }

        try {
            console.log(`🔍 Fetching details for asteroid: ${designation}`);

            const response = await axios.get(this.sbdbAPI, {
                params: {
                    'sstr': designation,
                    'phys-par': '1', // Include physical parameters
                    'ca-data': 'true' // Include close approach data
                },
                timeout: 5000
            });

            const data = response.data;

            if (!data.object) {
                throw new Error(`Asteroid ${designation} not found in SBDB`);
            }

            const details = this.parseAsteroidDetails(data);

            console.log(`✅ Retrieved details for ${details.fullname || designation}`);

            // Cache for 24 hours (orbital data rarely changes)
            this.cache.set(cacheKey, details, 86400);

            return details;

        } catch (error) {
            console.error(`❌ Error fetching asteroid ${designation}:`, error.message);
            throw new Error(`Failed to fetch asteroid details: ${error.message}`);
        }
    }

    /**
     * Get NEOs by size category
     * @param {string} category - 'small' (<50m), 'medium' (50-300m), 'large' (>300m)
     * @returns {Promise<Array>} Filtered NEO list
     */
    async getNEOsBySize(category = 'all', options = {}) {
        // H magnitude to diameter conversion:
        // H ≈ 25 → ~50m, H ≈ 22 → ~150m, H ≈ 18 → ~1km
        let hMin, hMax;

        switch (category.toLowerCase()) {
            case 'small': // < 50m
                hMin = 25;
                hMax = 35;
                break;
            case 'medium': // 50-300m
                hMin = 20;
                hMax = 25;
                break;
            case 'large': // > 300m
                hMin = 10;
                hMax = 20;
                break;
            case 'all':
            default:
                hMin = null;
                hMax = 28; // Filter out very tiny objects
                break;
        }

        const queryOptions = {
            ...options,
            hMax: hMax
        };

        const neos = await this.getUpcomingCloseApproaches(queryOptions);

        // Additional filtering if hMin specified
        if (hMin !== null) {
            return neos.filter(neo => {
                const h = parseFloat(neo.absoluteMagnitude);
                return h >= hMin && h <= hMax;
            });
        }

        return neos;
    }

    /**
     * Get Potentially Hazardous Asteroids (PHAs)
     * PHAs are NEOs with H < 22 (diameter > 140m) and MOID < 0.05 AU
     */
    async getPotentiallyHazardousAsteroids(options = {}) {
        console.log('🚨 Fetching Potentially Hazardous Asteroids (PHAs)...');

        const queryOptions = {
            ...options,
            hMax: 22, // Only asteroids > 140m diameter
            distMax: '0.05' // Close approach within 0.05 AU
        };

        const neos = await this.getUpcomingCloseApproaches(queryOptions);

        // Filter to only include those with very close approaches
        const phas = neos.filter(neo => {
            const distAU = parseFloat(neo.missDistance.astronomical);
            return distAU < 0.05; // Within ~19.5 lunar distances
        });

        console.log(`✅ Found ${phas.length} PHAs in upcoming approaches`);

        return phas;
    }

    /**
     * Parse Close Approach Data from JPL CAD API response
     * @private
     */
    parseCloseApproachData(data, limit = 200) {
        const fields = data.fields;
        const rows = data.data;

        // Field indices mapping
        const fieldMap = {};
        fields.forEach((field, index) => {
            fieldMap[field] = index;
        });

        // Process each row
        const neos = rows.slice(0, limit).map(row => {
            const des = row[fieldMap['des']] || 'Unknown'; // Designation
            const fullname = row[fieldMap['fullname']] || des;
            const cd = row[fieldMap['cd']] || ''; // Close approach date
            const dist = row[fieldMap['dist']] || 0; // Distance in AU
            const vRel = row[fieldMap['v_rel']] || 0; // Relative velocity km/s
            const h = row[fieldMap['h']] || 25; // Absolute magnitude

            // Calculate estimated diameter from H magnitude
            // Formula: D (km) ≈ 1329 × 10^(-H/5) / sqrt(albedo)
            // Assuming average albedo 0.14
            const diameterKm = 1.329 / Math.sqrt(0.14) * Math.pow(10, -parseFloat(h) / 5);
            const diameterM = diameterKm * 1000;

            // Convert distance to various units
            const distAU = parseFloat(dist);
            const distLD = distAU * 389.17; // Lunar distances
            const distKm = distAU * 149597870.7; // Kilometers

            // Parse date
            const dateStr = cd.split(' ')[0]; // Extract date part

            return {
                id: des.replace(/\s+/g, ''),
                name: des,
                fullName: fullname,
                designation: des,

                // Close approach data
                closeApproachDate: dateStr,
                closeApproachDateFull: cd,

                // Size estimation
                absoluteMagnitude: parseFloat(h),
                estimatedDiameter: {
                    meters: {
                        min: diameterM * 0.7, // ±30% uncertainty
                        max: diameterM * 1.3,
                        estimated: diameterM
                    },
                    kilometers: {
                        min: diameterKm * 0.7,
                        max: diameterKm * 1.3,
                        estimated: diameterKm
                    }
                },

                // Velocity
                relativeVelocity: {
                    kilometersPerSecond: parseFloat(vRel),
                    kilometersPerHour: parseFloat(vRel) * 3600,
                    metersPerSecond: parseFloat(vRel) * 1000
                },

                // Distance
                missDistance: {
                    astronomical: distAU,
                    lunar: distLD,
                    kilometers: distKm,
                    miles: distKm * 0.621371
                },

                // Classification
                isPotentiallyHazardous: distAU < 0.05 && diameterM > 140,

                // Metadata
                source: 'JPL SBDB CAD',
                lastUpdated: new Date().toISOString()
            };
        });

        return neos;
    }

    /**
     * Parse detailed asteroid data from SBDB API response
     * @private
     */
    parseAsteroidDetails(data) {
        const obj = data.object;
        const orbit = data.orbit;

        // Extract orbital elements
        const elements = {};
        if (orbit && orbit.elements) {
            orbit.elements.forEach(elem => {
                elements[elem.name] = {
                    value: parseFloat(elem.value),
                    units: elem.units,
                    sigma: elem.sigma ? parseFloat(elem.sigma) : null
                };
            });
        }

        // Physical parameters
        const phys = data.phys || {};

        return {
            // Identification
            spkid: obj.spkid,
            designation: obj.des,
            fullname: obj.fullname,

            // Classification
            isNEO: obj.neo === true || obj.neo === 'true',
            isPHA: obj.pha === true || obj.pha === 'true',
            orbitClass: obj.orbit_class,

            // Orbital elements
            orbitalElements: {
                eccentricity: elements.e?.value,
                semiMajorAxis: elements.a?.value, // AU
                perihelionDistance: elements.q?.value, // AU
                aphelionDistance: elements.ad?.value, // AU
                inclination: elements.i?.value, // degrees
                longitudeAscendingNode: elements.om?.value, // degrees
                argumentPerihelion: elements.w?.value, // degrees
                meanAnomaly: elements.ma?.value, // degrees
                orbitalPeriod: elements.per?.value, // days
                epoch: orbit?.epoch
            },

            // Physical properties
            physicalProperties: phys,

            // Orbital data metadata
            orbitData: {
                source: orbit?.source || 'JPL',
                lastObservation: orbit?.last_obs,
                numberOfObservations: orbit?.n_obs_used,
                dataArc: orbit?.data_arc,
                conditionCode: orbit?.condition_code
            },

            // Metadata
            source: 'JPL SBDB',
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Get statistics about NEO database
     */
    async getStatistics() {
        const neos = await this.getUpcomingCloseApproaches({ limit: 500 });

        const stats = {
            total: neos.length,
            potentiallyHazardous: neos.filter(n => n.isPotentiallyHazardous).length,
            bySize: {
                small: neos.filter(n => n.estimatedDiameter.meters.estimated < 50).length,
                medium: neos.filter(n => {
                    const d = n.estimatedDiameter.meters.estimated;
                    return d >= 50 && d < 300;
                }).length,
                large: neos.filter(n => n.estimatedDiameter.meters.estimated >= 300).length
            },
            averageMissDistance: {
                au: neos.reduce((sum, n) => sum + n.missDistance.astronomical, 0) / neos.length,
                lunar: neos.reduce((sum, n) => sum + n.missDistance.lunar, 0) / neos.length
            },
            averageVelocity: {
                kmPerSec: neos.reduce((sum, n) => sum + n.relativeVelocity.kilometersPerSecond, 0) / neos.length
            },
            closestApproach: neos.reduce((closest, n) =>
                n.missDistance.astronomical < closest.missDistance.astronomical ? n : closest
            , neos[0]),
            largestAsteroid: neos.reduce((largest, n) =>
                n.estimatedDiameter.meters.estimated > largest.estimatedDiameter.meters.estimated ? n : largest
            , neos[0])
        };

        return stats;
    }

    /**
     * Clear cache (useful for testing or forcing refresh)
     */
    clearCache() {
        this.cache.flushAll();
        console.log('🗑️  Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            keys: this.cache.keys().length,
            stats: this.cache.getStats()
        };
    }
}

module.exports = RealTimeNeoService;
