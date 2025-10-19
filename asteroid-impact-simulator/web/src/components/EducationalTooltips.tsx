import { useState } from 'react';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  formula?: string;
  category: 'physics' | 'limitations' | 'validation' | 'history';
}

const EDUCATIONAL_CONTENT: ContentItem[] = [
  // PHYSICS MODELS
  {
    id: 'holsapple-crater',
    title: '1. Holsapple Pi-Group Crater Scaling (1993)',
    content: 'Notre modèle principal pour le calcul des cratères. Basé sur les lois de scaling dimensionnel pures, sans régression empirique.',
    formula: 'D = C × D_imp × (ρ/ρ_target)^(1/3) × (v/v_ref)^(2/3) × sin^(1/3)(θ)',
    category: 'physics'
  },
  {
    id: 'holsapple-params',
    title: 'Paramètres Holsapple',
    content: 'C = 14.10 ± 1.13 (constante calibrée par bootstrap, N=1000). Exposants : μ=1/3 (densité), β=2/3 (vélocité), ε=1/3 (angle). Ces exposants sont fondamentaux, pas empiriques.',
    category: 'physics'
  },
  {
    id: 'fcm-v2',
    title: '2. FCM V2 Fragmentation Atmosphérique (Wheeler 2017)',
    content: 'Modèle de fragment-cloud pour les astéroïdes se fragmentant dans l\'atmosphère. Utilise le critère Hills-Goda pour déterminer quand la fragmentation commence.',
    formula: 'P_ram = ½ × ρ_air × v² vs σ (résistance matériau)',
    category: 'physics'
  },
  {
    id: 'fcm-conservation',
    title: 'Conservation d\'Énergie FCM V2',
    content: 'Notre implémentation préserve l\'énergie à <7% d\'erreur sur tous les régimes (intact, fragmentation, airburst). Validation rigoureuse sur Tunguska et Chelyabinsk.',
    category: 'physics'
  },
  {
    id: 'monte-carlo',
    title: '3. Monte Carlo Uncertainty Quantification',
    content: 'Nous propageons les incertitudes de 2 paramètres actuellement : C (constante cratère) et σ (résistance matériau). Utilise Box-Muller transform pour échantillonnage Normal exact.',
    formula: 'C ~ N(14.10, 1.13), σ ~ U(20, 120) MPa',
    category: 'physics'
  },
  {
    id: 'seismic',
    title: '4. Effets Sismiques (Schultz & Gault 1975)',
    content: 'Relation Gutenberg-Richter calibrée. Rayon ressenti calculé par interpolation haute précision (7 points d\'ancrage) avec <1% d\'erreur.',
    formula: 'M = (2/3) × log₁₀(E) - 5.87',
    category: 'physics'
  },

  // LIMITATIONS
  {
    id: 'limit-vref',
    title: '🔴 L1: Inconsistance v_ref (CRITIQUE)',
    content: 'Le code utilise v_ref = 15 km/s mais la documentation mentionne 12 km/s. Cette incohérence crée ±20% d\'incertitude sur les diamètres de cratères. À résoudre en Phase 1.4.',
    category: 'limitations'
  },
  {
    id: 'limit-sikhote',
    title: '🔴 L2: Problème Sikhote-Alin (CRITIQUE)',
    content: 'Monte Carlo prédit 1.8-10.7m pour Sikhote-Alin vs 26m observé. Cause : σ range [20-120 MPa] trop large pour petits fers, OU FCM V2 surestime la fragmentation. Calibration σ_typical nécessaire.',
    category: 'limitations'
  },
  {
    id: 'limit-altitude',
    title: '🔴 L3: Airbursts Haute Altitude (CRITIQUE)',
    content: 'Zones blast sous-estimées pour événements >20km altitude (ex: Chelyabinsk 23.3km). Couplage atmosphérique mal modélisé en air ténue. Facteurs d\'ajustement par altitude à implémenter.',
    category: 'limitations'
  },
  {
    id: 'limit-mae',
    title: '⚠️ L4: MAE Global 32%',
    content: 'Erreur absolue moyenne actuelle de 32% (cible v2.0: <20%). Composantes : Cratères 16-21% (bon), Blast zones 8% (excellent), mais dominé par cas extrêmes (petits fers, impacts rasants).',
    category: 'limitations'
  },
  {
    id: 'limit-dataset',
    title: '⚠️ L5: Dataset Limité (20 cratères)',
    content: 'Validation actuelle sur 20 cratères uniquement (puissance statistique ~60%). Objectif v2.0 : 75 cratères pour puissance 95%. Expansion en Phase 2 (8 semaines).',
    category: 'limitations'
  },
  {
    id: 'limit-population',
    title: '⚠️ L6: Populations (45 villes seulement)',
    content: '45 villes majeures pré-chargées. Sous-estime casualties rurales de 30-50%. Alternatives (NASA SEDAC, WorldPop) trop lourdes/peu fiables. Limite documentée explicitement.',
    category: 'limitations'
  },
  {
    id: 'limit-geometry',
    title: '🟢 L7: Géométrie Simplifiée (ACCEPTABLE)',
    content: 'Impacteurs sphériques uniquement. Réalité : formes ellipsoïdales, orientation 3D. Impact : ±10-15% variation taille cratère. Extension géométrie 3D en Phase 3 (RK45).',
    category: 'limitations'
  },
  {
    id: 'limit-target',
    title: '🟢 L8: Cible Uniforme (ACCEPTABLE)',
    content: 'Densité cible fixe 2500 kg/m³ (roche sédimentaire). Réalité : roche cristalline, structures en couches, glace. Impact : ±20% variation. Sélecteur type terrain en roadmap future.',
    category: 'limitations'
  },
  {
    id: 'limit-earth',
    title: '🟢 L9: Terre Uniquement (ACCEPTABLE)',
    content: 'Transition simple/complex à 3.2km spécifique à la Terre (gravité + matériau). Lune ~15km, Mars ~5-7km. Modèle NON valide pour autres corps planétaires sans recalibration.',
    category: 'limitations'
  },

  // VALIDATION
  {
    id: 'val-tunguska',
    title: 'Tunguska (1908) - ±8% erreur',
    content: '65m, 15 MT @ 8km altitude. Notre modèle FCM V2 : altitude burst <1% erreur, blast zones ±8% erreur. Baseline de calibration pour airbursts moyenne altitude.',
    category: 'validation'
  },
  {
    id: 'val-chelyabinsk',
    title: 'Chelyabinsk (2013) - Problème haute altitude',
    content: '20m, 0.5 MT @ 23.3km altitude. Altitude burst <1% erreur (excellent). MAIS blast zones sous-estimés (limitation L3). Tests automatisés en place.',
    category: 'validation'
  },
  {
    id: 'val-barringer',
    title: 'Barringer Crater - ±25% erreur',
    content: 'Observé : 1.2km diamètre. Calculé : 1.5km. Erreur 25% acceptable pour scaling laws. Érosion minimale (50k ans) donc bonne référence.',
    category: 'validation'
  },
  {
    id: 'val-chicxulub',
    title: 'Chicxulub - ±24% erreur',
    content: 'Observé : 180km diamètre. Calculé : 136.6km. Erreur 24% excellente pour impact géant (66 Ma, complètement enfoui). Extinc validation extrême.',
    category: 'validation'
  },

  // HISTORY
  {
    id: 'hist-tunguska',
    title: 'Tunguska (1908) - Référence Airburst',
    content: '65m astéroïde explosé à 8km altitude, équivalent 15 MT TNT. Aucun cratère formé. 2,000 km² de forêt aplatie. Prouve que airbursts peuvent être dévastateurs sans impact sol.',
    category: 'history'
  },
  {
    id: 'hist-chelyabinsk',
    title: 'Chelyabinsk (2013) - Événement Récent',
    content: '20m @ 19 km/s, airburst 23.3km altitude, 0.5 MT. 1,500 blessés (principalement radiation thermique + verre brisé). Rappel que petits objets difficiles à détecter.',
    category: 'history'
  },
  {
    id: 'hist-chicxulub',
    title: 'Chicxulub (66 Ma) - Extinction Dinosaures',
    content: '10-15km astéroïde, cratère 180km (Yucatan). 100 millions MT. Extinction massive (75% espèces). Démontre impact civilisationnel des grands impacts.',
    category: 'history'
  }
];

