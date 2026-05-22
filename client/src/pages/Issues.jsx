/**
 * pages/Issues.jsx – GitHub Issues Page
 */

import { useState, useEffect } from 'react';
import { CircleDot, CheckCircle2, ExternalLink, Tag } from 'lucide-react';
import { githubService } from '../services/githubService';
import toast from 'react-hot-toast';

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await githubService.getIssues();
        setIssues(data.issues || []);
      } catch { toast.error('Failed to load issues'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = filter === 'all' ? issues : issues.filter((i) => i.state === filter);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex gap-2">
        {['all', 'open', 'closed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === f
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-xs opacity-60">
              {f === 'all' ? issues.length : issues.filter((i) => i.state === f).length}
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
                <div className="skeleton h-3 w-1/3 rounded" />
              </div>
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map((issue, i) => (
            <div key={issue.id || i} className="p-4 flex gap-4 items-start hover:bg-white/3 transition-colors group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                issue.state === 'open'
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-violet-500/10 border border-violet-500/20'
              }`}>
                {issue.state === 'open'
                  ? <CircleDot size={14} className="text-emerald-400" />
                  : <CheckCircle2 size={14} className="text-violet-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="text-sm text-white font-medium line-clamp-1">{issue.title}</p>
                  <span className={`badge shrink-0 ${issue.state === 'open' ? 'badge-green' : 'badge-purple'}`}>
                    {issue.state}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>#{issue.number}</span>
                  <span>{issue.author}</span>
                  <span>{issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : ''}</span>
                </div>
                {issue.labels?.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {issue.labels.map((label) => (
                      <span key={label} className="flex items-center gap-1 badge-blue text-[10px] px-2 py-0.5">
                        <Tag size={8} /> {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {issue.url && (
                <a href={issue.url} target="_blank" rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white mt-0.5">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <CircleDot size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No Issues Found</p>
            <p className="text-slate-500 text-sm">Sync your GitHub to load issues.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Issues;
