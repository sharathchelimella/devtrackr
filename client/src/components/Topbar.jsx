/**
 * components/Topbar.jsx – Top Navigation Bar with Real-Time Notifications
 */

import { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, RefreshCw, Trash2, Check, CheckSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { githubService } from '../services/githubService';
import toast from 'react-hot-toast';

const Topbar = ({ title = 'Dashboard', subtitle = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllAsRead, markOneAsRead, deleteNotification } = useNotifications();
  const [syncing, setSyncing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // The manual sync request itself triggers real-time socket events & DB records
      await githubService.sync();
      // Refresh the page data
      window.dispatchEvent(new Event('github-sync'));
    } catch (err) {
      // Caught error will be shown via notifications
    } finally {
      setSyncing(false);
    }
  };

  const getNotificationStyles = (type) => {
    if (type.includes('complete')) {
      return {
        bg: 'rgba(16,185,129,0.06)',
        border: '1px solid rgba(16,185,129,0.15)',
        text: 'text-emerald-400',
      };
    }
    if (type.includes('failed')) {
      return {
        bg: 'rgba(244,63,94,0.06)',
        border: '1px solid rgba(244,63,94,0.15)',
        text: 'text-rose-400',
      };
    }
    if (type.includes('started')) {
      return {
        bg: 'rgba(59,130,246,0.06)',
        border: '1px solid rgba(59,130,246,0.15)',
        text: 'text-blue-400',
      };
    }
    return {
      bg: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      text: 'text-slate-300',
    };
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // diff in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
      <div className="flex items-center gap-2 relative">
        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          title="Sync GitHub data"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            className={`relative p-2 rounded-lg transition-all duration-200 ${
              showNotifications ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-3 w-80 rounded-xl overflow-hidden glass-card shadow-2xl animate-fade-in border border-white/10"
              style={{
                background: 'rgba(15,23,42,0.95)',
                backdropFilter: 'blur(30px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={markAllAsRead}
                      title="Mark all as read"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <CheckSquare size={13} />
                    </button>
                    <button
                      onClick={() => deleteNotification(null)}
                      title="Clear all notifications"
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Scrollable list */}
              <div className="max-h-[320px] overflow-y-auto divide-y divide-white/4 scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500">
                    <Bell size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium">All caught up!</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const styles = getNotificationStyles(n.type);
                    const id = n.id || n._id;
                    return (
                      <div
                        key={id}
                        style={{ background: n.isRead ? 'transparent' : 'rgba(59,130,246,0.02)' }}
                        className="px-4 py-3 hover:bg-white/2 transition-colors relative group flex flex-col gap-1"
                      >
                        {/* Dot indicator */}
                        {!n.isRead && (
                          <div className="absolute left-2.5 top-4.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        )}
                        <div className={`pl-2 flex justify-between items-start`}>
                          <span className={`text-xs font-bold ${styles.text}`}>
                            {n.title}
                          </span>
                          <span className="text-[9px] text-slate-600 font-medium">
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="pl-2 text-[11px] text-slate-400 leading-normal pr-5">
                          {n.message}
                        </p>
                        
                        {/* Item actions */}
                        <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                          {!n.isRead && (
                            <button
                              onClick={() => markOneAsRead(id)}
                              className="p-1 rounded bg-slate-900/80 border border-white/5 text-slate-400 hover:text-emerald-400 transition"
                            >
                              <Check size={11} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(id)}
                            className="p-1 rounded bg-slate-900/80 border border-white/5 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
