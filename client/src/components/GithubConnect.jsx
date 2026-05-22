/**
 * components/GithubConnect.jsx – GitHub PAT Connection UI
 * Modal/card for entering and validating a GitHub Personal Access Token.
 */

import { useState } from 'react';
import { Eye, EyeOff, CheckCircle, RefreshCw, Unlink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { githubService } from '../services/githubService';
import toast from 'react-hot-toast';

// Inline GitHub SVG icon (lucide-react doesn't include this in older versions)
const GithubIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);


const GithubConnect = ({ onSuccess }) => {
  const { user, updateUser } = useAuth();
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isConnected = user?.github?.isConnected;

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!token.trim()) return toast.error('Please enter your GitHub PAT');

    setConnecting(true);
    try {
      const { data } = await githubService.connect(token.trim());
      toast.success(`Connected as @${data.github.username}!`);
      updateUser({ github: { ...user?.github, ...data.github, isConnected: true } });
      setToken('');

      // Auto-trigger sync
      setSyncing(true);
      toast.loading('Syncing your GitHub data...', { id: 'sync' });
      await githubService.sync();
      toast.success('GitHub data synced!', { id: 'sync' });
      setSyncing(false);

      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect GitHub');
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      toast.loading('Syncing GitHub data...', { id: 'sync' });
      await githubService.sync();
      toast.success('GitHub data synced!', { id: 'sync' });
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('Sync failed. Please try again.', { id: 'sync' });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your GitHub account? Your synced data will be removed.')) return;
    try {
      await githubService.disconnect();
      updateUser({ github: { isConnected: false, username: null, avatarUrl: null } });
      toast.success('GitHub disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  return (
    <div className="glass-card p-6 max-w-xl animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-slate-700/50 rounded-lg" style={{border:'1px solid rgba(255,255,255,0.1)'}}>
          <GithubIcon size={22} className="text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">GitHub Integration</h3>
          <p className="text-xs text-slate-400">
            {isConnected ? `Connected as @${user?.github?.username}` : 'Connect your GitHub account'}
          </p>
        </div>

        {isConnected && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle size={12} /> Connected
          </span>
        )}
      </div>

      {isConnected ? (
        /* ── Already Connected ── */
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
            {user?.github?.avatarUrl && (
              <img
                src={user.github.avatarUrl}
                alt="GitHub Avatar"
                className="w-10 h-10 rounded-full border border-white/15"
              />
            )}
            <div>
              <p className="text-sm font-semibold text-white">@{user?.github?.username}</p>
              <p className="text-xs text-slate-400">
                Connected {user?.github?.connectedAt ? new Date(user.github.connectedAt).toLocaleDateString() : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-secondary flex-1"
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button onClick={handleDisconnect} className="btn-secondary text-rose-400 hover:text-rose-300 border-rose-500/20 hover:border-rose-500/40">
              <Unlink size={15} />
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        /* ── Connect Form ── */
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg text-xs text-slate-400 leading-relaxed">
            <strong className="text-blue-400">How to create a PAT:</strong>{' '}
            GitHub → Settings → Developer settings → Personal access tokens → Generate new token.
            Required scopes: <code className="text-blue-300">repo</code>, <code className="text-blue-300">read:user</code>
          </div>

          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="input-field pr-12 font-mono text-xs"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" disabled={connecting || !token.trim()} className="btn-primary w-full justify-center">
            {connecting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <GithubIcon size={16} />
                Connect GitHub
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default GithubConnect;
