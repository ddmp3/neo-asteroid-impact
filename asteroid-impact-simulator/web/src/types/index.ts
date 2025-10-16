// Asteroid types
export interface AsteroidParams {
  diameter: number; // meters
  velocity: number; // km/s
  angle: number; // degrees
  density: number; // kg/m³
  composition: 'rocky' | 'iron' | 'icy';
}

export interface ImpactLocation {
  lat: number;
  lon: number;
  isOcean?: boolean;
  depth?: number;
}

// Simulation result types
export interface SimulationResult {
  asteroidProperties: {
    diameter: number;
    mass: number;
    velocity: number;
    density: number;
    angle: number;
  };
  energy: {
    joules: number;
    tntTons: number;
    megatons: number;
  };
  fragmentation?: {
    willFragment: boolean;
    impactType: 'ground' | 'low_airburst_with_impact' | 'airburst' | 'high_altitude_airburst';
    altitude: number;
    energyDepositionAltitude: number;
    craterFormed: boolean;
    reachesGround: boolean;
    note: string;
    strength: number;
    ramPressure: number;
    details: {
      fragmentationCriterion: string;
      strengthMPa: number;
      ramPressureMPa: number;
      fragmentationRatio: number;
      model: string;
    };
    model: string;
  };
  crater: {
    diameter: number;
    depth: number;
    volume: number;
    modifiedDiameter: number;
    modifiedDepth: number;
  } | null;
  seismic: {
    magnitude: number;
    description: string;
    radiusKm: number;
  };
  blast: {
    fireball: number;
    radiationRadius: number;
    airblastRadius: number;
    thermalRadius: number;
  };
  blastTerrainAware?: {
    zones: {
      [key: string]: {
        originalRadius: number;
        polygon: Array<{ lat: number; lon: number }>;
        terrainAdjusted: boolean;
      };
    };
    burstPoint: {
      latitude: number;
      longitude: number;
      altitudeASL: number;
      burstHeight: number;
    };
    metadata: {
      radialSamples: number;
      rangeSteps: number;
      method: string;
    };
  } | null;
  tsunami: {
    initialWaveHeight: number;
    wavelength: number;
    propagationSpeed: number;
    speedKmh: number;
    affectedRadiusKm: number;
    amplitudeAtDistances?: Array<{
      distanceKm: number;
      amplitude: number;
    }>;
  } | null;
  casualties: {
    estimatedCasualties: number;
    estimatedInjured: number;
    totalAffected: number;
    severity: string;
    zones: {
      [key: string]: {
        radius: number;
        area: number;
        populationAffected: number;
        casualties: number;
        injured: number;
        mortalityRate: number;
        description: string;
        affectedCities?: Array<{
          name: string;
          country: string;
          lat: number;
          lon: number;
          distance: number;
          population: number;
          casualties: number;
          casualtyRate: number;
          affectedPopulation?: number;
          overlapFactor?: number;
        }>;
      };
    };
    affectedCities?: Array<{
      name: string;
      country: string;
      lat: number;
      lon: number;
      distance: number;
      population: number;
      casualties: number;
      casualtyRate: number;
      affectedPopulation?: number;
    }>;
    note: string;
  };
  impactLocation: ImpactLocation;
}

export interface ZoneAnalysis {
  impactPoint: {
    latitude: number;
    longitude: number;
    elevation: number;
    isOcean: boolean;
    waterDepth: number;
    terrainType: string;
  };
  terrainAnalysis: {
    averageElevation: number;
    elevationRange: number;
    terrainRoughness: string;
    coastalProximity: string;
    oceanPercentage: number;
  };
  historicalSeismicity: {
    eventCount: number;
    maxMagnitude: number;
    tsunamiHistory: number;
  };
  populationRisk: string;
  tsunamiRisk: {
    risk: string;
    reason: string;
  };
}

export interface DeflectionResult {
  method: string;
  description: string;
  requiredDeltaV: number;
  impactorMass: number;
  feasible: boolean;
  warningTimeNeeded: number;
  successProbability: number;
}

// NASA NEO types
export interface NeoData {
  id: string;
  name: string;
  designation: string;
  isPotentiallyHazardous: boolean;
  closeApproachDate: string;
  estimatedDiameter: {
    min: number;
    max: number;
    average: number;
  };
  relativeVelocity: {
    kmPerSecond: number;
    kmPerHour: number;
  };
  missDistance: {
    astronomical: number;
    lunar: number;
    kilometers: number;
  };
  absoluteMagnitude?: number;
  orbitalData?: {
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
    longitudeOfAscendingNode: number;
    argumentOfPeriapsis: number;
    trueAnomaly: number;
  };
}

export interface SampleAsteroid {
  name: string;
  diameter: number;
  velocity: number;
  description: string;
}

// Monte Carlo Uncertainty types
export interface MonteCarloParams {
  diameter: number;
  velocity: number;
  angle: number;
  density: number;
  composition: 'rocky' | 'iron' | 'icy';
  latitude: number;
  longitude: number;
  nSamples: number;
  customUncertainties?: {
    diameter?: { mean: number; stdDev: number };
    velocity?: { mean: number; stdDev: number };
    angle?: { mean: number; stdDev: number };
    density?: { mean: number; stdDev: number };
  };
  includeVisualization?: boolean;
  includeDecomposition?: boolean;
}

export interface MonteCarloStatistics {
  n: number;
  mean: number;
  median: number;
  mode: number | null;
  std: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  coefficientOfVariation: number | null;
  skewness: number | null;
  kurtosis: number | null;
  confidenceInterval: {
    level: number;
    lower: number;
    upper: number;
    margin: number;
  };
  percentiles: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  standardError: number;
}

export interface MonteCarloOutputStatistics {
  craterDiameter?: MonteCarloStatistics;
  impactEnergy?: MonteCarloStatistics;
  seismicMagnitude?: MonteCarloStatistics;
  [key: string]: MonteCarloStatistics | undefined;
}

export interface SobolIndices {
  firstOrder: number;
  totalOrder: number;
  interaction?: number;
}

export interface VarianceDecomposition {
  [outputVariable: string]: {
    [inputParameter: string]: SobolIndices;
  };
}

export interface VisualizationData {
  [outputVariable: string]: {
    pdf: {
      bins: number[];
      frequencies: number[];
    };
    cdf: {
      values: number[];
      probabilities: number[];
    };
    boxPlot: {
      min: number;
      q1: number;
      median: number;
      q3: number;
      max: number;
      outliers: number[];
    };
  };
}

export interface MonteCarloResult {
  nominalParams: {
    diameter: number;
    velocity: number;
    angle: number;
    density: number;
    composition: string;
    latitude: number;
    longitude: number;
  };
  statistics: MonteCarloOutputStatistics;
  metadata: {
    nSamples: number;
    successfulSamples: number;
    successRate: number;
    computationTime: number;
    timestamp: string;
  };
  sensitivity?: VarianceDecomposition;
  visualization?: VisualizationData;
}

// UI State types
export type ViewMode = 'simulation' | 'scenario' | 'education' | 'mitigation' | 'game' | '3d' | 'info' | 'uncertainty';
export type SimulationStep = 'parameters' | 'location' | 'results' | 'mitigation';
