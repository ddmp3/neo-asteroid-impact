export default function InfoPanel() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-card p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          📊 Version de Production
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-3xl font-bold text-blue-400">v1.6.24</span>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
            STABLE
          </span>
          <span className="text-sm text-white/60">Déployé: 2025-10-13</span>
        </div>
        <p className="text-white/80 text-sm">
          Simulator d'impact d'astéroïdes avec physique réaliste (Collins 2005, Ward & Asphaug 2000).
          Backend API sur Azure Container Apps, Frontend sur Azure Static Web Apps.
        </p>
      </div>

      {/* Latest Version */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🔧</span>
          v1.6.24 - Corrections TypeScript & Debug Logs
        </h3>

        <div className="space-y-4">
          {/* Fixed */}
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2">✅ CORRIGÉ</h4>
            <ul className="text-sm text-white/80 space-y-1 ml-4">
              <li>• <strong>16 erreurs TypeScript</strong> → 0 erreurs (strict mode)</li>
              <li>• <strong>Favicon 404</strong> → Créé asteroid.svg</li>
              <li>• <strong>Three.js materials</strong> → meshBasicMaterial → meshStandardMaterial</li>
              <li>• <strong>Geometry rendering</strong> → &lt;line&gt; → &lt;primitive&gt;</li>
              <li>• <strong>Logs déflection</strong> → Debug détaillé pour Game mode</li>
            </ul>
          </div>

          {/* Added */}
          <div>
            <h4 className="text-sm font-semibold text-blue-400 mb-2">🆕 AJOUTÉ</h4>
            <ul className="text-sm text-white/80 space-y-1 ml-4">
              <li>• Interface TsunamiData.amplitudeAtDistances (rings de propagation)</li>
              <li>• Logs détaillés API /api/simulate/deflection (debugging)</li>
            </ul>
          </div>

          {/* Removed */}
          <div>
            <h4 className="text-sm font-semibold text-red-400 mb-2">🗑️ SUPPRIMÉ</h4>
            <ul className="text-sm text-white/80 space-y-1 ml-4">
              <li>• GoogleImpactMap.tsx (dépendance @vis.gl manquante)</li>
              <li>• ParameterPanel.old.tsx (obsolète)</li>
              <li>• Imports React inutiles (Vite JSX transform)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Previous Major Version */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🌊</span>
          v1.6.23 - Corrections Tsunami (CRITICAL)
        </h3>

        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-red-400 mb-2">🐛 BUG CRITIQUE CORRIGÉ</h4>
            <ul className="text-sm text-white/80 space-y-1 ml-4">
              <li>• <strong>Casualties tsunami = 0</strong> → Champ waveHeight vs initialWaveHeight</li>
              <li>• <strong>Vagues irréalistes</strong> → 265m (Méditerranée) corrigé avec Ward & Asphaug 2000</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-blue-400 mb-2">🆕 NOUVELLES FONCTIONS</h4>
            <ul className="text-sm text-white/80 space-y-1 ml-4">
              <li>• calculateOceanImpactTsunami() - Impacts profondeur &gt;1000m</li>
              <li>• calculateCoastalTsunami() - Impacts côtiers avec shoaling</li>
              <li>• calculateLandImpact() - Cratères terrestres (Collins 2005)</li>
              <li>• calculateAirburstImpact() - Explosions atmosphériques</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2">📐 PHYSIQUE CORRIGÉE</h4>
            <ul className="text-sm text-white/80 space-y-1 ml-4">
              <li>• Schmidt-Holsapple: β=0.22, CT=1.88 (eau)</li>
              <li>• Hauteur initiale: H₀ = 0.1 × R_cavity (pas 0.28)</li>
              <li>• Cap physique: max 500m (Chicxulub = 300m)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          Fonctionnalités Clés
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">🎯 Simulation Physique</h4>
            <ul className="text-xs text-white/70 space-y-1">
              <li>• Cratères Collins (2005) - 21% erreur</li>
              <li>• Tsunamis Ward & Asphaug (2000) - 2.4% erreur</li>
              <li>• Sismique Gutenberg-Richter - 0.56 mag erreur</li>
              <li>• Blast zones, casualties 45 villes</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-400 mb-2">🌍 Données Temps Réel</h4>
            <ul className="text-xs text-white/70 space-y-1">
              <li>• NASA JPL SBDB (282 NEOs 2025)</li>
              <li>• USGS Elevation API</li>
              <li>• GeoNames 32,686 villes</li>
              <li>• Cache optimisé 15min</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-400 mb-2">🎮 Modes Interactifs</h4>
            <ul className="text-xs text-white/70 space-y-1">
              <li>• 8 scénarios pré-configurés</li>
              <li>• Jeu Defend Earth (6 niveaux)</li>
              <li>• Visualisation 3D orbites/impacts</li>
              <li>• 16 tooltips éducatifs</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-orange-400 mb-2">🛡️ Mitigation</h4>
            <ul className="text-xs text-white/70 space-y-1">
              <li>• Kinetic Impactor</li>
              <li>• Gravity Tractor</li>
              <li>• Nuclear Deflection</li>
              <li>• Calcul ΔV requis</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="glass-card p-6 mt-6">
        <h3 className="text-xl font-bold text-white mb-4">💻 Stack Technique</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-blue-500/10 rounded p-2 text-center">
            <div className="font-semibold text-blue-400">Backend</div>
            <div className="text-xs text-white/60">Node.js + Express</div>
          </div>
          <div className="bg-cyan-500/10 rounded p-2 text-center">
            <div className="font-semibold text-cyan-400">Frontend</div>
            <div className="text-xs text-white/60">React + TypeScript</div>
          </div>
          <div className="bg-purple-500/10 rounded p-2 text-center">
            <div className="font-semibold text-purple-400">3D</div>
            <div className="text-xs text-white/60">Three.js + R3F</div>
          </div>
          <div className="bg-green-500/10 rounded p-2 text-center">
            <div className="font-semibold text-green-400">Maps</div>
            <div className="text-xs text-white/60">Leaflet + OSM</div>
          </div>
        </div>
      </div>
    </div>
  );
}
