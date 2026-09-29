import { getRiskLevel, explainFactor } from "../utils/riskVocab";
import { IconChevronUp, IconArrowRight } from "./Icons";

export default function RiskCard({
  title,
  prediction,
  factors,
  isOpen,
  onToggle,
}) {
  if (!prediction) {
    return (
      <div className="risk-card">
        <div className="risk-title">{title}</div>
        <div className="loading-hint">Waiting for prediction…</div>
      </div>
    );
  }

  const rawProbability =
    typeof prediction.probability === "number"
      ? prediction.probability
      : 0;

  const probability =
    rawProbability <= 1
      ? rawProbability * 100
      : rawProbability;

  const pct = Math.min(Math.max(probability, 0), 100);

  const riskLevel =
    prediction.risk_level ||
    getRiskLevel(rawProbability);

  const normalizedLevel = String(riskLevel).toLowerCase();

  return (
    <div className={`risk-card ${normalizedLevel}`}>
      <div className="risk-title">
        {title}
      </div>

      <div className="risk-pct">
        {pct.toFixed(1)}%
      </div>

      <div className="risk-label">
        {normalizedLevel === "high"
          ? "HIGH RISK"
          : normalizedLevel === "medium" ||
            normalizedLevel === "med"
          ? "MEDIUM RISK"
          : "LOW RISK"}
      </div>

      <button
        type="button"
        className="risk-explanation-button"
        onClick={onToggle}
      >
        <span>
          {isOpen
            ? "Hide explanation"
            : `Why is this ${
                normalizedLevel === "med"
                  ? "medium"
                  : normalizedLevel
              }?`}
        </span>

        <span className="explanation-arrow">
          {isOpen ? <IconChevronUp size={14} /> : <IconArrowRight size={14} />}
        </span>
      </button>

      {isOpen && (
        <div className="risk-explanation-drawer mobile-only-explanation">
          <ExplanationContent factors={factors} />
        </div>
      )}
    </div>
  );
}

function ExplanationContent({ factors }) {
  if (!factors) {
    return (
      <div className="explanation-empty">
        Explanation is currently unavailable.
      </div>
    );
  }

  if (Array.isArray(factors)) {
    if (factors.length === 0) {
      return (
        <div className="explanation-empty">
          No significant risk factors found.
        </div>
      );
    }

    return (
      <div className="explanation-list">
        {factors.map((factor, index) => (
          <ExplanationItem
            key={factor.id || factor.feature || index}
            factor={factor}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="explanation-text">
      {Object.entries(factors).map(
        ([key, value]) => (
          <div className="explanation-row" key={key}>
            <strong>{formatLabel(key)}</strong>
            <div className="explanation-value">
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function ExplanationItem({ factor }) {
  const feature =
    factor.feature ||
    factor.factor ||
    factor.name ||
    "Risk factor";

  const shapValue = Number(
    factor.shap_value ??
    factor.shapValue ??
    factor.value ??
    0
  );

  const isIncreased = shapValue > 0;
  const isDecreased = shapValue < 0;

  let explained = {};

  try {
    explained = explainFactor(feature, shapValue) || {};
  } catch {
    explained = {};
  }

  const description =
    factor.description ||
    factor.explanation ||
    factor.reason ||
    explained.description ||
    explained.explanation ||
    explained.sentence ||
    `${formatLabel(feature)} is influencing the current risk level.`;

  return (
    <div className="explanation-item">
      <div className="explanation-point">
        <strong>{formatLabel(feature)}</strong>

        {isIncreased && (
          <span className="change-pill increased">↑ Increased</span>
        )}

        {isDecreased && (
          <span className="change-pill decreased">↓ Decreased</span>
        )}
      </div>

      <div className="explanation-description">
        {description}
      </div>
    </div>
  );
}

function formatLabel(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}