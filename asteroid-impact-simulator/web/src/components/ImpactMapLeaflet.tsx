import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents, Popup } from 'react-leaflet';
import { useSimulationStore } from '../store/useSimulationStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom impact marker
const impactIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgZmlsbD0iI2VmNDQ0NCIgZmlsbC1vcGFjaXR5PSIwLjgiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMjAiIHk9IjI2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjIwIiBmaWxsPSIjZmZmIj7wn5KlPC90ZXh0Pjwvc3ZnPg==',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

function MapClickHandler() {
  const { setImpactLocation } = useSimulationStore();

  useMapEvents({
    click: (e) => {
      setImpactLocation({
        lat: e.latlng.lat,
        lon: e.latlng.lng,
      });
    },
  });

  return null;
}

// Component to handle map view updates when impact location changes
function MapViewController() {
  const map = useMap();
  const { impactLocation, simulationResult } = useSimulationStore();

  useEffect(() => {
    if (impactLocation) {
      // Calculate appropriate zoom level based on blast radius
      let zoom = 8; // default zoom

      if (simulationResult && simulationResult.blast) {
        // Get the largest blast radius to determine zoom
        const maxRadius = Math.max(
          simulationResult.blast.fireball || 0,
          simulationResult.blast.thermalRadius || 0,
          simulationResult.blast.airblastRadius || 0,
          simulationResult.blast.radiationRadius || 0
        );

        // Adjust zoom based on blast radius (in meters)
        if (maxRadius > 500000) zoom = 5;       // > 500 km
        else if (maxRadius > 100000) zoom = 6;  // > 100 km
        else if (maxRadius > 50000) zoom = 7;   // > 50 km
        else if (maxRadius > 10000) zoom = 8;   // > 10 km
        else if (maxRadius > 5000) zoom = 9;    // > 5 km
        else if (maxRadius > 1000) zoom = 10;   // > 1 km
        else zoom = 11;                         // < 1 km
      }

      // Smoothly fly to impact location
      map.flyTo([impactLocation.lat, impactLocation.lon], zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [impactLocation, simulationResult, map]);

  return null;
}

// Keyboard navigation for map - Arrow keys to move marker
function KeyboardMapNavigation() {
  const map = useMap();
  const { impactLocation, setImpactLocation } = useSimulationStore();
  const [keyboardHintVisible, setKeyboardHintVisible] = useState(false);

  useEffect(() => {
    if (!map) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard when map container is focused
      if (!document.activeElement?.classList.contains('leaflet-container')) return;

      const moveStep = 0.5; // degrees (about 55km at equator)
      let newLat = impactLocation?.lat || 0;
      let newLon = impactLocation?.lon || 0;
      let moved = false;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newLat += moveStep;
          moved = true;
          break;
        case 'ArrowDown':
          e.preventDefault();
          newLat -= moveStep;
          moved = true;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newLon -= moveStep;
          moved = true;
          break;
        case 'ArrowRight':
          e.preventDefault();
          newLon += moveStep;
          moved = true;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          // Set impact at center of current view if no location set
          if (!impactLocation) {
            const center = map.getCenter();
            setImpactLocation({ lat: center.lat, lon: center.lng });
            moved = true;
          }
          break;
      }

      if (moved) {
        // Clamp latitude to valid range
        newLat = Math.max(-90, Math.min(90, newLat));
        // Wrap longitude
        newLon = ((newLon + 180) % 360) - 180;

        setImpactLocation({ lat: newLat, lon: newLon });
        setKeyboardHintVisible(false);
      }
    };

    const handleFocus = () => {
      setKeyboardHintVisible(true);
      // Hide hint after 3 seconds
      setTimeout(() => setKeyboardHintVisible(false), 3000);
    };

    const mapContainer = map.getContainer();
    mapContainer.addEventListener('keydown', handleKeyDown);
    mapContainer.addEventListener('focus', handleFocus);

    // Make map focusable
    mapContainer.setAttribute('tabindex', '0');

    return () => {
      mapContainer.removeEventListener('keydown', handleKeyDown);
      mapContainer.removeEventListener('focus', handleFocus);
    };
  }, [map, impactLocation, setImpactLocation]);

  return (
    <>
      {keyboardHintVisible && (
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
            ⌨️ Use arrow keys to move • Enter/Space to place marker
          </div>
        </div>
      )}
    </>
  );
}

export default function ImpactMapLeaflet() {
  const { impactLocation, simulationResult } = useSimulationStore();

  return (
    <div className="relative">
      {/* Screen reader instructions */}
      <div className="sr-only" role="status" aria-live="polite">
        {!impactLocation
          ? 'Interactive map: Click anywhere to select asteroid impact location'
          : `Impact location selected at latitude ${impactLocation.lat.toFixed(4)}, longitude ${impactLocation.lon.toFixed(4)}`}
      </div>

      <div
        role="application"
        aria-label="Interactive world map for selecting asteroid impact location. Click anywhere to set impact coordinates."
      >
        <MapContainer
          center={impactLocation ? [impactLocation.lat, impactLocation.lon] : [20, 0]}
          zoom={impactLocation ? 8 : 2}
          style={{ height: '500px', width: '100%', borderRadius: '0.5rem' }}
          className="z-0"
        >
        {/* OpenStreetMap - Clear and readable, FREE */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Map view controller - auto zoom to impact location */}
        <MapViewController />

        {/* Map click handler */}
        <MapClickHandler />

        {/* Keyboard navigation */}
        <KeyboardMapNavigation />

        {/* Impact marker and blast zones */}
        {impactLocation && (
          <>
            <Marker position={[impactLocation.lat, impactLocation.lon]} icon={impactIcon}>
              <Popup>
                <div>
                  <strong>Impact Point</strong>
                  <br />
                  Lat: {impactLocation.lat.toFixed(4)}°
                  <br />
                  Lon: {impactLocation.lon.toFixed(4)}°
                </div>
              </Popup>
            </Marker>

            {/* Blast zones if simulation result exists */}
            {simulationResult && (
              <>
                {/* Fireball */}
                <Circle
                  center={[impactLocation.lat, impactLocation.lon]}
                  radius={simulationResult.blast.fireball}
                  pathOptions={{
                    color: '#ff0000',
                    fillColor: '#ff0000',
                    fillOpacity: 0.5,
                  }}
                >
                  <Popup>
                    <div role="region" aria-label="Fireball zone details">
                      <strong>🔴 Fireball Zone</strong>
                      <br />
                      Radius: {(simulationResult.blast.fireball / 1000).toFixed(1)} km
                      <br />
                      Complete vaporization
                    </div>
                  </Popup>
                </Circle>

                {/* Thermal radiation */}
                <Circle
                  center={[impactLocation.lat, impactLocation.lon]}
                  radius={simulationResult.blast.thermalRadius}
                  pathOptions={{
                    color: '#ff6600',
                    fillColor: '#ff6600',
                    fillOpacity: 0.3,
                  }}
                >
                  <Popup>
                    <div role="region" aria-label="Thermal radiation zone details">
                      <strong>🟠 Thermal Radiation Zone</strong>
                      <br />
                      Radius: {(simulationResult.blast.thermalRadius / 1000).toFixed(1)} km
                      <br />
                      3rd degree burns
                    </div>
                  </Popup>
                </Circle>

                {/* Air blast */}
                <Circle
                  center={[impactLocation.lat, impactLocation.lon]}
                  radius={simulationResult.blast.airblastRadius}
                  pathOptions={{
                    color: '#ffcc00',
                    fillColor: '#ffcc00',
                    fillOpacity: 0.2,
                  }}
                >
                  <Popup>
                    <div role="region" aria-label="Air blast zone details">
                      <strong>🟡 Air Blast Zone</strong>
                      <br />
                      Radius: {(simulationResult.blast.airblastRadius / 1000).toFixed(1)} km
                      <br />
                      20 psi overpressure
                    </div>
                  </Popup>
                </Circle>

                {/* Radiation zone */}
                <Circle
                  center={[impactLocation.lat, impactLocation.lon]}
                  radius={simulationResult.blast.radiationRadius}
                  pathOptions={{
                    color: '#00ff00',
                    fillColor: '#00ff00',
                    fillOpacity: 0.15,
                  }}
                >
                  <Popup>
                    <div role="region" aria-label="Radiation zone details">
                      <strong>🟢 Radiation Zone</strong>
                      <br />
                      Radius: {(simulationResult.blast.radiationRadius / 1000).toFixed(1)} km
                      <br />
                      500 rem radiation dose
                    </div>
                  </Popup>
                </Circle>
              </>
            )}
          </>
        )}
      </MapContainer>
      </div>

      {/* Instructions overlay - Small centered at bottom */}
      {!impactLocation && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="text-center text-white bg-black/80 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-sm">
            <p className="text-xs font-medium">🎯 Click anywhere on the map to select impact location</p>
          </div>
        </div>
      )}

      {/* Info panel */}
      {impactLocation && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg" role="region" aria-label="Impact location coordinates">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/60">Latitude:</span>
              <span className="ml-2 font-semibold" aria-label={`Latitude: ${impactLocation.lat.toFixed(4)} degrees`}>{impactLocation.lat.toFixed(4)}°</span>
            </div>
            <div>
              <span className="text-white/60">Longitude:</span>
              <span className="ml-2 font-semibold" aria-label={`Longitude: ${impactLocation.lon.toFixed(4)} degrees`}>{impactLocation.lon.toFixed(4)}°</span>
            </div>
          </div>

          {simulationResult && (
            <div className="mt-3 pt-3 border-t border-white/10" role="region" aria-label="Blast zones summary">
              <div className="text-xs text-white/70 mb-2">Blast Zones:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Fireball: {(simulationResult.blast.fireball / 1000).toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Thermal: {(simulationResult.blast.thermalRadius / 1000).toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Air Blast: {(simulationResult.blast.airblastRadius / 1000).toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Radiation: {(simulationResult.blast.radiationRadius / 1000).toFixed(1)} km</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
