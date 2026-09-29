import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";
import { useAuth } from "../context/AuthContext";
import {
  IconDashboard,
  IconMap,
  IconLayers,
  IconUsers,
  IconChat,
  IconClipboard,
  IconUser,
  IconLogout,
} from "./Icons";

export default function Sidebar({ collapsed }) {
  const { isField } = useRole();
  const { user, isGuest, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  const isGuestUser = isGuest || !user || !!user?.isGuest || user?.employeeId === "GUEST-001";
  const initials = isGuestUser ? "GE" : (user?.name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "OP");

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sb-user">
        <div className="sb-avatar">{initials}</div>
        <div className="sb-user-info">
          <div className="sb-user-name">{isGuestUser ? "Guest Engineer" : (user?.name || "Drilling Engineer")}</div>
          <div className="sb-user-role">{isGuestUser ? "Guest Access" : isField ? "RTOC Field Console" : "Office Operations"}</div>
        </div>
      </div>
      <div className="nav-list">
        <NavItem to="/" icon={<IconDashboard size={16} />} label="Operations" />
        <NavItem to="/app/nearby" icon={<IconMap size={16} />} label="Offset Wells" />
        <NavItem to="/app/similar" icon={<IconLayers size={16} />} label="Similar Formations" />
        <NavItem to="/app/knowledge" icon={<IconChat size={16} />} label="Knowledge Hub" />
        <NavItem to="/app/decision-log" icon={<IconClipboard size={16} />} label="Decisions" />
        {!isField && <NavItem to="/app/contributors" icon={<IconUsers size={16} />} label="Contributors" />}
        <div className="nav-sep" />
        <NavItem to="/app/account" icon={<IconUser size={16} />} label="Account" />

        {/* Guest shows Sign In, Authenticated shows Logout */}
        {isGuestUser ? (
          <div
            className="nav-item login-action"
            onClick={() => navigate("/auth")}
            title="Sign In to unlock official supervisory actions"
          >
            <span className="ic"><IconUser size={16} /></span>
            <span className="nav-label">Sign In</span>
          </div>
        ) : (
          <div className="nav-item logout" onClick={handleLogout} title="Sign Out">
            <span className="ic"><IconLogout size={16} /></span>
            <span className="nav-label">Logout</span>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      title={label}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
    >
      <span className="ic">{icon}</span>
      <span className="nav-label">{label}</span>
    </NavLink>
  );
}