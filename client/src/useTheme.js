import { useState, useEffect } from 'react';
import { getInitialTheme, setTheme as persistTheme } from './theme';

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    persistTheme(theme);
  }, [theme]);

  const toggle = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, setTheme: setThemeState, toggle };
}