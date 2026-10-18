import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Trash2, Pencil, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const CATEGORIES = [
  'Food', 'Grocery', 'Dairy', 'Snacks', 'Beverages', 'Personal Care', 'Household',
  'Health', 'Shopping', 'Medical', 'Fuel', 'Travel', 'Bills',
  'Entertainment', 'Electronics', 'Education', 'Friend', 'Family',
  'Rent', 'Loan', 'Salary', 'Gift', 'Other',
];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Card', 'Net Banking', 'Other'];

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Transactions() {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchExpenses = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 10 });
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (paymentMethod) params.append('paymentMethod', paymentMethod);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const { data } = await api.get(`/expenses?${params}`);
      setExpenses(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(page); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExpenses(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Deleted');
      fetchExpenses(page);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const startEdit = (e) => {
    setEditId(e._id);
    setEditForm({
      merchant: e.merchant, amount: e.amount, date: e.date?.split('T')[0],
      category: e.category, paymentMethod: e.paymentMethod, notes: e.notes || '',
    });
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/expenses/${editId}`, { ...editForm, amount: parseFloat(editForm.amount) });
      toast.success('Updated');
      setEditId(null);
      fetchExpenses(page);
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="label">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
              <input className="input pl-8" placeholder="Merchant or notes..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="w-36">
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="label">Payment</label>
            <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="">All</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="label">From</label>
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="w-36">
            <label className="label">To</label>
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary">Search</button>
          <button type="button" className="btn-secondary" onClick={() => {
            setSearch(''); setCategory(''); setPaymentMethod('');
            setStartDate(''); setEndDate(''); setPage(1); fetchExpenses(1);
          }}>Clear</button>
        </form>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-ink">
            {pagination.total} Transaction{pagination.total !== 1 ? 's' : ''}
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner w-8 h-8" />
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-center text-ink-muted text-sm py-12">No transactions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-surface-low">
                  {['Date','Merchant','Category','Payment','Amount',''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) =>
                  editId === e._id ? (
                    <tr key={e._id} className="border-b border-gray-50 bg-primary-50">
                      <td className="px-3 py-2"><input type="date" className="input text-xs py-1" value={editForm.date} onChange={(ev) => setEditForm({ ...editForm, date: ev.target.value })} /></td>
                      <td className="px-3 py-2"><input className="input text-xs py-1" value={editForm.merchant} onChange={(ev) => setEditForm({ ...editForm, merchant: ev.target.value })} /></td>
                      <td className="px-3 py-2">
                        <select className="input text-xs py-1" value={editForm.category} onChange={(ev) => setEditForm({ ...editForm, category: ev.target.value })}>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select className="input text-xs py-1" value={editForm.paymentMethod} onChange={(ev) => setEditForm({ ...editForm, paymentMethod: ev.target.value })}>
                          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2"><input type="number" className="input text-xs py-1 w-24" value={editForm.amount} onChange={(ev) => setEditForm({ ...editForm, amount: ev.target.value })} /></td>
                      <td className="px-3 py-2 flex gap-1">
                        <button onClick={handleEditSave} className="btn-primary text-xs py-1 px-2">Save</button>
                        <button onClick={() => setEditId(null)} className="btn-secondary text-xs py-1 px-2"><X size={12} /></button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={e._id} className="border-b border-gray-50 hover:bg-surface-low transition-colors">
                      <td className="px-5 py-3 text-sm text-ink-muted">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink">{e.merchant}</p>
                          {e.items && e.items.length > 0 && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium border border-gray-200">
                              {e.items.length} items
                            </span>
                          )}
                        </div>
                        {e.notes && <p className="text-xs text-ink-subtle truncate max-w-xs">{e.notes}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="badge bg-primary-50 text-primary-600">{e.category}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-ink-muted">{e.paymentMethod}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-danger">{fmt(e.amount)}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(e)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-mid text-ink-muted"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(e._id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-danger"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-ink-muted">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-surface-low">
                <ChevronLeft size={16} />
              </button>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-surface-low">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
