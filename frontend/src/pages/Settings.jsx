import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon, Save, Lock } from 'lucide-react';

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: user?.name || '', currency: user?.currency || 'INR' });
  const [budget, setBudget] = useState(user?.monthlyBudget || '');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBudgetSave = async () => {
    setSavingBudget(true);
    try {
      const { data } = await api.put('/auth/profile', { monthlyBudget: parseFloat(budget) || 0 });
      updateUser(data.user);
      toast.success('Budget updated');
    } catch {
      toast.error('Failed to update budget');
    } finally {
      setSavingBudget(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error('Fill all password fields');
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Min 6 characters');
    setSavingPw(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Profile */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-ink">Profile</h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-ink">{user?.name}</p>
            <p className="text-sm text-ink-muted">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input" value={profile.currency}
              onChange={(e) => setProfile({ ...profile, currency: e.target.value })}>
              {['INR','USD','EUR','GBP','AED'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleProfileSave} disabled={savingProfile} className="btn-primary flex items-center gap-2">
          <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Budget */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-ink">Monthly Budget</h3>
        <p className="text-sm text-ink-muted">Set your monthly spending limit to track budget remaining on the dashboard.</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">Monthly Budget (₹)</label>
            <input type="number" className="input" placeholder="e.g. 30000"
              value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <button onClick={handleBudgetSave} disabled={savingBudget} className="btn-primary self-end flex items-center gap-2">
            <Save size={15} /> {savingBudget ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="card">
        <h3 className="text-sm font-semibold text-ink mb-3">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink">Theme</p>
            <p className="text-xs text-ink-muted">Currently using {theme} mode</p>
          </div>
          <button onClick={toggleTheme} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-surface-low transition-colors">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-ink-muted" />
          <h3 className="text-sm font-semibold text-ink">Change Password</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
          </div>
          <button onClick={handlePasswordChange} disabled={savingPw} className="btn-primary flex items-center gap-2">
            <Lock size={15} /> {savingPw ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="card">
        <h3 className="text-sm font-semibold text-ink mb-3">Account</h3>
        <button onClick={handleLogout} className="btn-danger flex items-center gap-2">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}
