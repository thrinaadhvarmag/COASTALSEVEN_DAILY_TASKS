import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';
function Probe() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
      <button onClick={() => setTheme('light')}>Light</button>
    </div>
  );
}
beforeEach(() => localStorage.clear());
describe('ThemeContext', () => {
  it('defaults to dark mode', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });
  it('reads a saved theme from localStorage', () => {
    localStorage.setItem('rebel_mart_theme', 'light');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });
  it('toggles between dark and light', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });
  it('updates the document theme attribute', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.click(screen.getByRole('button', { name: 'Light' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
  it('persists theme changes', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Light' }));
    expect(localStorage.getItem('rebel_mart_theme')).toBe('light');
  });
});
