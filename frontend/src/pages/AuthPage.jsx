import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../context/RoleContext";
import UtilityBar from "../components/UtilityBar";
import { GoogleLogin } from "@react-oauth/google";
import { IconCompass, IconGauge, IconTarget, IconHardHat, IconBuilding } from "../components/Icons";
import nwisLogo from "../assets/nwis-logo.png";

export default function AuthPage() {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [loginRole, setLoginRole] = useState("field");
  const [loginForm, setLoginForm] = useState({ employeeId: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ employeeId: "", fullName: "", password: "" });

  const { login, register, googleLogin, loading, error } = useAuth();
  const { setRole } = useRole();
  const navigate = useNavigate();
  const [registerRole, setRegisterRole] = useState("field");

  async function handleLogin(e) {
    e.preventDefault();
    await login(loginForm);
    navigate("/app/dashboard");
  }
  async function handleRegister(e) {
    e.preventDefault();
    await register({ ...registerForm, role: registerRole });
    navigate("/app/dashboard");
  }

  async function handleGoogleSuccess(credentialResponse, roleForThisTab) {
    await googleLogin({ idToken: credentialResponse.credential, role: roleForThisTab });
    navigate("/app/dashboard");
  }

  return (
    <div className="auth-screen">
      <UtilityBar showRoleSwitch={false} showThemeToggle={false} />

      <div className="auth-hero">
        {/* NWIS BRAND */}
        <div className="nwis-brand">
          <img
             src={nwisLogo}
             alt="NWIS Oil India eRTMAC"
             className="nwis-logo"
           />
        </div>

        {/* HERO CONTENT */}
        <div className="nwis-hero-content">
          <h1>
            Nearby Wells
            <span>Intelligence System</span>
          </h1>

          <p className="nwis-tagline">
            Smarter insights. Safer operations.
            <br />
            A more efficient tomorrow.
          </p>

          {/* FEATURE INDICATORS */}
          <div className="nwis-features">
            <div className="nwis-feature">
              <div className="feature-icon">
                <IconCompass size={22} />
              </div>
              <div>Find Nearby<br />Wells</div>
            </div>

            <div className="nwis-feature">
              <div className="feature-icon">
                <IconGauge size={22} />
              </div>
              <div>Predict<br />Risks</div>
            </div>

            <div className="nwis-feature">
              <div className="feature-icon">
                <IconTarget size={22} />
              </div>
              <div>Improve<br />Decision Making</div>
            </div>
          </div>
        </div>

        <div className="nwis-oil-visual"></div>

        {/* FOOTER */}
        <div className="nwis-footer">
          <span></span>
          Powered by Data. Built for Safer Energy.
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="top-label">Oil India Limited</div>
          <h2>Access your dashboard</h2>

          <div className="tabs">
            <button className={`tab-btn ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>Log In</button>
            <button className={`tab-btn ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>Register</button>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin}>
              <div className="role-select">
                <div className={`role-opt ${loginRole === "field" ? "active" : ""}`} onClick={() => setLoginRole("field")}>
                  <span className="ric"><IconHardHat size={18} /></span>Field User
                </div>
                <div className={`role-opt ${loginRole === "office" ? "active" : ""}`} onClick={() => setLoginRole("office")}>
                  <span className="ric"><IconBuilding size={18} /></span>Office User
                </div>
              </div>
              <div className="field">
                <label>Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. E101"
                  value={loginForm.employeeId}
                  onChange={(e) => setLoginForm({ ...loginForm, employeeId: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              {error && <div className="error-text">{error}</div>}
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Logging in…" : "Log In"}
              </button>
              <div className="divider">OR</div>
              <GoogleLogin
                onSuccess={(cred) => handleGoogleSuccess(cred, loginRole)}
                onError={() => console.error("Google sign-in failed.")}
              />
              <div className="helper-text">Forgot password? Contact your IT administrator.</div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="role-select">
                <div className={`role-opt ${registerRole === "field" ? "active" : ""}`} onClick={() => setRegisterRole("field")}>
                  <span className="ric"><IconHardHat size={18} /></span>Field User
                </div>
                <div className={`role-opt ${registerRole === "office" ? "active" : ""}`} onClick={() => setRegisterRole("office")}>
                  <span className="ric"><IconBuilding size={18} /></span>Office User
                </div>
              </div>
              <div className="field">
                <label>Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. E101"
                  value={registerForm.employeeId}
                  onChange={(e) => setRegisterForm({ ...registerForm, employeeId: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="As per office records"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                />
              </div>
              {error && <div className="error-text">{error}</div>}
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Submitting…" : "Register"}
              </button>
              <div className="divider">OR</div>
              <GoogleLogin
                onSuccess={(cred) => handleGoogleSuccess(cred, registerRole)}
                onError={() => console.error("Google sign-up failed.")}
              />
              <div className="helper-text">Your account will be verified against HR records before activation.</div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ num, label }) {
  return (
    <div>
      <div className="st-num">{num}</div>
      <div className="st-lbl">{label}</div>
    </div>
  );
}