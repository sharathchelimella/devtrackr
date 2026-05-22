/**
 * pages/Settings.jsx – User Settings Page
 */

import { useState } from 'react';
import { User, Shield, Moon, Sun, Save, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import GithubConnect from '../components/GithubConnect';
import api from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [changingPass, setChangingPass] = useState(false);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/api/auth/profile', { name });
      updateUser({ name: data.user.name });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) return toast.error('Passwords do not match');
    if (passwords.newPass.length < 8) return toast.error('Password must be at least 8 characters');
    setChangingPass(true);
    try {
      await api.put('/api/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      toast.success('Password changed!');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setChangingPass(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <User size={16} className="text-blue-400" />
          </div>
          <h3 className="section-title">Profile Information</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="input-field" placeholder="Your name" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
          <input type="email" value={user?.email || ''} disabled
            className="input-field opacity-50 cursor-not-allowed" />
          <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300">
            <Shield size={14} className="text-violet-400" />
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </div>
        </div>

        <button onClick={handleProfileSave} disabled={saving} className="btn-primary">
          <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Appearance */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            {theme === 'dark' ? <Moon size={16} className="text-amber-400" /> : <Sun size={16} className="text-amber-400" />}
          </div>
          <h3 className="section-title">Appearance</h3>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/4 rounded-xl border border-white/8">
          <div>
            <p className="text-sm font-medium text-white">Dark Mode</p>
            <p className="text-xs text-slate-400">Currently {theme} mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
              theme === 'dark' ? 'bg-blue-600' : 'bg-slate-600'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* GitHub */}
      <GithubConnect />

      {/* Change Password */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
            <Key size={16} className="text-rose-400" />
          </div>
          <h3 className="section-title">Change Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3">
          <input type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})}
            placeholder="Current password" className="input-field" required />
          <input type="password" value={passwords.newPass} onChange={(e) => setPasswords({...passwords, newPass: e.target.value})}
            placeholder="New password (min. 8 chars)" className="input-field" required />
          <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
            placeholder="Confirm new password" className="input-field" required />
          <button type="submit" disabled={changingPass} className="btn-primary">
            <Key size={14} /> {changingPass ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
