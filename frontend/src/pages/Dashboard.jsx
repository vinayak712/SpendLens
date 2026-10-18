import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Receipt, Lightbulb, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function StatCard({ label, value, sub, icon: Icon, trend }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon size={16} className="text-primary-500" />
        </div>
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      {sub && <p className={`text-xs mt-1 ${trend === 'up' ? 'text-danger' : trend === 'down' ? 'text-success' : 'text-ink-muted'}`}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [recent, setRecent] = useState([]);
  const [insights, setInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoryView, setCategoryView] = useState('simple'); // 'simple' | 'detailed'

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, c, m, r] = await Promise.all([
          api.get('/expenses/stats'),
          api.get('/analytics/categories'),
          api.get('/analytics/monthly?months=6'),
          api.get('/analytics/recent?limit=5'),
        ]);
        setStats(s.data.data);
        setCategories(c.data.data);
        setMonthly(m.data.data);
        setRecent(r.data.data);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();

    // Load AI insights separately (slower)
    const fetchInsights = async () => {
      setLoadingInsights(true);
      try {
        const { data } = await api.get('/insights/dashboard');
        setInsights(data.insights);
      } catch {
        setInsights('Unable to load insights right now.');
      } finally {
        setLoadingInsights(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  const budgetPct = stats?.monthlyBudget > 0
    ? Math.min(100, Math.round((stats.monthlySpending / stats.monthlyBudget) * 100))
    : null;

  const displayedCategories = (() => {
    if (!categories || categories.length === 0) return [];
    if (categoryView === 'detailed') return categories;

    const foodCategories = ['Food', 'Grocery', 'Dairy', 'Snacks', 'Beverages'];
    let foodTotal = 0;
    let otherTotal = 0;

    categories.forEach((c) => {
      if (foodCategories.includes(c._id)) {
        foodTotal += c.total;
      } else {
        otherTotal += c.total;
      }
    });

    const result = [];
    if (foodTotal > 0) result.push({ _id: 'Food', total: foodTotal });
    if (otherTotal > 0) result.push({ _id: 'Other', total: otherTotal });
    return result.length > 0 ? result : categories;
  })();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-ink">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h2>
        <p className="text-sm text-ink-muted mt-0.5">Here's your financial overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Expenses" value={fmt(stats?.totalExpenses || 0)} icon={Wallet} />
        <StatCard label="This Month" value={fmt(stats?.monthlySpending || 0)}
          sub={stats?.lastMonthSpending > 0 ? `vs ${fmt(stats.lastMonthSpending)} last month` : ''}
          icon={TrendingUp}
          trend={stats?.monthlySpending > stats?.lastMonthSpending ? 'up' : 'down'}
        />
        <StatCard
          label="Budget Remaining"
          value={stats?.budgetRemaining !== null ? fmt(stats.budgetRemaining) : 'Not set'}
          sub={budgetPct !== null ? `${budgetPct}% used` : 'Set budget in Settings'}
          icon={TrendingDown}
        />
        <StatCard label="Transactions" value={stats?.totalTransactions || 0} icon={Receipt} />
      </div>

      {/* Budget bar */}
      {budgetPct !== null && (
        <div className="card">
          <div className="flex justify-between text-xs mb-2 text-ink-muted font-medium">
            <span>Monthly Budget Usage</span>
            <span>{budgetPct}% of {fmt(stats.monthlyBudget)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${budgetPct > 90 ? 'bg-danger' : budgetPct > 70 ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Pie */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">Spending by Category</h3>
            <div className="flex bg-gray-100 p-0.5 rounded-md text-[11px] font-medium">
              <button
                onClick={() => setCategoryView('simple')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  categoryView === 'simple' ? 'bg-white text-primary-600 shadow-2xs font-semibold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => setCategoryView('detailed')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  categoryView === 'detailed' ? 'bg-white text-primary-600 shadow-2xs font-semibold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Detailed
              </button>
            </div>
          </div>

          {displayedCategories.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={displayedCategories}
                  dataKey="total"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {displayedCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly trend */}
        <div className="card">
          <h3 className="text-sm font-semibold text-ink mb-4">Monthly Trend</h3>
          {monthly.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs text-primary-500 hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {recent.map((e) => (
                <div key={e._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-ink">{e.merchant}</p>
                    <p className="text-xs text-ink-muted">{e.category} · {new Date(e.date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className="text-sm font-semibold text-danger">-{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-warning" />
            <h3 className="text-sm font-semibold text-ink">AI Financial Insights</h3>
          </div>
          {loadingInsights ? (
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 size={16} className="animate-spin" /> Analyzing your spending...
            </div>
          ) : (
            <p className="text-sm text-ink-muted whitespace-pre-line leading-relaxed">{insights}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
