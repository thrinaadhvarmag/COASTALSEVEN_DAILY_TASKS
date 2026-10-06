import { Moon, Sun } from './icons';
import { useTheme } from '../context/ThemeContext';
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="icon-btn"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
