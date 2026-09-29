import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchWellsReal, createWellReal, getWellByWellId } from "../api/wellApi";
import { useWell } from "../context/WellContext";
import UtilityBar from "../components/UtilityBar";
import { IconSearch, IconPlus } from "../components/Icons";

export default function WellSelectPage() {
  const [tab, setTab] = useState("existing"); // "existing" | "create"
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    wellId: "", wellName: "", field: "", block: "", wellType: "",
    latitude: "", longitude: "", spudDate: "", completionDate: "",
    totalDepth: "", status: "Drilling",
  });

  const { setActiveWell } = useWell();
  const navigate = useNavigate();

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
      navigate("/app/dashboard");
    } catch (e) {
      setError(e.message);
    }
  }

  function applyActiveWell(well) {
    setActiveWell({
      id: well.wellId,
      name: well.wellName,
      formation: well.formation || well.field || "—",
      block: well.block || "—",
      status: well.status || "—",
    });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      const well = await createWellReal(form);
      applyActiveWell(well);
      navigate("/app/dashboard");
    } catch (e2) {
      setError(e2.message);
    }
  }

  return (
    <div className="well-select-screen">
      <UtilityBar showRoleSwitch />
      <div className="center-wrap">
        <div className="page-heading">Select a well to begin</div>
        <div className="page-sub">Choose an existing well from your operational area, or register a new well.</div>

        <div className="choice-tabs">
          <div className={`choice-tab ${tab === "existing" ? "active" : ""}`} onClick={() => setTab("existing")}>
            <IconSearch size={15} /> Select Existing Well
          </div>
          <div className={`choice-tab ${tab === "create" ? "active" : ""}`} onClick={() => setTab("create")}>
            <IconPlus size={15} /> Create New Well
          </div>
        </div>

        {error && <div className="error-text" style={{ marginBottom: 14 }}>{error}</div>}

        {tab === "existing" ? (
          <div className="panel-box">
            <div className="search-row">
              <input
                type="text"
                placeholder="Search by Well ID, e.g. W001"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button onClick={handleSearch}><IconSearch size={14} /> Search</button>
            </div>
            {!searched && <div className="empty-hint">Type a Well ID above and press Search.</div>}
            {searched && results.length === 0 && <div className="empty-hint">No wells match "{query}".</div>}
            {results.map((w) => (
              <div className="well-result" key={w.wellId} onClick={() => selectWell(w)}>
                <div>
                  <div className="wr-id">{w.wellId} — {w.wellName}</div>
                  <div className="wr-meta">Field: {w.field || "—"} · Block: {w.block || "—"}</div>
                </div>
                <div className="status-chip status-active">{w.status || "Unknown"}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel-box">
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <Field label="Well ID" value={form.wellId} onChange={(v) => setForm({ ...form, wellId: v })} placeholder="e.g. W005" required />
                <Field label="Well Name" value={form.wellName} onChange={(v) => setForm({ ...form, wellName: v })} placeholder="e.g. Alpha-05" required />
                <Field label="Field" value={form.field} onChange={(v) => setForm({ ...form, field: v })} placeholder="e.g. Field_Alpha" />
                <Field label="Block" value={form.block} onChange={(v) => setForm({ ...form, block: v })} placeholder="e.g. Block_1" />
                <Field label="Well Type" value={form.wellType} onChange={(v) => setForm({ ...form, wellType: v })} placeholder="Exploratory / Development / Appraisal" />
                <Field label="Latitude" value={form.latitude} onChange={(v) => setForm({ ...form, latitude: v })} placeholder="27.4728" required />
                <Field label="Longitude" value={form.longitude} onChange={(v) => setForm({ ...form, longitude: v })} placeholder="95.3372" required />
                <Field label="Spud Date" value={form.spudDate} onChange={(v) => setForm({ ...form, spudDate: v })} placeholder="DD/MM/YYYY" />
                <Field label="Completion Date" value={form.completionDate} onChange={(v) => setForm({ ...form, completionDate: v })} placeholder="DD/MM/YYYY" />
                <Field label="Total Depth (m)" value={form.totalDepth} onChange={(v) => setForm({ ...form, totalDepth: v })} placeholder="e.g. 3200" />
                <div className="field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option>Drilling</option>
                    <option>Completed</option>
                    <option>Suspended</option>
                    <option>Planned</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary" type="submit">Create Well &amp; Continue to Dashboard</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="text" value={value} placeholder={placeholder} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}