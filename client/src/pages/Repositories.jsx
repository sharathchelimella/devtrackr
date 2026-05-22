/**
 * pages/Repositories.jsx – GitHub Repositories Page with Health Scores & Interactive Analytics
 */

import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Star, GitFork, AlertCircle, ExternalLink, Lock, Globe,
  Activity, ShieldAlert, Award, Heart, Layers, ArrowUpDown, Info, CheckCircle, HelpCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { githubService } from '../services/githubService';
import toast from 'react-hot-toast';

const getRepoNameFromUrl = (url) => {
  if (!url) return '';
  const parts = url.replace('https://github.com/', '').split('/');
  return parts[1] || '';
};

const Repositories = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | list
  const [githubData, setGithubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('health'); // health | name | stars | updated
  const [selectedRepo, setSelectedRepo] = useState(null); // Repo detail modal target

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data } = await githubService.getData();
      if (data.success && data.data) {
        setGithubData(data.data);
      } else {
        setGithubData(null);
      }
    } catch (err) {
      toast.error('Failed to load GitHub analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Listen for manual/background sync updates to live refresh the page
    window.addEventListener('github-sync', fetchAllData);
    return () => window.removeEventListener('github-sync', fetchAllData);
  }, []);

  // ── Calculate Health Scores ────────────────────────────────────────────────
  const reposWithHealth = useMemo(() => {
    if (!githubData || !githubData.repositories) return [];

    const commits = githubData.commits || [];
    const prs = githubData.pullRequests || [];
    const issues = githubData.issues || [];

    return githubData.repositories.map((repo) => {
      // 1. Commits Score (30%)
      const repoCommits = commits.filter((c) => getRepoNameFromUrl(c.url) === repo.name);
      const commitCount = repoCommits.length;
      const commitsScore = Math.min(100, (commitCount / 10) * 100);

      // 2. PR Activity Score (20%)
      const repoPRs = prs.filter((p) => getRepoNameFromUrl(p.url) === repo.name);
      const prCount = repoPRs.length;
      const prScore = prCount === 0 ? 50 : Math.min(100, (prCount / 4) * 100);

      // 3. Issue Resolution Score (20%)
      const repoIssues = issues.filter((i) => getRepoNameFromUrl(i.url) === repo.name);
      const totalIssues = repoIssues.length;
      const closedIssues = repoIssues.filter((i) => i.state === 'closed').length;
      const issueScore = totalIssues === 0 ? 100 : Math.min(100, (closedIssues / totalIssues) * 100);

      // 4. Repo Activity Score (30%)
      // Recency of updates (updatedAt)
      const updateDate = new Date(repo.updatedAt);
      const daysSinceUpdate = Math.floor((new Date() - updateDate) / (1000 * 60 * 60 * 24));
      let recencyScore = 10;
      if (daysSinceUpdate <= 3) recencyScore = 100;
      else if (daysSinceUpdate <= 7) recencyScore = 85;
      else if (daysSinceUpdate <= 14) recencyScore = 65;
      else if (daysSinceUpdate <= 30) recencyScore = 40;

      // Stars and forks weight
      const engagementScore = Math.min(100, (repo.stars * 5) + (repo.forks * 10));
      const activityScore = (recencyScore * 0.7) + (engagementScore * 0.3);

      // Final Weighted Health Score
      const healthScore = Math.round(
        (commitsScore * 0.3) +
        (prScore * 0.2) +
        (issueScore * 0.2) +
        (activityScore * 0.3)
      );

      // Helper status tag
      let healthStatus = 'Needs Attention';
      let healthColor = 'text-rose-400';
      if (healthScore >= 80) {
        healthStatus = 'Healthy';
        healthColor = 'text-emerald-400';
      } else if (healthScore >= 55) {
        healthStatus = 'Moderate';
        healthColor = 'text-amber-400';
      }

      return {
        ...repo,
        healthScore,
        healthStatus,
        healthColor,
        breakdown: {
          commits: Math.round(commitsScore),
          prs: Math.round(prScore),
          issues: Math.round(issueScore),
          activity: Math.round(activityScore),
        },
        stats: {
          commits: commitCount,
          prs: prCount,
          issues: totalIssues,
          closedIssues,
        }
      };
    });
  }, [githubData]);

  // Sort and Filter repositories
  const sortedAndFilteredRepos = useMemo(() => {
    let list = [...reposWithHealth];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }

    // Sort options
    list.sort((a, b) => {
      if (sortBy === 'health') return b.healthScore - a.healthScore;
      if (sortBy === 'stars') return b.stars - a.stars;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'updated') return new Date(b.updatedAt) - new Date(a.updatedAt);
      return 0;
    });

    return list;
  }, [reposWithHealth, search, sortBy]);

  // Aggregate stats for Dashboard Tab
  const dashboardStats = useMemo(() => {
    if (reposWithHealth.length === 0) return null;

    const avgScore = Math.round(
      reposWithHealth.reduce((acc, r) => acc + r.healthScore, 0) / reposWithHealth.length
    );

    const healthyCount = reposWithHealth.filter((r) => r.healthScore >= 80).length;
    const moderateCount = reposWithHealth.filter((r) => r.healthScore >= 55 && r.healthScore < 80).length;
    const alertCount = reposWithHealth.filter((r) => r.healthScore < 55).length;

    // Language trends data
    const langMap = {};
    reposWithHealth.forEach((r) => {
      if (r.language) {
        langMap[r.language] = (langMap[r.language] || 0) + 1;
      }
    });
    const languageData = Object.entries(langMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Commit timeline chart data (last 10 days in chronological order)
    const commitTimelineMap = {};
    const last10DaysKeys = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      commitTimelineMap[key] = 0;
      last10DaysKeys.push(key);
    }

    if (githubData && githubData.commits) {
      githubData.commits.forEach((c) => {
        if (!c.date) return;
        const key = new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (commitTimelineMap.hasOwnProperty(key)) {
          commitTimelineMap[key]++;
        }
      });
    }

    const commitTrendData = last10DaysKeys.map((date) => ({
      date,
      commits: commitTimelineMap[date],
    }));

    // Productivity metrics comparison
    const productivityCompareData = reposWithHealth.slice(0, 5).map((r) => ({
      name: r.name,
      commits: r.stats.commits,
      PRs: r.stats.prs,
      issues: r.stats.issues,
    }));

    return {
      avgScore,
      healthyCount,
      moderateCount,
      alertCount,
      languageData,
      commitTrendData,
      productivityCompareData,
    };
  }, [reposWithHealth, githubData]);

  // Language color mapping
  const langColors = {
    JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3776ab',
    Java: '#b07219', 'C++': '#f34b7d', Go: '#00add8', Rust: '#dea584',
    Ruby: '#701516', PHP: '#777bb4', CSS: '#563d7c', HTML: '#e34c26',
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // emerald
    if (score >= 55) return '#f59e0b'; // amber
    return '#f43f5e'; // rose
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        </div>
        <p className="text-slate-400 text-sm mt-4 font-semibold">Compiling repository health analytics...</p>
      </div>
    );
  }

  if (!githubData || reposWithHealth.length === 0) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto mt-10">
        <ShieldAlert size={48} className="text-slate-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-white text-xl font-bold mb-2">No GitHub Data Available</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          We couldn't retrieve any repositories. Please verify your GitHub connection status or trigger a manual sync using the refresh icon in the navigation bar.
        </p>
        <div className="flex justify-center gap-3">
          <a href="/settings" className="btn-primary text-xs py-2.5">
            Connect GitHub
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Sub Navigation Tabs ── */}
      <div className="flex border-b border-white/6 gap-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${
            activeTab === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity size={15} /> Dashboard & Trends
          </div>
          {activeTab === 'dashboard' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${
            activeTab === 'list' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers size={15} /> Repositories List
          </div>
          {activeTab === 'list' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>
      </div>

      {/* ── DASHBOARD VIEW ── */}
      {activeTab === 'dashboard' && dashboardStats && (
        <div className="space-y-6">
          {/* Row 1: Health Gauge & Metric Weights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Avg Health Gauge */}
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Average Health Score</span>
              <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Track */}
                  <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.04)" strokeWidth="8" fill="transparent" />
                  {/* Progress Indicator */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke={getScoreColor(dashboardStats.avgScore)}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - dashboardStats.avgScore / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-white">{dashboardStats.avgScore}</span>
                  <span className="text-[10px] font-bold text-slate-500">/ 100</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 w-full mt-2">
                <div className="text-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="text-xs font-extrabold text-emerald-400">{dashboardStats.healthyCount}</div>
                  <div className="text-[9px] font-medium text-slate-500 mt-0.5">Healthy</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <div className="text-xs font-extrabold text-amber-400">{dashboardStats.moderateCount}</div>
                  <div className="text-[9px] font-medium text-slate-500 mt-0.5">Moderate</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
                  <div className="text-xs font-extrabold text-rose-400">{dashboardStats.alertCount}</div>
                  <div className="text-[9px] font-medium text-slate-500 mt-0.5">Alerts</div>
                </div>
              </div>
            </div>

            {/* Metric Score Guide */}
            <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Health Metric Distribution</span>
                  <Info size={14} className="text-slate-500" />
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Repository health represents codebase maintenance activity, safety checks, and speed of delivery. Scores are weighted by critical developer standards:
                </p>

                <div className="space-y-4">
                  {[
                    { label: 'Commits Recency', weight: '30%', desc: 'Frequency of code additions in the last 30 days.', color: 'from-blue-500 to-indigo-600' },
                    { label: 'Pull Request Delivery', weight: '20%', desc: 'Consistency of code reviews, checks, and updates.', color: 'from-purple-500 to-pink-600' },
                    { label: 'Issue Resolution Speed', weight: '20%', desc: 'Ratio of resolved/closed issues vs backlog items.', color: 'from-emerald-500 to-teal-600' },
                    { label: 'Engagement & Update Recency', weight: '30%', desc: 'Time since last code update and stars/forks engagement.', color: 'from-amber-500 to-orange-600' }
                  ].map((metric) => (
                    <div key={metric.label} className="flex items-start gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${metric.color} mt-1`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{metric.label}</span>
                          <span className="text-xs font-extrabold text-white">{metric.weight}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{metric.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Charts (Commit Trend & Languages) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Commit Trends Chart */}
            <div className="glass-card p-6 md:col-span-2 space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Combined Commit Trends (Last 10 Days)</span>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardStats.commitTrendData}>
                    <defs>
                      <linearGradient id="colorCommits" cx="0" cy="0" r="1" fx="0" fy="0">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
                      labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#60a5fa', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="commits" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCommits)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Language Distribution */}
            <div className="glass-card p-6 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Primary Language Density</span>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardStats.languageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dashboardStats.languageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={langColors[entry.name] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legends list */}
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 justify-center">
                {dashboardStats.languageData.slice(0, 4).map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: langColors[entry.name] || '#6b7280' }} />
                    <span className="text-[10px] text-slate-400 font-semibold">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Repository Productivity Comparisons */}
          <div className="glass-card p-6 space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Core Code Activity Comparison</span>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardStats.productivityCompareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
                    labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="commits" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="PRs" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="issues" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── REPOSITORIES LIST VIEW ── */}
      {activeTab === 'list' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repositories..."
              className="input-field max-w-sm text-xs py-2 px-3"
            />
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ArrowUpDown size={13} /> Sort By:
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-900 border border-white/8 rounded-lg text-slate-300 text-xs py-1.5 px-3 focus:outline-none focus:border-blue-500"
              >
                <option value="health">Health Score</option>
                <option value="name">Name</option>
                <option value="stars">Stars</option>
                <option value="updated">Recent Activity</option>
              </select>
            </div>
          </div>

          {/* Grid list */}
          {sortedAndFilteredRepos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedAndFilteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => setSelectedRepo(repo)}
                  className="glass-card p-5 hover:scale-[1.01] transition-transform duration-200 cursor-pointer flex justify-between items-start gap-4 border border-white/6 hover:border-white/10 group"
                >
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      {repo.isPrivate ? (
                        <Lock size={12} className="text-amber-400 shrink-0" />
                      ) : (
                        <Globe size={12} className="text-slate-500 shrink-0" />
                      )}
                      <span className="text-sm font-bold text-white hover:text-blue-400 transition-colors truncate">
                        {repo.name}
                      </span>
                    </div>

                    {repo.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {repo.description}
                      </p>
                    )}

                    {/* Stats Icons */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: langColors[repo.language] || '#6b7280' }}
                          />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star size={11} className="text-amber-400" /> {repo.stars}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork size={11} className="text-slate-400" /> {repo.forks}
                      </span>
                    </div>
                  </div>

                  {/* Health Indicator Circle */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="transparent" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          stroke={getScoreColor(repo.healthScore)}
                          strokeWidth="3"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 15}
                          strokeDashoffset={2 * Math.PI * 15 * (1 - repo.healthScore / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-[11px] font-extrabold text-white">
                        {repo.healthScore}
                      </span>
                    </div>
                    <span className={`text-[9px] font-extrabold ${repo.healthColor}`}>
                      {repo.healthStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <BookOpen size={40} className="text-slate-700 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No Matching Repositories</h3>
              <p className="text-slate-400 text-sm">
                No repositories found matching "{search}". Try adjusting your keywords.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selectedRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg glass-card overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
            style={{ background: 'rgba(15,23,42,0.98)' }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Heart size={16} className={selectedRepo.healthColor} />
                <span className="text-base font-extrabold text-white truncate max-w-[280px]">
                  {selectedRepo.name} Health Stats
                </span>
              </div>
              <button
                onClick={() => setSelectedRepo(null)}
                className="text-slate-400 hover:text-white transition-colors text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
              {/* Radar Chart */}
              <div className="flex flex-col items-center">
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'Commits', value: selectedRepo.breakdown.commits, fullMark: 100 },
                      { subject: 'PR Delivery', value: selectedRepo.breakdown.prs, fullMark: 100 },
                      { subject: 'Issues Resolved', value: selectedRepo.breakdown.issues, fullMark: 100 },
                      { subject: 'Activity / Updates', value: selectedRepo.breakdown.activity, fullMark: 100 }
                    ]}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={9} />
                      <Radar
                        name="Health Breakdown"
                        dataKey="value"
                        stroke={getScoreColor(selectedRepo.healthScore)}
                        fill={getScoreColor(selectedRepo.healthScore)}
                        fillOpacity={0.15}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Progress Bars Breakdown */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Metric Breakdown</span>
                {[
                  { label: 'Commit Activity (30%)', value: selectedRepo.breakdown.commits, color: 'bg-blue-500' },
                  { label: 'PR Delivery (20%)', value: selectedRepo.breakdown.prs, color: 'bg-purple-500' },
                  { label: 'Issue Resolution (20%)', value: selectedRepo.breakdown.issues, color: 'bg-emerald-500' },
                  { label: 'Engagement & Updates (30%)', value: selectedRepo.breakdown.activity, color: 'bg-amber-500' }
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">{item.label}</span>
                      <span className="text-white font-bold">{item.value} / 100</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations Box */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <CheckCircle size={14} className="text-emerald-400" /> Recommendations
                </div>
                <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-1.5">
                  {selectedRepo.breakdown.commits < 50 && (
                    <li>Commit active code updates in this repository to keep the development history fresh.</li>
                  )}
                  {selectedRepo.stats.issues > 0 && selectedRepo.breakdown.issues < 70 && (
                    <li>Address and close pending issues backlog to boost resolution speed.</li>
                  )}
                  {selectedRepo.breakdown.prs < 60 && (
                    <li>Incorporate Pull Request flows rather than direct pushing to improve code delivery health.</li>
                  )}
                  {selectedRepo.breakdown.commits >= 80 && selectedRepo.breakdown.issues >= 80 && (
                    <li>Awesome! This repository is highly active and shows premium developer health. Keep it up!</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/6 flex justify-between items-center bg-slate-900/20">
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <HelpCircle size={12} /> Click link to view repo on GitHub
              </div>
              <a
                href={selectedRepo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                View on GitHub <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repositories;
