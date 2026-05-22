/**
 * components/Sidebar.jsx – Sidebar Navigation
 */

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, GitCommit, GitPullRequest, CircleDot,
  BookOpen, Cpu, Settings, LogOut, Zap, ChevronRight, Kanban
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',      badge: null },
  { path: '/repositories',  icon: BookOpen,         label: 'Repositories',  badge: null },
  { path: '/commits',       icon: GitCommit,        label: 'Commits',       badge: null },
  { path: '/pull-requests', icon: GitPullRequest,   label: 'Pull Requests', badge: null },
  { path: '/issues',        icon: CircleDot,        label: 'Issues',        badge: null },
  { path: '/collaboration',  icon: Kanban,           label: 'Team Board',    badge: null },
  { path: '/ai-insights',   icon: Cpu,              label: 'AI Insights',   badge: 'AI' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full z-30 flex flex-col"
      style={{ width: '260px', background: 'rgba(15,23,42,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-glow">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <span className="text-base font-extrabold text-white tracking-tight">DevTrackr</span>
          <p className="text-xs text-slate-500 -mt-0.5">AI Productivity</p>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/4 hover:bg-white/6 transition-colors cursor-pointer" onClick={() => navigate('/settings')}>
          {user?.github?.avatarUrl ? (
            <img src={user.github.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-white/15" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">
              {user?.github?.isConnected ? `@${user.github.username}` : 'GitHub not connected'}
            </p>
          </div>
          <ChevronRight size={14} className="text-slate-600" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-2 mb-3">Menu</p>
        {navItems.map(({ path, icon: Icon, label, badge }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Settings size={17} />
          <span>Settings</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="nav-link w-full text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
        >
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
