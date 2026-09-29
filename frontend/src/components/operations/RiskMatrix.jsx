import { RISK_LABELS } from "../../utils/riskVocab";

export default function RiskMatrix({
  risks = null,
  prediction = {},
  explanation = {},
  selectedRisk = "mud_loss",
  selectedRiskId = "mud_loss",
  onSelectRisk,
}) {
  const activeKey = selectedRiskId || (typeof selectedRisk === "string" ? selectedRisk : selectedRisk?.id) || "mud_loss";

  const defaultTargets = [
    { id: "mud_loss", key: "Mud_Loss_Label", title: "Mud Loss", code: "ML", prob: 74, trend: "+4.2% / 10m", driver: "ECD (1.46 SG) > Fracture Grad" },
    { id: "stuck_pipe", key: "Stuck_Pipe_Label", title: "Stuck Pipe", code: "SP", prob: 42, trend: "+1.5% / 10m", driver: "Overbalance (240 psi)" },
    { id: "overpressure", key: "Overpressure_Label", title: "Overpressure", code: "OP", prob: 68, trend: "+6.8% / 10m", driver: "D-Exp Deviation & Gas Peak" },
    { id: "torque_spike", key: "Torque_Spike_Label", title: "Torque Spike", code: "TS", prob: 38, trend: "-2.0% / 10m", driver: "Stick-Slip 45 RPM Oscillation" },
    { id: "cementing_issue", key: "Cementing_Issue_Label", title: "Cementing Issue", code: "CI", prob: 21, trend: "0.0% / 10m", driver: "Mud Channeling in Washout" },
  ];

  const items = risks && risks.length > 0
    ? risks.map((r) => {
        const id = r.id || r.key;
        return {
          id,
          key: id,
          title: r.label || r.title || id,
          code: id.split("_").map((p) => p[0]).join("").toUpperCase().slice(0, 2),
          prob: r.prob !== undefined ? r.prob : Math.round((prediction?.[id]?.probability ?? 0.3) * 100),
          trend: r.trend || "Within envelope",
          driver: r.topShapDriver || "Telemetry baseline nominal"
        };
      })
    : defaultTargets.map((t) => {
        const pObj = prediction?.[t.id] || prediction?.[t.key];
        const prob = pObj?.probability !== undefined ? Math.round(pObj.probability * 100) : t.prob;
        return {
          ...t,
          prob
        };
      });

  function getSeverity(p) {
    if (p >= 60) return { label: "CRITICAL", color: "critical" };
    if (p >= 30) return { label: "ELEVATED", color: "elevated" };
    return { label: "NORMAL", color: "nominal" };
  }

  return (
    <div className="risk-matrix-panel">
      <div className="matrix-header">
        <div className="matrix-title-group">
          <span className="matrix-title">5-TARGET MULTI-RISK INTELLIGENCE</span>
          <span className="matrix-sub">XGBoost Ensemble · SHAP Feature Attributions</span>
        </div>
        <span className="matrix-hint">Click card to correlate offset evidence ➔</span>
      </div>

      <div className="risk-matrix-grid">
        {items.map((item) => {
          const severity = getSeverity(item.prob);
          const isSelected = activeKey === item.id || activeKey === item.key;

          return (
            <div
              key={item.id}
              className={`risk-tech-card ${severity.color} ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelectRisk && onSelectRisk(item.id)}
            >
              {/* Card Header */}
              <div className="risk-tech-top">
                <div className="risk-identity">
                  <span className="risk-code">{item.code}</span>
                  <span className="risk-name">{item.title}</span>
                </div>
                <span className={`severity-pill ${severity.color}`}>
                  {severity.label}
                </span>
              </div>

              {/* Probability & Trend */}
              <div className="risk-tech-body">
                <span className={`risk-tech-pct ${severity.color}`}>
                  {item.prob}%
                </span>
                <span className="risk-tech-trend">{item.trend}</span>
              </div>

              {/* Gauge Track with 30%/60% thresholds */}
              <div className="meter-gauge-track">
                <div
                  className={`meter-gauge-bar ${severity.color}`}
                  style={{ width: `${Math.min(100, Math.max(5, item.prob))}%` }}
                />
                <span className="threshold-marker-30" />
                <span className="threshold-marker-60" />
              </div>

              {/* Top SHAP Driver Preview */}
              <div className="risk-tech-driver" title={item.driver}>
                {item.driver}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
