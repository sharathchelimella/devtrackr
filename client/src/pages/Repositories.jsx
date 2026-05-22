/**
 * pages/Repositories.jsx – GitHub Repositories Page
 */

import { useState, useEffect } from 'react';
import { BookOpen, Star, GitFork, AlertCircle, ExternalLink, Lock, Globe } from 'lucide-react';
import { githubService } from '../services/githubService';
import toast from 'react-hot-toast';

const Repositories = () => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true);
      try {
        const { data } = await githubService.getRepos();
        setRepos(data.repositories || []);
      } catch {
        toast.error('Failed to load repositories');
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, []);

  const filtered = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const langColors = {
    JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3776ab',
    Java: '#b07219', 'C++': '#f34b7d', Go: '#00add8', Rust: '#dea584',
    Ruby: '#701516', PHP: '#777bb4', CSS: '#563d7c', HTML: '#e34c26',
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search repositories..."
          className="input-field max-w-sm"
        />
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <BookOpen size={15} />
          {filtered.length} repos
        </div>
      </div>

      {/* Repository Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse space-y-3">
              <div className="skeleton h-5 w-1/2 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
              <div className="flex gap-3 mt-3">
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-4 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((repo) => (
            <div key={repo.id} className="glass-card p-5 hover:scale-[1.01] transition-transform duration-200 group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {repo.isPrivate ? (
                    <Lock size={14} className="text-amber-400 shrink-0" />
                  ) : (
                    <Globe size={14} className="text-slate-500 shrink-0" />
                  )}
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-white hover:text-blue-400 transition-colors truncate"
                  >
                    {repo.name}
                  </a>
                </div>
                <a href={repo.url} target="_blank" rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white">
                  <ExternalLink size={14} />
                </a>
              </div>

              {repo.description && (
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{repo.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500">
                {repo.language && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full"
                      style={{ background: langColors[repo.language] || '#6b7280' }} />
                    {repo.language}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star size={11} className="text-amber-400" /> {repo.stars}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork size={11} className="text-slate-400" /> {repo.forks}
                </span>
                {repo.openIssues > 0 && (
                  <span className="flex items-center gap-1">
                    <AlertCircle size={11} className="text-rose-400" /> {repo.openIssues} issues
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <BookOpen size={40} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No Repositories Found</h3>
          <p className="text-slate-400 text-sm">
            {search ? 'No repos match your search.' : 'Connect and sync your GitHub to see repositories.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Repositories;
