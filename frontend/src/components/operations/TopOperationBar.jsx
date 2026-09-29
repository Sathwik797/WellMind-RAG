import { useWell } from "../../context/WellContext";
import { useRole } from "../../context/RoleContext";
import {
  IconAlertTriangle,
  IconLayers,
  IconClipboard,
} from "../Icons";

export default function TopOperationBar({
  onOpenSelector,
  onOpenWellSelector,
  onOpenSandbox,
  onOpenDecisionLog,
  onOpenDecision,
  onToggleAlerts,
  onOpenAlerts,
  alertCount = 0,
  alertsCount = 0,
  socketConnected = true,
  connected = true,
  currentDepth = 2450.5,
  telemetry = {},
  tvd = 2410.2,
  rop = 18.4,
  drillingStatus = "DRILLING"
}) {
  const { activeWell } = useWell();
  const { role, isField, setRole, switchRole } = useRole();

  const handleSelector = onOpenSelector || onOpenWellSelector;
  const handleSandbox = onOpenSandbox;
  const handleDecision = onOpenDecisionLog || onOpenDecision;
  const handleAlerts = onToggleAlerts || onOpenAlerts;
  const isLive = socketConnected !== undefined ? socketConnected : connected;
  const totalAlerts = alertCount || alertsCount || 0;
  const depth = telemetry?.md || currentDepth || 2450.5;
  const tvdVal = telemetry?.tvd || tvd || 2410.2;
  const ropVal = telemetry?.rop || rop || 18.4;

  const toggleRole = () => {
    const nextRole = isField ? "office" : "field";
    if (switchRole) switchRole(nextRole);
    else if (setRole) setRole(nextRole);
  };

  return (
    <header className="ops-header">
      {/* Brand & Project Identity */}
      <div className="ops-brand">
        <div className="ops-badge">eRTMAC-NWIS</div>
        <div className="ops-title-group">
          <span className="ops-org">OIL INDIA LIMITED</span>
          <span className="ops-subtitle">Operations RTOC Console</span>
        </div>
      </div>

      {/* Center Operational State Readouts */}
      <div className="ops-status-cluster">
        {/* Active Well Switcher */}
        <div className="ops-well-pill" onClick={handleSelector} title="Click to switch or search well">
          <span className="ops-lbl">ACTIVE WELL</span>
          <span className="ops-val-accent">
            {activeWell ? (activeWell.name || activeWell.well_id || activeWell.id) : "OIL-BHK-142"}
          </span>
          <span className="ops-switch-hint">▾</span>
        </div>

        {/* Real-time Depth Indicators */}
        <div className="ops-metric-unit">
          <span className="ops-lbl">MD (DEPTH)</span>
          <span className="ops-val-mono">{Number(depth).toFixed(1)}m</span>
        </div>

        <div className="ops-metric-unit">
          <span className="ops-lbl">TVD</span>
          <span className="ops-val-mono">{Number(tvdVal).toFixed(1)}m</span>
        </div>

        <div className="ops-metric-unit">
          <span className="ops-lbl">FORMATION</span>
          <span className="ops-tag-formation">{activeWell?.formation || "Barail Sandstone"}</span>
        </div>

        <div className="ops-metric-unit hide-mobile">
          <span className="ops-lbl">STATUS</span>
          <span className="ops-tag-status">
            <span className="pulse-dot online" />
            {drillingStatus} @ {ropVal}m/h
          </span>
        </div>

        {/* Live Stream Telemetry Indicator */}
        <div className="ops-connection-badge" title={isLive ? "Telemetry stream active" : "Offline"}>
          <span className={`status-dot ${isLive ? "live" : "offline"}`} />
          <span>{isLive ? "LIVE TELEMETRY" : "OFFLINE"}</span>
        </div>
      </div>

      {/* Right Controls & Quick Workflows */}
      <div className="ops-actions-cluster">
        {/* Alerts Button */}
        <button
          className={`ops-btn-alert ${totalAlerts > 0 ? "has-alerts" : ""}`}
          onClick={handleAlerts}
          title="Active operational alerts"
        >
          <IconAlertTriangle size={14} />
          <span>ALERTS</span>
          {totalAlerts > 0 && <span className="alert-count-pill">{totalAlerts}</span>}
        </button>

        {/* Quick Simulator Sandbox */}
        <button
          className="ops-btn-action"
          onClick={handleSandbox}
          title="Open parameter sensitivity sandbox"
        >
          <IconLayers size={13} />
          <span>WHAT-IF SANDBOX</span>
        </button>

        {/* Quick Decision Logger */}
        <button
          className="ops-btn-action highlight"
          onClick={handleDecision}
          title="Log engineering mitigation decision"
        >
          <IconClipboard size={13} />
          <span>LOG DECISION</span>
        </button>

        {/* Role Toggle Switch */}
        <div className="ops-role-switch">
          <button
            className={`role-btn ${isField ? "active" : ""}`}
            onClick={toggleRole}
          >
            FIELD
          </button>
          <button
            className={`role-btn ${!isField ? "active" : ""}`}
            onClick={toggleRole}
          >
            OFFICE
          </button>
        </div>
      </div>
    </header>
  );
}
