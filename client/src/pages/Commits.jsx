/**
 * pages/Commits.jsx – Commits History Page
 */

import { useState, useEffect } from 'react';
import { GitCommit, ExternalLink, Calendar } from 'lucide-react';
import { githubService } from '../services/githubService';
import toast from 'react-hot-toast';

const Commits = () => {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await githubService.getCommits();
        setCommits(data.commits || []);
      } catch { toast.error('Failed to load commits'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = commits.filter((c) =>
    c.message?.toLowerCase().includes(search.toLowerCase()) ||
    c.author?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex gap-3 items-center">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search commits..." className="input-field max-w-sm" />
        <span className="text-sm text-slate-400">{filtered.length} commits</span>
      </div>

      <div className="glass-card divide-y divide-white/5">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="p-4 flex gap-4 animate-pulse">
              <div className="w-8 h-8 bg-white/5 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
              </div>
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map((c, i) => (
            <div key={c.sha || i} className="p-4 flex gap-4 items-start hover:bg-white/3 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <GitCommit size={14} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium mb-0.5 line-clamp-2">{c.message}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-mono text-slate-600">{c.sha?.slice(0, 7)}</span>
                  <span>{c.author}</span>
                  {c.date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> {new Date(c.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              {c.url && (
                <a href={c.url} target="_blank" rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white mt-0.5">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <GitCommit size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No Commits Found</p>
            <p className="text-slate-500 text-sm">Sync your GitHub to load commit history.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Commits;
