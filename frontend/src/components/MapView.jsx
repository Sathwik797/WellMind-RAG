import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { Globe, Locate, Maximize2, Minimize2 } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { getWellFullDetails } from "../api/wellApi";

const TILE_LAYERS = {
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
  },
};

const COLORS = { current: "#A9803D", nearby: "#0B2A40", similar: "#1E6B4C" };

function markerIcon(color, size = 18) {
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:3px solid #fff;box-shadow:0 0 0 2px ${color};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
function Recenter({ center, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center?.[0], center?.[1], trigger]); // trigger lets a button force a recenter too
  return null;
}

function isValidLatLng(lat, lng) {
  return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
}

export default function MapView({ currentWell, nearbyWells, similarWells, radiusKm, satellite,onToggleSatellite }) {
  const { isField } = useRole();
  const [selected, setSelected] = useState(null);
  const [loadingWell, setLoadingWell] = useState(false);
   const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);


  if (!currentWell || !isValidLatLng(currentWell.lat, currentWell.lng)) {
    return <div className="empty-hint">Loading map…</div>;
  }

  const center = [currentWell.lat, currentWell.lng];
  const layer = satellite ? TILE_LAYERS.satellite : TILE_LAYERS.streets;

  async function handleMarkerClick(wellId) {
    setLoadingWell(true);
    setSelected({ wellId });
    try {
      const data = await getWellFullDetails(wellId);
      setSelected({ wellId, ...data });
    } finally {
      setLoadingWell(false);
    }
  }

  return (
    <div className={`map-layout ${fullscreen ? "map-fullscreen" : ""}`}>
      <div className="map-canvas" style={{ padding: 0, position: "relative" }}>
         <div className="map-controls">
          <button
            className="map-icon-btn"
            title={satellite ? "Switch to street view" : "Switch to satellite view"}
            onClick={onToggleSatellite}
          >
            <Globe size={16} />
          </button>
          <button
            className="map-icon-btn"
            title="Recenter on active well"
            onClick={() => setRecenterTrigger((n) => n + 1)}
          >
            <Locate size={16} />
          </button>
          <button
            className="map-icon-btn"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            onClick={() => setFullscreen((f) => !f)}
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
        <MapContainer center={center} zoom={11} style={{ width: "100%", height: "100%" }} scrollWheelZoom>
          <TileLayer url={layer.url} attribution={layer.attribution} />
          <Recenter center={center} trigger={recenterTrigger} />

          <Circle
            center={center}
            radius={radiusKm * 1000}
            pathOptions={{ color: COLORS.current, dashArray: "6 6", fillOpacity: 0.05 }}
          />
          <Marker position={center} icon={markerIcon(COLORS.current, 22)} eventHandlers={{ click: () => handleMarkerClick(currentWell.wellId) }}>
            <Tooltip permanent direction="top" offset={[0, -14]} className="well-label well-label-current">
              {currentWell.wellId}
            </Tooltip>
            <Tooltip permanent direction="top" offset={[0, -14]} className="well-label well-label-current">
              {currentWell.wellName}
            </Tooltip>
          </Marker>
          {nearbyWells.filter((w) => isValidLatLng(w.lat, w.lng)).map((w) => (
            <Marker key={`nearby-${w.wellId}`} position={[w.lat, w.lng]} icon={markerIcon(COLORS.nearby)} eventHandlers={{ click: () => handleMarkerClick(w.wellId) }}>
              <Tooltip permanent direction="top" offset={[0, -10]} className="well-label well-label-nearby">
                {w.wellName}
              </Tooltip>
              <Tooltip permanent direction="top" offset={[0, -10]} className="well-label well-label-nearby">
                {w.wellName}
              </Tooltip>
            </Marker>
          ))}
          {similarWells.filter((w) => isValidLatLng(w.lat, w.lng)).map((w) => (
            <Marker key={`similar-${w.wellId}`} position={[w.lat, w.lng]} icon={markerIcon(COLORS.similar)} eventHandlers={{ click: () => handleMarkerClick(w.wellId) }}>
              <Tooltip permanent direction="top" offset={[0, -10]} className="well-label well-label-similar">
                {w.wellName}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>

        <div className="map-legend">
          <div><i style={{ background: COLORS.current }} /> Current Well</div>
          <div><i style={{ background: COLORS.nearby }} /> Nearby Well</div>
        </div>
      </div>

      <div className="map-side">
        <div className="well-info-card">
          {!selected ? (
            <div className="empty-hint">Click a well marker to view information here.</div>
          ) : loadingWell || !selected.well ? (
            <div className="empty-hint">Loading well details…</div>
          ) : (
            <>
              <div className="wi-id">{selected.well.wellId} — {selected.well.wellName}</div>
              <div className="wi-row"><span>Field</span><b>{selected.well.field || "—"}</b></div>
              <div className="wi-row"><span>Block</span><b>{selected.well.block || "—"}</b></div>
              <div className="wi-row"><span>Well Type</span><b>{selected.well.wellType || "—"}</b></div>
              <div className="wi-row"><span>Total Depth</span><b>{selected.well.totalDepth ? `${selected.well.totalDepth} m` : "—"}</b></div>
              <div className="wi-row"><span>Status</span><b>{selected.well.status || "—"}</b></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}