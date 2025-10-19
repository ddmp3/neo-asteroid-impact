import { useState, useEffect } from 'react';
import { useSimulationStore } from './store/useSimulationStore';
import { healthAPI } from './services/api';
import Header from './components/Header';
import ParameterPanel from './components/ParameterPanel';
import ImpactMapLeaflet from './components/ImpactMapLeaflet';
import ResultsDashboard from './components/ResultsDashboard';
import LoadingScreen from './components/LoadingScreen';
import ErrorBanner from './components/ErrorBanner';
import EducationalTooltips from './components/EducationalTooltips';
import ScenarioSelector from './components/ScenarioSelector';

function App() {
  const [apiHealth, setApiHealth] = useState<'checking' | 'healthy' | 'error'>('checking');
  const { viewMode, simulationStep, isLoading, error, setError, setViewMode } = useSimulationStore();

  useEffect(() => {
    // Check API health on mount
    healthAPI
      .checkHealth()
      .then(() => setApiHealth('healthy'))
      .catch(() => setApiHealth('error'));
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key - Clear error or return to simulation view
      if (e.key === 'Escape') {
        if (error) {
          setError(null);
        } else if (viewMode !== 'simulation') {
          setViewMode('simulation');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [error, viewMode, setError, setViewMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Header apiHealth={apiHealth} />

      {error && <ErrorBanner message={error} />}

      {isLoading && <LoadingScreen />}

      <main id="main-content" role="main" aria-label="Main application content">
        {/* Show different views based on viewMode */}
        {viewMode === 'scenario' ? (
          <div className="container mx-auto px-4 py-6">
            <ScenarioSelector />
          </div>
        ) : viewMode === 'education' ? (
          <div className="container mx-auto px-4 py-6">
            <EducationalTooltips />
          </div>
        ) : (
          <div className="container mx-auto px-4 py-6">
            {/* Top Section - Parameters and Map */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Left Panel - Parameters */}
              <div className="lg:col-span-1">
                <ParameterPanel />
              </div>

              {/* Right Panel - Map */}
              <div className="lg:col-span-2">
                <div className="glass-card">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                    <span>🌍</span> Impact Location
                  </h2>
                  <ImpactMapLeaflet />
                </div>
              </div>
            </div>

            {/* Bottom Section - Full Width Results */}
            {simulationStep === 'results' && (
              <div className="w-full">
                <ResultsDashboard />
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  );
}

export default App;
