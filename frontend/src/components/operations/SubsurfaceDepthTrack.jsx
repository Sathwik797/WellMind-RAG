import { useMemo } from "react";
import { RISK_LABELS } from "../../utils/riskVocab";

export default function SubsurfaceDepthTrack({
  currentDepth = 2450.5,
  timeseries = null,
  offsetEvents = [],
  activeFormation = "Shale_B",
}) {
  // Geological Stratigraphic Formations
  const FORMATIONS = [
    { name: "Alluvium_Top", from: 0, to: 800, color: "rgba(100, 116, 139, 0.20)", lithology: "Sands & Gravels" },
    { name: "Claystone_A", from: 800, to: 1550, color: "rgba(71, 85, 105, 0.25)", lithology: "Tight Claystone" },
    { name: "Limestone_B", from: 1550, to: 2150, color: "rgba(148, 163, 184, 0.20)", lithology: "Fractured Carbonate" },
    { name: "Shale_B", from: 2150, to: 2850, color: "rgba(30, 41, 59, 0.35)", lithology: "Unstable Reactive Shale" },
    { name: "Target_Sandstone", from: 2850, to: 3500, color: "rgba(217, 119, 6, 0.20)", lithology: "Porous Sand Reservoir" },
  ];

  const totalScaleDepth = 3500;

  // Convert depth in meters to vertical percentage
  function depthToPct(depth) {
    return Math.min(100, Math.max(0, (depth / totalScaleDepth) * 100));
  }

  const bitPositionPct = depthToPct(currentDepth);

  // Parse timeseries curves if present
  const depths = timeseries?.depths || [];
  const series = timeseries?.series || {};

  // Build SVG polygon/polyline paths for the 5 curves
  const curves = useMemo(() => {
    if (!depths || depths.length < 2) return [];

    const colors = {
      Mud_Loss_Label: "#EF4444",      // Red
      Stuck_Pipe_Label: "#F59E0B",     // Amber
      Overpressure_Label: "#38BDF8",   // Cyan
      Torque_Spike_Label: "#A855F7",   // Purple
      Cementing_Issue_Label: "#10B981" // Green
    };

    return Object.entries(series).map(([key, vals]) => {
      const pts = depths.map((d, i) => {
        const y = depthToPct(d); // 0 to 100%
        const prob = vals[i] ?? 0; // 0 to 100%
        const x = (prob / 100) * 180 + 10; // 10 to 190 px in curve track
        return `${x.toFixed(1)},${y.toFixed(2)}`;
      });
      return {
        key,
        color: colors[key] || "#94A3B8",
        label: RISK_LABELS[key]?.short || key,
        path: pts.join(" "),
      };
    });
  }, [depths, series]);

  return (
    <div className="depth-track-card">
      <div className="depth-track-top">
        <div className="dt-title-group">
          <span className="dt-title">SUBSURFACE DEPTH-TRACK & LOG CORRELATION</span>
          <span className="dt-sub">Stratigraphy · Continuous Risk Log · Offset Hazard Pointers</span>
        </div>
        <div className="dt-legend">
          <span className="dt-leg-item"><i style={{ background: "#EF4444" }} /> Mud Loss</span>
          <span className="dt-leg-item"><i style={{ background: "#F59E0B" }} /> Stuck Pipe</span>
          <span className="dt-leg-item"><i style={{ background: "#38BDF8" }} /> Overpressure</span>
          <span className="dt-leg-item"><i style={{ background: "#A855F7" }} /> Torque</span>
        </div>
      </div>

      <div className="depth-track-body">
        {/* Track 1: Depth Scale Ruler */}
        <div className="track-depth-scale">
          {[0, 500, 1000, 1500, 2000, 2500, 3000, 3500].map((d) => (
            <div key={d} className="depth-ruler-mark" style={{ top: `${depthToPct(d)}%` }}>
              <span>{d}m</span>
            </div>
          ))}
        </div>

        {/* Track 2: Stratigraphic Column */}
        <div className="track-formation-column">
          {FORMATIONS.map((f) => {
            const topPct = depthToPct(f.from);
            const heightPct = depthToPct(f.to) - topPct;
            const isCurrent = currentDepth >= f.from && currentDepth < f.to;

            return (
              <div
                key={f.name}
                className={`formation-block ${isCurrent ? "current-zone" : ""}`}
                style={{
                  top: `${topPct}%`,
                  height: `${heightPct}%`,
                  backgroundColor: f.color,
                }}
              >
                <div className="fmt-label-group">
                  <span className="fmt-name">{f.name.replace(/_/g, " ")}</span>
                  <span className="fmt-lith">{f.lithology}</span>
                  <span className="fmt-interval">{f.from}m – {f.to}m</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Track 3: Continuous Risk Probability Depth Curves (SVG) */}
        <div className="track-curve-canvas">
          <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="curve-svg">
            {/* Grid vertical guidelines */}
            <line x1="60" y1="0" x2="60" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
            <line x1="120" y1="0" x2="120" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
            <line x1="180" y1="0" x2="180" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />

            {/* Risk curves */}
            {curves.map((c) => (
              <polyline
                key={c.key}
                points={c.path}
                fill="none"
                stroke={c.color}
                strokeWidth="1.8"
                vectorEffect="non-scaling-stroke"
                opacity="0.9"
              />
            ))}
          </svg>

          {/* Active Drill Bit Depth Laser Line */}
          <div className="bit-depth-laser" style={{ top: `${bitPositionPct}%` }}>
            <span className="laser-badge">BIT: {Number(currentDepth).toFixed(1)}m</span>
            <div className="laser-line" />
          </div>

          {/* Offset Well Event Marker Pins on Depth Track */}
          {offsetEvents.slice(0, 5).map((evt, idx) => {
            const top = depthToPct(evt.depth || 2400);
            return (
              <div
                key={idx}
                className="offset-event-pin"
                style={{ top: `${top}%` }}
                title={`${evt.wellId || "Offset"}: ${evt.type} at ${evt.depth}m - ${evt.mitigation || evt.description}`}
              >
                <span className="pin-dot" />
                <span className="pin-text">{evt.wellId || "Offset"}: {evt.type?.replace(/_/g, " ")} ({evt.depth}m)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
