import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { IconMenu, IconSun, IconMoon, IconUser, IconLogout } from "./Icons";
import nwisLogo from "../assets/nwis-logo.png";

export default function TopNav({ onBurgerClick }) {
  const { user, isGuest, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="topnav">
      <div className="topnav-left">
        <button
          className="burger"
          onClick={onBurgerClick}
          aria-label="Toggle Navigation Rail"
          title="Toggle Navigation"
        >
          <IconMenu size={18} />
        </button>

        {/* Constrained Brand Logo Mark */}
        <Link to="/" className="brand-logo-wrap" title="eRTMAC-NWIS Operations Console">
          <img
            src={nwisLogo}
            alt="Oil India Limited — eRTMAC-NWIS"
            className="brand-logo-img"
          />
          <div className="brand-titles">
            <span className="brand-name">eRTMAC-NWIS</span>
            <span className="brand-sub">Nearby Wells Intelligence System</span>
          </div>
        </Link>

        {/* Primary Workspace Navigation Links */}
        <nav className="topnav-nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `top-nav-link ${isActive ? "active" : ""}`}
          >
            Operations
          </NavLink>
          <NavLink
            to="/nearby"
            className={({ isActive }) => `top-nav-link ${isActive ? "active" : ""}`}
          >
            Offset Wells
          </NavLink>
          <NavLink
            to="/knowledge"
            className={({ isActive }) => `top-nav-link ${isActive ? "active" : ""}`}
          >
            Knowledge
          </NavLink>
          <NavLink
            to="/decision-log"
            className={({ isActive }) => `top-nav-link ${isActive ? "active" : ""}`}
          >
            Decisions
          </NavLink>
        </nav>
      </div>

      <div className="topnav-right">
        {/* Theme Toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <IconSun size={15} /> : <IconMoon size={15} />}
        </button>

        {/* Optional Authentication Status / Sign In */}
        {isGuest ? (
          <Link to="/auth" className="ops-btn-signin" title="Sign in for official supervisory governance">
            <IconUser size={13} />
            <span>Sign In</span>
          </Link>
        ) : (
          <div className="user-auth-pill">
            <span className="user-pill-name">{user?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="ops-btn-icon-logout"
              title="Sign Out to Guest Mode"
            >
              <IconLogout size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}