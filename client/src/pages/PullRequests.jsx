/**
 * pages/PullRequests.jsx – Pull Requests Page
 */

import { useState, useEffect } from 'react';
import { GitPullRequest, ExternalLink, GitMerge, XCircle } from 'lucide-react';
import { githubService } from '../services/githubService';
import toast from 'react-hot-toast';

const stateConfig = {
  open:   { label: 'Open',   class: 'badge-blue',   icon: GitPullRequest },
  merged: { label: 'Merged', class: 'badge-purple',  icon: GitMerge },
  closed: { label: 'Closed', class: 'badge-rose',    icon: XCircle },
};

const PullRequests = () => {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await githubService.getPRs();
        setPrs(data.pullRequests || []);
      } catch { toast.error('Failed to load PRs'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = filter === 'all' ? prs : prs.filter((p) => p.state === filter);

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'open', 'merged', 'closed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === f
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-xs opacity-60">
              {f === 'all' ? prs.length : prs.filter((p) => p.state === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="glass-card divide-y divide-white/5">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="p-4 flex gap-4 animate-pulse">
              <div className="w-8 h-8 bg-white/5 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map((pr, i) => {
            const config = stateConfig[pr.state] || stateConfig.open;
            const Icon = config.icon;
            return (
              <div key={pr.id || i} className="p-4 flex gap-4 items-start hover:bg-white/3 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-sm text-white font-medium line-clamp-1">{pr.title}</p>
                    <span className={`badge ${config.class} shrink-0`}>{config.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>#{pr.number}</span>
                    <span>{pr.author}</span>
                    <span>{pr.createdAt ? new Date(pr.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                </div>
                {pr.url && (
                  <a href={pr.url} target="_blank" rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white mt-0.5">
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center">
            <GitPullRequest size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No Pull Requests</p>
            <p className="text-slate-500 text-sm">Sync your GitHub to load PR data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PullRequests;
