import { useEffect, useState } from "react";
import { getDecisionLogs } from "../api/decisionLogApi";
import { useWell } from "../context/WellContext";

export default function ContributorsPage() {
  const { activeWell } = useWell();
  const wellId = activeWell?.id;

  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!wellId) {
      setContributors([]);
      return;
    }

    setLoading(true);
    setError(null);

    getDecisionLogs(wellId)
      .then((data) => {
        setContributors(data.logs || []);
      })
      .catch((error) => {
        console.error("Failed to load contributors:", error);
        setError(error.message || "Unable to load contributor history.");
        setContributors([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [wellId]);

  return (
    <div>
      <div className="view-title">Contributors</div>
      <div className="view-sub">
        Engineers who worked on this well and the challenges they resolved.
      </div>

      {!wellId && (
        <div className="empty-hint">
          Select a well to view contributor history.
        </div>
      )}

      {wellId && loading && (
        <div className="empty-hint">
          Loading contributor history...
        </div>
      )}

      {error && !loading && (
        <div className="error-text">
          {error}
        </div>
      )}

      {wellId && !loading && !error && contributors.length === 0 && (
        <div className="empty-hint">
          No contributors yet for this well.
        </div>
      )}

      {!loading &&
        !error &&
        contributors.length > 0 &&
        contributors.map((c) => (
          <div className="contrib-card" key={c._id}>
            <div className="contrib-avatar">
              {getInitials(c.engineerName)}
            </div>

            <div>
              <div className="contrib-name">
                {c.engineerName}
                {c.date && (
                  <span className="contrib-date"> · {c.date}</span>
                )}
              </div>

              {c.depth != null && (
                <div className="contrib-problem">
                  <span className="lbl">Depth:</span> {c.depth} m
                </div>
              )}

              <div className="contrib-problem">
                <span className="lbl">Problem:</span> {c.problem}
              </div>

              <div className="contrib-solution">
                <span className="lbl">Solution:</span> {c.solution}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}