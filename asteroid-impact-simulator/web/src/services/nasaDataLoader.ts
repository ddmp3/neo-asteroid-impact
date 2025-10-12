/**
 * NASA Asteroid Data Loader
 * Loads and processes asteroid data from real-time JPL SBDB API (v1.6.11+)
 * Replaces static JSON with live NASA data
 */

import { dateToJulian } from '../utils/orbitalMechanics';
import { neoAPI } from './api';

const AU = 149597870.7; // Astronomical Unit in km

export interface NASAAsteroidRaw {
  id: string;
  name: string;
  full_name: string;
  is_potentially_hazardous_asteroid: boolean;
  absolute_magnitude_h: number;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  orbital_data: {
    orbit_id: string;
    epoch_osculation: number;
    eccentricity: string;
    semi_major_axis: string;
    inclination: string;
    ascending_node_longitude: string;
    perihelion_argument: string;
    mean_anomaly: string;
    mean_motion: string;
    orbit_class: {
      orbit_class_type: string;
    };
  };
  close_approach_data: Array<{
    close_approach_date: string;
    close_approach_date_full: string;
    relative_velocity: {
      kilometers_per_second: string;
      kilometers_per_hour: string;
    };
    miss_distance: {
      astronomical: string;
      kilometers: string;
      lunar: string;
    };
    orbiting_body: string;
  }>;
}

// Real-Time NEO API Response (JPL SBDB)
export interface RealTimeNEO {
  id: string;
  name: string;
  fullName: string;
  designation: string;
  closeApproachDate: string;
  absoluteMagnitude: number;
  estimatedDiameter: {
    meters: {
      min: number;
      max: number;
      estimated: number;
    };
    kilometers: {
      min: number;
      max: number;
      estimated: number;
    };
  };
  relativeVelocity: {
    kilometersPerSecond: number;
    kilometersPerHour: number;
    metersPerSecond: number;
  };
  missDistance: {
    astronomical: number;
    lunar: number;
    kilometers: number;
    miles: number;
  };
  isPotentiallyHazardous: boolean;
  source: string;
  lastUpdated: string;
}

export interface OrbitalElements {
  a: number; // Semi-major axis (km)
  e: number; // Eccentricity
  i: number; // Inclination (radians)
  Omega: number; // Longitude of ascending node (radians)
  omega: number; // Argument of perihelion (radians)
  M0: number; // Mean anomaly at epoch (radians)
  n: number; // Mean motion (radians/second)
  epoch: number; // Epoch (Julian date)
}

export interface ProcessedAsteroid {
  id: string;
  name: string;
  fullName: string;
  isHazardous: boolean;
  magnitude: number;
  diameter: {
    min: number; // km
    max: number; // km
    avg: number; // km
  };
  elements?: OrbitalElements; // Optional, for orbital view
  orbitClass?: string;
  closeApproaches: Array<{
    date: Date;
    julianDate: number;
    velocity: number; // km/s
    distance: number; // km
    distanceAU: number;
  }>;
  // For sorting/filtering
  closestDistance: number; // km
  closestDistanceAU: number;
  // Real-time metadata
  source?: string;
  lastUpdated?: string;
}

/**
 * Process real-time NEO data from JPL SBDB API
 */
export function processRealTimeNEO(raw: RealTimeNEO): ProcessedAsteroid {
  const closeApproach = {
    date: new Date(raw.closeApproachDate),
    julianDate: dateToJulian(new Date(raw.closeApproachDate)),
    velocity: raw.relativeVelocity.kilometersPerSecond,
    distance: raw.missDistance.kilometers,
    distanceAU: raw.missDistance.astronomical,
  };

  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.fullName || raw.name,
    isHazardous: raw.isPotentiallyHazardous,
    magnitude: raw.absoluteMagnitude,
    diameter: {
      min: raw.estimatedDiameter.kilometers.min,
      max: raw.estimatedDiameter.kilometers.max,
      avg: raw.estimatedDiameter.kilometers.estimated,
    },
    closeApproaches: [closeApproach],
    closestDistance: closeApproach.distance,
    closestDistanceAU: closeApproach.distanceAU,
    source: raw.source,
    lastUpdated: raw.lastUpdated,
  };
}

/**
 * Process raw NASA asteroid data (legacy format from static JSON)
 */
