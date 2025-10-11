import { useSimulationStore } from '../store/useSimulationStore';
import { simulationAPI } from '../services/api';

export default function ParameterPanel() {
  const {
    asteroidParams,
    setAsteroidParams,
    impactLocation,
    isLoading,
    setSimulationStep,
    setLoading,
    setError,
    setSimulationResult,
  } = useSimulationStore();

  const handleSimulate = async () => {
    if (!impactLocation) {
      setSimulationStep('location');
      setError('Please select an impact location on the map');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { simulation, zoneAnalysis } = await simulationAPI.simulateImpact(
        asteroidParams,
        impactLocation
      );

      if (!simulation || !zoneAnalysis) {
        throw new Error('Invalid simulation response');
      }

      setSimulationResult(simulation, zoneAnalysis);
    } catch (error: any) {
      console.error('Simulation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Simulation failed. Please check API connection.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="glass-card h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-white">
        Parameters
      </h2>

      <div className="space-y-4 flex-1">
        {/* Diameter Slider */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-xs font-medium text-white/70">
              Diameter
            </label>
            <span className="text-lg font-bold text-blue-400">
              {asteroidParams.diameter.toLocaleString()}<span className="text-xs font-normal text-white/50 ml-1">m</span>
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="10000"
            step="10"
            value={asteroidParams.diameter}
            onChange={(e) => setAsteroidParams({ diameter: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Velocity Slider */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-xs font-medium text-white/70">
              Velocity
            </label>
            <span className="text-lg font-bold text-cyan-400">
              {asteroidParams.velocity}<span className="text-xs font-normal text-white/50 ml-1">km/s</span>
            </span>
          </div>
          <input
            type="range"
            min="11"
            max="72"
            step="1"
            value={asteroidParams.velocity}
            onChange={(e) => setAsteroidParams({ velocity: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Impact Angle Slider */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-xs font-medium text-white/70">
              Impact Angle
            </label>
            <span className="text-lg font-bold text-purple-400">
              {asteroidParams.angle}°
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={asteroidParams.angle}
            onChange={(e) => setAsteroidParams({ angle: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Density Slider */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-xs font-medium text-white/70">
              Density
            </label>
            <span className="text-lg font-bold text-green-400">
              {asteroidParams.density.toLocaleString()}<span className="text-xs font-normal text-white/50 ml-1">kg/m³</span>
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="8000"
            step="100"
            value={asteroidParams.density}
            onChange={(e) => setAsteroidParams({ density: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Composition Selector */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-2">
            Composition
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'rocky', label: 'Rocky', emoji: '🪨', density: 3000 },
              { value: 'iron', label: 'Iron', emoji: '⚙️', density: 7800 },
              { value: 'icy', label: 'Icy', emoji: '❄️', density: 1000 },
            ].map((comp) => (
              <button
                key={comp.value}
                onClick={() => setAsteroidParams({ composition: comp.value as any, density: comp.density })}
                className={`p-2 rounded-lg text-xs font-medium transition-all border-2 ${
                  asteroidParams.composition === comp.value
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                    : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                <div className="text-lg mb-0.5">{comp.emoji}</div>
                {comp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Simulate Button */}
        <button
          onClick={handleSimulate}
          disabled={isLoading || !impactLocation}
          className={`w-full py-3 font-bold rounded-xl transition-all shadow-lg ${
            isLoading
              ? 'bg-gray-500 cursor-wait'
              : impactLocation
              ? 'bg-blue-500 hover:bg-blue-600 hover:shadow-xl cursor-pointer'
              : 'bg-gray-600 cursor-not-allowed'
          } text-white`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculating Impact...
            </span>
          ) : impactLocation ? (
            '🚀 Simulate Impact'
          ) : (
            '⚠️ Select Location'
          )}
        </button>
      </div>
    </div>
  );
}
