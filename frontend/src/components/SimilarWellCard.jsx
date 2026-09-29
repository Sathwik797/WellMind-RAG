import { useState } from "react";
import { getWellEvents } from "../api/wellApi";
import { IconChevronUp, IconChevronDown } from "./Icons";

export default function SimilarWellCard({ rank, well }) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  async function togglePastEvents() {
    const willOpen = !open;
    setOpen(willOpen);

    if (willOpen && events === null && !loadingEvents) {
      setLoadingEvents(true);
      setEventsError(null);
      try {
        const data = await getWellEvents(well.wellId);
        setEvents(data);
      } catch (e) {
        setEventsError(e.message);
      } finally {
        setLoadingEvents(false);
      }
    }
  }

  return (
    <div className="similar-card">
      <div className="similar-top">
        <div className="sim-rank">{rank}</div>
        <div className="sim-info">
          <div className="sim-id">{well.wellId} — {well.wellName}</div>
          <div className="sim-meta">
            {well.formation || well.field || "—"} · {well.block || "—"} ·{" "}
            TD {well.totalDepth ? `${well.totalDepth} m` : "—"}
          </div>
          <div className="sim-tags">
            {(well.matchedFactors || []).map((tag) => (
              <span className="sim-tag" key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <div className="sim-score-wrap">
          <div className="sim-score-num">{well.similarityPercentage}%</div>
          <div className="sim-bar-bg">
            <div className="sim-bar-fill" style={{ width: `${well.similarityPercentage}%` }} />
          </div>
        </div>
      </div>

      <button className="view-past-btn" onClick={togglePastEvents}>
        {open ? "Hide past events" : "View past events"}
        {open ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
      </button>

      <div className={`past-events ${open ? "open" : ""}`}>
        {loadingEvents && <div className="pe-item">Loading past events…</div>}
        {eventsError && <div className="pe-item">Couldn't load past events: {eventsError}</div>}
        {!loadingEvents && events && events.length === 0 && (
          <div className="pe-item">No recorded events for this well yet.</div>
        )}
        {!loadingEvents &&
          events &&
          events.map((e, i) => (
            <div className="pe-item" key={i}>
              <div className="pe-date">
                {new Date(e.date).toLocaleDateString()}
                {e.depth ? ` · ${e.depth} m` : ""}
              </div>
              <div className="pe-p">{e.type} — {e.description}</div>
              <div className="pe-s">{e.mitigation}</div>
            </div>
          ))}
      </div>
    </div>
  );
}