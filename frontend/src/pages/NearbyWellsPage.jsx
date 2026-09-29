import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Globe,
  Locate,
  Maximize2,
  Minimize2,
  Filter,
  Layers,
  ShieldAlert,
  FileText,
  Compass,
  ArrowRight,
  Database,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Search
} from "lucide-react";
import { useWell } from "../context/WellContext";
import {
  getWellByWellId,
  getNearbyWellsReal,
  getSimilarWellsReal,
  getWellEvents,
  getWellFullDetails
} from "../api/wellApi";

// Convert GeoJSON coordinates [lng, lat] to { lat, lng }
function toLatLng(well) {
  if (!well?.location?.coordinates) return null;
  const [lng, lat] = well.location.coordinates;
  return { lat, lng };
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

const TILES = {
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
  },
};

function createPin(color = "#38BDF8", size = 18, isActive = false) {
  const border = isActive ? "3px solid #FFFFFF" : "2px solid rgba(255,255,255,0.9)";
  const ring = isActive
    ? `0 0 0 3px ${color}, 0 0 16px ${color}`
    : `0 2px 6px rgba(0,0,0,0.6)`;
  return L.divIcon({
    className: "ops-marker-pin",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:${ring};display:flex;align-items:center;justify-content:center;">${
      isActive ? '<div style="width:5px;height:5px;border-radius:50%;background:#FFF;"></div>' : ''
    }</div>`,
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

export default function NearbyWellsPage() {
  const navigate = useNavigate();
  const { activeWell, setActiveWell } = useWell();

  const [radiusKm, setRadiusKm] = useState(15);
  const [satellite, setSatellite] = useState(false);
  const [formationFilter, setFormationFilter] = useState("ALL");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [fullscreen, setFullscreen] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const [currentWell, setCurrentWell] = useState(null);
  const [nearbyWells, setNearbyWells] = useState([]);
  const [similarWells, setSimilarWells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected offset well dossier
  const [selectedOffset, setSelectedOffset] = useState(null);
  const [offsetEvents, setOffsetEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Fallback active well data if none set
  const wellId = activeWell?.id || activeWell?.wellId || "W001";
  const wellDisplayName = activeWell?.name || activeWell?.wellName || "OIL-BHK-142";

  // 1. Fetch current well
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getWellByWellId(wellId)
      .then((well) => {
        if (!isMounted) return;
        const coords = toLatLng(well);
        const resolved = {
          ...well,
          lat: coords?.lat || 26.11218,
          lng: coords?.lng || 82.6655,
          formation: well.formation || "Barail Sandstone",
          totalDepth: well.totalDepth || 3050,
        };
        setCurrentWell(resolved);
        // Automatically select active well initially
        setSelectedOffset(resolved);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Failed to load active well coordinates, using field defaults:", err.message);
        const fallback = {
          wellId: "W001",
          wellName: "OIL-BHK-142",
          lat: 26.11218,
          lng: 82.6655,
          field: "Upper Assam",
          block: "Block-1",
          formation: "Barail Sandstone",
          totalDepth: 3050,
          status: "Drilling",
        };
        setCurrentWell(fallback);
        setSelectedOffset(fallback);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [wellId]);

  // 2. Fetch nearby wells and similar wells
  useEffect(() => {
    if (!currentWell?.lat || !currentWell?.lng) return;

    let isMounted = true;

    // Fetch nearby
    getNearbyWellsReal(currentWell.lat, currentWell.lng, radiusKm)
      .then((wells) => {
        if (!isMounted) return;
        const enriched = (wells || [])
          .filter((w) => w.wellId !== currentWell.wellId)
          .map((w) => {
            const coords = toLatLng(w);
            return {
              ...w,
              lat: coords ? coords.lat : w.lat,
              lng: coords ? coords.lng : w.lng,
              distanceKm: calculateDistanceKm(currentWell.lat, currentWell.lng, coords?.lat, coords?.lng),
            };
          });
        setNearbyWells(enriched);
      })
      .catch((err) => {
        console.warn("Nearby wells fetch error:", err.message);
      });

    // Fetch similar wells
    getSimilarWellsReal(currentWell.wellId, 10)
      .then((similar) => {
        if (!isMounted) return;
        setSimilarWells(similar || []);
      })
      .catch(() => {
        if (isMounted) setSimilarWells([]);
      });

    return () => {
      isMounted = false;
    };
  }, [currentWell, radiusKm]);

  // 3. When an offset well is selected, fetch its borehole historical events
  async function handleSelectWell(well) {
    setSelectedOffset(well);
    setLoadingEvents(true);
    try {
      const res = await getWellEvents(well.wellId);
      setOffsetEvents(res || []);
    } catch {
      setOffsetEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  // Initial event fetch for selected well
  useEffect(() => {
    if (selectedOffset?.wellId) {
      handleSelectWell(selectedOffset);
    }
  }, [selectedOffset?.wellId]);

  // Filter nearby wells by formation and event
  const filteredNearby = nearbyWells.filter((w) => {
    if (formationFilter !== "ALL" && w.formation && !w.formation.toLowerCase().includes(formationFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const centerCoord = currentWell?.lat && currentWell?.lng ? [currentWell.lat, currentWell.lng] : [26.11218, 82.6655];

  return (
    <div className={`ops-workspace-page ${fullscreen ? "page-fullscreen" : ""}`}>
      {/* 1. Industrial Top Status & Filter Bar */}
      <div className="workspace-header-bar">
        <div className="wh-left">
          <div className="wh-title-badge">
            <Compass size={14} className="wh-badge-icon" />
            <span>OFFSET-WELL INTELLIGENCE WORKSPACE</span>
          </div>
          <div className="wh-context-pill">
            <span className="wh-ctx-label">ACTIVE RIG:</span>
            <span className="wh-ctx-val text-amber">{wellDisplayName} ({currentWell?.wellId || "W001"})</span>
            <span className="wh-ctx-optional">
              <span className="wh-ctx-sep">|</span>
              <span className="wh-ctx-label">FORMATION:</span>
              <span className="wh-ctx-val">{currentWell?.formation || "Barail Sandstone"}</span>
              <span className="wh-ctx-sep">|</span>
              <span className="wh-ctx-label">DEPTH:</span>
              <span className="wh-ctx-val font-mono">{currentWell?.totalDepth || "3050"}m</span>
            </span>
          </div>
        </div>

        <div className="wh-right">
          {/* Radius Selector */}
          <div className="wh-control-group">
            <span className="wh-control-label">SEARCH RADIUS:</span>
            <input
              type="range"
              min="2"
              max="50"
              step="1"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="ops-range-slider"
            />
            <span className="wh-range-display">{radiusKm} km</span>
          </div>

          {/* Quick Radius Buttons */}
          <div className="wh-btn-group">
            {[5, 15, 30].map((r) => (
              <button
                key={r}
                className={`wh-preset-btn ${radiusKm === r ? "active" : ""}`}
                onClick={() => setRadiusKm(r)}
              >
                {r}km
              </button>
            ))}
          </div>

          {/* Map Layer Switcher */}
          <div className="wh-btn-group">
            <button
              className={`wh-layer-btn ${!satellite ? "active" : ""}`}
              onClick={() => setSatellite(false)}
            >
              STREET
            </button>
            <button
              className={`wh-layer-btn ${satellite ? "active" : ""}`}
              onClick={() => setSatellite(true)}
            >
              SATELLITE
            </button>
            <button
              className="wh-icon-btn"
              title="Recenter on Active Well"
              onClick={() => setRecenterTrigger((n) => n + 1)}
            >
              <Locate size={14} />
            </button>
            <button
              className="wh-icon-btn"
              title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
              onClick={() => setFullscreen((f) => !f)}
            >
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Spatial Intelligence Grid */}
      <div className="workspace-main-split">
        {/* Left Map Canvas */}
        <div className="spatial-canvas-container">
          <MapContainer
            center={centerCoord}
            zoom={12}
            style={{ width: "100%", height: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url={satellite ? TILES.satellite.url : TILES.streets.url}
              attribution={satellite ? TILES.satellite.attribution : TILES.streets.attribution}
            />
            <RecenterMap center={centerCoord} trigger={recenterTrigger} />

            {/* Active Well Radius Circle */}
            <Circle
              center={centerCoord}
              radius={radiusKm * 1000}
              pathOptions={{
                color: "#38BDF8",
                dashArray: "5 5",
                fillColor: "#0284C7",
                fillOpacity: 0.08,
                weight: 1.5,
              }}
            />

            {/* Current Active Well Marker */}
            {currentWell && (
              <Marker
                position={[currentWell.lat, currentWell.lng]}
                icon={createPin("#EAB308", 22, true)}
                eventHandlers={{ click: () => handleSelectWell(currentWell) }}
              >
                <Tooltip permanent direction="top" offset={[0, -14]} className="ops-leaflet-tip active-tip">
                  ● ACTIVE: {wellDisplayName}
                </Tooltip>
              </Marker>
            )}

            {/* Offset Wells Markers */}
            {filteredNearby.map((w) => {
              const isSimilar = similarWells.some((s) => s.wellId === w.wellId);
              const isSelected = selectedOffset?.wellId === w.wellId;
              const color = isSelected ? "#EC4899" : isSimilar ? "#10B981" : "#38BDF8";

              return (
                <Marker
                  key={w.wellId}
                  position={[w.lat, w.lng]}
                  icon={createPin(color, isSelected ? 20 : 16, isSelected)}
                  eventHandlers={{ click: () => handleSelectWell(w) }}
                >
                  <Tooltip direction="top" offset={[0, -10]} className="ops-leaflet-tip">
                    <span className="font-mono font-bold">{w.wellId}</span> · {w.wellName}
                    {isSimilar && <span className="tip-badge">SIMILAR</span>}
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Interactive Legend Bar */}
          <div className="spatial-legend-floating">
            <div className="leg-item"><span className="leg-dot active-dot" /> Active Rig ({wellDisplayName})</div>
            <div className="leg-item"><span className="leg-dot similar-dot" /> Geological Match</div>
            <div className="leg-item"><span className="leg-dot offset-dot" /> Offset Exploration Well</div>
            <div className="leg-item"><span className="leg-dot selected-dot" /> Selected Dossier</div>
            <div className="leg-item-count">{filteredNearby.length} wells in {radiusKm}km radius</div>
          </div>
        </div>

        {/* Right Offset Intelligence Dossier */}
        <div className="spatial-dossier-sidebar">
          {selectedOffset ? (
            <div className="dossier-inner">
              {/* Dossier Header */}
              <div className="dossier-header-bar">
                <div className="dh-status-chip">
                  <span className="dh-pulse" />
                  <span>{selectedOffset.wellId === currentWell?.wellId ? "CURRENT ACTIVE RIG" : "OFFSET PRECEDENT"}</span>
                </div>
                <div className="dh-well-title">{selectedOffset.wellId} — {selectedOffset.wellName}</div>
                <div className="dh-sub-meta">
                  <span>{selectedOffset.field || "Assam Shelf"}</span>
                  <span className="dh-dot">·</span>
                  <span>{selectedOffset.block || "Block-1"}</span>
                  <span className="dh-dot">·</span>
                  <span className="text-cyan font-mono">{selectedOffset.status || "Completed"}</span>
                </div>
              </div>

              {/* Spatial Proximity & Formation Correlation */}
              <div className="dossier-metrics-grid">
                <div className="dossier-metric-card">
                  <div className="dmc-label">PROXIMITY DISTANCE</div>
                  <div className="dmc-value font-mono">
                    {selectedOffset.wellId === currentWell?.wellId ? "0.0 km" : `${selectedOffset.distanceKm || calculateDistanceKm(currentWell?.lat, currentWell?.lng, selectedOffset.lat, selectedOffset.lng) || "—"} km`}
                  </div>
                  <div className="dmc-sub">Borehole separation</div>
                </div>

                <div className="dossier-metric-card">
                  <div className="dmc-label">TARGET FORMATION</div>
                  <div className="dmc-value font-mono text-cyan">
                    {selectedOffset.formation || "Barail Sandstone"}
                  </div>
                  <div className="dmc-sub">Subsurface correlation</div>
                </div>

                <div className="dossier-metric-card">
                  <div className="dmc-label">TOTAL DEPTH</div>
                  <div className="dmc-value font-mono">
                    {selectedOffset.totalDepth ? `${selectedOffset.totalDepth}m` : "3120m"}
                  </div>
                  <div className="dmc-sub">Measured Depth</div>
                </div>

                <div className="dossier-metric-card">
                  <div className="dmc-label">WELL TYPE</div>
                  <div className="dmc-value font-mono">
                    {selectedOffset.wellType || "Exploratory"}
                  </div>
                  <div className="dmc-sub">Operational Class</div>
                </div>
              </div>

              {/* Geological Correlation Notes */}
              <div className="dossier-section">
                <div className="dossier-section-title">
                  <Layers size={13} />
                  <span>GEOLOGICAL CORRELATION & ATTRIBUTES</span>
                </div>
                <div className="dossier-props-table">
                  <div className="dp-row">
                    <span className="dp-key">Formation Sequence</span>
                    <span className="dp-val text-primary font-mono">{selectedOffset.formation || "Barail Sandstone"}</span>
                  </div>
                  <div className="dp-row">
                    <span className="dp-key">Coordinates (Lat / Lng)</span>
                    <span className="dp-val font-mono">{selectedOffset.lat?.toFixed(4)}, {selectedOffset.lng?.toFixed(4)}</span>
                  </div>
                  <div className="dp-row">
                    <span className="dp-key">Spud Date</span>
                    <span className="dp-val font-mono">{selectedOffset.spudDate || "02-04-2024"}</span>
                  </div>
                  <div className="dp-row">
                    <span className="dp-key">Completion Date</span>
                    <span className="dp-val font-mono">{selectedOffset.completionDate || "30-05-2024"}</span>
                  </div>
                </div>
              </div>

              {/* Historical NPT Incidents & Precedents */}
              <div className="dossier-section">
                <div className="dossier-section-title">
                  <ShieldAlert size={13} className="text-amber" />
                  <span>HISTORICAL DRILLING EVENTS & NPT PRECEDENTS</span>
                  <span className="badge-count">{offsetEvents.length}</span>
                </div>

                {loadingEvents ? (
                  <div className="dossier-events-loading font-mono">
                    <RefreshCw size={13} className="animate-spin" /> Querying historical borehole logs...
                  </div>
                ) : offsetEvents.length === 0 ? (
                  <div className="dossier-events-empty">
                    <div className="dee-title">No Critical NPT Incidents Recorded</div>
                    <div className="dee-sub">This offset well traversed nominal lithological horizons without severe lost circulation or kick events.</div>
                  </div>
                ) : (
                  <div className="dossier-events-timeline">
                    {offsetEvents.map((evt, idx) => (
                      <div className="event-precedent-card" key={idx}>
                        <div className="epc-top">
                          <span className={`epc-type-badge ${evt.type?.toLowerCase().includes("loss") ? "danger" : "warn"}`}>
                            {evt.type || "Mud Loss Incident"}
                          </span>
                          <span className="epc-depth font-mono">@{evt.depth ? `${evt.depth}m MD` : "Fractured Horizon"}</span>
                        </div>
                        <div className="epc-desc">{evt.description}</div>
                        {evt.mitigation && (
                          <div className="epc-mitigation">
                            <span className="epc-mit-label">MITIGATION TAKEN:</span>
                            <span className="epc-mit-text">{evt.mitigation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dossier Quick Workflow Actions */}
              <div className="dossier-actions-footer">
                <button
                  className="ops-btn-action-primary"
                  onClick={() => navigate(`/app/knowledge?wellId=${selectedOffset.wellId}`)}
                >
                  <FileText size={13} />
                  <span>Query WellMind Reports for {selectedOffset.wellId}</span>
                </button>
                <button
                  className="ops-btn-action-subtle"
                  onClick={() => navigate(`/app/similar?wellId=${selectedOffset.wellId}`)}
                >
                  <Database size={13} />
                  <span>View in Similarity Matrix</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="dossier-unselected">
              <Compass size={32} className="text-muted mb-2" />
              <div className="du-title">Select an Offset Well</div>
              <div className="du-sub">Click any borehole marker on the map to inspect proximity telemetry, formation correlation, and past incident mitigations.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}