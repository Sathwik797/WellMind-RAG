import React, { useState, useEffect } from 'react';
import { useWell } from '../context/WellContext';
import { useRole } from '../context/RoleContext';
import { getRiskPrediction, getRiskExplanation, getRiskTimeseries } from '../api/riskApi';
import { searchWellsReal, getWellByWellId } from '../api/wellApi';
import { socket } from '../api/socket';

// Operations Workspace Components
import TopOperationBar from '../components/operations/TopOperationBar';
import TelemetryPanel from '../components/operations/TelemetryPanel';
import RiskMatrix from '../components/operations/RiskMatrix';
import SubsurfaceDepthTrack from '../components/operations/SubsurfaceDepthTrack';
import OffsetMapDossier from '../components/operations/OffsetMapDossier';
import ActionEvidencePanel from '../components/operations/ActionEvidencePanel';
import ScenarioSandbox from '../components/operations/ScenarioSandbox';
import QuickDecisionDrawer from '../components/operations/QuickDecisionDrawer';
import ActiveAlertsDrawer from '../components/operations/ActiveAlertsDrawer';

export default function DashboardPage() {
  const { activeWell, setActiveWell } = useWell();
  const { role, setRole, isOffice, isField } = useRole();

  // Selected risk state (drives evidence, depth highlighting, and sandbox target)
  const [selectedRiskId, setSelectedRiskId] = useState('mud_loss');

  // Prediction and SHAP explanation
  const [prediction, setPrediction] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live Telemetry state (from socket or default baseline)
  const [telemetry, setTelemetry] = useState({
    md: 2450.4,
    tvd: 2210.8,
    rop: 18.5,
    wob: 14.2,
    rpm: 110,
    torque: 18.4,
    spp: 3150,
    mudWeight: 1.42,
    flowRate: 2400,
    pv: 22,
    yp: 18
  });

  const [connected, setConnected] = useState(false);
  const [alertsCount, setAlertsCount] = useState(3);
  const [alertsList, setAlertsList] = useState([]);

  // Drawers and Modals
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isWellSelectorOpen, setIsWellSelectorOpen] = useState(false);

  // Well Search & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Office vs Field active tab for middle pane
  const [centerTab, setCenterTab] = useState('GEOSPATIAL'); // 'GEOSPATIAL' or 'DEPTH_TRACK'

  // Fetch prediction and explanation when active well changes
  useEffect(() => {
    if (!activeWell) {
      // Default to standard well if none active
      setActiveWell({
        id: 'WELL-001',
        name: 'OIL-BHK-142',
        well_id: 'WELL-001',
        formation: 'Barail Sandstone',
        block: 'Upper Assam Block A-1',
        status: 'Drilling',
        current_md: 2450.4,
        tvd: 2210.8,
        latitude: 27.4728,
        longitude: 94.9120
      });
      return;
    }

    const wellId = activeWell.id || activeWell.well_id || 'WELL-001';
    setLoading(true);
    setError(null);

    Promise.allSettled([
      getRiskPrediction(wellId),
      getRiskExplanation(wellId)
    ]).then(([predResult, explResult]) => {
      if (predResult.status === 'fulfilled' && predResult.value) {
        setPrediction(predResult.value.prediction || predResult.value);
      }
      if (explResult.status === 'fulfilled' && explResult.value) {
        setExplanation(explResult.value.explanation || explResult.value);
      }
    }).finally(() => {
      setLoading(false);
    });
  }, [activeWell, setActiveWell]);

  // Socket setup for real-time drilling updates
  useEffect(() => {
    if (!activeWell) return;
    const wellId = activeWell.id || activeWell.well_id;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) setConnected(true);

    socket.emit('watch-well', wellId);

    const handleDrillingUpdate = (data) => {
      if (!data) return;
      if (data.wellId && data.wellId !== wellId) return;

      setTelemetry((prev) => ({
        ...prev,
        md: data.depth || data.md || (prev.md + 0.1),
        tvd: data.tvd || prev.tvd,
        rop: data.rop ?? prev.rop,
        wob: data.wob ?? prev.wob,
        rpm: data.rpm ?? prev.rpm,
        torque: data.torque ?? prev.torque,
        spp: data.spp ?? prev.spp,
        mudWeight: data.mud_weight ?? prev.mudWeight,
        flowRate: data.flow_rate ?? prev.flowRate
      }));

      if (data.risks) {
        setPrediction((prev) => ({
          ...prev,
          ...data.risks
        }));
      }
    };

    const handleNewAlert = (alert) => {
      setAlertsList((prev) => [alert, ...prev].slice(0, 20));
      setAlertsCount((prev) => prev + 1);
    };

    socket.on('drilling-update', handleDrillingUpdate);
    socket.on('new-alert', handleNewAlert);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('drilling-update', handleDrillingUpdate);
      socket.off('new-alert', handleNewAlert);
      socket.emit('unwatch-well', wellId);
    };
  }, [activeWell]);

  // Handle Search for Wells
  const handleWellSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchWellsReal(searchQuery.trim());
      setSearchResults(results || []);
    } catch (err) {
      console.warn('Well search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectWell = async (selected) => {
    try {
      const fullWell = await getWellByWellId(selected.wellId || selected.id);
      setActiveWell({
        id: fullWell.wellId || fullWell._id,
        name: fullWell.wellName || fullWell.name || fullWell.wellId,
        well_id: fullWell.wellId,
        formation: fullWell.formation || 'Barail Sandstone',
        block: fullWell.block || 'Upper Assam',
        status: fullWell.status || 'Drilling',
        current_md: fullWell.current_md || 2450.4,
        tvd: fullWell.tvd || 2210.8,
        latitude: fullWell.latitude || 27.4728,
        longitude: fullWell.longitude || 94.9120
      });
      setIsWellSelectorOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Failed to select well:', err);
    }
  };

  // Convert raw prediction object to risk matrix array
  const riskList = [
    {
      id: 'mud_loss',
      label: 'Mud Loss',
      prob: prediction?.mud_loss?.probability ? Math.round(prediction.mud_loss.probability * 100) : 74,
      trend: '+4.2% / 10m',
      topShapDriver: 'ECD (1.46 SG) > Fracture Grad',
      lossVolume: '14.2 bbl/hr'
    },
    {
      id: 'stuck_pipe',
      label: 'Stuck Pipe',
      prob: prediction?.stuck_pipe?.probability ? Math.round(prediction.stuck_pipe.probability * 100) : 42,
      trend: '+1.5% / 10m',
      topShapDriver: 'High Overbalance (240 psi)',
      lossVolume: 'Tight Hole Tendency'
    },
    {
      id: 'overpressure',
      label: 'Overpressure',
      prob: prediction?.overpressure?.probability ? Math.round(prediction.overpressure.probability * 100) : 68,
      trend: '+6.8% / 10m',
      topShapDriver: 'D-Exponent Deviation & Gas Peak',
      lossVolume: 'Kick Precursor'
    },
    {
      id: 'torque_spike',
      label: 'Torque Spike',
      prob: prediction?.torque_spike?.probability ? Math.round(prediction.torque_spike.probability * 100) : 38,
      trend: '-2.0% / 10m',
      topShapDriver: 'Stick-Slip 45 RPM Oscillation',
      lossVolume: 'Torsional Shock'
    },
    {
      id: 'cementing_issue',
      label: 'Cementing Issue',
      prob: prediction?.cementing_issue?.probability ? Math.round(prediction.cementing_issue.probability * 100) : 21,
      trend: '0.0% / 10m',
      topShapDriver: 'Mud Channeling in Washout',
      lossVolume: 'Integrity Risk'
    }
  ];

  const currentSelectedRisk = riskList.find((r) => r.id === selectedRiskId) || riskList[0];

  return (
    <div className="operations-control-workstation">
      {/* 1. TOP OPERATION BAR */}
      <TopOperationBar
        activeWell={activeWell}
        telemetry={telemetry}
        connected={connected}
        alertsCount={alertsCount}
        role={role}
        onRoleToggle={() => setRole(isOffice ? 'FIELD' : 'OFFICE')}
        onOpenWellSelector={() => setIsWellSelectorOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        onOpenDecision={() => setIsDecisionOpen(true)}
      />

      {/* 2. REAL-TIME TELEMETRY PANEL */}
      <TelemetryPanel
        telemetry={telemetry}
        activeWell={activeWell}
        connected={connected}
      />

      {/* 3. MULTI-RISK INTELLIGENCE MATRIX */}
      <RiskMatrix
        risks={riskList}
        selectedRiskId={selectedRiskId}
        onSelectRisk={(id) => setSelectedRiskId(id)}
      />

      {/* 4. MAIN OPERATIONAL WORKSPACE (CENTER & RIGHT DUAL ENGINES) */}
      <div className="ops-main-grid">
        {/* CENTER VIEW: OFFSET GEOSPATIAL MAP OR PETROPHYSICAL DEPTH TRACK */}
        <div className="ops-center-stage">
          <div className="stage-tab-header">
            <div className="stage-tab-controls">
              <button
                className={`stage-tab-btn ${centerTab === 'GEOSPATIAL' ? 'active' : ''}`}
                onClick={() => setCenterTab('GEOSPATIAL')}
              >
                OFFSET-WELL SPATIAL RECONNAISSANCE
              </button>
              <button
                className={`stage-tab-btn ${centerTab === 'DEPTH_TRACK' ? 'active' : ''}`}
                onClick={() => setCenterTab('DEPTH_TRACK')}
              >
                SUBSURFACE DEPTH-TRACK & LOGS
              </button>
            </div>
            <div className="stage-tab-meta">
              <span className="meta-tag">ACTIVE BIT DEPTH: {telemetry.md} m MD</span>
              <span className="meta-tag formation-tag">{activeWell?.formation || 'Barail Sandstone'}</span>
            </div>
          </div>

          <div className="stage-content-body">
            {centerTab === 'GEOSPATIAL' ? (
              <OffsetMapDossier
                activeWell={activeWell}
                selectedRisk={currentSelectedRisk}
                onSelectOffsetWell={(offset) => {
                  console.log('Offset well dossier inspected:', offset);
                }}
              />
            ) : (
              <SubsurfaceDepthTrack
                activeWell={activeWell}
                currentDepth={telemetry.md}
                selectedRisk={currentSelectedRisk}
              />
            )}
          </div>
        </div>

        {/* RIGHT VIEW: ACTION & EVIDENCE PANEL (SHAP + OFFSET PRECEDENTS + WELLMIND PLAYBOOKS) */}
        <div className="ops-action-evidence-stage">
          <ActionEvidencePanel
            selectedRisk={currentSelectedRisk}
            activeWell={activeWell}
            currentDepth={telemetry.md}
            onOpenSandbox={() => setIsSandboxOpen(true)}
            onOpenDecision={() => setIsDecisionOpen(true)}
          />
        </div>
      </div>

      {/* SLIDE-OVER WORKBENCH: WHAT-IF SENSITIVITY SANDBOX */}
      <ScenarioSandbox
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        activeWell={activeWell}
        telemetry={telemetry}
        selectedRisk={currentSelectedRisk}
        onApplyScenario={(scenario) => {
          setIsDecisionOpen(true);
        }}
      />

      {/* SLIDE-OVER DRAWER: QUICK DECISION LOGGING */}
      <QuickDecisionDrawer
        isOpen={isDecisionOpen}
        onClose={() => setIsDecisionOpen(false)}
        activeWell={activeWell}
        telemetry={telemetry}
        selectedRisk={currentSelectedRisk}
        onDecisionLogged={(decision) => {
          console.log('Logged decision:', decision);
        }}
      />

      {/* SLIDE-OVER DRAWER: ACTIVE OPERATIONAL ALERTS */}
      <ActiveAlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alertsList}
        onAcknowledge={(alertId) => {
          setAlertsCount((prev) => Math.max(0, prev - 1));
        }}
        onInspectRisk={(riskId) => {
          setSelectedRiskId(riskId);
        }}
      />

      {/* WELL SWITCHER MODAL */}
      {isWellSelectorOpen && (
        <div className="scenario-drawer-overlay" onClick={() => setIsWellSelectorOpen(false)}>
          <div className="well-selector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="scenario-drawer-header">
              <div className="scenario-header-title">
                <span className="terminal-badge">WELL FLEET DISPATCH</span>
                <h3>Switch Active Monitored Well</h3>
              </div>
              <button className="ops-btn-icon" onClick={() => setIsWellSelectorOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleWellSearch} className="well-search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search well by name, UWI, or formation (e.g. WELL-001, BHK, OIL-142)..."
                className="input-ops"
              />
              <button type="submit" className="ops-btn-primary" disabled={isSearching}>
                {isSearching ? 'SEARCHING...' : 'SEARCH FLEET'}
              </button>
            </form>
            <div className="well-search-results">
              {searchResults.length > 0 ? (
                searchResults.map((w) => (
                  <div key={w.wellId || w._id} className="well-search-item" onClick={() => handleSelectWell(w)}>
                    <div className="well-search-title">
                      <strong>{w.wellName || w.wellId}</strong>
                      <span className="well-status-tag">{w.status || 'Active'}</span>
                    </div>
                    <div className="well-search-details">
                      Formation: {w.formation || w.field || 'Barail'} | Block: {w.block || 'Assam'} | TD: {w.totalDepth || 3200}m
                    </div>
                  </div>
                ))
              ) : (
                <div className="well-search-preset-list">
                  <div className="preset-label">QUICK SWITCH PRESETS:</div>
                  <div className="preset-wells-row">
                    {['WELL-001', 'WELL-002', 'WELL-003', 'WELL-004'].map((wId) => (
                      <button
                        key={wId}
                        className="ops-btn-xs"
                        onClick={() => handleSelectWell({ wellId: wId, wellName: `OIL-AS-${wId.replace('WELL-00', '0')}` })}
                      >
                        Select {wId}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}