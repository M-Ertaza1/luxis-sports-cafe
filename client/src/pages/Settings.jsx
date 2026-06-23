import Layout from '../components/Layout';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../useTheme';

export default function Settings() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-brand mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Appearance */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-1">Appearance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose how the app looks.</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
              <span className="text-sm">{isDark ? 'Dark mode' : 'Light mode'}</span>
            </div>
            <button
              onClick={toggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-brand' : 'bg-gray-300'}`}
              aria-label="Toggle dark mode"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : ''}`}
              />
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}