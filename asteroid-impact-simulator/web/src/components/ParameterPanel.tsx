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
            <label htmlFor="diameter-slider" className="text-xs font-medium text-white/70">
              Diameter
            </label>
            <span id="diameter-value" className="text-lg font-bold text-blue-400" aria-live="polite">
              {asteroidParams.diameter.toLocaleString()}<span className="text-xs font-normal text-white/50 ml-1">m</span>
            </span>
          </div>
          <input
            id="diameter-slider"
            type="range"
            min="10"
            max="10000"
            step="10"
            value={asteroidParams.diameter}
            onChange={(e) => setAsteroidParams({ diameter: Number(e.target.value) })}
            className="w-full"
            aria-label="Asteroid diameter in meters"
            aria-valuemin={10}
            aria-valuemax={10000}
            aria-valuenow={asteroidParams.diameter}
            aria-valuetext={`${asteroidParams.diameter} meters`}
            role="slider"
          />
        </div>

        {/* Velocity Slider */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label htmlFor="velocity-slider" className="text-xs font-medium text-white/70">
              Velocity
            </label>
            <span id="velocity-value" className="text-lg font-bold text-cyan-400" aria-live="polite">
              {asteroidParams.velocity}<span className="text-xs font-normal text-white/50 ml-1">km/s</span>
            </span>
          </div>
          <input
            id="velocity-slider"
            type="range"
            min="11"
            max="72"
            step="1"
            value={asteroidParams.velocity}
            onChange={(e) => setAsteroidParams({ velocity: Number(e.target.value) })}
            className="w-full"
            aria-label="Impact velocity in kilometers per second"
            aria-valuemin={11}
            aria-valuemax={72}
            aria-valuenow={asteroidParams.velocity}
            aria-valuetext={`${asteroidParams.velocity} kilometers per second`}
            role="slider"
          />
        </div>

        {/* Impact Angle Slider */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label htmlFor="angle-slider" className="text-xs font-medium text-white/70">
              Impact Angle
            </label>
            <span id="angle-value" className="text-lg font-bold text-purple-400" aria-live="polite">
              {asteroidParams.angle}°
            </span>
          </div>
          <input
            id="angle-slider"
            type="range"
            min="0"
            max="90"
            step="5"
            value={asteroidParams.angle}
            onChange={(e) => setAsteroidParams({ angle: Number(e.target.value) })}
            className="w-full"
            aria-label="Impact angle in degrees from horizontal"
            aria-valuemin={0}
            aria-valuemax={90}
            aria-valuenow={asteroidParams.angle}
            aria-valuetext={`${asteroidParams.angle} degrees`}
            role="slider"
          />
        </div>

        {/* Density Slider */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label htmlFor="density-slider" className="text-xs font-medium text-white/70">
              Density
            </label>
            <span id="density-value" className="text-lg font-bold text-green-400" aria-live="polite">
              {asteroidParams.density.toLocaleString()}<span className="text-xs font-normal text-white/50 ml-1">kg/m³</span>
            </span>
          </div>
          <input
            id="density-slider"
            type="range"
            min="1000"
            max="8000"
            step="100"
            value={asteroidParams.density}
            onChange={(e) => setAsteroidParams({ density: Number(e.target.value) })}
            className="w-full"
            aria-label="Asteroid density in kilograms per cubic meter"
            aria-valuemin={1000}
            aria-valuemax={8000}
            aria-valuenow={asteroidParams.density}
            aria-valuetext={`${asteroidParams.density} kilograms per cubic meter`}
            role="slider"
          />
        </div>

        {/* Composition Selector */}
        <div
          role="radiogroup"
          aria-labelledby="composition-label"
          onKeyDown={(e) => {
            const compositions = ['rocky', 'iron', 'icy'];
            const currentIndex = compositions.indexOf(asteroidParams.composition);
            const densities = [3000, 7800, 1000];

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault();
              const nextIndex = (currentIndex + 1) % compositions.length;
              setAsteroidParams({ composition: compositions[nextIndex] as any, density: densities[nextIndex] });
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault();
              const prevIndex = (currentIndex - 1 + compositions.length) % compositions.length;
              setAsteroidParams({ composition: compositions[prevIndex] as any, density: densities[prevIndex] });
            }
          }}
        >
          <label id="composition-label" className="block text-xs font-medium text-white/70 mb-2">
            Composition
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'rocky', label: 'Rocky', emoji: '🪨', density: 3000 },
              { value: 'iron', label: 'Iron', emoji: '⚙️', density: 7800 },
              { value: 'icy', label: 'Icy', emoji: '❄️', density: 1000 },
            ].map((comp, index) => (
              <button
                key={comp.value}
                onClick={() => setAsteroidParams({ composition: comp.value as any, density: comp.density })}
                role="radio"
                tabIndex={asteroidParams.composition === comp.value ? 0 : -1}
                aria-checked={asteroidParams.composition === comp.value}
                aria-label={`${comp.label} asteroid composition, density ${comp.density} kg/m³`}
                className={`p-2 rounded-lg text-xs font-medium transition-all border-2 ${
                  asteroidParams.composition === comp.value
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                    : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                <div className="text-lg mb-0.5" aria-hidden="true">{comp.emoji}</div>
                {comp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Simulate Button */}
        <button
          onClick={handleSimulate}
          disabled={isLoading || !impactLocation}
          aria-label={
            isLoading
              ? 'Simulation in progress, please wait'
              : impactLocation
              ? 'Run asteroid impact simulation with current parameters'
              : 'Select impact location on map before simulating'
          }
          aria-busy={isLoading}
          aria-disabled={!impactLocation}
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
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Calculating Impact...</span>
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
