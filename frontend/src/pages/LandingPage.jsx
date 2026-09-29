import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/nwis-logo.png";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp-page">
      <header className="lp-navbar">
        <div className="lp-brand-box">
          <img src={logo} alt="eRTMAC-NWIS Oil India Logo" className="lp-logo" />
          <div className="lp-brand-text">
            <strong>eRTMAC-NWIS</strong>
            <span>Nearby Wells Intelligence System</span>
          </div>
        </div>

        <div className="lp-nav-actions">
          <button
            type="button"
            className="ops-btn-primary"
            onClick={() => navigate("/")}
          >
            ENTER OPERATIONS WORKSTATION ➔
          </button>
          <Link to="/auth" className="ops-btn-secondary">
            Sign In (Optional)
          </Link>
        </div>
      </header>

      <main className="lp-hero-compact">
        <div className="lp-hero-card">
          <span className="terminal-badge">OIL INDIA LIMITED · RIG-FLOOR & RTOC</span>
          <h1 className="lp-hero-title">
            Nearby Wells Intelligence & Real-Time Drilling Risk Support
          </h1>
          <p className="lp-hero-desc">
            Advanced multi-target drilling risk surveillance integrating petrophysical depth tracks,
            offset well incident correlation, WellMind engineering retrieval, and real-time hydraulic scenario simulation.
          </p>
          <div className="lp-hero-actions">
            <button
              className="ops-btn-primary"
              onClick={() => navigate("/")}
              style={{ padding: "10px 22px", fontSize: "13px" }}
            >
              LAUNCH OPERATIONAL CONSOLE ➔
            </button>
            <Link
              to="/nearby"
              className="ops-btn-secondary"
              style={{ padding: "10px 18px", fontSize: "12px" }}
            >
              Explore Offset Map
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}