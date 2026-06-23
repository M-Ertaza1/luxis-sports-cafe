// Reads the saved theme, or falls back to the OS preference
export function getInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  // Follow the system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Applies the theme by toggling the `dark` class on <html>
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Saves and applies
export function setTheme(theme) {
  localStorage.setItem('theme', theme);
  applyTheme(theme);
}