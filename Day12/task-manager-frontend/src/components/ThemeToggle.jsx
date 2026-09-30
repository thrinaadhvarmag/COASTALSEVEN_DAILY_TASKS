import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_KEY = "theme";

function getInitialTheme() {
    if (typeof window === "undefined") return false;

    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "dark") return true;
    if (saved === "light") return false;

    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function applyTheme(isDark) {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.dataset.theme = isDark ? "dark" : "light";
    root.style.colorScheme = isDark ? "dark" : "light";
}

function ThemeToggle() {
    const [dark, setDark] = useState(getInitialTheme);

    useEffect(() => {
        applyTheme(dark);
        window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    }, [dark]);

    function toggleTheme() {
        setDark((current) => !current);
    }

    return (
        <button
            type="button"
            className="theme-toggle"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={dark}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
        >
            {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
    );
}

export default ThemeToggle;
