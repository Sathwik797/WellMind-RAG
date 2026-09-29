import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  ArrowRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Compass,
  FileText,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  Database
} from "lucide-react";
import { useWell } from "../context/WellContext";
import { getSimilarWellsReal, getWellEvents, getWellByWellId } from "../api/wellApi";

export default function SimilarWellsPage() {
  const navigate = useNavigate();
  const { activeWell } = useWell();

  const wellId = activeWell?.id || activeWell?.wellId || "W001";
  const wellDisplayName = activeWell?.name || activeWell?.wellName || "OIL-BHK-142";

  const [targetWell, setTargetWell] = useState(null);
  const [similarWells, setSimilarWells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [formationFilter, setFormationFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  // Selected well for side dossier
  const [selectedWell, setSelectedWell] = useState(null);
  const [wellEvents, setWellEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Load target well & similar wells
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Target well details
      const current = await getWellByWellId(wellId).catch(() => ({
        wellId: "W001",
        wellName: wellDisplayName,
        formation: "Barail Sandstone",
        totalDepth: 3050,
        field: "Upper Assam",
        block: "Block-1",
        status: "Drilling",
      }));
      setTargetWell(current);

      // 2. Similar wells list
      const res = await getSimilarWellsReal(wellId, 10);
      const list = res || [];
      setSimilarWells(list);
      if (list.length > 0) {
        setSelectedWell(list[0]);
      }
    } catch (err) {
      console.error("Failed to load similar formations:", err);
      setError(err.message || "Failed to retrieve similarity intelligence");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [wellId]);

  // When selected well changes, load its borehole events
  useEffect(() => {
    if (!selectedWell?.wellId) return;
    let isMounted = true;
    setLoadingEvents(true);

    getWellEvents(selectedWell.wellId)
      .then((evts) => {
        if (isMounted) setWellEvents(evts || []);
      })
      .catch(() => {
        if (isMounted) setWellEvents([]);
      })
      .finally(() => {
        if (isMounted) setLoadingEvents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedWell?.wellId]);

  // Filtered list
  const filteredList = similarWells.filter((w) => {
    if (formationFilter !== "ALL" && w.formation && !w.formation.toLowerCase().includes(formationFilter.toLowerCase())) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchId = w.wellId?.toLowerCase().includes(q);
      const matchName = w.wellName?.toLowerCase().includes(q);
      const matchFmt = w.formation?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchFmt) return false;
    }
    return true;
  });

  return (
    <div className="ops-workspace-page">
      {/* 1. Industrial Header Bar */}
      <div className="workspace-header-bar">
        <div className="wh-left">
          <div className="wh-title-badge">
            <Layers size={14} className="wh-badge-icon" />
            <span>SIMILAR FORMATIONS & OFFSET WELL COMPARATIVE INTELLIGENCE</span>
          </div>
          <div className="wh-context-pill">
            <span className="wh-ctx-label">ACTIVE RIG:</span>
            <span className="wh-ctx-val text-amber">{wellDisplayName} ({wellId})</span>
            <span className="wh-ctx-sep">|</span>
            <span className="wh-ctx-label">FORMATION:</span>
            <span className="wh-ctx-val text-cyan">{targetWell?.formation || "Barail Sandstone"}</span>
            <span className="wh-ctx-sep">|</span>
            <span className="wh-ctx-label">ACTIVE DEPTH:</span>
            <span className="wh-ctx-val font-mono">{targetWell?.totalDepth || "2450.4"}m</span>
          </div>
        </div>

        <div className="wh-right">
          {/* Quick Search */}
          <div className="wh-search-input">
            <Search size={13} className="text-muted" />
            <input
              type="text"
              placeholder="Search well or formation..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          <button className="wh-icon-btn" title="Refresh Analysis" onClick={loadData}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 2. Workspace Two-Column Layout */}
      <div className="workspace-main-split">
        {/* Left Table Panel */}
        <div className="similar-table-container">
          {/* Filter Toolbar */}
          <div className="similar-filter-strip">
            <div className="sfs-item">
              <span className="sfs-label">FORMATION:</span>
              <select
                value={formationFilter}
                onChange={(e) => setFormationFilter(e.target.value)}
                className="sfs-select"
              >
                <option value="ALL">All Formations</option>
                <option value="Sandstone">Sandstone Sequences</option>
                <option value="Shale">Shale Formations</option>
                <option value="Limestone">Carbonate / Limestone</option>
              </select>
            </div>

            <div className="sfs-item">
              <span className="sfs-label">SORT BY:</span>
              <span className="sfs-tag active">Similarity Score (High to Low)</span>
            </div>

            <div className="sfs-count">
              Showing <span className="font-mono text-cyan">{filteredList.length}</span> correlated offset wells
            </div>
          </div>

          {/* Comparative Data Table */}
          {loading ? (
            <div className="table-loading-skeleton">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : error ? (
            <div className="ops-alert-banner danger">
              <AlertTriangle size={16} />
              <div>
                <div className="font-bold">OFFSET INTELLIGENCE UNAVAILABLE</div>
                <div className="text-xs">{error}</div>
              </div>
              <button className="ops-btn-action-subtle ml-auto" onClick={loadData}>
                Retry
              </button>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="table-empty-notice">
              <Database size={32} className="text-muted mb-2" />
              <div className="font-bold">No Similar Wells Found</div>
              <div className="text-xs text-muted">Try resetting formation filters or widening geological parameters.</div>
            </div>
          ) : (
            <div className="similar-table-scroll">
              <table className="ops-industrial-table">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>RANK</th>
                    <th>OFFSET WELL</th>
                    <th>FORMATION</th>
                    <th style={{ width: "160px" }}>GEOLOGICAL SIMILARITY</th>
                    <th>TOTAL DEPTH</th>
                    <th>MATCH FACTORS</th>
                    <th style={{ width: "90px", textAlign: "right" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((w, idx) => {
                    const isSelected = selectedWell?.wellId === w.wellId;
                    const pct = w.similarityPercentage || w.similarityScore || 70;
                    const scoreColor =
                      pct >= 85 ? "var(--green-safe)" : pct >= 70 ? "var(--amber-warn)" : "var(--cyan-info)";

                    return (
                      <tr
                        key={w.wellId}
                        className={`table-row-selectable ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedWell(w)}
                      >
                        <td className="font-mono text-muted">#{idx + 1}</td>
                        <td>
                          <div className="td-well-id font-mono font-bold text-primary">{w.wellId}</div>
                          <div className="td-well-name text-xs text-muted">{w.wellName}</div>
                        </td>
                        <td>
                          <span className="td-formation-chip font-mono">{w.formation || "Barail Sandstone"}</span>
                        </td>
                        <td>
                          <div className="sim-meter-wrap">
                            <div className="sim-meter-track">
                              <div
                                className="sim-meter-fill"
                                style={{ width: `${pct}%`, background: scoreColor }}
                              />
                            </div>
                            <span className="sim-meter-text font-mono font-bold" style={{ color: scoreColor }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="font-mono text-xs">
                          {w.totalDepth ? `${w.totalDepth}m MD` : "3050m"}
                        </td>
                        <td>
                          <div className="td-factor-chips">
                            {(w.matchedFactors && w.matchedFactors.length > 0
                              ? w.matchedFactors
                              : ["Same Formation", "Nearby Depth"]
                            ).map((factor, fIdx) => (
                              <span className="factor-chip" key={fIdx}>
                                {factor}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="td-inspect-btn"
                            title="Inspect Well Dossier"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWell(w);
                            }}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Dossier Panel */}
        <div className="similar-dossier-panel">
          {selectedWell ? (
            <div className="dossier-inner">
              <div className="dossier-header-bar">
                <div className="dh-status-chip">
                  <span className="dh-pulse" />
                  <span>OFFSET CORRELATION DOSSIER</span>
                </div>
                <div className="dh-well-title">
                  {selectedWell.wellId} — {selectedWell.wellName}
                </div>
                <div className="dh-sub-meta">
                  <span>{selectedWell.field || "Upper Assam Basin"}</span>
                  <span className="dh-dot">·</span>
                  <span>{selectedWell.block || "Block-1"}</span>
                  <span className="dh-dot">·</span>
                  <span className="text-cyan font-mono">{selectedWell.status || "Completed"}</span>
                </div>
              </div>

              {/* Similarity Hero Card */}
              <div className="dossier-sim-hero">
                <div className="dsh-left">
                  <div className="dsh-score font-mono">
                    {selectedWell.similarityPercentage || selectedWell.similarityScore || 85}%
                  </div>
                  <div className="dsh-label">Lithological Similarity Index</div>
                </div>
                <div className="dsh-right">
                  <div className="dsh-sub">
                    Calibrated on structural depth, lithology classification, and regional formation pressure gradients.
                  </div>
                </div>
              </div>

              {/* Parameters Breakdown */}
              <div className="dossier-metrics-grid">
                <div className="dossier-metric-card">
                  <div className="dmc-label">FORMATION</div>
                  <div className="dmc-value font-mono text-cyan">
                    {selectedWell.formation || "Barail Sandstone"}
                  </div>
                  <div className="dmc-sub">Borehole Horizon</div>
                </div>

                <div className="dossier-metric-card">
                  <div className="dmc-label">TOTAL DEPTH</div>
                  <div className="dmc-value font-mono">
                    {selectedWell.totalDepth ? `${selectedWell.totalDepth}m` : "3120m"}
                  </div>
                  <div className="dmc-sub">True Vertical Depth</div>
                </div>

                <div className="dossier-metric-card">
                  <div className="dmc-label">WELL TYPE</div>
                  <div className="dmc-value font-mono">
                    {selectedWell.wellType || "Exploratory"}
                  </div>
                  <div className="dmc-sub">Classification</div>
                </div>

                <div className="dossier-metric-card">
                  <div className="dmc-label">HISTORICAL NPT</div>
                  <div className="dmc-value font-mono text-amber">
                    {wellEvents.length} Incidents
                  </div>
                  <div className="dmc-sub">Logged Drilling Events</div>
                </div>
              </div>

              {/* Borehole Historical Events */}
              <div className="dossier-section">
                <div className="dossier-section-title">
                  <ShieldAlert size={13} className="text-amber" />
                  <span>HISTORICAL DRILLING PRECEDENTS & MITIGATIONS</span>
                  <span className="badge-count">{wellEvents.length}</span>
                </div>

                {loadingEvents ? (
                  <div className="dossier-events-loading font-mono">
                    <RefreshCw size={13} className="animate-spin" /> Querying historical logs...
                  </div>
                ) : wellEvents.length === 0 ? (
                  <div className="dossier-events-empty">
                    <div className="dee-title">No Critical NPT Incidents Recorded</div>
                    <div className="dee-sub">
                      Drilled through target formation without severe stuck pipe or major circulation losses.
                    </div>
                  </div>
                ) : (
                  <div className="dossier-events-timeline">
                    {wellEvents.map((evt, idx) => (
                      <div className="event-precedent-card" key={idx}>
                        <div className="epc-top">
                          <span
                            className={`epc-type-badge ${
                              evt.type?.toLowerCase().includes("loss") ? "danger" : "warn"
                            }`}
                          >
                            {evt.type || "Drilling Event"}
                          </span>
                          <span className="epc-depth font-mono">
                            @{evt.depth ? `${evt.depth}m MD` : "Target Zone"}
                          </span>
                        </div>
                        <div className="epc-desc">{evt.description}</div>
                        {evt.mitigation && (
                          <div className="epc-mitigation">
                            <span className="epc-mit-label">MITIGATION TAKEN:</span>
                            <span className="epc-mit-text">{evt.mitigation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="dossier-actions-footer">
                <button
                  className="ops-btn-action-primary"
                  onClick={() => navigate(`/app/knowledge?wellId=${selectedWell.wellId}`)}
                >
                  <FileText size={13} />
                  <span>Query WellMind for {selectedWell.wellId}</span>
                </button>
                <button
                  className="ops-btn-action-subtle"
                  onClick={() => navigate(`/app/nearby`)}
                >
                  <Compass size={13} />
                  <span>Inspect on Spatial Map</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="dossier-unselected">
              <Layers size={32} className="text-muted mb-2" />
              <div className="du-title">Select a Correlated Well</div>
              <div className="du-sub">
                Click any row in the similarity matrix to view geological correlation, formation depth, and past borehole event lessons.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}