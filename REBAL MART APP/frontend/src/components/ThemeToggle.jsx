import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ showLabel = false, className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      className={`theme-toggle-switch ${isDark ? "is-dark" : "is-light"} ${showLabel ? "has-label" : "icon-only"} ${className}`}
      onClick={toggleTheme}
      title={`Switch to ${nextTheme} mode`}
      aria-label={`Switch to ${nextTheme} mode`}
    >
      <div className="theme-toggle-thumb-icon">
        {isDark ? (
          <Sun size={15} className="theme-sun-icon" />
        ) : (
          <Moon size={15} className="theme-moon-icon" />
        )}
      </div>
      <span className="theme-toggle-label">
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}
