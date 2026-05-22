/**
 * pages/AIInsights.jsx – AI-Powered Developer Insights
 * Analyzes: Commits · Repositories · Coding Activity · Productivity Patterns
 */

import { useState } from 'react';
import {
  Cpu, Zap, GitCommit, BookOpen, Activity, BarChart3,
  AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Star, Clock, Flame, Shield, Target, RefreshCw,
  ChevronRight, Award, Moon, Sun, Sunset, Sunrise,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { aiService } from '../services/aiService';
import toast from 'react-hot-toast';

// ── Constants ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Overview',       icon: BarChart3  },
  { id: 'commits',     label: 'Commits',         icon: GitCommit  },
  { id: 'repos',       label: 'Repositories',    icon: BookOpen   },
  { id: 'activity',    label: 'Coding Activity', icon: Activity   },
  { id: 'patterns',    label: 'Patterns',        icon: Target     },
];

const PRIORITY_STYLE = {
  high:   { bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.25)',  text: '#f43f5e',  label: 'High'   },
  medium: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b',  label: 'Medium' },
  low:    { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#10b981',  label: 'Low'    },
};

const CATEGORY_COLORS = {
  commits:      '#3b82f6',
  repositories: '#8b5cf6',
  activity:     '#10b981',
  patterns:     '#f59e0b',
};

const DAY_COLORS   = ['#1e293b','#1e3a5f','#1e4d82','#1e63a8','#2563eb','#3b82f6','#60a5fa'];
const TIME_ICONS   = { morning: Sunrise, afternoon: Sun, evening: Sunset, night: Moon };
const TIME_COLORS  = { morning: '#f59e0b', afternoon: '#3b82f6', evening: '#f97316', night: '#8b5cf6' };

// ── Sub-components ─────────────────────────────────────────────────────────────

const ScoreRing = ({ score, size = 120 }) => {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white">{score}</span>
        <span className="text-xs text-slate-400 mt-0.5">/ 100</span>
      </div>
    </div>
  );
};

const InsightCard = ({ icon: Icon, title, verdict, suggestions = [], color = '#3b82f6', score, scoreLabel }) => (
  <div className="glass-card p-5 space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon size={17} style={{ color }} />
        </div>
        <h3 className="font-bold text-white text-sm">{title}</h3>
      </div>
      {score !== undefined && (
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xl font-extrabold text-white">{score}</span>
          <span className="text-xs text-slate-500">{scoreLabel || '/100'}</span>
        </div>
      )}
    </div>

    <p className="text-sm text-slate-300 leading-relaxed border-l-2 pl-3"
      style={{ borderColor: color }}>
      {verdict}
    </p>

    {suggestions.length > 0 && (
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
            <ChevronRight size={12} className="mt-0.5 shrink-0" style={{ color }} />
            {s}
          </div>
        ))}
      </div>
    )}
  </div>
);

const MetricPill = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl"
    style={{ background: `${color}0d`, border: `1px solid ${color}20` }}>
    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
      style={{ background: `${color}15` }}>
      <Icon size={15} style={{ color }} />
    </div>
    <div>
      <p className="text-lg font-extrabold text-white leading-none">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  </div>
);

const LoadingAnalysis = () => (
  <div className="glass-card p-16 flex flex-col items-center gap-6 animate-fade-in">
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
      <div className="absolute inset-3 rounded-full border-2 border-blue-500/20 border-b-blue-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <Cpu size={24} className="text-violet-400" />
      </div>
    </div>
    <div className="text-center">
      <p className="text-white font-semibold mb-1">Gemini is analyzing your code...</p>
      <p className="text-slate-400 text-sm">Examining commits · repositories · activity · patterns</p>
    </div>
    <div className="flex gap-2">
      {['Commits', 'Repos', 'Activity', 'Patterns'].map((label, i) => (
        <span key={label} className="text-xs px-3 py-1 rounded-full text-slate-400"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            animation: `pulse 1.5s ${i * 0.3}s infinite` }}>
          {label}
        </span>
      ))}
    </div>
  </div>
);

// ── Tab Content Components ─────────────────────────────────────────────────────

