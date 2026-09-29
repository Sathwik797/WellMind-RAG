import { IconChevronUp, IconChevronDown } from "./Icons";
export default function AlertCard({ title, data, isOpen, onToggle }) {
  const levelLabel = { high: "High", med: "Medium", low: "Low" }[data.level];
  const riskClass = { high: "risk-high", med: "risk-med", low: "risk-low" }[data.level];

  return (
    <div className={`alert-card ${riskClass}`}>
      <div className="alert-top">
        <div className="alert-name">{title}</div>
        <div className="alert-level">{levelLabel}</div>
      </div>
      <div className="alert-score">
        {data.score}
        <span> /100</span>
      </div>
      <div className="alert-desc">{data.desc}</div>
      <button className="why-btn" onClick={onToggle}>
              {isOpen ? "Hide details" : "Why this was predicted"}
        {isOpen ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
      </button>
      <div className={`why-panel ${isOpen ? "open" : ""}`}>
        <ul>
          {data.why.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}