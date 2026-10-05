import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const KEY = "rebel_mart_theme";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(KEY) || "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(KEY, theme);
  }, [theme]);
  const toggleTheme = () => setTheme((v) => (v === "dark" ? "light" : "dark"));
  return <ThemeContext.Provider value={useMemo(() => ({ theme, setTheme, toggleTheme }), [theme])}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
