import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

const COLORS = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#84cc16','#14b8a6'];
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Analytics() {
  const [categories, setCategories] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [c, m, mer, pm, cmp] = await Promise.all([
          api.get('/analytics/categories'),
          api.get('/analytics/monthly?months=6'),
          api.get('/analytics/merchants?limit=8'),
          api.get('/analytics/payment-methods'),
          api.get('/analytics/comparison'),
        ]);
        setCategories(c.data.data);
        setMonthly(m.data.data);
        setMerchants(mer.data.data);
        setPaymentMethods(pm.data.data);
        setComparison(cmp.data.data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="spinner w-10 h-10" /></div>;

  return (
    <div className="space-y-6">
      {/* Row 1 — Category + Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-ink mb-4">Category Distribution</h3>
          {categories.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categories} dataKey="total" nameKey="_id" cx="40%" cy="50%" outerRadius={90} label={false}>
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend layout="vertical" align="right" verticalAlign="middle"
                  formatter={(v) => <span className="text-xs text-ink-muted">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-ink mb-4">Payment Method Usage</h3>
          {paymentMethods.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={paymentMethods} dataKey="total" nameKey="_id" cx="40%" cy="50%" innerRadius={55} outerRadius={90}>
                  {paymentMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend layout="vertical" align="right" verticalAlign="middle"
                  formatter={(v) => <span className="text-xs text-ink-muted">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2 — Monthly trend */}
      <div className="card">
        <h3 className="text-sm font-semibold text-ink mb-4">Monthly Spending Trend</h3>
        {monthly.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3 — Top merchants */}
      <div className="card">
        <h3 className="text-sm font-semibold text-ink mb-4">Top Merchants by Spend</h3>
        {merchants.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={merchants} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="_id" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 4 — Month comparison */}
      {comparison && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink">This Month vs Last Month</h3>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${comparison.overallChange > 0 ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'}`}>
              {comparison.overallChange > 0 ? '▲' : '▼'} {Math.abs(comparison.overallChange)}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-surface-low rounded-lg p-3">
              <p className="text-xs text-ink-muted mb-1">This Month</p>
              <p className="text-xl font-bold text-ink">{fmt(comparison.thisMonth.total)}</p>
            </div>
            <div className="bg-surface-low rounded-lg p-3">
              <p className="text-xs text-ink-muted mb-1">Last Month</p>
              <p className="text-xl font-bold text-ink">{fmt(comparison.lastMonth.total)}</p>
            </div>
          </div>
          {comparison.comparison.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={comparison.comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Bar dataKey="previous" fill="#c3c6d7" name="Last Month" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" fill="#2563eb" name="This Month" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}

function Empty() {
  return <p className="text-center text-sm text-ink-muted py-10">No data available yet. Add expenses to see analytics.</p>;
}
