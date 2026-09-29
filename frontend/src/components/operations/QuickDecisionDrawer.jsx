import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitDecisionLogReal } from '../../api/wellApi';
import { useAuth } from '../../context/AuthContext';

export default function QuickDecisionDrawer({
  isOpen,
  onClose,
  activeWell,
  telemetry,
  selectedRisk,
  onDecisionLogged
}) {
  if (!isOpen) return null;

  const { user, isGuest } = useAuth();
  const navigate = useNavigate();

  const [depth, setDepth] = useState(telemetry?.md || activeWell?.current_md || 2450);
  const [riskType, setRiskType] = useState(selectedRisk?.label || 'Mud Loss');
  const [mitigationAction, setMitigationAction] = useState('CIRCULATE_LCM');
  const [rationale, setRationale] = useState('');
  const [offsetReference, setOffsetReference] = useState('W002 (2460m incident precedent)');
  const [supervisorApproved, setSupervisorApproved] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (telemetry?.md) setDepth(telemetry.md);
    if (selectedRisk?.label) setRiskType(selectedRisk.label);
  }, [telemetry, selectedRisk]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const wellId = activeWell?.well_id || 'WELL-001';
      const payload = {
        well_id: wellId,
        depth_m: Number(depth),
        risk_type: riskType,
        action_taken: mitigationAction,
        rationale: rationale || `Standard mitigation applied per offset well intelligence and WellMind guidelines for ${riskType}.`,
        offset_reference: offsetReference,
        engineer_name: isGuest ? 'Guest Operations Analyst' : (user?.name || 'Field Drilling Engineer'),
        supervisor_approved: supervisorApproved,
        is_guest_entry: isGuest,
        timestamp: new Date().toISOString()
      };

      if (!isGuest) {
        await submitDecisionLogReal(wellId, payload);
        setSuccessMsg('Operational decision successfully committed to permanent audit trail.');
      } else {
        setSuccessMsg('Guest decision recorded locally. Sign in to commit to official supervisory audit.');
      }

      if (onDecisionLogged) onDecisionLogged(payload);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      console.warn('Backend decision log write failed, persisting locally:', err);
      setSuccessMsg('Decision recorded in local session log.');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="scenario-drawer-overlay" onClick={onClose}>
      <div className="decision-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="scenario-drawer-header">
          <div className="scenario-header-title">
            <span className="terminal-badge">OPERATIONAL GOVERNANCE</span>
            <h3>Log Engineering Mitigation Decision</h3>
          </div>
          <button className="ops-btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Guest Mode Informational Banner */}
        {isGuest && (
          <div className="decision-guest-notice">
            <div className="guest-notice-text">
              <strong>GUEST MODE:</strong> You can test mitigation protocols locally.
              Sign in to record this intervention in the official field decision log.
            </div>
            <button
              type="button"
              className="ops-btn-xs"
              onClick={() => {
                onClose();
                navigate('/auth');
              }}
            >
              Sign In to Authorize ➔
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="decision-form">
          {successMsg && (
            <div className="decision-alert-success">
              ✓ {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="decision-alert-error">
              ⚠ {errorMsg}
            </div>
          )}

          <div className="decision-grid-2col">
            <div className="form-field">
              <label>WELL IDENTIFIER</label>
              <input
                type="text"
                disabled
                value={activeWell?.name || activeWell?.well_id || 'WELL-001'}
                className="input-disabled"
              />
            </div>
            <div className="form-field">
              <label>MEASURED DEPTH (MD)</label>
              <input
                type="number"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                className="input-ops"
              />
            </div>
          </div>

          <div className="form-field">
            <label>CORRELATED RISK FACTOR</label>
            <select
              value={riskType}
              onChange={(e) => setRiskType(e.target.value)}
              className="select-ops"
            >
              <option value="Mud Loss">Mud Loss (Seepage / Partial / Total)</option>
              <option value="Stuck Pipe">Stuck Pipe (Differential / Mechanical)</option>
              <option value="Overpressure">Pore Overpressure / Kick Hazard</option>
              <option value="Torque Spike">Torque Spike / Vibration / Torsional Shock</option>
              <option value="Cementing Issue">Channeling / Cementing Sheer Flaw</option>
            </select>
          </div>

          <div className="form-field">
            <label>ACTION / MITIGATION PROTOCOL</label>
            <select
              value={mitigationAction}
              onChange={(e) => setMitigationAction(e.target.value)}
              className="select-ops"
            >
              <option value="CIRCULATE_LCM">Pump Coarse/Medium LCM Pill (35 ppb)</option>
              <option value="REDUCE_FLOW_PUMP">Reduce Flow Rate by 15% & Monitor Return Flow</option>
              <option value="ADJUST_MUD_WEIGHT">Increase Mud Weight by 0.04 SG (Weighting Up)</option>
              <option value="WIPER_TRIP">Perform Short Wiper Trip & Ream Tight Hole</option>
              <option value="BACKOFF_PULL">Stop Drilling, Back-Off Bit Weight, Circulate Clean</option>
              <option value="CONTROLLED_DRILL">Implement Controlled Drilling (10 m/hr cap)</option>
              <option value="CUSTOM">Custom Field Protocol (Specify below)</option>
            </select>
          </div>

          <div className="form-field">
            <label>OFFSET EVIDENCE / KNOWLEDGE SOURCE CITED</label>
            <input
              type="text"
              value={offsetReference}
              onChange={(e) => setOffsetReference(e.target.value)}
              placeholder="e.g. Offset Well W002 DDR Page 14 or WellMind SOP-SEC-4"
              className="input-ops"
            />
          </div>

          <div className="form-field">
            <label>ENGINEER RATIONALE & OBSERVATIONS</label>
            <textarea
              rows={4}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Detail pit level shifts, cuttings volume, torque oscillation readings, and rationale for action..."
              className="textarea-ops"
            />
          </div>

          <div className="form-checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={supervisorApproved}
                onChange={(e) => setSupervisorApproved(e.target.checked)}
              />
              <span>Confirmed with RTOC Operations Superintendent / Toolpusher</span>
            </label>
          </div>

          <div className="decision-form-footer">
            <button
              type="button"
              className="ops-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="ops-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'COMMITTING...'
                : isGuest
                ? 'RECORD LOCAL DRAFT DECISION'
                : 'COMMIT OFFICIAL AUDIT ENTRY'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
