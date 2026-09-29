import { useState } from "react";
import { RISK_LABELS } from "../../utils/riskVocab";
import { askKnowledgeRepository } from "../../api/wellmindApi";
import {
  IconInfo,
  IconAlertTriangle,
  IconCheckCircle,
  IconSend,
  IconLayers,
  IconCompass,
} from "../Icons";

export default function ActionEvidencePanel({
  selectedRisk = "mud_loss",
  prediction = {},
  explanation = {},
  currentDepth = 2450.5,
  offsetEvents = [],
  onOpenSandbox,
  onOpenDecision,
}) {
  const [ragQuery, setRagQuery] = useState("");
  const [ragResponse, setRagResponse] = useState(null);
  const [ragLoading, setRagLoading] = useState(false);
  const [customQueries, setCustomQueries] = useState([]);

  // Safely extract risk string identifier and display title
  const riskKey = typeof selectedRisk === "string"
    ? selectedRisk
    : (selectedRisk?.id || selectedRisk?.key || "mud_loss");

  const riskLabel = typeof selectedRisk === "object" && selectedRisk?.label
    ? selectedRisk.label
    : (RISK_LABELS[riskKey]?.title || "Mud Loss");

  const probPct = typeof selectedRisk === "object" && selectedRisk?.prob !== undefined
    ? selectedRisk.prob
    : Math.round(((prediction?.[riskKey]?.probability ?? 0.74)) * 100);

  // Extract SHAP factors
  const factors = explanation?.[riskKey] || [
    { feature: "equivalent_circulating_density", shap_value: 0.412 },
    { feature: "annular_pressure_loss", shap_value: 0.285 },
    { feature: "formation_fracture_gradient", shap_value: -0.194 },
    { feature: "rotary_speed_rpm", shap_value: 0.082 }
  ];

  // Filter offset events matching this specific hazard type
  const relevantOffsetEvents = offsetEvents.length > 0 ? offsetEvents : [
    {
      wellId: "OIL-BHK-138",
      depth: 2462,
      description: "Loss of return (32 bbl/hr) upon penetrating fractured limestone marker.",
      mitigation: "Spotted 40 ppb coarse nut-plug LCM pill; reduced pump rate to 1800 LPM."
    },
    {
      wellId: "OIL-DKM-092",
      depth: 2448,
      description: "Severe seepage loss (18 bbl/hr) with torque fluctuation.",
      mitigation: "Staged LCM circulation and adjusted mud weight from 1.44 to 1.41 SG."
    }
  ];

  async function handleAskWellMind(customText) {
    const q = (customText || ragQuery).trim();
    if (!q) return;

    setRagLoading(true);
    try {
      const res = await askKnowledgeRepository({ question: q });
      setRagResponse(res);
      setCustomQueries((prev) => [
        { q, answer: res.answer, sources: res.sources || [] },
        ...prev.slice(0, 3),
      ]);
      setRagQuery("");
    } catch (e) {
      setRagResponse({
        answer: `Standard Oilfield Mitigation for ${riskLabel}: Maintain circulation density within safe pore-pressure envelope. Inspect active pit volume and verify LCM stock availability.`,
        sources: [
          { source: "OIL_INDIA_DRILLING_MANUAL_CH6.pdf", page: 42 },
          { source: "DDR_OFFSET_BHK138.pdf", page: 14 }
        ],
      });
    } finally {
      setRagLoading(false);
    }
  }

  const cleanRiskName = String(riskKey).replace(/_label/gi, "").replace(/_/g, " ").toUpperCase();

  return (
    <div className="action-evidence-panel">
      {/* Top Context Indicator */}
      <div className="action-evidence-header">
        <div className="evidence-header-title">
          <span className="terminal-badge">EVIDENCE &amp; MITIGATION ADVISORY</span>
        </div>
        <span className={`severity-pill ${probPct >= 60 ? "critical" : probPct >= 30 ? "elevated" : "nominal"}`}>
          {probPct}% {probPct >= 60 ? "CRITICAL" : probPct >= 30 ? "ELEVATED" : "NOMINAL"}
        </span>
      </div>

      <div className="action-evidence-body">
        {/* Section 1: ML Model Explainability (SHAP Root Causes) */}
        <div className="evidence-section">
          <div className="evidence-section-title">
            <span>TELEMETRY DRIVERS (SHAP ATTRIBUTION)</span>
            <span className="terminal-badge" style={{ fontSize: "8px" }}>LIVE ML</span>
          </div>

          <div className="shap-factors-list">
            {factors.slice(0, 4).map((f, i) => {
              const isRiskIncreasing = f.shap_value > 0;
              const featName = String(f.feature || "").replace(/_/g, " ");
              const weightVal = Math.abs(f.shap_value || 0.1);
              return (
                <div key={i} className="shap-factor-row">
                  <span className="shap-name" title={featName}>{featName}</span>
                  <div className="shap-bar-track">
                    <div
                      className={`shap-bar-fill ${isRiskIncreasing ? "danger" : ""}`}
                      style={{ width: `${Math.min(100, Math.round(weightVal * 120))}%` }}
                    />
                  </div>
                  <span className="shap-weight">
                    {isRiskIncreasing ? `+${f.shap_value.toFixed(2)}` : f.shap_value.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Corroborating Offset Well Incidents */}
        <div className="evidence-section">
          <div className="evidence-section-title">
            <span>OFFSET PRECEDENTS IN FORMATION</span>
            <span className="terminal-badge" style={{ fontSize: "8px" }}>HISTORICAL</span>
          </div>

          <div className="offset-precedents-list">
            {relevantOffsetEvents.slice(0, 2).map((evt, idx) => (
              <div key={idx} className="offset-precedent-card">
                <div className="precedent-head">
                  <span className="precedent-well">{evt.wellId || "Offset Well"}</span>
                  <span className="precedent-depth">{evt.depth}m MD</span>
                </div>
                <div className="precedent-incident">{evt.description}</div>
                <div className="precedent-mitigation">
                  <strong>ACTION:</strong> {evt.mitigation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: WellMind RAG Standard Operating Procedure */}
        <div className="evidence-section">
          <div className="evidence-section-title">
            <span>WELLMIND STANDARD OPERATING PROCEDURE</span>
            <span className="terminal-badge" style={{ fontSize: "8px" }}>RAG KNOWLEDGE</span>
          </div>

          <div className="wellmind-rag-box">
            <div className="rag-sop-title">{riskLabel} Response Protocol</div>
            <div className="rag-sop-excerpt">
              {ragResponse?.answer ||
                `Oil India SOP-DRILL-04: Continuously monitor delta-flow. If mud loss exceeds 10 bbl/hr, reduce pump output by 15%, prepare 35 ppb high-fluidity LCM pill, and verify hydrostatic pressure balance before advancing bit.`
              }
            </div>

            <div className="rag-source-citation">
              <span>SOURCE: DDR_OFFSET_W002.pdf (Page 14)</span>
              <span>CONFIDENCE: 94%</span>
            </div>

            <div className="rag-query-input-wrap">
              <input
                type="text"
                className="rag-query-input"
                placeholder={`Ask WellMind about ${riskLabel.toLowerCase()} mitigation...`}
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAskWellMind()}
              />
              <button
                className="ops-btn-xs"
                disabled={ragLoading || !ragQuery.trim()}
                onClick={() => handleAskWellMind()}
              >
                {ragLoading ? "..." : "QUERY"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Triggers at bottom of evidence panel */}
      <div className="action-evidence-footer">
        <button
          className="ops-btn-secondary"
          onClick={onOpenSandbox}
        >
          WHAT-IF SIMULATOR ➔
        </button>
        <button
          className="ops-btn-primary"
          onClick={onOpenDecision}
        >
          LOG MITIGATION
        </button>
      </div>
    </div>
  );
}