export function processNASAAsteroid(raw: NASAAsteroidRaw): ProcessedAsteroid {
  const orbital = raw.orbital_data;

  // Convert orbital elements to proper units
  const elements: OrbitalElements = {
    a: parseFloat(orbital.semi_major_axis) * AU, // Convert AU to km
    e: parseFloat(orbital.eccentricity),
    i: (parseFloat(orbital.inclination) * Math.PI) / 180, // Convert deg to rad
    Omega: (parseFloat(orbital.ascending_node_longitude) * Math.PI) / 180,
    omega: (parseFloat(orbital.perihelion_argument) * Math.PI) / 180,
    M0: (parseFloat(orbital.mean_anomaly) * Math.PI) / 180,
    n: ((parseFloat(orbital.mean_motion) * Math.PI) / 180) / 86400, // Convert deg/day to rad/s
    epoch: orbital.epoch_osculation,
  };

  // Process close approaches
  const closeApproaches = raw.close_approach_data
    .filter((ca) => ca.orbiting_body === 'Earth')
    .map((ca) => ({
      date: new Date(ca.close_approach_date_full),
      julianDate: dateToJulian(new Date(ca.close_approach_date_full)),
      velocity: parseFloat(ca.relative_velocity.kilometers_per_second),
      distance: parseFloat(ca.miss_distance.kilometers),
      distanceAU: parseFloat(ca.miss_distance.astronomical),
    }));

  // Find closest approach
  const closestApproach = closeApproaches.reduce((min, ca) =>
    ca.distance < min.distance ? ca : min
  , closeApproaches[0]);

  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    isHazardous: raw.is_potentially_hazardous_asteroid,
    magnitude: raw.absolute_magnitude_h,
    diameter: {
      min: raw.estimated_diameter.kilometers.estimated_diameter_min,
      max: raw.estimated_diameter.kilometers.estimated_diameter_max,
      avg:
        (raw.estimated_diameter.kilometers.estimated_diameter_min +
          raw.estimated_diameter.kilometers.estimated_diameter_max) / 2,
    },
    elements,
    orbitClass: orbital.orbit_class.orbit_class_type,
    closeApproaches,
    closestDistance: closestApproach?.distance || Infinity,
    closestDistanceAU: closestApproach?.distanceAU || Infinity,
  };
}

/**
 * Load asteroid data from real-time JPL SBDB API (v1.6.11+)
 * Falls back to static JSON if API fails
 */
export async function loadAsteroidData(): Promise<ProcessedAsteroid[]> {
  try {
    console.log('🌍 Loading asteroid data from JPL SBDB API (real-time)...');

    // Try real-time API first
    const response = await neoAPI.getRealTimeUpcoming({
      dateMin: '2024-01-01',
      dateMax: '2026-12-31',
      limit: 200,
    });

    if (response && response.data && response.data.length > 0) {
      const asteroids = response.data.map(processRealTimeNEO);

      // Sort by closest distance
      asteroids.sort((a, b) => a.closestDistance - b.closestDistance);

      console.log(`✅ Loaded ${asteroids.length} asteroids from JPL SBDB API (real-time)`);
      console.log(`   Source: ${response.source}`);
      console.log(`   Last Updated: ${response.timestamp}`);
      return asteroids;
    }

    // If API returns no data, fall back to static JSON
    console.warn('⚠️  API returned no data, falling back to static JSON...');
    return await loadStaticAsteroidData();

  } catch (error) {
    console.error('❌ Failed to load from JPL SBDB API:', error);
    console.log('   Falling back to static JSON data...');
    return await loadStaticAsteroidData();
  }
}

/**
 * Load asteroid data from static JSON file (fallback)
 */
async function loadStaticAsteroidData(): Promise<ProcessedAsteroid[]> {
  try {
    const response = await fetch('/data/asteroids.json');
    const data = await response.json();

    const asteroids = data.asteroids.map(processNASAAsteroid);

    // Sort by closest distance
    asteroids.sort((a, b) => a.closestDistance - b.closestDistance);

    console.log(`✅ Loaded ${asteroids.length} asteroids from static JSON (fallback)`);
    return asteroids;
  } catch (error) {
    console.error('❌ Failed to load static asteroid data:', error);
    return [];
  }
}

/**
 * Filter asteroids by various criteria
 */
export function filterAsteroids(
  asteroids: ProcessedAsteroid[],
  options: {
    limit?: number;
    hazardousOnly?: boolean;
    searchQuery?: string;
    minDistance?: number; // km
    maxDistance?: number; // km
  }
): ProcessedAsteroid[] {
  let filtered = [...asteroids];

  // Filter by hazardous status
  if (options.hazardousOnly) {
    filtered = filtered.filter((a) => a.isHazardous);
  }

  // Filter by distance range
  if (options.minDistance !== undefined) {
    filtered = filtered.filter((a) => a.closestDistance >= options.minDistance!);
  }
  if (options.maxDistance !== undefined) {
    filtered = filtered.filter((a) => a.closestDistance <= options.maxDistance!);
  }

  // Filter by search query
  if (options.searchQuery) {
    const query = options.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.id.toLowerCase().includes(query) ||
        a.fullName.toLowerCase().includes(query)
    );
  }

  // Apply limit
  if (options.limit !== undefined) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

/**
 * Get asteroid statistics
 */
export function getAsteroidStats(asteroids: ProcessedAsteroid[]) {
  return {
    total: asteroids.length,
    hazardous: asteroids.filter((a) => a.isHazardous).length,
    closestDistance: Math.min(...asteroids.map((a) => a.closestDistance)),
    farthestDistance: Math.max(...asteroids.map((a) => a.closestDistance)),
    averageDistance:
      asteroids.reduce((sum, a) => sum + a.closestDistance, 0) / asteroids.length,
    orbitClasses: asteroids
      .map((a) => a.orbitClass)
      .filter((c): c is string => c !== undefined)
      .filter((c, i, arr) => arr.indexOf(c) === i),
    dataSource: asteroids[0]?.source || 'static',
    lastUpdated: asteroids[0]?.lastUpdated,
  };
}
