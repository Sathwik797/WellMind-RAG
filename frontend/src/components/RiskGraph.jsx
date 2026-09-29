import { useState } from "react";
import { RISK_LABELS } from "../utils/riskVocab";

const SERIES_COLORS = {
  Mud_Loss_Label: "var(--red)",
  Stuck_Pipe_Label: "var(--amber)",
  Overpressure_Label: "var(--navy)",
  Torque_Spike_Label: "var(--green)",
  Cementing_Issue_Label: "var(--purple)",
};

const MAX_POINTS = 15; // sliding window — keeps the axis readable as data grows

export default function RiskGraph({ data }) {
  // NEW — which risk line is isolated. null = show all lines normally.
  const [selectedKey, setSelectedKey] = useState(null);

  if (!data || !data.depths || data.depths.length === 0) {
    return null;
  }

  const start = Math.max(0, data.depths.length - MAX_POINTS);
  const depths = data.depths.slice(start);
  const series = Object.fromEntries(
    Object.entries(data.series).map(([key, values]) => [key, (values || []).slice(start)])
  );

  const WIDTH = 680;
  const HEIGHT = 240;
  const LEFT = 45;
  const RIGHT = 20;
  const TOP = 15;
  const BOTTOM = 35;
  const GRAPH_WIDTH = WIDTH - LEFT - RIGHT;
  const GRAPH_HEIGHT = 180;

  const pointCount = depths.length;

  const getY = (value) => {
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    return TOP + GRAPH_HEIGHT - (safeValue / 100) * GRAPH_HEIGHT;
  };

  const getX = (index) => {
    if (pointCount === 1) return LEFT;
    return LEFT + (index / (pointCount - 1)) * GRAPH_WIDTH;
  };

  // NEW — click a legend item to isolate its line; click the same one again to reset.
  function handleLegendClick(key) {
    setSelectedKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="section-card">
      <h4>
        <span className="live-dot" />
        Real-Time Risk vs Depth
      </h4>

      <div className="graph-legend">
        {Object.entries(RISK_LABELS).map(([key, meta]) => {
          const values = series[key] || [];
          const latest = values.length > 0 ? Number(values[values.length - 1]) || 0 : 0;
          const isDimmed = selectedKey && selectedKey !== key; // NEW
          const isActive = selectedKey === key; // NEW

          return (
            <span
              key={key}
              className={`legend-item ${isActive ? "legend-active" : ""} ${isDimmed ? "legend-dimmed" : ""}`}
              onClick={() => handleLegendClick(key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleLegendClick(key)}
              title={isActive ? "Click again to show all risks" : `Isolate ${meta.short}`}
            >
              <i style={{ background: SERIES_COLORS[key] }} />
              {meta.short} ({latest.toFixed(1)}%)
            </span>
          );
        })}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: "100%", height: 260, overflow: "visible" }}
      >
        {[0, 25, 50, 75, 100].map((risk) => {
          const y = getY(risk);
          return (
            <g key={risk}>
              <line x1={LEFT} y1={y} x2={WIDTH - RIGHT} y2={y} stroke="var(--line)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={LEFT - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--text-mute)">
                {risk}%
              </text>
            </g>
          );
        })}

        <text
          x="12"
          y={TOP + GRAPH_HEIGHT / 2}
          transform={`rotate(-90 12 ${TOP + GRAPH_HEIGHT / 2})`}
          textAnchor="middle"
          fontSize="11"
          fill="var(--text-mute)"
        >
          Risk (%)
        </text>

        <line x1={LEFT} y1={TOP + GRAPH_HEIGHT} x2={WIDTH - RIGHT} y2={TOP + GRAPH_HEIGHT} stroke="var(--line)" strokeWidth="1" />

        {Object.keys(RISK_LABELS).map((key) => {
          const values = series[key] || [];
          if (values.length === 0) return null;

          const points = values.map((value, index) => `${getX(index)},${getY(value)}`).join(" ");
          const isDimmed = selectedKey && selectedKey !== key; // NEW
          const isActive = selectedKey === key; // NEW

          return (
            <g
              key={key}
              className={`risk-line ${isDimmed ? "risk-line-dimmed" : ""}`} // NEW
              onClick={() => handleLegendClick(key)} // NEW — clicking the line itself also isolates it
              style={{ cursor: "pointer" }}
            >
              <polyline
                fill="none"
                stroke={SERIES_COLORS[key]}
                strokeWidth={isActive ? 3.5 : 2.5} // NEW — slightly thicker when isolated
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {values.map((value, index) => (
                <circle key={index} cx={getX(index)} cy={getY(value)} r={isActive ? 3.5 : 3} fill={SERIES_COLORS[key]} />
              ))}
            </g>
          );
        })}

        {depths.map((depth, index) => (
          <text
            key={index}
            x={getX(index)}
            y={TOP + GRAPH_HEIGHT + 20}
            textAnchor="middle"
            fontSize="10.5"
            fill="var(--text-mute)"
          >
            {Number(depth).toLocaleString()}{index === pointCount - 1 ? " (current)" : ""}
          </text>
        ))}
      </svg>
    </div>
  );
}