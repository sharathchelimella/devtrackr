/**
 * components/Topbar.jsx – Top Navigation Bar
 */

import { Bell, Sun, Moon, RefreshCw, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import { githubService } from '../services/githubService';
import toast from 'react-hot-toast';

const Topbar = ({ title = 'Dashboard', subtitle = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      toast.loading('Syncing GitHub data...', { id: 'topbar-sync' });
      await githubService.sync();
      toast.success('Data synced!', { id: 'topbar-sync' });
      // Refresh the page data
      window.dispatchEvent(new Event('github-sync'));
    } catch {
      toast.error('Sync failed', { id: 'topbar-sync' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center justify-between px-6"
      style={{
        left: '260px',
        height: '64px',
        background: 'rgba(15,23,42,0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Title */}
      <div>
        <h1 className="text-base font-bold text-white leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          title="Sync GitHub data"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-200"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications (placeholder) */}
        <button
          title="Notifications"
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-200"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