const OverviewTab = ({ analysis }) => {
  const { productivityScore: score, summary, weeklyTrend, highlights, strengths,
    bottlenecks, recommendations, activityMetrics } = analysis;

  // Build radar data from sub-scores
  const radarData = [
    { subject: 'Commits',    score: analysis.commitInsights?.messageQuality === 'excellent' ? 90 : analysis.commitInsights?.messageQuality === 'good' ? 75 : 55 },
    { subject: 'Repos',      score: analysis.repositoryInsights?.languageDiversity === 'high' ? 85 : 65 },
    { subject: 'Activity',   score: analysis.codingActivityInsights?.consistencyScore || 70 },
    { subject: 'PRs',        score: analysis.productivityPatterns?.prHealthScore || 70 },
    { subject: 'Issues',     score: analysis.productivityPatterns?.issueResolutionRate || 60 },
  ];

  return (
    <div className="space-y-5">
      {/* Score + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score */}
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.05) 100%)' }}>
          <ScoreRing score={score} size={120} />
          <p className="text-sm font-bold text-white mt-4">Productivity Score</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs"
            style={{ color: weeklyTrend === 'improving' ? '#10b981' : weeklyTrend === 'declining' ? '#f43f5e' : '#f59e0b' }}>
            {weeklyTrend === 'improving' ? <TrendingUp size={13} /> : weeklyTrend === 'declining' ? <TrendingDown size={13} /> : <Activity size={13} />}
            {weeklyTrend?.charAt(0).toUpperCase() + weeklyTrend?.slice(1)} trend
          </div>
        </div>

        {/* Summary + Highlights */}
        <div className="glass-card p-5 md:col-span-2 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
          <div className="space-y-2">
            {highlights?.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <Star size={12} className="text-amber-400 shrink-0" />
                {h}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Metrics */}
      {activityMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricPill icon={Flame}    label="Current Streak"  value={`${activityMetrics.currentStreak}d`} color="#f43f5e" />
          <MetricPill icon={Award}    label="Longest Streak"  value={`${activityMetrics.longestStreak}d`} color="#f59e0b" />
          <MetricPill icon={Activity} label="Active Days"     value={activityMetrics.activeDays}           color="#3b82f6" />
          <MetricPill icon={GitCommit}label="Avg Commits/Day" value={activityMetrics.avgPerDay}            color="#10b981" />
        </div>
      )}

      {/* Radar + Strengths/Bottlenecks */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Radar Chart */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-4">Performance Radar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
              <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15}
                dot={{ r: 3, fill: '#3b82f6' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Strengths */}
        <div className="glass-card p-5 lg:col-span-3 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Shield size={14} className="text-emerald-400" /> Strengths
            </h3>
            <div className="space-y-2">
              {strengths?.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300 p-2 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                  <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-rose-400" /> Bottlenecks
            </h3>
            <div className="space-y-2">
              {bottlenecks?.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300 p-2 rounded-lg"
                  style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.1)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations?.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Target size={14} className="text-blue-400" /> AI Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => {
              const ps = PRIORITY_STYLE[rec.priority] || PRIORITY_STYLE.medium;
              const catColor = CATEGORY_COLORS[rec.category] || '#3b82f6';
              return (
                <div key={i} className="flex gap-4 p-4 rounded-xl transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-2 self-stretch rounded-full shrink-0" style={{ background: catColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-sm font-semibold text-white">{rec.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                        style={{ background: ps.bg, border: `1px solid ${ps.border}`, color: ps.text }}>
                        {ps.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                    <span className="text-xs mt-1 inline-block" style={{ color: catColor }}>
                      #{rec.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const CommitsTab = ({ analysis }) => {
  const { commitInsights: ci, commitPatterns: cp } = analysis;
  if (!ci || !cp) return null;

  const dayData = Object.entries(cp.byDay || {}).map(([day, count]) => ({ day, count }));
  const timeData = Object.entries(cp.byHour || {}).map(([period, count]) => ({
    period: period.charAt(0).toUpperCase() + period.slice(1),
    count,
    color: TIME_COLORS[period],
  }));

  const maxDay = Math.max(...dayData.map((d) => d.count), 1);

  const qualityMap = { excellent: 95, good: 75, fair: 50, poor: 25 };
  const qualityColors = { excellent: '#10b981', good: '#3b82f6', fair: '#f59e0b', poor: '#f43f5e' };

  return (
    <div className="space-y-5">
      <InsightCard icon={GitCommit} title="Commit Analysis"
        verdict={ci.verdict} suggestions={ci.suggestions} color="#3b82f6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Commits by Day */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4">Commits by Day of Week</h3>
          <div className="flex items-end gap-2 h-28">
            {dayData.map(({ day, count }) => {
              const pct = count / maxDay;
              const active = day === cp.peakDay;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-400">{count}</span>
                  <div className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${Math.max(pct * 80, 4)}px`,
                      background: active ? '#3b82f6' : 'rgba(59,130,246,0.3)',
                      boxShadow: active ? '0 0 12px rgba(59,130,246,0.5)' : 'none',
                    }} />
                  <span className="text-xs text-slate-500">{day}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Peak day: <span className="text-blue-400 font-medium">{cp.peakDay}</span>
          </p>
        </div>

        {/* Commits by Time */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4">Commits by Time of Day</h3>
          <div className="space-y-3">
            {timeData.map(({ period, count, color }) => {
              const Icon = TIME_ICONS[period.toLowerCase()] || Sun;
              const total = timeData.reduce((s, t) => s + t.count, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={period}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Icon size={13} style={{ color }} />
                      {period}
                    </div>
                    <span className="text-xs text-slate-400">{count} commits ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Peak time: <span className="font-medium" style={{ color: TIME_COLORS[cp.peakTime] }}>
              {cp.peakTime?.charAt(0).toUpperCase() + cp.peakTime?.slice(1)}
            </span>
          </p>
        </div>
      </div>

      {/* Message Quality */}
      <div className="glass-card p-5 flex items-center gap-6">
        <div>
          <p className="text-xs text-slate-500 mb-1">Message Quality</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold" style={{ color: qualityColors[ci.messageQuality] }}>
              {qualityMap[ci.messageQuality]}
            </span>
            <span className="text-lg font-bold" style={{ color: qualityColors[ci.messageQuality] }}>
              / 100
            </span>
            <span className="text-sm ml-2 capitalize" style={{ color: qualityColors[ci.messageQuality] }}>
              {ci.messageQuality}
            </span>
          </div>
        </div>
        <div className="flex-1 border-l border-white/5 pl-6">
          <p className="text-xs text-slate-400 leading-relaxed">{ci.patterns}</p>
        </div>
      </div>
    </div>
  );
};

const ReposTab = ({ analysis }) => {
  const { repositoryInsights: ri, repoStats } = analysis;
  if (!ri) return null;

  const langColors = { JavaScript:'#f7df1e', TypeScript:'#3178c6', Python:'#3776ab',
    Java:'#b07219', Go:'#00add8', Rust:'#dea584', 'C++'  :'#f34b7d',
    CSS:'#563d7c', HTML:'#e34c26', Markdown:'#083fa1', 'React Native':'#61dafb', 'N/A':'#475569' };

  return (
    <div className="space-y-5">
      <InsightCard icon={BookOpen} title="Repository Analysis"
        verdict={ri.verdict} suggestions={ri.suggestions} color="#8b5cf6" />

      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-4">Repository Activity</h3>
        {repoStats?.length > 0 ? (
          <div className="space-y-3">
            {repoStats.map((repo, i) => {
              const maxCommits = Math.max(...repoStats.map((r) => r.commits), 1);
              const pct = Math.round((repo.commits / maxCommits) * 100);
              const color = langColors[repo.language] || '#6b7280';
              return (
                <div key={repo.name} className="p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-sm font-semibold text-white">{repo.name}</span>
                      {ri.mostActiveRepo === repo.name && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                          Most Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>⭐ {repo.stars}</span>
                      <span className="text-rose-400">{repo.openIssues} issues</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-xs text-slate-400 w-20 text-right">
                      {repo.commits} commits
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-8">No repository data available</p>
        )}
      </div>

      {/* Language diversity badge */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <BookOpen size={22} className="text-violet-400" />
        </div>
        <div>
          <p className="text-xs text-slate-500">Language Diversity</p>
          <p className="text-lg font-bold capitalize" style={{
            color: ri.languageDiversity === 'high' ? '#10b981' : ri.languageDiversity === 'medium' ? '#f59e0b' : '#f43f5e'
          }}>
            {ri.languageDiversity}
          </p>
        </div>
        <p className="text-sm text-slate-400 flex-1 border-l border-white/5 pl-4">
          Most active: <span className="text-white font-medium">{ri.mostActiveRepo}</span>
        </p>
      </div>
    </div>
  );
};

const ActivityTab = ({ analysis }) => {
  const { codingActivityInsights: cai, activityMetrics: am } = analysis;
  if (!cai) return null;

  const consistencyScore = cai.consistencyScore || 0;
  const burnoutColors = { low: '#10b981', medium: '#f59e0b', high: '#f43f5e' };

  return (
    <div className="space-y-5">
      <InsightCard icon={Activity} title="Coding Activity Analysis"
        verdict={cai.verdict} suggestions={cai.suggestions} color="#10b981" />

      {/* Streak cards */}
      {am && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Flame,     label: 'Current Streak', value: `${am.currentStreak} days`, color: '#f43f5e' },
            { icon: Award,     label: 'Longest Streak', value: `${am.longestStreak} days`, color: '#f59e0b' },
            { icon: Activity,  label: 'Active Days',    value: `${am.activeDays} / 30`,    color: '#3b82f6' },
            { icon: GitCommit, label: 'Daily Average',  value: `${am.avgPerDay} commits`,  color: '#10b981' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card p-4 text-center">
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
                style={{ background: `${color}15` }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-base font-extrabold text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Consistency + Burnout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4">Consistency Score</h3>
          <div className="flex items-center gap-4">
            <ScoreRing score={consistencyScore} size={90} />
            <div className="flex-1">
              <p className="text-xs text-slate-400 leading-relaxed">
                Measures how regularly you commit across the 30-day period.
                Higher scores indicate sustainable, daily coding habits.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4">Burnout Risk Indicator</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-extrabold"
              style={{
                background: `${burnoutColors[cai.burnoutRisk] || '#10b981'}15`,
                border: `3px solid ${burnoutColors[cai.burnoutRisk] || '#10b981'}40`,
                color: burnoutColors[cai.burnoutRisk],
              }}>
              {cai.burnoutRisk === 'low' ? '😊' : cai.burnoutRisk === 'medium' ? '😐' : '😰'}
            </div>
            <div>
              <p className="text-sm font-bold capitalize" style={{ color: burnoutColors[cai.burnoutRisk] }}>
                {cai.burnoutRisk} Risk
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Peak productivity: {cai.peakProductivityTime}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PatternsTab = ({ analysis }) => {
  const { productivityPatterns: pp, recommendations } = analysis;
  if (!pp) return null;

  const workStyleDescriptions = {
    consistent:       'Steady daily commits – sustainable long-term pace',
    burst:            'Intense bursts of activity followed by quiet periods',
    'weekend-warrior':'Most productive on weekends',
    'night-owl':      'Prefers late-night coding sessions',
    'early-bird':     'Most productive in the early morning hours',
  };

  const filteredRecs = recommendations?.filter((r) => r.category === 'patterns' || r.category === 'activity') || [];

  return (
    <div className="space-y-5">
      <InsightCard icon={Target} title="Productivity Patterns"
        verdict={pp.verdict} suggestions={pp.suggestions} color="#f59e0b" />

      {/* Work Style */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-4">Work Style Profile</h3>
        <div className="flex items-center gap-5 p-4 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="text-4xl">
            {pp.workStyle === 'consistent' ? '🏃' : pp.workStyle === 'burst' ? '⚡' :
             pp.workStyle === 'weekend-warrior' ? '🌟' : pp.workStyle === 'night-owl' ? '🦉' : '🌅'}
          </div>
          <div>
            <p className="text-base font-bold text-white capitalize">
              {pp.workStyle?.replace('-', ' ')}
            </p>
            <p className="text-sm text-slate-400 mt-0.5">
              {workStyleDescriptions[pp.workStyle] || 'Unique coding style'}
            </p>
          </div>
        </div>
      </div>

      {/* PR Health + Issue Resolution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4">PR Health Score</h3>
          <div className="flex items-center gap-4">
            <ScoreRing score={pp.prHealthScore || 0} size={90} />
            <div className="flex-1 text-xs text-slate-400 leading-relaxed">
              Measures PR merge rate, review cycle time, and overall pull request activity relative to your commit volume.
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4">Issue Resolution Rate</h3>
          <div className="flex items-center gap-4">
            <ScoreRing score={pp.issueResolutionRate || 0} size={90} />
            <div className="flex-1 text-xs text-slate-400 leading-relaxed">
              Percentage of issues closed relative to total issues opened over the 30-day period.
            </div>
          </div>
        </div>
      </div>

      {/* Pattern-specific recommendations */}
      {filteredRecs.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4">Pattern-Specific Actions</h3>
          <div className="space-y-3">
            {filteredRecs.map((rec, i) => {
              const ps = PRIORITY_STYLE[rec.priority] || PRIORITY_STYLE.medium;
              return (
                <div key={i} className="flex gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Target size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{rec.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{ background: ps.bg, border: `1px solid ${ps.border}`, color: ps.text }}>
                        {ps.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{rec.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Page Component ────────────────────────────────────────────────────────

const AIInsights = () => {
  const [analysis, setAnalysis]         = useState(null);
  const [loading, setLoading]           = useState(false);
  const [sprintSummary, setSprintSummary] = useState('');
  const [loadingSprint, setLoadingSprint] = useState(false);
  const [activeTab, setActiveTab]       = useState('overview');
  const [isDemo, setIsDemo]             = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setActiveTab('overview');
    try {
      const { data } = await aiService.analyze('weekly');
      setAnalysis(data.analysis);
      setIsDemo(!!data.demo);
      if (data.demo) toast('Demo mode – add your Gemini key for live analysis', { icon: '🔧', duration: 5000 });
      else toast.success('AI analysis complete! Powered by Gemini.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Please sync GitHub first.');
    } finally {
      setLoading(false);
    }
  };

  const handleSprintSummary = async () => {
    setLoadingSprint(true);
    try {
      const { data } = await aiService.getSprintSummary();
      setSprintSummary(data.summary);
    } catch {
      toast.error('Failed to generate sprint summary');
    } finally {
      setLoadingSprint(false);
    }
  };

  const renderTab = () => {
    if (!analysis) return null;
    switch (activeTab) {
      case 'overview':  return <OverviewTab  analysis={analysis} />;
      case 'commits':   return <CommitsTab   analysis={analysis} />;
      case 'repos':     return <ReposTab     analysis={analysis} />;
      case 'activity':  return <ActivityTab  analysis={analysis} />;
      case 'patterns':  return <PatternsTab  analysis={analysis} />;
      default:          return null;
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Header ── */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.06) 100%)', borderColor: 'rgba(139,92,246,0.2)' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}>
            <Cpu size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">AI Developer Insights</h2>
            <p className="text-sm text-slate-400">
              Powered by <span className="text-violet-400 font-medium">Gemini 1.5 Flash</span>
              &nbsp;·&nbsp; Commits · Repos · Activity · Patterns
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button onClick={handleSprintSummary} disabled={loadingSprint} className="btn-secondary text-sm">
            <RefreshCw size={13} className={loadingSprint ? 'animate-spin' : ''} />
            Sprint Summary
          </button>
          <button onClick={handleAnalyze} disabled={loading} className="btn-primary text-sm">
            {loading
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <Zap size={14} />
            }
            {loading ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {/* ── Demo Banner ── */}
      {isDemo && analysis && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
          <Zap size={14} />
          <span>Demo mode – showing sample insights. Add your <code className="font-mono">GEMINI_API_KEY</code> to <code className="font-mono">server/.env</code> for live AI analysis.</span>
        </div>
      )}

      {/* ── Sprint Summary ── */}
      {sprintSummary && (
        <div className="glass-card p-5 animate-slide-up">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Clock size={14} className="text-blue-400" /> Sprint Summary
          </h3>
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{sprintSummary}</div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && <LoadingAnalysis />}

      {/* ── Results ── */}
      {analysis && !loading && (
        <div className="space-y-4 animate-slide-up">
          {/* Tab bar */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                style={activeTab === id
                  ? { background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }
                  : { color: '#64748b', border: '1px solid transparent' }
                }>
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          {renderTab()}

          {/* Footer */}
          <p className="text-xs text-slate-600 text-right">
            Generated by {analysis.aiModel}
            {analysis.tokensUsed ? ` · ${analysis.tokensUsed} tokens used` : ''}
            {' · '}{analysis.generatedAt ? new Date(analysis.generatedAt).toLocaleString() : ''}
          </p>
        </div>
      )}

      {/* ── Empty State ── */}
      {!analysis && !loading && (
        <div className="glass-card p-16 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.08))', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Cpu size={36} className="text-violet-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white mb-2">AI Developer Insights</h3>
          <p className="text-slate-400 text-sm mb-2 max-w-md mx-auto">
            Get a comprehensive AI analysis of your developer profile across 4 dimensions:
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { icon: GitCommit, label: 'Commits',         color: '#3b82f6' },
              { icon: BookOpen,  label: 'Repositories',    color: '#8b5cf6' },
              { icon: Activity,  label: 'Coding Activity', color: '#10b981' },
              { icon: Target,    label: 'Patterns',        color: '#f59e0b' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                style={{ background: `${color}10`, border: `1px solid ${color}20`, color }}>
                <Icon size={11} /> {label}
              </div>
            ))}
          </div>
          <button onClick={handleAnalyze} className="btn-primary mx-auto">
            <Zap size={15} /> Run AI Analysis
          </button>
          <p className="text-xs text-slate-600 mt-4">
            Make sure your GitHub is connected and synced first
          </p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
