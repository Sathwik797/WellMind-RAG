import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  FileCheck2,
  Lock,
  Save,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Layers,
  ArrowRight,
  RefreshCw,
  FileText,
  Compass,
  Sliders,
  History,
  Info
} from "lucide-react";
import { useWell } from "../context/WellContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { submitDecisionLogReal, getDecisionLogsReal } from "../api/wellApi";

const DEFAULT_AUDIT_LOGS = [
  {
    _id: "log-seed-1",
    wellId: "W001",
    engineerName: "T. Gogoi (Lead RTOC)",
    depth: 2410,
    category: "Mud Loss",
    severity: "Critical",
    problem: "Lost circulation (32 bbl/hr) upon penetrating fractured limestone marker.",
    solution: "Spotted 40 ppb coarse nut-plug pill; reduced annular pump rate from 2400 to 1800 LPM.",
    createdAt: "2026-09-29T14:30:00Z"
  },
  {
    _id: "log-seed-2",
    wellId: "W001",
    engineerName: "R. Sharma (Drilling Supervisor)",
    depth: 2280,
    category: "Torque Spike",
    severity: "Elevated",
    problem: "Severe torsional stick-slip oscillation (45 RPM fluctuation) at 110 RPM string speed.",
    solution: "Optimized WOB from 18 klbs to 14 klbs; elevated rotary speed to 125 RPM to exit harmonic resonance.",
    createdAt: "2026-09-28T09:15:00Z"
  }
];

