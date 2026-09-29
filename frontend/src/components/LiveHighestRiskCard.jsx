import { useEffect, useState } from "react";
import { socket } from "../api/socket";
import { useWell } from "../context/WellContext";
import AlertCard from "./AlertCard";
import { RISK_LABELS } from "../utils/riskVocab";

export default function LiveHighestRiskCard() {
  const { activeWell } = useWell();

  const [liveData, setLiveData] = useState(null);
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    setLiveData(null);
    setShowWhy(false);

    if (!activeWell?.id) return;

    socket.emit("watch-well", activeWell.id);
    console.log("Emitted watch-well for:", activeWell.id);

    function handleUpdate(data) {
      console.log("drilling-update received:", data);

      if (data.wellId === activeWell.id) {
        setLiveData(data);
      }
    }

    socket.on("drilling-update", handleUpdate);

    return () => {
      socket.off("drilling-update", handleUpdate);
      socket.emit("unwatch-well", activeWell.id);
    };
  }, [activeWell]);

  if (!activeWell) return null;

  if (!liveData) {
    return (
      <div className="loading-hint">
        Waiting for live drilling data…
      </div>
    );
  }

  let highestKey = null;
  let highestProbability = -1;

  Object.keys(RISK_LABELS).forEach((key) => {
    const probability =
      (liveData.risks?.[key]?.probability ?? 0) * 100;

    if (probability > highestProbability) {
      highestProbability = probability;
      highestKey = key;
    }
  });

  if (!highestKey) return null;

  const score = Math.round(highestProbability);

  const level =
    score >= 80
      ? "high"
      : score >= 40
      ? "med"
      : "low";

  const relatedWarning = liveData.warnings?.find(
    (w) =>
      w.event?.replace(/\s/g, "_") + "_Label" === highestKey
  );

  const desc =
    level === "high"
      ? "Elevated risk — review immediately."
      : level === "med"
      ? "Moderate risk — monitor closely."
      : "Low risk at current parameters.";

  const why = [
    relatedWarning
      ? relatedWarning.message
      : `Current probability: ${score}%`,
    `Depth: ${liveData.depth?.toFixed(1) ?? "—"} m`,
    `Recommendation: ${
      liveData.recommendation ||
      "Continue monitoring current drilling conditions."
    }`,
  ];

  return (
    <AlertCard
      title={`${RISK_LABELS[highestKey].title} (Highest Current Risk)`}
      data={{
        level,
        score,
        desc,
        why,
      }}
      isOpen={showWhy}
      onToggle={() => {
        console.log("Why button clicked. Current:", showWhy);
        setShowWhy((prev) => !prev);
      }}
    />
  );
}