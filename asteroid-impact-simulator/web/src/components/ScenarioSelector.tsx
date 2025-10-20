import { useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { simulationAPI } from '../services/api';
import ImpactMapLeaflet from './ImpactMapLeaflet';
import ResultsDashboard from './ResultsDashboard';

interface Scenario {
  id: string;
  name: string;
  icon: string;
  description: string;
  historicalContext: string;
  category: 'validated' | 'estimated' | 'hypothetical';
  reliability: {
    score: number; // 0-100%
    details: string;
    ourMAE?: number; // Our measured error
    validated: boolean;
  };
  year?: number;
  params: {
    diameter: number;
    velocity: number;
    angle: number;
    density: number;
    composition: 'rocky' | 'iron' | 'icy';
  };
  location?: {
    lat: number;
    lon: number;
    name: string;
  };
  requiresLocationSelection?: boolean;
}

const PREDEFINED_SCENARIOS: Scenario[] = [
  // === VALIDATED HISTORICAL (we have tested) ===
  {
    id: 'tunguska',
    name: 'Tunguska Event',
    icon: '🌲',
    description: 'Devastating airburst in Siberia - 2,000 km² of forest flattened',
    historicalContext: 'June 30, 1908, Tunguska (Siberia). 65m asteroid exploded at ~8km altitude, equivalent 15 MT TNT. No crater formed. Witnesses saw fireball crossing sky, followed by shockwave. Trees knocked down in radial pattern over 2,000 km². Proves airbursts can be devastating without ground impact.',
    category: 'validated',
    reliability: {
      score: 92,
      details: 'Excellent. Our FCM V2 model reproduces burst altitude <1% error, blast zones ±8% error. Calibration baseline.',
      ourMAE: 8,
      validated: true
    },
    year: 1908,
    params: {
      diameter: 65,
      velocity: 27,
      angle: 30,
      density: 1800,
      composition: 'icy',
    },
    location: {
      lat: 60.8858,
      lon: 101.8939,
      name: 'Tunguska, Siberia',
    },
  },
  {
    id: 'chelyabinsk',
    name: 'Chelyabinsk Meteor',
    icon: '💨',
    description: 'High-altitude airburst - 1,500 injured (broken glass + thermal radiation)',
    historicalContext: 'February 15, 2013, Chelyabinsk (Russia). 20m asteroid @ 19 km/s, airburst 23.3km altitude, 0.5 MT. 1,500 injured (mainly thermal radiation + broken glass 7,200 buildings). Spectacular dashcam footage. Reminder that small objects are difficult to detect (discovered AFTER impact).',
    category: 'validated',
    reliability: {
      score: 75,
      details: 'Good. Burst altitude <1% error (excellent). BUT blast zones underestimated (limitation L3: airbursts >20km). Automated tests in place.',
      ourMAE: 1, // altitude only
      validated: true
    },
    year: 2013,
    params: {
      diameter: 20,
      velocity: 19,
      angle: 18,
      density: 3300,
      composition: 'rocky',
    },
    location: {
      lat: 55.1644,
      lon: 61.4368,
      name: 'Chelyabinsk, Russia',
    },
  },
  {
    id: 'barringer',
    name: 'Barringer Crater',
    icon: '🕳️',
    description: 'Famous Arizona crater - 1.2km diameter, well preserved',
    historicalContext: '~50,000 years ago, Arizona (USA). 50m iron impacted at ~12.8 km/s, crater 1.2km × 170m depth. Well preserved (arid climate). First scientifically recognized impact crater (1906). World reference for validating crater scaling laws.',
    category: 'validated',
    reliability: {
      score: 75,
      details: 'Good. Calculated 1.5km vs observed 1.2km (25% error). Acceptable for scaling laws. Minimal erosion so good reference.',
      ourMAE: 25,
      validated: true
    },
    year: -50000,
    params: {
      diameter: 50,
      velocity: 12.8,
      angle: 45,
      density: 7800,
      composition: 'iron',
    },
    location: {
      lat: 35.0275,
      lon: -111.0225,
      name: 'Winslow, Arizona, USA',
    },
  },
  {
    id: 'chicxulub',
    name: 'Chicxulub Impact',
    icon: '🦖',
    description: 'Dinosaur extinction - 180 km crater, 100 million MT',
    historicalContext: '66 million years ago, Yucatán (Mexico). 10-15km asteroid, 180km crater (completely buried under sediments). 100 million MT. Mass extinction 75% species including dinosaurs. Global tsunami, fires, impact winter (dust blocks sun). Changed Earth\'s life history.',
    category: 'validated',
    reliability: {
      score: 76,
      details: 'Good. Calculated 136.6km vs observed 180km (24% error). Excellent precision for giant impact (66 Ma, completely buried). Extreme validation.',
      ourMAE: 24,
      validated: true
    },
    year: -66000000,
    params: {
      diameter: 10000,
      velocity: 20,
      angle: 60,
      density: 2600,
      composition: 'icy',
    },
    location: {
      lat: 21.3,
      lon: -89.5,
      name: 'Yucatán, Mexico',
    },
  },

  // === ESTIMATED HISTORICAL (not yet validated) ===
  {
    id: 'sikhote-alin',
    name: 'Sikhote-Alin',
    icon: '🪨',
    description: 'Iron meteorite shower - Largest crater 26m',
    historicalContext: 'February 12, 1947, Sikhote-Alin Mountains (Russia). ~100 tonnes iron fragmented in atmosphere. Shower of ~70 tonnes fragments (largest ~1.7 tonnes). Largest crater 26m diameter. Witnesses saw bright trail then explosions. 100+ craters formed.',
    category: 'estimated',
    reliability: {
      score: 45,
      details: '⚠️ Problematic (limitation L2). Our Monte Carlo predicts 1.8-10.7m vs 26m observed. Cause: σ range too wide OR FCM V2 overestimates fragmentation. σ_typical calibration needed.',
      validated: false
    },
    year: 1947,
    params: {
      diameter: 9, // Largest fragment estimated
      velocity: 14,
      angle: 40,
      density: 7800,
      composition: 'iron',
    },
    location: {
      lat: 46.1,
      lon: 134.7,
      name: 'Sikhote-Alin, Russia',
    },
  },
  {
    id: 'ries',
    name: 'Ries Crater',
    icon: '⭕',
    description: 'Complex crater Germany - 24km diameter',
    historicalContext: '~15 million years ago, Bavaria (Germany). ~1.5km asteroid, 24km crater. Complex crater well studied with central peak. Partially eroded but structure visible. Tourist and scientific site (crater museum).',
    category: 'estimated',
    reliability: {
      score: 85,
      details: 'Good. Calculated 20.4km vs observed 24km (14.9% error). Good precision for partially eroded complex crater. Not yet tested automatically.',
      validated: false
    },
    year: -15000000,
    params: {
      diameter: 1500,
      velocity: 20,
      angle: 45,
      density: 3000,
      composition: 'rocky',
    },
    location: {
      lat: 48.8833,
      lon: 10.6167,
      name: 'Nördlingen, Germany',
    },
  },

  // === HYPOTHETICAL (future/theoretical scenarios) ===
  {
    id: 'apophis',
    name: 'Apophis (99942)',
    icon: '⚠️',
    description: 'NEO close approach 2029 - Will pass closer than satellites',
    historicalContext: 'April 13, 2029, Apophis (370m) will pass at 31,600 km from Earth (closer than geostationary satellites 35,786 km). Initially classified high risk (2004), then ruled out after additional observations. Remains monitored for future passages. Demonstration of early detection importance.',
    category: 'hypothetical',
    reliability: {
      score: 60,
      details: 'Hypothetical. No impact predicted. Parameters based on radar measurements. If real impact, expected precision ±20-30% (typical MAE).',
      validated: false
    },
    params: {
      diameter: 370,
      velocity: 31,
      angle: 45,
      density: 3200,
      composition: 'rocky',
    },
    requiresLocationSelection: true,
  },
  {
    id: 'bennu',
    name: 'Bennu (101955)',
    icon: '🎯',
    description: 'OSIRIS-REx target - 1/2,700 chance of impact 2175-2199',
    historicalContext: 'Bennu (490m) visited by OSIRIS-REx probe (2018-2021, samples returned 2023). Low-density rubble pile. 1/2,700 chance of impact between 2175-2199. Precise orbit and composition knowledge thanks to mission. Planetary defense case study.',
    category: 'hypothetical',
    reliability: {
      score: 65,
      details: 'Hypothetical. Precise parameters measured by spacecraft. If real impact, our low-density rubble pile model should give ±25-30% precision.',
      validated: false
    },
    params: {
      diameter: 490,
      velocity: 28,
      angle: 45,
      density: 1190,
      composition: 'icy',
    },
    requiresLocationSelection: true,
  },
  {
    id: 'city_killer',
    name: 'City Killer (140m)',
    icon: '🏙️',
    description: 'NASA "Potentially Hazardous" threshold - Expected every ~10,000 years',
    historicalContext: '140m is NASA threshold for "Potentially Hazardous Asteroid" (PHA). Impact statistically expected every ~10,000 years. Large enough to destroy entire metropolitan area. NASA actively monitors all NEOs >140m (95% discovered). Standard planetary defense scenario.',
    category: 'hypothetical',
    reliability: {
      score: 70,
      details: 'Hypothetical. Size in well-calibrated range (100-500m). Expected precision ±20% based on current dataset. Global MAE 32%.',
      validated: false
    },
    params: {
      diameter: 140,
      velocity: 20,
      angle: 45,
      density: 3000,
      composition: 'rocky',
    },
    requiresLocationSelection: true,
  },
  {
    id: 'regional_devastation',
    name: 'Regional Devastation (1km)',
    icon: '💥',
    description: 'Massive regional effects - Expected every ~500,000 years',
    historicalContext: '1km asteroid: global effects threshold (atmospheric dust, climate cooling). Impact expected every ~500,000 years. Crater ~20km, tsunami if ocean, massive fires. NASA tracking 95% of NEOs >1km (none threaten next 100 years). Possible regional extinction.',
    category: 'hypothetical',
    reliability: {
      score: 65,
      details: 'Hypothetical. Size validated on Ries (24km observed, 14.9% error). Expected precision ±20-25% for complex crater.',
      validated: false
    },
    params: {
      diameter: 1000,
      velocity: 25,
      angle: 45,
      density: 2800,
      composition: 'rocky',
    },
    requiresLocationSelection: true,
  },
];

export default function ScenarioSelector() {
  const {
    asteroidParams,
    setAsteroidParams,
    impactLocation: _impactLocation,
    setImpactLocation,
    setSimulationStep,
    simulationStep,
    setSimulationResult,
    setLoading,
    setError,
  } = useSimulationStore();
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadScenario = async (scenario: Scenario) => {
    setAsteroidParams(scenario.params);
    setSelectedScenario(scenario);

    if (scenario.location) {
      const location = {
        lat: scenario.location.lat,
        lon: scenario.location.lon,
      };
      setImpactLocation(location);
      setSimulationStep('location');

      // Auto-simulate
      setLoading(true);
      setError(null);

      try {
        const { simulation, zoneAnalysis } = await simulationAPI.simulateImpact(
          scenario.params,
          location
        );

        if (!simulation || !zoneAnalysis) {
          throw new Error('Invalid simulation response');
        }

        setSimulationResult(simulation, zoneAnalysis);
        setSimulationStep('results');
      } catch (error: any) {
        console.error('Simulation error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Simulation failed. Please check API connection.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      setSimulationStep('location');
    }
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 75) return 'text-green-400 border-green-500/50 bg-green-500/10';
    if (score >= 50) return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
    return 'text-red-400 border-red-500/50 bg-red-500/10';
  };

  const getReliabilityLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Low';
    return 'Problematic';
  };

  const categories = [
    { id: 'all', label: 'All', icon: '🌐' },
    { id: 'validated', label: 'Validated', icon: '✅', count: PREDEFINED_SCENARIOS.filter(s => s.category === 'validated').length },
    { id: 'estimated', label: 'Estimated', icon: '📊', count: PREDEFINED_SCENARIOS.filter(s => s.category === 'estimated').length },
    { id: 'hypothetical', label: 'Hypothetical', icon: '🔮', count: PREDEFINED_SCENARIOS.filter(s => s.category === 'hypothetical').length },
  ];

  const filteredScenarios = selectedCategory === 'all'
    ? PREDEFINED_SCENARIOS
    : PREDEFINED_SCENARIOS.filter(s => s.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card">
        <h2 className="text-3xl font-bold mb-2 text-white">📋 Impact Scenarios</h2>
        <p className="text-white/70 mb-4">
          Validated historical and hypothetical scenarios with reliability indicators from our model
        </p>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-blue-500 border-blue-400 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.label}
              {cat.count !== undefined && <span className="ml-1.5 opacity-60">({cat.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Scenarios List */}
        <div className="glass-card max-h-[800px] overflow-y-auto">
          <div className="space-y-3">
            {filteredScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`border-2 rounded-lg transition-all ${
                  selectedScenario?.id === scenario.id
                    ? 'border-blue-500/70 bg-blue-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {/* Scenario header */}
                <button
                  onClick={() => loadScenario(scenario)}
                  onMouseEnter={() => setHoveredScenario(scenario.id)}
                  onMouseLeave={() => setHoveredScenario(null)}
                  className="w-full text-left px-4 py-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-white flex items-center gap-2 mb-1">
                        <span className="text-2xl">{scenario.icon}</span>
                        <span>{scenario.name}</span>
                        {scenario.year && (
                          <span className="text-xs text-yellow-400 font-normal">
                            ({scenario.year > 0 ? scenario.year : `${Math.abs(scenario.year).toLocaleString()} BCE`})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/70 mb-2">{scenario.description}</p>

                      {/* Reliability badge */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-medium ${getReliabilityColor(scenario.reliability.score)}`}>
                        <span>{getReliabilityLabel(scenario.reliability.score)} {scenario.reliability.score}%</span>
                        {scenario.reliability.validated && <span>✅</span>}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded details on hover/select */}
                {(hoveredScenario === scenario.id || selectedScenario?.id === scenario.id) && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3 mt-2">
                    {/* Historical context */}
                    <div>
                      <h5 className="text-xs font-semibold text-blue-300 mb-1">📖 Historical Context</h5>
                      <p className="text-xs text-white/80 leading-relaxed">{scenario.historicalContext}</p>
                    </div>

                    {/* Reliability details */}
                    <div>
                      <h5 className="text-xs font-semibold text-purple-300 mb-1">🎯 Our Model Reliability</h5>
                      <p className="text-xs text-white/80 leading-relaxed">{scenario.reliability.details}</p>
                      {scenario.reliability.ourMAE !== undefined && (
                        <p className="text-xs text-green-400 mt-1">
                          Our measured MAE: ±{scenario.reliability.ourMAE}%
                        </p>
                      )}
                    </div>

                    {/* Parameters */}
                    <div>
                      <h5 className="text-xs font-semibold text-cyan-300 mb-2">⚙️ Parameters</h5>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-200 rounded text-xs">
                          Ø {scenario.params.diameter}m
                        </span>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-200 rounded text-xs">
                          {scenario.params.velocity} km/s
                        </span>
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-200 rounded text-xs">
                          {scenario.params.angle}° angle
                        </span>
                        <span className="px-2 py-1 bg-green-500/20 text-green-200 rounded text-xs capitalize">
                          {scenario.params.composition}
                        </span>
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-200 rounded text-xs">
                          {scenario.params.density} kg/m³
                        </span>
                      </div>
                    </div>

                    {/* Location info */}
                    {scenario.location && (
                      <p className="text-xs text-white/70">
                        📍 Location: <span className="text-white font-medium">{scenario.location.name}</span>
                      </p>
                    )}

                    {/* Requires selection warning */}
                    {scenario.requiresLocationSelection && (
                      <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-300">
                        ⚠️ <strong>Action required:</strong> After loading, click on the map (right) to select an impact point, then run the simulation.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right - Map */}
        <div className="glass-card">
          <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
            <span>🌍</span> Impact Location
          </h3>

          {/* Status message */}
          {selectedScenario ? (
            selectedScenario.location ? (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300 font-medium">
                  ✓ Pre-defined location: {selectedScenario.location.name}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Simulation launched automatically
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-300 font-medium">
                  👆 Click on map to choose impact point
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Hypothetical scenario: <strong>{selectedScenario.name}</strong>
                </p>
              </div>
            )
          ) : (
            <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm text-white/70">
                Select a scenario from the left
              </p>
            </div>
          )}

          {/* Map */}
          <ImpactMapLeaflet />

          {/* Current parameters */}
          {selectedScenario && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-sm font-semibold text-white mb-2">Loaded Parameters</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/60">Diameter:</span>
                  <span className="ml-2 text-blue-400 font-medium">{asteroidParams.diameter}m</span>
                </div>
                <div>
                  <span className="text-white/60">Velocity:</span>
                  <span className="ml-2 text-cyan-400 font-medium">{asteroidParams.velocity} km/s</span>
                </div>
                <div>
                  <span className="text-white/60">Angle:</span>
                  <span className="ml-2 text-purple-400 font-medium">{asteroidParams.angle}°</span>
                </div>
                <div>
                  <span className="text-white/60">Density:</span>
                  <span className="ml-2 text-green-400 font-medium">{asteroidParams.density} kg/m³</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {simulationStep === 'results' && (
        <div className="w-full">
          <ResultsDashboard />
        </div>
      )}
    </div>
  );
}
