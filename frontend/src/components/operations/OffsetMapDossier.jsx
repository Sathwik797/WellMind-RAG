import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { Globe, Locate, Maximize2, Minimize2, Eye, ShieldAlert, FileText } from "lucide-react";
import { getWellFullDetails, getWellEvents } from "../../api/wellApi";


const TILES = {
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
};

function createPinIcon(color = "#38BDF8", size = 16, isCurrent = false) {
  const border = isCurrent ? "3px solid #FFFFFF" : "2px solid rgba(255,255,255,0.85)";
  const ring = isCurrent ? `0 0 0 3px ${color}, 0 0 12px ${color}` : `0 2px 5px rgba(0,0,0,0.5)`;
  return L.divIcon({
    className: "custom-map-pin",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:${ring};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function RecenterMap({ center, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, trigger]);
  return null;
}

export default function OffsetMapDossier({
  currentWell,
  nearbyWells = [],
  similarWells = [],
  radiusKm = 8,
  onRadiusChange,
  onSelectOffsetForRag,
}) {
  const [satellite, setSatellite] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [selectedWell, setSelectedWell] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'events_only' | 'high_similarity'

  const center = currentWell?.lat && currentWell?.lng ? [currentWell.lat, currentWell.lng] : [27.4728, 95.3372];

  async function handleMarkerSelect(w) {
    setSelectedWell(w);
    setLoadingEvents(true);
    try {
      const res = await getWellEventsReal(w.wellId);
      setEvents(res.events || []);
    } catch (e) {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  // Filter nearby wells based on selection mode
  const displayedWells = nearbyWells.filter((w) => {
    if (filterMode === "high_similarity") {
      return similarWells.some((s) => s.wellId === w.wellId);
    }
    return true;
  });

  return (
    <div className="offset-spatial-card">
      <div className="spatial-header">
        <div className="sh-title-group">
          <span className="sh-title">OFFSET WELL SPATIAL INTELLIGENCE</span>
          <span className="sh-sub">Proximity vectors · Geological setting · Borehole event correlation</span>
        </div>

        {/* Toolbar Controls */}
        <div className="sh-controls">
          <div className="radius-input-pill">
            <span>RADIUS:</span>
            <input
              type="range"
              min="1"
              max="25"
              value={radiusKm}
              onChange={(e) => onRadiusChange && onRadiusChange(Number(e.target.value))}
            />
            <span className="radius-val">{radiusKm}km</span>
          </div>

          <div className="map-view-toggles">
            <button
              className={`map-view-btn ${!satellite ? "active" : ""}`}
              onClick={() => setSatellite(false)}
            >
              STREET
            </button>
            <button
              className={`map-view-btn ${satellite ? "active" : ""}`}
              onClick={() => setSatellite(true)}
            >
              SATELLITE
            </button>
            <button
              className="map-recenter-btn"
              title="Recenter on current active well"
              onClick={() => setRecenterTrigger((t) => t + 1)}
            >
              <Locate size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="spatial-content-split">
        {/* Left Map Viewport */}
        <div className="spatial-map-container">
          <MapContainer
            center={center}
            zoom={11}
            style={{ width: "100%", height: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url={satellite ? TILES.satellite.url : TILES.streets.url}
              attribution={satellite ? TILES.satellite.attribution : TILES.streets.attribution}
            />
            <RecenterMap center={center} trigger={recenterTrigger} />

            {/* Current Well Search Radius */}
            <Circle
              center={center}
              radius={radiusKm * 1000}
              pathOptions={{
                color: "#38BDF8",
                dashArray: "4 4",
                fillColor: "#0284C7",
                fillOpacity: 0.08,
                weight: 1.5,
              }}
            />

            {/* Current Well Marker */}
            {currentWell?.lat && (
              <Marker
                position={[currentWell.lat, currentWell.lng]}
                icon={createPinIcon("#38BDF8", 22, true)}
                eventHandlers={{ click: () => handleMarkerSelect(currentWell) }}
              >
                <Tooltip permanent direction="top" offset={[0, -12]} className="ops-map-tooltip current">
                  ● ACTIVE: {currentWell.wellId}
                </Tooltip>
              </Marker>
            )}

            {/* Offset Wells Markers */}
            {displayedWells.map((w) => {
              const isSimilar = similarWells.some((s) => s.wellId === w.wellId);
              const pinColor = isSimilar ? "#F59E0B" : "#10B981";

              return (
                <Marker
                  key={w.wellId}
                  position={[w.lat, w.lng]}
                  icon={createPinIcon(pinColor, 16, false)}
                  eventHandlers={{ click: () => handleMarkerSelect(w) }}
                >
                  <Tooltip direction="top" offset={[0, -8]} className="ops-map-tooltip">
                    {w.wellId} · {w.wellName} {isSimilar ? "(Offset Match)" : ""}
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map Overlay Legend */}
          <div className="map-industrial-legend">
            <span className="leg-dot current" /> Active Well ({currentWell?.wellId || "Current"})
            <span className="leg-dot match" /> Ranked Offset Match
            <span className="leg-dot nominal" /> Offset Field Well
          </div>
        </div>

        {/* Right Offset Intelligence Dossier */}
        <div className="spatial-dossier-panel">
          <div className="dossier-top">
            <span className="dossier-tag">OFFSET WELL DOSSIER</span>
            {selectedWell && (
              <span className="dossier-id">{selectedWell.wellId} — {selectedWell.wellName}</span>
            )}
          </div>

          {!selectedWell ? (
            <div className="dossier-empty">
              <Eye size={24} className="empty-icon" />
              <p>Click any offset well pin on the map to inspect its borehole history, formation correlation, and past NPT incidents.</p>
            </div>
          ) : (
            <div className="dossier-body">
              <div className="dossier-meta-grid">
                <div className="meta-item">
                  <span className="lbl">FORMATION</span>
                  <span className="val">{selectedWell.formation || "Alluvium_Top"}</span>
                </div>
                <div className="meta-item">
                  <span className="lbl">FIELD / BLOCK</span>
                  <span className="val">{selectedWell.field || "—"} / {selectedWell.block || "—"}</span>
                </div>
                <div className="meta-item">
                  <span className="lbl">TOTAL DEPTH</span>
                  <span className="val">{selectedWell.totalDepth ? `${selectedWell.totalDepth}m` : "3,200m"}</span>
                </div>
                <div className="meta-item">
                  <span className="lbl">STATUS</span>
                  <span className="val">{selectedWell.status || "Completed"}</span>
                </div>
              </div>

              {/* Historical Borehole Events on this Offset Well */}
              <div className="dossier-events-section">
                <div className="events-header">
                  <ShieldAlert size={14} />
                  <span>RECORDED NPT / BOREHOLE INCIDENTS ({events.length})</span>
                </div>

                {loadingEvents ? (
                  <div className="events-loading">Querying offset event logs…</div>
                ) : events.length === 0 ? (
                  <div className="events-clean">No critical NPT events recorded on this offset well.</div>
                ) : (
                  <div className="events-timeline-list">
                    {events.map((e, idx) => (
                      <div key={idx} className="event-item-card">
                        <div className="evt-row-top">
                          <span className="evt-type-badge">{e.type?.replace(/_/g, " ").toUpperCase()}</span>
                          <span className="evt-depth-tag">DEPTH: {e.depth}m</span>
                        </div>
                        <div className="evt-desc">{e.description}</div>
                        <div className="evt-mitigation">
                          <span className="mit-lbl">APPLIED MITIGATION:</span>
                          <span className="mit-text">{e.mitigation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action to Correlate with WellMind */}
              {onSelectOffsetForRag && (
                <button
                  className="dossier-rag-btn"
                  onClick={() => onSelectOffsetForRag(selectedWell)}
                >
                  <FileText size={14} />
                  Correlate Playbook &amp; DDR in WellMind →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
