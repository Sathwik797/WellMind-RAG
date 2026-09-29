import { useState } from "react";
import { simulateScenario } from "../api/riskApi";
import { RISK_LABELS } from "../utils/riskVocab";

const FIELD_CONFIG = [
  { key: "Well_ID", label: "Well ID", type: "text", placeholder: "W001" },
  { key: "Timestamp", label: "Date & Time", type: "datetime" },
  { key: "Depth_MD", label: "Depth MD (m)", type: "number" },
  { key: "Depth_TVD", label: "Depth TVD (m)", type: "number" },
  { key: "Formation", label: "Formation", type: "text", placeholder: "Alluvium_Top" },
  { key: "ROP", label: "ROP", type: "number" },
  { key: "WOB", label: "WOB", type: "number" },
  { key: "RPM", label: "RPM", type: "number" },
  { key: "Torque", label: "Torque", type: "number" },
  { key: "Standpipe_Pressure", label: "Standpipe Pressure", type: "number" },
  { key: "Flow_Rate", label: "Flow Rate", type: "number" },
  { key: "Mud_Weight", label: "Mud Weight", type: "number" },
  { key: "Plastic_Viscosity", label: "Plastic Viscosity", type: "number" },
  { key: "Yield_Point", label: "Yield Point", type: "number" },
  { key: "Hook_Load", label: "Hook Load", type: "number" },
  { key: "Inclination", label: "Inclination", type: "number" },
  { key: "Bit_Type", label: "Bit Type", type: "text", placeholder: "PDC_8.5" },
  { key: "Reservoir_Pressure", label: "Reservoir Pressure", type: "number" },
  { key: "Formation_Pore_Pressure", label: "Formation Pore Pressure", type: "number" },
  { key: "Distance_To_Nearest_Offset_m", label: "Distance To Nearest Offset (m)", type: "number" },
  { key: "Historical_Event_Count", label: "Historical Event Count", type: "number" },
  { key: "Previous_Mud_Loss_Count", label: "Previous Mud Loss Count", type: "number" },
  { key: "Previous_Stuck_Pipe_Count", label: "Previous Stuck Pipe Count", type: "number" },
  { key: "Previous_Kick_Count", label: "Previous Kick Count", type: "number" },
  { key: "Previous_NPT_Count", label: "Previous NPT Count", type: "number" },
  { key: "Similar_Well_Risk_Count", label: "Similar Well Risk Count", type: "number" },
];

