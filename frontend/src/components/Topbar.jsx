import { useLocation } from 'react-router-dom';
import { Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/dashboard':    'Dashboard',
  '/add-expense':  'Add Expense',
  '/transactions': 'Transactions',
  '/analytics':    'Analytics',
  '/insights':     'AI Insights',
  '/settings':     'Settings',
};

export default function Topbar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const title = pageTitles[pathname] || 'SpendLens';

  return (
    <header className="h-14 shrink-0 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <h1 className="text-base font-semibold text-ink">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-mid transition-colors text-ink-muted"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Currency badge */}
        <span className="text-xs font-medium text-ink-muted border border-gray-200 rounded px-2 py-1">
          {user?.currency || 'INR'}
        </span>
      </div>
    </header>
  );
}