export default function DecisionLogPage() {
  const navigate = useNavigate();
  const { activeWell } = useWell();
  const { user, isGuest } = useAuth();
  const { showToast } = useToast();

  const isGuestUser = isGuest || !user || user.isGuest || user.employeeId === "GUEST-001";
  const wellId = activeWell?.id || activeWell?.wellId || "W001";
  const wellDisplayName = activeWell?.name || activeWell?.wellName || "OIL-BHK-142";

  // Form State
  const [form, setForm] = useState({
    depth: "2450.4",
    formation: "Barail Sandstone",
    date: new Date().toISOString().split("T")[0],
    problem: "",
    category: "Mud Loss",
    severity: "Critical",
    solution: "",
    paramsChanged: "Mud Weight: 1.42 SG, Flow: 2100 LPM, WOB: 14 klbs",
    outcome: "Fluid loss controlled to <3 bbl/hr; continuous circulation sustained.",
    offsetCited: "W002 (OIL-BHK-138)",
    supportingDoc: "W001_DDR.pdf (Page 2)",
    notes: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [auditLogs, setAuditLogs] = useState(DEFAULT_AUDIT_LOGS);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Load audit logs
  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await getDecisionLogsReal(wellId);
      if (res && res.length > 0) {
        setAuditLogs(res);
      } else {
        setAuditLogs(DEFAULT_AUDIT_LOGS);
      }
    } catch {
      setAuditLogs(DEFAULT_AUDIT_LOGS);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // Load local draft if exists
    try {
      const saved = localStorage.getItem("nwis-decision-draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, [wellId]);

  // Save Local Draft
  const handleSaveDraft = () => {
    try {
      localStorage.setItem("nwis-decision-draft", JSON.stringify(form));
      setDraftSaved(true);
      if (showToast) showToast("Decision draft saved locally in workstation storage.");
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Official Commit
  const handleOfficialCommit = async (e) => {
    e.preventDefault();

    if (isGuestUser) {
      setShowAuthModal(true);
      return;
    }

    if (!form.problem.trim() || !form.solution.trim()) {
      if (showToast) showToast("Please describe the problem and mitigation applied.");
      return;
    }

    setSubmitting(true);
    try {
      await submitDecisionLogReal(wellId, {
        depth: parseFloat(form.depth) || 2450.4,
        problem: form.problem,
        solution: `${form.solution} | Parameters: ${form.paramsChanged} | Outcome: ${form.outcome}`,
        category: form.category,
        date: form.date
      });

      if (showToast) showToast("Official engineering decision logged to audit repository.");
      localStorage.removeItem("nwis-decision-draft");
      setForm((prev) => ({
        ...prev,
        problem: "",
        solution: "",
        notes: ""
      }));
      loadLogs();
    } catch (err) {
      if (showToast) showToast(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ops-workspace-page">
      {/* 1. Header Bar */}
      <div className="workspace-header-bar">
        <div className="wh-left">
          <div className="wh-title-badge">
            <ClipboardCheck size={14} className="wh-badge-icon" />
            <span>ENGINEERING DECISION LOG & AUDIT REPOSITORY</span>
          </div>
          <div className="wh-context-pill">
            <span className="wh-ctx-label">DECISION GOVERNANCE:</span>
            <span className="wh-ctx-val text-primary">Record operational observations, mitigation actions & verifiable outcomes</span>
          </div>
        </div>

        <div className="wh-right">
          <div className="wh-context-pill">
            <span className="wh-ctx-label">ACTIVE RIG:</span>
            <span className="wh-ctx-val text-amber">{wellDisplayName} ({wellId})</span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="workspace-main-split">
        {/* Left Form: Decision Entry */}
        <div className="decision-form-container">
          <form onSubmit={handleOfficialCommit} className="decision-form-inner">
            {/* Context Section */}
            <div className="df-section">
              <div className="df-section-title">
                <span className="df-sec-num">1</span>
                <span>OPERATIONAL CONTEXT & HORIZON</span>
              </div>
              <div className="df-grid-2">
                <div className="df-field">
                  <label>WELL IDENTIFIER</label>
                  <input type="text" value={`${wellDisplayName} (${wellId})`} readOnly className="df-input readonly" />
                </div>
                <div className="df-field">
                  <label>BIT DEPTH (MD / TVD)</label>
                  <input
                    type="text"
                    value={form.depth}
                    onChange={(e) => setForm({ ...form, depth: e.target.value })}
                    className="df-input font-mono"
                    placeholder="e.g. 2450.4"
                  />
                </div>
                <div className="df-field">
                  <label>TARGET FORMATION</label>
                  <input
                    type="text"
                    value={form.formation}
                    onChange={(e) => setForm({ ...form, formation: e.target.value })}
                    className="df-input"
                  />
                </div>
                <div className="df-field">
                  <label>DATE & SHIFT</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="df-input font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Event Section */}
            <div className="df-section">
              <div className="df-section-title">
                <span className="df-sec-num">2</span>
                <span>OBSERVED DRILLING EVENT & HAZARD</span>
              </div>
              <div className="df-grid-2 mb-3">
                <div className="df-field">
                  <label>RISK CATEGORY</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="df-select"
                  >
                    <option value="Mud Loss">Mud Loss (Lost Circulation)</option>
                    <option value="Stuck Pipe">Stuck Pipe (Differential / Mechanical)</option>
                    <option value="Kick">Kick / Well Inflow (Gas/Water)</option>
                    <option value="Torque Spike">Torque Spike & Stick-Slip</option>
                    <option value="Cementing Issue">Cementing Issue (Channeling/Washout)</option>
                    <option value="Overpressure">Formation Overpressure</option>
                  </select>
                </div>
                <div className="df-field">
                  <label>SEVERITY RATING</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="df-select"
                  >
                    <option value="Nominal">Nominal / Advisory (Low Impact)</option>
                    <option value="Elevated">Elevated (Action Required)</option>
                    <option value="Critical">Critical (Immediate Suspension/Mitigation)</option>
                  </select>
                </div>
              </div>
              <div className="df-field">
                <label>PROBLEM DESCRIPTION & DRILLING SYMPTOMS</label>
                <textarea
                  rows={3}
                  value={form.problem}
                  onChange={(e) => setForm({ ...form, problem: e.target.value })}
                  placeholder="Detail exact sensor symptoms: e.g. Pit level dropped 35 bbl over 20 min, standpipe pressure fell 240 psi upon encountering fractured limestone horizon..."
                  className="df-textarea"
                  required
                />
              </div>
            </div>

            {/* Action Section */}
            <div className="df-section">
              <div className="df-section-title">
                <span className="df-sec-num">3</span>
                <span>APPLIED MITIGATION & HYDRAULIC ADJUSTMENTS</span>
              </div>
              <div className="df-field mb-3">
                <label>MITIGATION PROCEDURE EXECUTED</label>
                <textarea
                  rows={3}
                  value={form.solution}
                  onChange={(e) => setForm({ ...form, solution: e.target.value })}
                  placeholder="e.g. Pulled bit 10m off bottom; spotted 45 bbl coarse nut-plug & mica LCM pill; squeezed at 1.8 BPM; decreased mud pump rate to 1800 LPM..."
                  className="df-textarea"
                  required
                />
              </div>
              <div className="df-grid-2">
                <div className="df-field">
                  <label>TELEMETRY PARAMETERS ADJUSTED</label>
                  <input
                    type="text"
                    value={form.paramsChanged}
                    onChange={(e) => setForm({ ...form, paramsChanged: e.target.value })}
                    className="df-input font-mono"
                    placeholder="e.g. Mud Wt: 1.42 SG, Flow: 2000 LPM, RPM: 90"
                  />
                </div>
                <div className="df-field">
                  <label>VERIFIED OPERATIONAL OUTCOME</label>
                  <input
                    type="text"
                    value={form.outcome}
                    onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                    className="df-input"
                    placeholder="e.g. Full circulation regained, ECD stabilized under 1.44 SG"
                  />
                </div>
              </div>
            </div>

            {/* Evidence & Offset References */}
            <div className="df-section">
              <div className="df-section-title">
                <span className="df-sec-num">4</span>
                <span>OFFSET EVIDENCE & VERIFICATION</span>
              </div>
              <div className="df-grid-2">
                <div className="df-field">
                  <label>CITED OFFSET WELL PRECEDENT</label>
                  <input
                    type="text"
                    value={form.offsetCited}
                    onChange={(e) => setForm({ ...form, offsetCited: e.target.value })}
                    className="df-input font-mono"
                    placeholder="e.g. OIL-BHK-138"
                  />
                </div>
                <div className="df-field">
                  <label>SUPPORTING REPORT / PLAYBOOK</label>
                  <input
                    type="text"
                    value={form.supportingDoc}
                    onChange={(e) => setForm({ ...form, supportingDoc: e.target.value })}
                    className="df-input font-mono"
                    placeholder="e.g. W001_DDR.pdf (Page 2)"
                  />
                </div>
              </div>
            </div>

            {/* Action Submission Buttons */}
            <div className="df-actions-row">
              <button
                type="button"
                className="ops-btn-action-subtle"
                onClick={handleSaveDraft}
              >
                <Save size={14} />
                <span>{draftSaved ? "Draft Saved Locally ✓" : "Save Workstation Draft"}</span>
              </button>

              <button
                type="submit"
                className="ops-btn-action-primary"
                disabled={submitting}
              >
                {isGuestUser ? (
                  <>
                    <Lock size={14} />
                    <span>Sign In to Commit Official Decision</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 size={14} />
                    <span>{submitting ? "Committing Audit Log..." : "Commit Official Decision"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Audit Trail Panel */}
        <div className="decision-audit-sidebar">
          <div className="dossier-inner">
            <div className="dossier-header-bar">
              <div className="dh-status-chip">
                <span className="dh-pulse" />
                <span>GOVERNANCE AUDIT TRAIL</span>
              </div>
              <div className="dh-well-title">Logged Decisions for {wellDisplayName}</div>
              <div className="dh-sub-meta">
                <span>Verified Field & RTOC Records</span>
                <span className="dh-dot">·</span>
                <span className="text-cyan font-mono">{auditLogs.length} Records</span>
              </div>
            </div>

            {/* Information Notice */}
            <div className="ops-alert-banner info">
              <Info size={15} />
              <div className="text-xs">
                All committed actions are permanently logged into the eRTMAC-NWIS institutional memory and directly calibrate future XGBoost risk probabilities and SHAP attribution models.
              </div>
            </div>

            {/* Decision History Cards */}
            <div className="audit-logs-list">
              {auditLogs.map((log, idx) => (
                <div className="audit-log-card" key={idx}>
                  <div className="alc-top">
                    <span className={`alc-badge ${log.category?.toLowerCase().includes("loss") ? "danger" : "warn"}`}>
                      {log.category || "Mitigation"}
                    </span>
                    <span className="alc-depth font-mono">@{log.depth ? `${log.depth}m MD` : "Target Depth"}</span>
                  </div>

                  <div className="alc-problem">
                    <span className="alc-key">PROBLEM:</span> {log.problem}
                  </div>

                  <div className="alc-solution">
                    <span className="alc-key">MITIGATION:</span> {log.solution}
                  </div>

                  <div className="alc-footer font-mono">
                    <div className="alc-engineer">
                      <User size={11} className="text-muted" />
                      <span>{log.engineerName || "Field Engineer"}</span>
                    </div>
                    <div className="alc-time">
                      <Clock size={11} className="text-muted" />
                      <span>{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "Historical"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Prompt Modal for Guest Commits */}
      {showAuthModal && (
        <div className="ops-modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="ops-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ops-modal-header">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-amber" />
                <span className="font-bold">SUPERVISORY AUTHENTICATION REQUIRED</span>
              </div>
              <button className="ops-modal-close" onClick={() => setShowAuthModal(false)}>✕</button>
            </div>
            <div className="ops-modal-body">
              <p className="mb-3 text-secondary text-sm">
                You are currently exploring as a <b className="text-primary">Guest Engineer</b>.
              </p>
              <p className="mb-4 text-secondary text-sm">
                While guests can explore all workspaces, analyze offset telemetry, run What-If simulations, and save local workstation drafts, submitting an official permanent operational audit record requires verified supervisory credentials.
              </p>
              <div className="bg-panel-card p-3 rounded border border-subtle mb-4 text-xs font-mono text-cyan">
                Your draft has been preserved in local memory. Sign in to submit the official record under your employee ID.
              </div>
            </div>
            <div className="ops-modal-footer">
              <button
                className="ops-btn-action-subtle"
                onClick={() => {
                  handleSaveDraft();
                  setShowAuthModal(false);
                }}
              >
                Keep Local Draft
              </button>
              <button
                className="ops-btn-action-primary"
                onClick={() => navigate("/auth")}
              >
                <Lock size={13} />
                <span>Sign In to Commit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}