function getCurrentFormattedTimestamp() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${d}-${m}-${y} ${h}:${min}`;
}

const DEFAULT_VALUES = {
  Well_ID: "W001",
  Timestamp: getCurrentFormattedTimestamp(),
  Depth_MD: 2000,
  Depth_TVD: 1980,
  Formation: "Alluvium_Top",
  ROP: 14.45,
  WOB: 46.31,
  RPM: 119.1,
  Torque: 276.5,
  Standpipe_Pressure: 340.9,
  Flow_Rate: 839.2,
  Mud_Weight: 1.426,
  Plastic_Viscosity: 23.57,
  Yield_Point: 8.39,
  Hook_Load: 161.7,
  Inclination: 1.0,
  Bit_Type: "PDC_8.5",
  Reservoir_Pressure: 2500,
  Formation_Pore_Pressure: 2480,
  Distance_To_Nearest_Offset_m: 5000,
  Historical_Event_Count: 0,
  Previous_Mud_Loss_Count: 0,
  Previous_Stuck_Pipe_Count: 0,
  Previous_Kick_Count: 0,
  Previous_NPT_Count: 0,
  Similar_Well_Risk_Count: 0,
};

// "DD-MM-YYYY HH:mm" <-> <input type="datetime-local"> ("YYYY-MM-DDTHH:mm")
function toDisplayTimestamp(isoLocal) {
  if (!isoLocal) return "";
  const [datePart, timePart] = isoLocal.split("T");
  const [y, m, d] = datePart.split("-");
  return `${d}-${m}-${y} ${timePart}`;
}
function toInputTimestamp(displayVal) {
  if (!displayVal) return "";
  const [datePart, timePart] = displayVal.split(" ");
  const [d, m, y] = datePart.split("-");
  return `${y}-${m}-${d}T${timePart}`;
}

export default function SimulateScenarioModal({ onClose }) {
  const [form, setForm] = useState(DEFAULT_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // prediction object, once returned

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

async function handleSubmit(e) {
  e.preventDefault();
  setError(null);

  // Validate and sanitize numeric inputs
  const cleanedPayload = { ...form };
  for (const field of FIELD_CONFIG) {
    if (field.type === "number") {
      const val = cleanedPayload[field.key];
      if (val === "" || val === null || val === undefined || isNaN(Number(val))) {
        setError(`Please enter a valid numeric value for ${field.label}.`);
        return;
      }
      cleanedPayload[field.key] = Number(val);
    }
  }

  setSubmitting(true);
  try {
    const res = await simulateScenario(cleanedPayload);
    setResult(res.prediction);
  } catch (err) {
    setError(err.response?.data?.message || err.message || "Failed to simulate scenario");
  } finally {
    setSubmitting(false);
  }
}

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Simulate a Scenario</h3>
          <button className="dashboard-cancel-btn" onClick={onClose}>✕</button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {FIELD_CONFIG.map((f) => (
                <SimField
                  key={f.key}
                  field={f}
                  value={form[f.key]}
                  onChange={(v) => updateField(f.key, v)}
                />
              ))}
            </div>

            {error && <div className="error-text" style={{ marginTop: 12 }}>{error}</div>}

            <button className="btn-primary" type="submit" style={{ width: "auto", padding: "11px 26px", marginTop: 18 }} disabled={submitting}>
              {submitting ? "Predicting…" : "Predict"}
            </button>
          </form>
        ) : (
          <SimulationResults prediction={result} onBack={() => setResult(null)} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function SimField({ field, value, onChange }) {
  if (field.type === "toggle") {
    return (
      <div className="field">
        <label>{field.label}</label>
        <div className="sat-toggle" style={{ marginTop: 4 }}>
          <span>{value ? "Yes (1)" : "No (0)"}</span>
          <div className={`switch ${value ? "on" : ""}`} onClick={() => onChange(value ? 0 : 1)} />
        </div>
      </div>
    );
  }

  if (field.type === "datetime") {
    return (
      <div className="field">
        <label>{field.label}</label>
        <input
          type="datetime-local"
          value={toInputTimestamp(value)}
          onChange={(e) => onChange(toDisplayTimestamp(e.target.value))}
          required
        />
      </div>
    );
  }

  return (
    <div className="field">
      <label>{field.label}</label>
     <input
  type={field.type}
  step="any"
  min="0"
  value={value}
  placeholder={field.placeholder}
  onChange={(e) => {
    if (field.type === "number") {
      const rawValue = e.target.value;

      if (rawValue === "") {
        onChange("");
        return;
      }

      const numberValue = parseFloat(rawValue);

      if (numberValue >= 0) {
        onChange(numberValue);
      }
    } else {
      onChange(e.target.value);
    }
  }}
  required
/>
    </div>
  );
}

// Short-form results — 5 risk labels, no SHAP drawer, just probability + a one-line takeaway.
function SimulationResults({ prediction, onBack, onClose }) {
  return (
    <div>
      <div className="alert-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {Object.entries(RISK_LABELS).map(([key, meta]) => {
          const p = prediction[key];
          const pct = Math.round((p?.probability ?? 0) * 100);
          const level = pct >= 60 ? "high" : pct >= 30 ? "med" : "low";
          return (
            <div key={key} className={`alert-card risk-${level}`}>
              <div className="alert-top">
                <span className="alert-name">{meta.short}</span>
                <span className="alert-level">{level === "high" ? "High" : level === "med" ? "Medium" : "Low"}</span>
              </div>
              <div className="alert-score">{pct}<span>%</span></div>
              <div className="alert-desc">
                {p?.prediction === 1
                  ? `These parameters indicate an elevated ${meta.short.toLowerCase()} risk.`
                  : `These parameters do not currently suggest a ${meta.short.toLowerCase()} risk.`}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button className="why-btn" onClick={onBack}>← Try different values</button>
        <button className="btn-primary" style={{ width: "auto", padding: "10px 22px" }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}