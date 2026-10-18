import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  BarChart2,
  Lightbulb,
  Settings,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/add-expense',  icon: PlusCircle,      label: 'Add Expense' },
  { to: '/transactions', icon: Receipt,          label: 'Transactions' },
  { to: '/analytics',    icon: BarChart2,        label: 'Analytics' },
  { to: '/insights',     icon: Lightbulb,        label: 'AI Insights' },
  { to: '/settings',     icon: Settings,         label: 'Settings' },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-60 shrink-0 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-lg font-bold text-ink tracking-tight">SpendLens</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User badge at bottom */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
            <p className="text-xs text-ink-subtle truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
