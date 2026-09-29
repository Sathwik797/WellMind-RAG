import React from 'react';

export default function ActiveAlertsDrawer({
  isOpen,
  onClose,
  alerts = [],
  onAcknowledge,
  onInspectRisk
}) {
  if (!isOpen) return null;

  const defaultAlerts = [
    {
      id: 'ALT-1082',
      severity: 'CRITICAL',
      title: 'Mud Loss Threshold Breached (74% Probability)',
      depth: '2,450.4 m MD',
      time: '14:22 UTC',
      detail: 'Abrupt delta flow negative (-42 LPM) correlating with fractured limestone zone entry. High probability of partial loss.',
      riskId: 'mud_loss'
    },
    {
      id: 'ALT-1079',
      severity: 'WARNING',
      title: 'Pore Pressure Exceeding Hydrostatic Gradient',
      depth: '2,442.0 m MD',
      time: '13:58 UTC',
      detail: 'Gas influx signs and D-exponent deviation observed. Overpressure probability escalated to 48%.',
      riskId: 'overpressure'
    },
    {
      id: 'ALT-1075',
      severity: 'INFO',
      title: 'Offset Well Proximity Advisory: W002 within 1.4 km',
      depth: '2,430.0 m MD',
      time: '13:10 UTC',
      detail: 'Historical total loss encountered at 2,460m in W002. Prepare LCM stock on active pit.',
      riskId: 'mud_loss'
    }
  ];

  const displayAlerts = alerts.length > 0 ? alerts : defaultAlerts;

  return (
    <div className="scenario-drawer-overlay" onClick={onClose}>
      <div className="alerts-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="scenario-drawer-header">
          <div className="scenario-header-title">
            <span className="terminal-badge danger-badge">TELEMETRY & THRESHOLD ALERTS</span>
            <h3>Active Drilling Operational Alarms ({displayAlerts.length})</h3>
          </div>
          <button className="ops-btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="alerts-drawer-list">
          {displayAlerts.map((alt) => (
            <div
              key={alt.id}
              className={`alert-item-card ${alt.severity.toLowerCase()}`}
            >
              <div className="alert-item-header">
                <span className={`alert-severity-pill ${alt.severity.toLowerCase()}`}>
                  {alt.severity}
                </span>
                <span className="alert-meta-time">{alt.time} | Depth: {alt.depth}</span>
              </div>
              <h4 className="alert-item-title">{alt.title}</h4>
              <p className="alert-item-detail">{alt.detail}</p>

              <div className="alert-item-actions">
                <button
                  className="ops-btn-xs"
                  onClick={() => {
                    if (onInspectRisk && alt.riskId) {
                      onInspectRisk(alt.riskId);
                      onClose();
                    }
                  }}
                >
                  CORRELATE IN WORKSPACE ➔
                </button>
                <button
                  className="ops-btn-xs-secondary"
                  onClick={() => {
                    if (onAcknowledge) onAcknowledge(alt.id);
                  }}
                >
                  ACKNOWLEDGE
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