interface EducationalTooltipsProps {
  topic?: string;
  className?: string;
}

export default function EducationalTooltips({ topic: _topic, className = '' }: EducationalTooltipsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('physics');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [
    { id: 'physics', label: 'Physics Models', icon: '⚛️', description: 'Holsapple, FCM V2, Monte Carlo' },
    { id: 'limitations', label: 'Limitations', icon: '⚠️', description: '9 identified (3 critical, 3 important, 3 acceptable)' },
    { id: 'validation', label: 'Validation', icon: '✅', description: 'Historical events & precision' },
    { id: 'history', label: 'Historical Events', icon: '🌍', description: 'Tunguska, Chelyabinsk, Chicxulub' }
  ];

  const filteredContent = EDUCATIONAL_CONTENT.filter(item => item.category === selectedCategory);

  const getLimitationColor = (id: string) => {
    if (id.includes('L1') || id.includes('L2') || id.includes('L3')) return 'border-red-500/50 bg-red-500/5';
    if (id.includes('L4') || id.includes('L5') || id.includes('L6')) return 'border-yellow-500/50 bg-yellow-500/5';
    if (id.includes('L7') || id.includes('L8') || id.includes('L9')) return 'border-green-500/50 bg-green-500/5';
    return 'border-white/10 bg-white/5';
  };

  return (
    <div className={`glass-card ${className}`}>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 text-white">📖 Scientific Documentation</h2>
        <p className="text-white/70 text-lg">
          Physics models, limitations, and validation data used in this simulator
        </p>
        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-200">
            <strong>Philosophy v2.0:</strong> Transparence maximale. Nous affichons toutes nos limites,
            nos incertitudes, et nos sources. Zéro régression linéaire - que de la physique pure.
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setExpandedId(null); // Reset expanded when changing category
            }}
            className={`p-4 rounded-lg text-left transition-all border-2 ${
              selectedCategory === cat.id
                ? 'bg-blue-500 border-blue-400 text-white shadow-lg'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{cat.icon}</span>
              <span className="font-bold">{cat.label}</span>
            </div>
            <p className="text-xs opacity-80 mt-1">{cat.description}</p>
          </button>
        ))}
      </div>

      {/* Content list */}
      <div className="space-y-3">
        {filteredContent.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border-2 transition-all ${
              selectedCategory === 'limitations'
                ? getLimitationColor(item.id)
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <button
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <span className="font-semibold text-white">{item.title}</span>
              <span className="text-white/50 text-xl">
                {expandedId === item.id ? '−' : '+'}
              </span>
            </button>

            {expandedId === item.id && (
              <div className="px-4 pb-4 pt-0 space-y-3">
                <p className="text-white/90 leading-relaxed">
                  {item.content}
                </p>
                {item.formula && (
                  <div className="p-3 bg-black/30 rounded border border-white/20 font-mono text-sm text-cyan-300">
                    {item.formula}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-300">32%</div>
          <div className="text-sm text-white/70">MAE Global Actuel</div>
          <div className="text-xs text-white/50 mt-1">Target v2.0: &lt;20%</div>
        </div>
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-2xl font-bold text-green-300">20 → 75</div>
          <div className="text-sm text-white/70">Cratères Validés</div>
          <div className="text-xs text-white/50 mt-1">Expansion Phase 2</div>
        </div>
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="text-2xl font-bold text-purple-300">2 → 6</div>
          <div className="text-sm text-white/70">Paramètres Monte Carlo</div>
          <div className="text-xs text-white/50 mt-1">C, σ → D, V, θ, ρ, σ, C</div>
        </div>
      </div>

      {/* Documentation link */}
      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
        <h4 className="font-semibold mb-2 text-white flex items-center gap-2">
          📚 Complete Documentation
        </h4>
        <p className="text-sm text-white/70 mb-3">
          Pour plus de détails techniques, formules complètes, et références scientifiques :
        </p>
        <a
          href="https://github.com/ddmp3/meteormadness#readme"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          View on GitHub →
        </a>
      </div>
    </div>
  );
}