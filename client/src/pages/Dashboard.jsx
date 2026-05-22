/**
 * pages/Dashboard.jsx – Main Dashboard Page
 * Displays key metrics, charts, and recent activity.
 */

import { useState, useEffect, useCallback } from 'react';
import { GitCommit, GitPullRequest, BookOpen, CircleDot, Cpu, TrendingUp } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import GithubConnect from '../components/GithubConnect';
import CommitFrequencyChart from '../charts/CommitFrequencyChart';
import PRStatusChart from '../charts/PRStatusChart';
import ContributorActivityChart from '../charts/ContributorActivityChart';
import IssuesChart from '../charts/IssuesChart';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/dashboard/summary');
      setDashboard(data.dashboard);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Listen for sync events from Topbar
    window.addEventListener('github-sync', fetchDashboard);
    return () => window.removeEventListener('github-sync', fetchDashboard);
  }, [fetchDashboard]);

  const stats = dashboard?.stats;
  const score = dashboard?.latestReport?.productivityScore;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="animate-fade-in">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {dashboard?.lastFetchedAt
            ? `Last synced: ${new Date(dashboard.lastFetchedAt).toLocaleString()}`
            : 'Connect your GitHub to get started'}
        </p>
      </div>

      {/* GitHub not connected banner */}
      {!dashboard?.isGithubConnected && !loading && (
        <div className="animate-slide-up">
          <GithubConnect onSuccess={fetchDashboard} />
        </div>
      )}

      {/* Productivity Score (if available) */}
      {score !== undefined && score !== null && (
        <div className="glass-card p-5 flex items-center gap-5 animate-slide-up"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%)', borderColor: 'rgba(59,130,246,0.2)' }}
        >
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="3"
                strokeDasharray={`${(score / 100) * 88} 88`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{score}</span>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1">AI Productivity Score</p>
            <p className="text-base font-semibold text-white">{dashboard?.latestReport?.summary?.slice(0, 80)}...</p>
          </div>
          <div className="ml-auto">
            <span className={`badge ${
              score >= 70 ? 'badge-green' : score >= 40 ? 'badge-amber' : 'badge-rose'
            }`}>
              {score >= 70 ? '🔥 High' : score >= 40 ? '⚡ Medium' : '📉 Low'}
            </span>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={BookOpen} label="Repositories" value={stats?.totalRepos ?? '—'}
          subtext="Total connected repos" color="blue" loading={loading} />
        <MetricCard icon={GitCommit} label="Commits" value={stats?.totalCommits ?? '—'}
          subtext="Last 30 days" color="purple" loading={loading} />
        <MetricCard icon={GitPullRequest} label="Pull Requests" value={stats?.totalPRs ?? '—'}
          subtext={`${stats?.openPRs ?? 0} open · ${stats?.closedPRs ?? 0} closed`}
          color="green" loading={loading} />
        <MetricCard icon={CircleDot} label="Issues" value={stats?.totalIssues ?? '—'}
          subtext={`${stats?.openIssues ?? 0} open`} color="amber" loading={loading} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CommitFrequencyChart data={dashboard?.commitFrequency || []} loading={loading} />
        </div>
        <PRStatusChart data={stats || {}} loading={loading} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ContributorActivityChart data={dashboard?.contributorActivity || []} loading={loading} />
        <IssuesChart data={stats || {}} loading={loading} />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Commits */}
        <div className="glass-card p-5">
          <h3 className="section-title mb-4">Recent Commits</h3>
          <div className="space-y-3">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))
            ) : dashboard?.recentCommits?.length > 0 ? (
              dashboard.recentCommits.map((c, i) => (
                <div key={c.sha || i} className="flex gap-3 items-start p-3 rounded-lg hover:bg-white/4 transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <GitCommit size={13} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate font-medium">{c.message}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.author} · {c.date ? new Date(c.date).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm text-center py-6">No commits found. Sync your GitHub to see activity.</p>
            )}
          </div>
        </div>

        {/* Top Languages */}
        <div className="glass-card p-5">
          <h3 className="section-title mb-4">Top Languages</h3>
          <div className="space-y-3">
            {loading ? (
              Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-8 rounded-lg" />)
            ) : dashboard?.topLanguages?.length > 0 ? (
              dashboard.topLanguages.map((lang, i) => {
                const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];
                const total = dashboard.topLanguages.reduce((s, l) => s + l.count, 0);
                const pct = Math.round((lang.count / total) * 100);
                return (
                  <div key={lang.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white font-medium">{lang.name}</span>
                      <span className="text-slate-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-sm text-center py-6">No language data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
