import { useTheme } from "../context/ThemeContext";
import { useRole } from "../context/RoleContext";
import { IconSun, IconMoon, IconHardHat } from "./Icons";

// Floating theme toggle (+ optional role switch) shown on pre-login screens.
export default function UtilityBar({ showRoleSwitch = false, showThemeToggle = true }) {
  const { theme, toggleTheme } = useTheme();
  const { role, setRole } = useRole();

  return (
    <div className="util-bar">
      {showThemeToggle && (
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle light / dark mode">
          {theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
        </button>
      )}
      {showRoleSwitch && (
        <div className="role-pill-switch">
          <button className={role === "field" ? "active" : ""} onClick={() => setRole("field")}>
            <IconHardHat size={14} /> Field
          </button>
        </div>
      )}
    </div>
  );
}