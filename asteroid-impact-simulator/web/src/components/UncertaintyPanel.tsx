import { useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { simulationAPI } from '../services/api';
import type { MonteCarloParams } from '../types';

export default function UncertaintyPanel() {
  const {
    asteroidParams,
    impactLocation,
    monteCarloResult,
    setMonteCarloResult,
    setLoading,
    setError,
  } = useSimulationStore();

  const [nSamples, setNSamples] = useState(1000);
  const [includeVisualization, setIncludeVisualization] = useState(true);
  const [includeDecomposition, setIncludeDecomposition] = useState(true);
  const [selectedOutput, setSelectedOutput] = useState<string>('craterDiameter');

  const handleRunMonteCarlo = async () => {
    if (!impactLocation) {
      setError('Please select an impact location first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params: MonteCarloParams = {
        diameter: asteroidParams.diameter,
        velocity: asteroidParams.velocity,
        angle: asteroidParams.angle,
        density: asteroidParams.density,
        composition: asteroidParams.composition,
        latitude: impactLocation.lat,
        longitude: impactLocation.lon,
        nSamples,
        includeVisualization,
        includeDecomposition,
      };

      const result = await simulationAPI.simulateUncertainty(params);
      setMonteCarloResult(result);
    } catch (err: any) {
      console.error('Monte Carlo simulation error:', err);
      setError(err.response?.data?.message || 'Monte Carlo simulation failed');
      setLoading(false);
    }
  };

  const formatNumber = (num: number | undefined, decimals: number = 2): string => {
    if (num === undefined || num === null) return 'N/A';
    return num.toFixed(decimals);
  };

  const getOutputLabel = (key: string): string => {
    const labels: Record<string, string> = {
      craterDiameter: 'Crater Diameter (m)',
      impactEnergy: 'Impact Energy (J)',
      seismicMagnitude: 'Seismic Magnitude',
    };
    return labels[key] || key;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card">
        <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2">
          <span>🎲</span> Uncertainty Quantification
        </h2>
        <p className="text-white/70 text-sm">
          Monte Carlo simulation to quantify uncertainties in impact predictions
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="glass-card">
        <h3 className="text-xl font-semibold mb-4 text-white">Simulation Configuration</h3>

        <div className="space-y-4">
          {/* Number of Samples */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Number of Samples: <span className="text-cyan-400">{nSamples}</span>
            </label>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={nSamples}
              onChange={(e) => setNSamples(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>100 (Fast)</span>
              <span>10,000 (Accurate)</span>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={includeVisualization}
                onChange={(e) => setIncludeVisualization(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Include Visualization Data (PDF/CDF)</span>
            </label>
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={includeDecomposition}
                onChange={(e) => setIncludeDecomposition(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Include Sensitivity Analysis (Sobol)</span>
            </label>
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunMonteCarlo}
            disabled={!impactLocation}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all shadow-lg disabled:cursor-not-allowed"
          >
            {impactLocation ? 'Run Monte Carlo Simulation' : 'Select Impact Location First'}
          </button>

          {/* Current Parameters Display */}
          <div className="bg-white/5 rounded-lg p-3 text-sm space-y-1">
            <div className="text-white/70 font-medium mb-2">Current Parameters:</div>
            <div className="grid grid-cols-2 gap-2 text-white/60">
              <div>Diameter: {asteroidParams.diameter} m</div>
              <div>Velocity: {asteroidParams.velocity} km/s</div>
              <div>Angle: {asteroidParams.angle}°</div>
              <div>Density: {asteroidParams.density} kg/m³</div>
            </div>
            {impactLocation && (
              <div className="text-white/60 mt-2">
                Location: {impactLocation.lat.toFixed(2)}°, {impactLocation.lon.toFixed(2)}°
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {monteCarloResult && (
        <>
          {/* Metadata */}
          <div className="glass-card">
            <h3 className="text-xl font-semibold mb-4 text-white">Simulation Metadata</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/60 text-xs mb-1">Samples</div>
                <div className="text-white text-lg font-semibold">
                  {monteCarloResult.metadata.nSamples}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/60 text-xs mb-1">Success Rate</div>
                <div className="text-white text-lg font-semibold">
                  {(monteCarloResult.metadata.successRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/60 text-xs mb-1">Computation Time</div>
                <div className="text-white text-lg font-semibold">
                  {(monteCarloResult.metadata.computationTime / 1000).toFixed(2)}s
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/60 text-xs mb-1">Timestamp</div>
                <div className="text-white text-xs font-mono">
                  {new Date(monteCarloResult.metadata.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="glass-card">
            <h3 className="text-xl font-semibold mb-4 text-white">Statistical Results</h3>

            {/* Output Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-white">
                Select Output Variable:
              </label>
              <select
                value={selectedOutput}
                onChange={(e) => setSelectedOutput(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                {Object.keys(monteCarloResult.statistics).map((key) => (
                  <option key={key} value={key}>
                    {getOutputLabel(key)}
                  </option>
                ))}
              </select>
            </div>

            {/* Statistics Table */}
            {monteCarloResult.statistics[selectedOutput] && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-2 px-3 text-white/70 font-medium">Statistic</th>
                      <th className="text-right py-2 px-3 text-white/70 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    <tr className="border-b border-white/10">
                      <td className="py-2 px-3">Mean</td>
                      <td className="text-right py-2 px-3 font-mono">
                        {formatNumber(monteCarloResult.statistics[selectedOutput]?.mean)}
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-2 px-3">Median</td>
                      <td className="text-right py-2 px-3 font-mono">
                        {formatNumber(monteCarloResult.statistics[selectedOutput]?.median)}
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-2 px-3">Std. Deviation</td>
                      <td className="text-right py-2 px-3 font-mono">
                        {formatNumber(monteCarloResult.statistics[selectedOutput]?.std)}
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-2 px-3">Min</td>
                      <td className="text-right py-2 px-3 font-mono">
                        {formatNumber(monteCarloResult.statistics[selectedOutput]?.min)}
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-2 px-3">Max</td>
                      <td className="text-right py-2 px-3 font-mono">
                        {formatNumber(monteCarloResult.statistics[selectedOutput]?.max)}
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-2 px-3">5th Percentile</td>
                      <td className="text-right py-2 px-3 font-mono">
                        {formatNumber(monteCarloResult.statistics[selectedOutput]?.percentiles?.p5)}
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-2 px-3">95th Percentile</td>
                      <td className="text-right py-2 px-3 font-mono">
                        {formatNumber(monteCarloResult.statistics[selectedOutput]?.percentiles?.p95)}
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-2 px-3">95% Confidence Interval</td>
                      <td className="text-right py-2 px-3 font-mono">
                        [{formatNumber(monteCarloResult.statistics[selectedOutput]?.confidenceInterval?.lower)},
                        {formatNumber(monteCarloResult.statistics[selectedOutput]?.confidenceInterval?.upper)}]
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sensitivity Analysis */}
          {monteCarloResult.sensitivity && includeDecomposition && (
            <div className="glass-card">
              <h3 className="text-xl font-semibold mb-4 text-white">
                Sensitivity Analysis (Sobol Indices)
              </h3>
              <p className="text-white/70 text-sm mb-4">
                Shows which input parameters have the most influence on each output variable
              </p>

              {monteCarloResult.sensitivity[selectedOutput] && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2 px-3 text-white/70 font-medium">Parameter</th>
                        <th className="text-right py-2 px-3 text-white/70 font-medium">
                          First Order
                        </th>
                        <th className="text-right py-2 px-3 text-white/70 font-medium">
                          Total Order
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      {Object.entries(monteCarloResult.sensitivity[selectedOutput]).map(
                        ([param, indices]) => (
                          <tr key={param} className="border-b border-white/10">
                            <td className="py-2 px-3 capitalize">{param}</td>
                            <td className="text-right py-2 px-3">
                              <div className="flex items-center justify-end gap-2">
                                <div
                                  className="h-2 bg-blue-500 rounded"
                                  style={{
                                    width: `${Math.max(0, Math.min(100, indices.firstOrder * 100))}%`,
                                  }}
                                />
                                <span className="font-mono text-xs w-12">
                                  {(indices.firstOrder * 100).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="text-right py-2 px-3">
                              <div className="flex items-center justify-end gap-2">
                                <div
                                  className="h-2 bg-cyan-500 rounded"
                                  style={{
                                    width: `${Math.max(0, Math.min(100, indices.totalOrder * 100))}%`,
                                  }}
                                />
                                <span className="font-mono text-xs w-12">
                                  {(indices.totalOrder * 100).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Visualization (Box Plot) */}
          {monteCarloResult.visualization && includeVisualization && (
            <div className="glass-card">
              <h3 className="text-xl font-semibold mb-4 text-white">
                Distribution Visualization
              </h3>

              {monteCarloResult.visualization[selectedOutput] && (
                <div className="space-y-6">
                  {/* Box Plot */}
                  <div>
                    <h4 className="text-white/70 text-sm font-medium mb-3">Box Plot</h4>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="relative h-20 flex items-center">
                        {(() => {
                          const boxPlot =
                            monteCarloResult.visualization[selectedOutput].boxPlot;
                          const range = boxPlot.max - boxPlot.min;
                          const scale = (val: number) =>
                            ((val - boxPlot.min) / range) * 100;

                          return (
                            <>
                              {/* Min to Max line */}
                              <div
                                className="absolute h-0.5 bg-white/30"
                                style={{
                                  left: `${scale(boxPlot.min)}%`,
                                  right: `${100 - scale(boxPlot.max)}%`,
                                  top: '50%',
                                }}
                              />
                              {/* Box (Q1 to Q3) */}
                              <div
                                className="absolute h-12 bg-blue-500/50 border-2 border-blue-400 rounded"
                                style={{
                                  left: `${scale(boxPlot.q1)}%`,
                                  right: `${100 - scale(boxPlot.q3)}%`,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                }}
                              >
                                {/* Median line */}
                                <div
                                  className="absolute h-full w-0.5 bg-cyan-400"
                                  style={{
                                    left: `${((boxPlot.median - boxPlot.q1) / (boxPlot.q3 - boxPlot.q1)) * 100}%`,
                                  }}
                                />
                              </div>
                              {/* Labels */}
                              <div className="absolute w-full" style={{ top: '70px' }}>
                                <div
                                  className="absolute text-xs text-white/60"
                                  style={{ left: `${scale(boxPlot.min)}%`, transform: 'translateX(-50%)' }}
                                >
                                  {formatNumber(boxPlot.min, 1)}
                                </div>
                                <div
                                  className="absolute text-xs text-white"
                                  style={{ left: `${scale(boxPlot.median)}%`, transform: 'translateX(-50%)' }}
                                >
                                  {formatNumber(boxPlot.median, 1)}
                                </div>
                                <div
                                  className="absolute text-xs text-white/60"
                                  style={{ left: `${scale(boxPlot.max)}%`, transform: 'translateX(-50%)' }}
                                >
                                  {formatNumber(boxPlot.max, 1)}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Distribution Info */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-white/60 text-xs">Min</div>
                      <div className="text-white font-mono">
                        {formatNumber(monteCarloResult.visualization[selectedOutput].boxPlot.min)}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-white/60 text-xs">Q1</div>
                      <div className="text-white font-mono">
                        {formatNumber(monteCarloResult.visualization[selectedOutput].boxPlot.q1)}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-white/60 text-xs">Median</div>
                      <div className="text-cyan-400 font-mono font-semibold">
                        {formatNumber(monteCarloResult.visualization[selectedOutput].boxPlot.median)}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-white/60 text-xs">Q3</div>
                      <div className="text-white font-mono">
                        {formatNumber(monteCarloResult.visualization[selectedOutput].boxPlot.q3)}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-white/60 text-xs">Max</div>
                      <div className="text-white font-mono">
                        {formatNumber(monteCarloResult.visualization[selectedOutput].boxPlot.max)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}