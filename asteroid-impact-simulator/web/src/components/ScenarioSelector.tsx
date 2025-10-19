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
  // === VALIDATED HISTORICAL (nous avons testé) ===
  {
    id: 'tunguska',
    name: 'Tunguska Event',
    icon: '🌲',
    description: 'Airburst dévastateur en Sibérie - 2,000 km² de forêt aplatie',
    historicalContext: '30 juin 1908, Tunguska (Sibérie). 65m astéroïde explosé à ~8km altitude, équivalent 15 MT TNT. Aucun cratère formé. Témoins ont vu une boule de feu traversant le ciel, suivie d\'une onde de choc. Arbres couchés en motif radial sur 2,000 km². Prouve que airbursts peuvent être dévastateurs sans impact sol.',
    category: 'validated',
    reliability: {
      score: 92,
      details: 'Excellent. Notre modèle FCM V2 reproduit altitude burst <1% erreur, blast zones ±8% erreur. Baseline de calibration.',
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
      name: 'Tunguska, Sibérie',
    },
  },
  {
    id: 'chelyabinsk',
    name: 'Chelyabinsk Meteor',
    icon: '💨',
    description: 'Airburst haute altitude - 1,500 blessés (verre brisé + radiation thermique)',
    historicalContext: '15 février 2013, Chelyabinsk (Russie). 20m astéroïde @ 19 km/s, airburst 23.3km altitude, 0.5 MT. 1,500 blessés (principalement radiation thermique + verre brisé 7,200 bâtiments). Dashcam footage spectaculaire. Rappel que petits objets difficiles à détecter (découvert APRÈS impact).',
    category: 'validated',
    reliability: {
      score: 75,
      details: 'Bon. Altitude burst <1% erreur (excellent). MAIS blast zones sous-estimés (limitation L3: airbursts >20km). Tests automatisés en place.',
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
      name: 'Chelyabinsk, Russie',
    },
  },
  {
    id: 'barringer',
    name: 'Barringer Crater',
    icon: '🕳️',
    description: 'Cratère célèbre Arizona - 1.2km diamètre, bien préservé',
    historicalContext: '~50,000 ans, Arizona (USA). 50m fer impacté à ~12.8 km/s, cratère 1.2km × 170m profondeur. Bien préservé (climat aride). Premier cratère impact reconnu scientifiquement (1906). Référence mondiale pour validation crater scaling laws.',
    category: 'validated',
    reliability: {
      score: 75,
      details: 'Bon. Calculé 1.5km vs observé 1.2km (erreur 25%). Acceptable pour scaling laws. Érosion minimale donc bonne référence.',
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
    description: 'Extinction dinosaures - 180 km cratère, 100 millions MT',
    historicalContext: '66 millions années, Yucatán (Mexique). 10-15km astéroïde, cratère 180km (complètement enfoui sous sédiments). 100 millions MT. Extinction massive 75% espèces incluant dinosaures. Tsunami global, incendies, hiver d\'impact (poussière bloque soleil). Changé histoire de la vie sur Terre.',
    category: 'validated',
    reliability: {
      score: 76,
      details: 'Bon. Calculé 136.6km vs observé 180km (erreur 24%). Excellente précision pour impact géant (66 Ma, complètement enfoui). Validation extrême.',
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
      name: 'Yucatán, Mexique',
    },
  },

  // === ESTIMATED HISTORICAL (pas encore validés) ===
  {
    id: 'sikhote-alin',
    name: 'Sikhote-Alin',
    icon: '🪨',
    description: 'Pluie de météorites ferreux - Plus grand cratère 26m',
    historicalContext: '12 février 1947, Montagnes Sikhote-Alin (Russie). ~100 tonnes fer fragmenté en atmosphère. Pluie de ~70 tonnes fragments (plus grand ~1.7 tonnes). Plus grand cratère 26m diamètre. Témoins ont vu traînée brillante puis explosions. 100+ cratères formés.',
    category: 'estimated',
    reliability: {
      score: 45,
      details: '⚠️ Problématique (limitation L2). Notre Monte Carlo prédit 1.8-10.7m vs 26m observé. Cause : σ range trop large OU FCM V2 surestime fragmentation. Calibration σ_typical nécessaire.',
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
      name: 'Sikhote-Alin, Russie',
    },
  },
  {
    id: 'ries',
    name: 'Ries Crater',
    icon: '⭕',
    description: 'Cratère complexe Allemagne - 24km diamètre',
    historicalContext: '~15 millions années, Bavière (Allemagne). ~1.5km astéroïde, cratère 24km. Cratère complexe bien étudié avec pic central. Partiellement érodé mais structure visible. Site touristique et scientifique (musée cratère).',
    category: 'estimated',
    reliability: {
      score: 85,
      details: 'Bon. Calculé 20.4km vs observé 24km (erreur 14.9%). Bonne précision pour cratère complexe partiellement érodé. Pas encore testé automatiquement.',
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
      name: 'Nördlingen, Allemagne',
    },
  },

  // === HYPOTHETICAL (scénarios futurs/théoriques) ===
  {
    id: 'apophis',
    name: 'Apophis (99942)',
    icon: '⚠️',
    description: 'NEO proche passage 2029 - Passera plus près que satellites',
    historicalContext: '13 avril 2029, Apophis (370m) passera à 31,600 km de Terre (plus proche que satellites géostationnaires 35,786 km). Initialement classé risque élevé (2004), puis écarté après observations supplémentaires. Reste surveillé pour passages futurs. Démonstration importance détection précoce.',
    category: 'hypothetical',
    reliability: {
      score: 60,
      details: 'Hypothétique. Impact non prévu. Paramètres basés mesures radar. Si impact réel, précision attendue ±20-30% (MAE typique).',
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
    description: 'Cible OSIRIS-REx - 1/2,700 chance impact 2175-2199',
    historicalContext: 'Bennu (490m) visité par sonde OSIRIS-REx (2018-2021, échantillons retournés 2023). Rubble pile faible densité. 1/2,700 chance impact entre 2175-2199. Connaissance précise orbite et composition grâce mission. Cas d\'étude défense planétaire.',
    category: 'hypothetical',
    reliability: {
      score: 65,
      details: 'Hypothétique. Paramètres précis mesurés par spacecraft. Si impact réel, notre modèle rubble pile faible densité devrait donner ±25-30% précision.',
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
    description: 'Seuil NASA "Potentially Hazardous" - Attendu tous ~10,000 ans',
    historicalContext: '140m est seuil NASA pour "Potentially Hazardous Asteroid" (PHA). Impact attendu statistiquement tous ~10,000 ans. Assez grand pour détruire zone métropolitaine complète. NASA surveille activement tous NEOs >140m (95% découverts). Scénario défense planétaire standard.',
    category: 'hypothetical',
    reliability: {
      score: 70,
      details: 'Hypothétique. Taille dans range bien calibré (100-500m). Précision attendue ±20% basé sur dataset actuel. MAE global 32%.',
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
    description: 'Effets régionaux massifs - Attendu tous ~500,000 ans',
    historicalContext: '1km astéroïde : seuil effets globaux (poussière atmosphère, refroidissement climat). Impact attendu tous ~500,000 ans. Cratère ~20km, tsunami si océan, incendies massifs. NASA tracking 95% de NEOs >1km (aucun menace 100 ans). Extinction régionale possible.',
    category: 'hypothetical',
    reliability: {
      score: 65,
      details: 'Hypothétique. Taille validée sur Ries (24km observé, 14.9% erreur). Précision attendue ±20-25% pour cratère complexe.',
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
    if (score >= 75) return 'Bon';
    if (score >= 60) return 'Moyen';
    if (score >= 40) return 'Faible';
    return 'Problématique';
  };

  const categories = [
    { id: 'all', label: 'Tous', icon: '🌐' },
    { id: 'validated', label: 'Validés', icon: '✅', count: PREDEFINED_SCENARIOS.filter(s => s.category === 'validated').length },
    { id: 'estimated', label: 'Estimés', icon: '📊', count: PREDEFINED_SCENARIOS.filter(s => s.category === 'estimated').length },
    { id: 'hypothetical', label: 'Hypothétiques', icon: '🔮', count: PREDEFINED_SCENARIOS.filter(s => s.category === 'hypothetical').length },
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
          Scénarios historiques validés et hypothétiques avec indicateurs de fiabilité de notre modèle
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
                      <h5 className="text-xs font-semibold text-blue-300 mb-1">📖 Contexte Historique</h5>
                      <p className="text-xs text-white/80 leading-relaxed">{scenario.historicalContext}</p>
                    </div>

                    {/* Reliability details */}
                    <div>
                      <h5 className="text-xs font-semibold text-purple-300 mb-1">🎯 Fiabilité Notre Modèle</h5>
                      <p className="text-xs text-white/80 leading-relaxed">{scenario.reliability.details}</p>
                      {scenario.reliability.ourMAE !== undefined && (
                        <p className="text-xs text-green-400 mt-1">
                          Notre MAE mesuré : ±{scenario.reliability.ourMAE}%
                        </p>
                      )}
                    </div>

                    {/* Parameters */}
                    <div>
                      <h5 className="text-xs font-semibold text-cyan-300 mb-2">⚙️ Paramètres</h5>
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
                        ⚠️ <strong>Action requise:</strong> Après chargement, cliquez sur la carte (à droite) pour sélectionner un point d'impact, puis lancez la simulation.
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
                  ✓ Location pré-définie : {selectedScenario.location.name}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Simulation lancée automatiquement
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-300 font-medium">
                  👆 Cliquez sur la carte pour choisir le point d'impact
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Scénario hypothétique : <strong>{selectedScenario.name}</strong>
                </p>
              </div>
            )
          ) : (
            <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm text-white/70">
                Sélectionnez un scénario à gauche
              </p>
            </div>
          )}

          {/* Map */}
          <ImpactMapLeaflet />

          {/* Current parameters */}
          {selectedScenario && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-sm font-semibold text-white mb-2">Paramètres Chargés</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/60">Diamètre:</span>
                  <span className="ml-2 text-blue-400 font-medium">{asteroidParams.diameter}m</span>
                </div>
                <div>
                  <span className="text-white/60">Vélocité:</span>
                  <span className="ml-2 text-cyan-400 font-medium">{asteroidParams.velocity} km/s</span>
                </div>
                <div>
                  <span className="text-white/60">Angle:</span>
                  <span className="ml-2 text-purple-400 font-medium">{asteroidParams.angle}°</span>
                </div>
                <div>
                  <span className="text-white/60">Densité:</span>
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