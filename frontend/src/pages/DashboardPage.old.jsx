import { useEffect, useState } from "react";
import { useWell } from "../context/WellContext";
import { getRiskPrediction, getRiskExplanation } from "../api/riskApi";
import { searchWellsReal, createWellReal, getWellByWellId } from "../api/wellApi";
import { RISK_LABELS,explainFactor } from "../utils/riskVocab";
import RiskCard from "../components/RiskCard";
import SimulateScenarioModal from "../components/SimulateScenarioModal";
import { useRole } from "../context/RoleContext";
import { getRiskTimeseries } from "../api/riskApi";
import RiskGraph from "../components/RiskGraph";
import LiveHighestRiskCard from "../components/LiveHighestRiskCard";
import { socket } from "../api/socket";
import {
  IconSearch,
  IconPlus,
  IconCompass,
  IconLayers,
  IconChat,
  IconGauge,
  IconInfo,
  IconClose,
} from "../components/Icons";

export default function DashboardPage() {
  const { activeWell, setActiveWell } = useWell();

  const [prediction, setPrediction] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openRisk, setOpenRisk] = useState(null);
  const [showWellSelector, setShowWellSelector] = useState(!activeWell);
  const [wellTab, setWellTab] = useState("existing");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const { isOffice } = useRole();
  const [timeseries, setTimeseries] = useState(null);
  const [showGuide, setShowGuide] = useState(
    () => localStorage.getItem("nwis-guide-dismissed") !== "1"
  );

  const MAX_HISTORY = 60;

  const [createForm, setCreateForm] = useState({
    wellId: "",
    wellName: "",
    field: "",
    block: "",
    wellType: "",
    latitude: "",
    longitude: "",
    spudDate: "",
    completionDate: "",
    totalDepth: "",
    status: "Drilling",
  });

  useEffect(() => {
    if (!activeWell) {
      setPrediction(null);
      setExplanation(null);
      setOpenRisk(null);
      return;
    }

    setLoading(true);
    setError(null);
    setOpenRisk(null);

    // Promise.all([
    //   getRiskPrediction(activeWell.id),
    //   getRiskExplanation(activeWell.id),
    // ])
    //   .then(([predRes, explRes]) => {
    //     setPrediction(predRes.prediction);
    //     setExplanation(explRes.explanation);
    //   })
    //   .catch((e) => {
    //     setError(e.message);
    //   })
    //   .finally(() => {
    //     setLoading(false);
    //   });
    Promise.allSettled([
  getRiskPrediction(activeWell.id),
  getRiskExplanation(activeWell.id),
]).then(([predResult, explResult]) => {
  if (predResult.status === "fulfilled") {
    setPrediction(predResult.value.prediction);
  }

  if (explResult.status === "fulfilled") {
    setExplanation(explResult.value.explanation);
  } else {
    // Explanation may not exist on the very first load.
    setExplanation(null);
  }

  if (
    predResult.status === "rejected" &&
    explResult.status === "rejected"
  ) {
    setError(predResult.reason?.message || "Unable to load risk data.");
  }
}).finally(() => {
  setLoading(false);
});
  }, [activeWell]);

  useEffect(() => {
    if (!activeWell || !isOffice) {
      setTimeseries(null);
      return;
    }

    let cancelled = false;

    getRiskTimeseries(activeWell.id)
      .then((hist) => {
        if (!cancelled) setTimeseries(hist);
      })
      .catch((e) => {
        console.error("Timeseries fetch failed:", e.message);
        if (!cancelled) setTimeseries({ depths: [], series: {} });
      });

    socket.emit("watch-well", activeWell.id);

    function handleLiveTick(data) {
      if (data.wellId !== activeWell.id) return;

      setTimeseries((prev) => {
        const base = prev || { depths: [], series: {} };

        const lastDepth = base.depths[base.depths.length - 1];

        if (lastDepth === data.depth) return base;

        const newDepths = [...base.depths, data.depth].slice(-MAX_HISTORY);

        const newSeries = { ...base.series };

        Object.keys(RISK_LABELS).forEach((key) => {
          const prevValues = base.series[key] || [];

          const probability =
            (data.risks?.[key]?.probability ?? 0) * 100;

          newSeries[key] = [...prevValues, probability].slice(-MAX_HISTORY);
        });

        return {
          depths: newDepths,
          series: newSeries,
        };
      });
    }

    socket.on("drilling-update", handleLiveTick);

    return () => {
      cancelled = true;
      socket.off("drilling-update", handleLiveTick);
      socket.emit("unwatch-well", activeWell.id);
    };
  }, [activeWell, isOffice]);

  function dismissGuide() {
    setShowGuide(false);
    localStorage.setItem("nwis-guide-dismissed", "1");
  }

  function reopenGuide() {
    setShowGuide(true);
    localStorage.removeItem("nwis-guide-dismissed");
  }

  function applyActiveWell(well) {
    setActiveWell({
      id: well.wellId,
      name: well.wellName,
      formation: well.formation || well.field || "—",
      block: well.block || "—",
      status: well.status || "—",
    });

    setShowWellSelector(false);
    setQuery("");
    setResults([]);
    setSearched(false);
    setError(null);
  }

  async function handleSearch() {
    setError(null);

    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    try {
      const wells = await searchWellsReal(query.trim());

      setResults(wells);
      setSearched(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function selectWell(basicWell) {
    setError(null);

    try {
      const well = await getWellByWellId(basicWell.wellId);

      applyActiveWell(well);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);

    try {
      const well = await createWellReal(createForm);

      applyActiveWell(well);
    } catch (e) {
      setError(e.message);
    }
  }

  function updateCreateForm(field, value) {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSwitchWell() {
    setShowWellSelector(true);
    setWellTab("existing");
    setError(null);
    setOpenRisk(null);
  }

  return (
    <div>
      <div className="view-title">Well Dashboard</div>

      <div className="view-sub">
        {activeWell
          ? `Real-time risk intelligence for ${activeWell.id} — ${
              activeWell.formation || "Formation not set"
            }.`
          : "Select or create a well to see real-time predictions."}
      </div>

      {showGuide ? (
        <div className="guide-panel">
          <button
            className="guide-close"
            onClick={dismissGuide}
            title="Dismiss"
          >
            <IconClose size={15} />
          </button>

          <div className="guide-eyebrow">
            <IconInfo size={15} />
            How NWIS works
          </div>

          <div className="guide-title">
            One dashboard for every risk signal on a well
          </div>

          <div className="guide-body">
            NWIS pulls live drilling parameters, historical offset-well data,
            and engineer decision logs into a single risk picture. Pick a well
            below to begin, then use the panels on this page to read current
            risk, understand what's driving it, and test how changing
            conditions would affect it.
          </div>

          <div className="guide-steps">
            <div className="guide-step">
              <div className="gs-icon">
                <IconSearch size={16} />
              </div>

              <div className="gs-title">1. Select a well</div>

              <div className="gs-desc">
                Search an existing well by ID, or register a new one below.
              </div>
            </div>

            <div className="guide-step">
              <div className="gs-icon">
                <IconGauge size={16} />
              </div>

              <div className="gs-title">2. Read the risk cards</div>

              <div className="gs-desc">
                Five live risk scores — mud loss, stuck pipe, overpressure,
                torque spike, cementing.
              </div>
            </div>

            <div className="guide-step">
              <div className="gs-icon">
                <IconInfo size={16} />
              </div>

              <div className="gs-title">3. Open "Why"</div>

              <div className="gs-desc">
                Every card explains which measurements are driving that score,
                and in which direction.
              </div>
            </div>

            <div className="guide-step">
              <div className="gs-icon">
                <IconLayers size={16} />
              </div>

              <div className="gs-title">4. Simulate a scenario</div>

              <div className="gs-desc">
                Change drilling parameters to see how risk would shift before
                it happens.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button className="guide-reopen" onClick={reopenGuide}>
          <IconInfo size={14} /> How NWIS works
        </button>
      )}

      <div
        className="panel-box dashboard-well-bar"
        style={{ marginBottom: 20 }}
      >
        {!showWellSelector && activeWell ? (
          <>
            <div>
              <div className="dashboard-well-label">ACTIVE WELL</div>

              <div className="dashboard-well-name">
                {activeWell.id} — {activeWell.name}
              </div>

              <div className="dashboard-well-meta">
                {activeWell.formation || "—"} · {activeWell.block || "—"} ·{" "}
                {activeWell.status || "—"}
              </div>
            </div>

            <button
              className="btn-primary"
              type="button"
              onClick={handleSwitchWell}
              style={{
                width: "auto",
                padding: "10px 22px",
              }}
            >
              Switch Well
            </button>
          </>
        ) : (
          <div style={{ width: "100%" }}>
            <div className="dashboard-selector-header">
              <div>
                <div className="dashboard-selector-title">
                  Select or Create a Well
                </div>
              </div>

              {activeWell && (
                <button
                  type="button"
                  className="dashboard-cancel-btn"
                  onClick={() => setShowWellSelector(false)}
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="dashboard-well-tabs">
              <button
                type="button"
                className={
                  wellTab === "existing"
                    ? "dashboard-well-tab active"
                    : "dashboard-well-tab"
                }
                onClick={() => setWellTab("existing")}
              >
                <IconSearch size={14} /> Select Existing Well
              </button>

              <button
                type="button"
                className={
                  wellTab === "create"
                    ? "dashboard-well-tab active"
                    : "dashboard-well-tab"
                }
                onClick={() => setWellTab("create")}
              >
                <IconPlus size={14} /> Create New Well
              </button>
            </div>

            {error && (
              <div
                className="error-text"
                style={{ marginTop: 14 }}
              >
                {error}
              </div>
            )}

            {wellTab === "existing" && (
              <div className="dashboard-well-selector">
                <div className="search-row">
                  <input
                    type="text"
                    placeholder="Search by Well ID, e.g. W001"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleSearch}
                  >
                    <IconSearch size={14} /> Search
                  </button>
                </div>

                {searched && results.length === 0 && (
                  <div className="empty-hint">
                    No wells match "{query}".
                  </div>
                )}

                {results.map((w) => (
                  <div
                    className="well-result"
                    key={w.wellId}
                    onClick={() => selectWell(w)}
                  >
                    <div>
                      <div className="wr-id">
                        {w.wellId} — {w.wellName}
                      </div>

                      <div className="wr-meta">
                        Field: {w.field || "—"} · Block: {w.block || "—"}
                      </div>
                    </div>

                    <div className="status-chip status-active">
                      {w.status || "Unknown"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {wellTab === "create" && (
              <form
                onSubmit={handleCreate}
                className="dashboard-create-well"
              >
                <div className="form-grid">
                  <DashboardField
                    label="Well ID"
                    value={createForm.wellId}
                    onChange={(v) =>
                      updateCreateForm("wellId", v)
                    }
                    placeholder="e.g. W005"
                    required
                  />

                  <DashboardField
                    label="Well Name"
                    value={createForm.wellName}
                    onChange={(v) =>
                      updateCreateForm("wellName", v)
                    }
                    placeholder="e.g. Alpha-05"
                    required
                  />

                  <DashboardField
                    label="Field"
                    value={createForm.field}
                    onChange={(v) =>
                      updateCreateForm("field", v)
                    }
                    placeholder="e.g. Field_Alpha"
                  />

                  <DashboardField
                    label="Block"
                    value={createForm.block}
                    onChange={(v) =>
                      updateCreateForm("block", v)
                    }
                    placeholder="e.g. Block_1"
                  />

                  <DashboardField
                    label="Well Type"
                    value={createForm.wellType}
                    onChange={(v) =>
                      updateCreateForm("wellType", v)
                    }
                    placeholder="Exploratory / Development"
                  />

                  <DashboardField
                    label="Latitude"
                    value={createForm.latitude}
                    onChange={(v) =>
                      updateCreateForm("latitude", v)
                    }
                    placeholder="27.4728"
                    required
                  />

                  <DashboardField
                    label="Longitude"
                    value={createForm.longitude}
                    onChange={(v) =>
                      updateCreateForm("longitude", v)
                    }
                    placeholder="95.3372"
                    required
                  />

                  <DashboardField
                    label="Spud Date"
                    value={createForm.spudDate}
                    onChange={(v) =>
                      updateCreateForm("spudDate", v)
                    }
                    placeholder="DD/MM/YYYY"
                  />

                  <DashboardField
                    label="Completion Date"
                    value={createForm.completionDate}
                    onChange={(v) =>
                      updateCreateForm("completionDate", v)
                    }
                    placeholder="DD/MM/YYYY"
                  />

                  <DashboardField
                    label="Total Depth (m)"
                    value={createForm.totalDepth}
                    onChange={(v) =>
                      updateCreateForm("totalDepth", v)
                    }
                    placeholder="e.g. 3200"
                  />

                  <div className="field">
                    <label>Status</label>

                    <select
                      value={createForm.status}
                      onChange={(e) =>
                        updateCreateForm(
                          "status",
                          e.target.value
                        )
                      }
                    >
                      <option>Drilling</option>
                      <option>Completed</option>
                      <option>Suspended</option>
                      <option>Planned</option>
                    </select>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  type="submit"
                  style={{ marginTop: 18 }}
                >
                  Create Well &amp; Continue
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {activeWell && (
        <div style={{ marginBottom: 20 }}>
          <LiveHighestRiskCard />
        </div>
      )}

      {error && !showWellSelector && (
        <div
          className="error-text"
          style={{ marginBottom: 16 }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-hint">
          Loading risk predictions…
        </div>
      )}

      {/* =====================================================
          RISK CARDS
          ===================================================== */}

      {activeWell && (
        <>
          <div
            className="alert-grid"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {Object.entries(RISK_LABELS).map(
              ([key, meta]) => (
                <RiskCard
                  key={key}
                  title={meta.title}
                  prediction={
                    prediction ? prediction[key] : null
                  }
                  factors={
                    explanation
                      ? explanation[key]
                      : null
                  }
                  isOpen={openRisk === key}
                  onToggle={() =>
                    setOpenRisk((cur) =>
                      cur === key ? null : key
                    )
                  }
                />
              )
            )}
          </div>

{activeWell && openRisk && (
  <div className="risk-full-explanation">
    <div className="risk-full-explanation-title">
      {RISK_LABELS[openRisk]?.title} Explanation
    </div>
     <div className="full-explanation-list"> {renderExplanation(explanation?.[openRisk])}</div>
  </div>
)}
        </>
      )}

      {activeWell && isOffice && (
        <RiskGraph data={timeseries} />
      )}

      {activeWell && (
        <div className="section-card">
          <h4>What happens if the conditions change?</h4>

          <div
            className="alert-desc"
            style={{ marginBottom: 14 }}
          >
            Try different drilling parameters and see the potential risk
            before it becomes a problem.
          </div>

          <button
            className="btn-primary"
            style={{
              width: "auto",
              padding: "11px 24px",
            }}
            onClick={() => setShowSimulator(true)}
          >
            Simulate a Scenario
          </button>
        </div>
      )}

      {showSimulator && (
        <SimulateScenarioModal
          onClose={() => setShowSimulator(false)}
        />
      )}
    </div>
  );
}

/* =========================================================
   EXPLANATION RENDERER
   ========================================================= */
function renderExplanation(factors) {
  if (!factors) {
    return (
      <div className="explanation-empty">
        No explanation available for this risk.
      </div>
    );
  }

  if (!Array.isArray(factors)) {
    return (
      <div className="explanation-empty">
        No explanation available for this risk.
      </div>
    );
  }

  if (factors.length === 0) {
    return (
      <div className="explanation-empty">
        No significant risk factors found.
      </div>
    );
  }

  return factors.map((item, index) => {
    const feature =
      item.feature ||
      item.factor ||
      item.name ||
      "";

    const shapValue = Number(
      item.shap_value ??
      item.shapValue ??
      item.value ??
      0
    );

    let explained;

    try {
      explained = explainFactor(feature, shapValue);
    } catch {
      explained = {
        label: feature.replace(/_/g, " "),
        sentence: `${feature.replace(
          /_/g,
          " "
        )} is influencing this risk.`,
        direction:
          shapValue > 0 ? "increasing" : "decreasing",
      };
    }

    const isIncreased = shapValue > 0;
    const isDecreased = shapValue < 0;

    return (
      <div
        className="full-explanation-item"
        key={item.id || feature || index}
      >
        <div className="explanation-point">
          <strong>{explained.label}</strong>

          {isIncreased && (
            <span className="change-pill increased">
              ↑ Increased
            </span>
          )}

          {isDecreased && (
            <span className="change-pill decreased">
              ↓ Decreased
            </span>
          )}
        </div>

        <div className="explanation-description">
          {explained.sentence}
        </div>

        {item.value !== undefined &&
          item.value !== null && (
            <div className="explanation-value">
              Value: {String(item.value)}
            </div>
          )}
      </div>
    );
  });
}

function DashboardField({
  label,
  value,
  onChange,
  placeholder,
  required,
}) {
  return (
    <div className="field">
      <label>{label}</label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) =>
          onChange(e.target.value)
        }
      />
    </div>
  );
}