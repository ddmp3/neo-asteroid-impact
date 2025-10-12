import { useSimulationStore } from '../store/useSimulationStore';

export default function ResultsDashboard() {
  const { simulationResult, zoneAnalysis } = useSimulationStore();

  if (!simulationResult || !zoneAnalysis) return null;

  const { asteroidProperties, energy, crater, seismic, blast, tsunami, casualties, fragmentation } = simulationResult;

  // Helper function to get impact type badge info
  const getImpactTypeBadge = (impactType: string) => {
    switch (impactType) {
      case 'ground':
        return {
          icon: '🎯',
          label: 'Ground Impact',
          color: 'bg-red-500/20 border-red-500/50 text-red-300',
          description: 'Direct surface impact with full crater formation'
        };
      case 'low_airburst_with_impact':
        return {
          icon: '💥',
          label: 'Low Airburst + Impact',
          color: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
          description: 'Partial fragmentation with ground impact and crater'
        };
      case 'airburst':
        return {
          icon: '☄️',
          label: 'Airburst',
          color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
          description: 'Mid-altitude explosion without ground impact'
        };
      case 'high_altitude_airburst':
        return {
          icon: '✨',
          label: 'High-Altitude Airburst',
          color: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300',
          description: 'Complete atmospheric breakup at high altitude'
        };
      default:
        return {
          icon: '❓',
          label: 'Unknown',
          color: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
          description: 'Impact type not determined'
        };
    }
  };

  return (
    <div className="space-y-6" role="region" aria-label="Simulation results dashboard">
      {/* Main Impact Stats */}
      <div className="card" role="region" aria-labelledby="impact-analysis-heading">
        <h2 id="impact-analysis-heading" className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span aria-hidden="true">💥</span> Impact Analysis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Impact Energy"
            value={`${energy.megatons.toFixed(2)} MT`}
            subtitle={`${energy.tntTons.toExponential(2)} tons TNT`}
            color="text-red-400"
          />
          <StatCard
            label="Asteroid Mass"
            value={`${(asteroidProperties.mass / 1e9).toFixed(2)} kt`}
            subtitle={`${asteroidProperties.diameter}m diameter`}
            color="text-blue-400"
          />
          <StatCard
            label="Impact Velocity"
            value={`${(asteroidProperties.velocity / 1000).toFixed(1)} km/s`}
            subtitle={`${asteroidProperties.angle}° angle`}
            color="text-purple-400"
          />
        </div>
      </div>

      {/* Fragmentation Analysis (v1.6.10+) */}
      {fragmentation && (
        <div className="card" role="region" aria-labelledby="fragmentation-heading">
          <h2 id="fragmentation-heading" className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span aria-hidden="true">🌠</span> Atmospheric Fragmentation Analysis
            <span className="text-xs font-normal text-white/50 ml-2">(Hills-Goda 1993)</span>
          </h2>

          {/* Impact Type Badge */}
          <div className="mb-6">
            {(() => {
              const badge = getImpactTypeBadge(fragmentation.impactType);
              return (
                <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-lg border-2 ${badge.color}`}>
                  <span className="text-3xl" aria-hidden="true">{badge.icon}</span>
                  <div>
                    <div className="font-bold text-lg">{badge.label}</div>
                    <div className="text-sm opacity-80">{badge.description}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Fragmentation Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {fragmentation.willFragment && (
              <StatCard
                label="Fragmentation Altitude"
                value={`${(fragmentation.altitude / 1000).toFixed(1)} km`}
                subtitle={`${fragmentation.altitude.toFixed(0)}m above ground`}
                color="text-cyan-400"
              />
            )}
            {fragmentation.details && (
              <StatCard
                label="Material Strength"
                value={`${fragmentation.details.strengthMPa.toFixed(1)} MPa`}
                subtitle={`Ram pressure: ${fragmentation.details.ramPressureMPa.toFixed(1)} MPa`}
                color="text-purple-400"
              />
            )}
            <StatCard
              label="Crater Formation"
              value={fragmentation.craterFormed ? 'YES' : 'NO'}
              subtitle={fragmentation.reachesGround ? 'Reaches ground' : 'Airburst only'}
              color={fragmentation.craterFormed ? 'text-red-400' : 'text-green-400'}
            />
          </div>

          {/* Scientific Note */}
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-sm text-blue-200">
              <span className="font-semibold">📖 Scientific Note:</span> {fragmentation.note}
            </div>
            <div className="text-xs text-white/50 mt-2">
              Model: {fragmentation.model} | Criterion: {fragmentation.details.fragmentationCriterion}
            </div>
          </div>
        </div>
      )}

      {/* Human Casualties */}
      <div className={`card ${casualties.severity === 'Extinction-Level Event' || casualties.severity === 'Mass Casualty Event' || casualties.severity === 'Catastrophic' ? 'glow-red border-2 border-red-500/50' : ''}`} role="region" aria-labelledby="casualties-heading" aria-live="polite">
        <h2 id="casualties-heading" className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span aria-hidden="true">⚠️</span> Human Impact Assessment
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatCard
            label="Estimated Fatalities"
            value={casualties.estimatedCasualties.toLocaleString()}
            subtitle={casualties.severity}
            color="text-red-400"
          />
          <StatCard
            label="Estimated Injured"
            value={casualties.estimatedInjured.toLocaleString()}
            subtitle="Requiring medical attention"
            color="text-orange-400"
          />
          <StatCard
            label="Total Affected"
            value={casualties.totalAffected.toLocaleString()}
            subtitle={casualties.affectedCities ? `${casualties.affectedCities.length} major cities` : 'Remote area'}
            color="text-yellow-400"
          />
        </div>

        {/* Casualties by Zone */}
        {casualties.zones && Object.keys(casualties.zones).length > 0 && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg" role="region" aria-labelledby="casualties-by-zone-heading">
          <h4 id="casualties-by-zone-heading" className="text-sm font-semibold mb-3 text-white/80">Casualties by Blast Zone:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {Object.entries(casualties.zones).map(([zoneName, zone]: [string, any]) => (
              <div key={zoneName} className="p-3 bg-white/5 rounded border border-white/10">
                <div className="font-semibold text-white capitalize mb-1">
                  {zoneName === 'fireball' && '🔴'}
                  {zoneName === 'thermal' && '🟠'}
                  {zoneName === 'airblast' && '🟡'}
                  {zoneName === 'radiation' && '🟢'}
                  {' '}
                  {zoneName.charAt(0).toUpperCase() + zoneName.slice(1)} Zone
                </div>
                <div className="text-xs text-white/70 space-y-1">
                  <div>Population: {zone.populationAffected.toLocaleString()}</div>
                  <div className="text-red-300">Deaths: {zone.casualties.toLocaleString()} ({(zone.mortalityRate * 100).toFixed(0)}%)</div>
                  <div className="text-orange-300">Injured: {zone.injured.toLocaleString()}</div>
                  <div className="text-white/50 italic">{zone.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Affected Cities */}
        {casualties.affectedCities && casualties.affectedCities.length > 0 && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg" role="region" aria-labelledby="affected-cities-heading">
            <h4 id="affected-cities-heading" className="text-sm font-semibold mb-3 text-red-200"><span aria-hidden="true">🏙️</span> Major Cities Affected:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {casualties.affectedCities.map((city) => (
                <div key={city.name} className="p-2 bg-white/5 rounded border border-red-500/20">
                  <div className="font-semibold text-white">{city.name}</div>
                  <div className="text-white/60">Population: {(city.population / 1000000).toFixed(1)}M</div>
                  <div className="text-red-300">Casualties: {(city.casualties / 1000).toFixed(0)}K ({city.casualtyRate}%)</div>
                  <div className="text-white/50">{city.distance} km from impact</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-xs text-yellow-200/80">
          ⚠️ {casualties.note}
        </div>
      </div>

      {/* Crater Data */}
      {crater && (
        <div className="card" role="region" aria-labelledby="crater-heading">
          <h3 id="crater-heading" className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span aria-hidden="true">🕳️</span> Crater Formation
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              label="Diameter"
              value={`${(crater.modifiedDiameter / 1000).toFixed(2)} km`}
              subtitle={`${crater.modifiedDiameter.toFixed(0)}m`}
              color="text-orange-400"
            />
            <StatCard
              label="Depth"
              value={`${(crater.modifiedDepth / 1000).toFixed(2)} km`}
              subtitle={`${crater.modifiedDepth.toFixed(0)}m`}
              color="text-orange-400"
            />
            <StatCard
              label="Volume"
              value={`${(crater.volume / 1e9).toExponential(2)} km³`}
              subtitle="Excavated material"
              color="text-orange-400"
            />
          </div>
        </div>
      )}

      {/* Seismic Effects */}
      <div className="card" role="region" aria-labelledby="seismic-heading">
        <h3 id="seismic-heading" className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span aria-hidden="true">📊</span> Seismic Effects
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            label="Magnitude"
            value={seismic.magnitude.toFixed(1)}
            subtitle={seismic.description}
            color="text-yellow-400"
          />
          <StatCard
            label="Felt Radius"
            value={`${(seismic.radiusKm / 1000).toFixed(1)} km`}
            subtitle="Earthquake zone"
            color="text-yellow-400"
          />
        </div>
      </div>

      {/* Blast Effects */}
      <div className="card" role="region" aria-labelledby="blast-heading">
        <h3 id="blast-heading" className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span aria-hidden="true">💨</span> Blast & Thermal Effects
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Fireball"
            value={`${(blast.fireball / 1000).toFixed(1)} km`}
            subtitle="Vaporization"
            color="text-red-400"
            size="sm"
          />
          <StatCard
            label="Thermal"
            value={`${(blast.thermalRadius / 1000).toFixed(1)} km`}
            subtitle="3rd degree burns"
            color="text-orange-400"
            size="sm"
          />
          <StatCard
            label="Airblast"
            value={`${(blast.airblastRadius / 1000).toFixed(1)} km`}
            subtitle="20 psi overpressure"
            color="text-purple-400"
            size="sm"
          />
          <StatCard
            label="Radiation"
            value={`${(blast.radiationRadius / 1000).toFixed(1)} km`}
            subtitle="500 rem"
            color="text-green-400"
            size="sm"
          />
        </div>
      </div>

      {/* Tsunami */}
      {tsunami && (
        <div className="card glow-red" role="alert" aria-labelledby="tsunami-heading">
          <h3 id="tsunami-heading" className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span aria-hidden="true">🌊</span> Tsunami Warning
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              label="Wave Height"
              value={`${tsunami.initialWaveHeight.toFixed(1)} m`}
              subtitle="Initial wave"
              color="text-cyan-400"
            />
            <StatCard
              label="Speed"
              value={`${tsunami.speedKmh.toFixed(0)} km/h`}
              subtitle={`${tsunami.propagationSpeed.toFixed(0)} m/s`}
              color="text-cyan-400"
            />
            <StatCard
              label="Affected Radius"
              value={`${tsunami.affectedRadiusKm.toFixed(0)} km`}
              subtitle="Coastal zones at risk"
              color="text-cyan-400"
            />
          </div>
        </div>
      )}

      {/* Zone Analysis */}
      <div className="card" role="region" aria-labelledby="zone-analysis-heading">
        <h3 id="zone-analysis-heading" className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span aria-hidden="true">🗺️</span> Impact Zone Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-white/60">Terrain Type:</span>
            <span className="ml-2 font-semibold">{zoneAnalysis.impactPoint.terrainType}</span>
          </div>
          <div>
            <span className="text-white/60">Location:</span>
            <span className="ml-2 font-semibold">{zoneAnalysis.terrainAnalysis.coastalProximity}</span>
          </div>
          <div>
            <span className="text-white/60">Population Risk:</span>
            <span className="ml-2 font-semibold text-red-400">{zoneAnalysis.populationRisk}</span>
          </div>
          <div>
            <span className="text-white/60">Tsunami Risk:</span>
            <span className="ml-2 font-semibold text-cyan-400">{zoneAnalysis.tsunamiRisk.risk}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  color,
  size = 'md',
}: {
  label: string;
  value: string;
  subtitle: string;
  color: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="bg-white/5 rounded-lg p-4" role="region" aria-label={`${label}: ${value}, ${subtitle}`}>
      <div className="text-xs text-white/60 mb-1">{label}</div>
      <div className={`${size === 'sm' ? 'text-xl' : 'text-2xl'} font-bold ${color}`} aria-live="polite">
        {value}
      </div>
      <div className="text-xs text-white/50 mt-1">{subtitle}</div>
    </div>
  );
}
