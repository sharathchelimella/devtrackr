/**
 * pages/AIInsights.jsx – AI Productivity Analysis Page
 */

import { useState } from 'react';
import {
  Cpu, Zap, TrendingUp, AlertTriangle, CheckCircle,
  ChevronRight, RefreshCw, Star, Clock
} from 'lucide-react';
import { aiService } from '../services/aiService';
import toast from 'react-hot-toast';

const priorityColors = {
  high:   'text-rose-400 bg-rose-500/10 border-rose-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const typeIcons = {
  bottleneck:  AlertTriangle,
  improvement: TrendingUp,
  task:        CheckCircle,
};

const AIInsights = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sprintSummary, setSprintSummary] = useState('');
  const [loadingSprint, setLoadingSprint] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const { data } = await aiService.analyze('weekly');
      setAnalysis(data.analysis);
      if (data.demo) toast('Running in demo mode – add OpenAI key for real analysis', { icon: '🔧' });
      else toast.success('AI analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
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

  const score = analysis?.productivityScore;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header card */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.06) 100%)', borderColor: 'rgba(139,92,246,0.2)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-glow">
            <Cpu size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Productivity Analysis</h2>
            <p className="text-sm text-slate-400">Powered by GPT-4o-mini · Analyzes your GitHub data</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSprintSummary} disabled={loadingSprint} className="btn-secondary">
            <Clock size={14} className={loadingSprint ? 'animate-spin' : ''} />
            Sprint Summary
          </button>
          <button onClick={handleAnalyze} disabled={loading} className="btn-primary">
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Zap size={14} />
            )}
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {/* Sprint summary */}
      {sprintSummary && (
        <div className="glass-card p-5 animate-slide-up">
          <h3 className="section-title mb-3">Sprint Summary</h3>
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{sprintSummary}</div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="glass-card p-10 flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <p className="text-slate-400 text-sm">AI is analyzing your productivity...</p>
          <p className="text-xs text-slate-600">This may take a few seconds</p>
        </div>
      )}

      {/* Analysis results */}
      {analysis && !loading && (
        <div className="space-y-5 animate-slide-up">
          {/* Score + summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score circle */}
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
              <div className="relative w-24 h-24 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="14" fill="none"
                    stroke={score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e'}
                    strokeWidth="3" strokeDasharray={`${(score / 100) * 88} 88`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-white">
                  {score}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">Productivity Score</p>
              <span className={`mt-2 badge ${score >= 70 ? 'badge-green' : score >= 40 ? 'badge-amber' : 'badge-rose'}`}>
                {score >= 70 ? '🔥 High Performer' : score >= 40 ? '⚡ On Track' : '📉 Needs Attention'}
              </span>
            </div>

            {/* Summary */}
            <div className="glass-card p-5 md:col-span-2">
              <h3 className="section-title mb-3">Summary</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">{analysis.summary}</p>
              {analysis.highlights?.length > 0 && (
                <div className="space-y-2">
                  {analysis.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <Star size={13} className="text-amber-400 shrink-0" />
                      {h}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="section-title mb-4">Recommendations</h3>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, i) => {
                  const Icon = typeIcons[rec.type] || CheckCircle;
                  return (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/4 border border-white/8 hover:bg-white/6 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Icon size={15} className="text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-white">{rec.title}</p>
                          <span className={`badge text-xs shrink-0 ${priorityColors[rec.priority] || priorityColors.medium}`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottlenecks + Inactive Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.bottlenecks?.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="section-title mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-400" /> Bottlenecks
                </h3>
                <ul className="space-y-2">
                  {analysis.bottlenecks.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.inactiveAreas?.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="section-title mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-400" /> Low Activity Areas
                </h3>
                <ul className="space-y-2">
                  {analysis.inactiveAreas.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Meta info */}
          <p className="text-xs text-slate-600 text-right">
            Generated by {analysis.aiModel} · {analysis.generatedAt ? new Date(analysis.generatedAt).toLocaleString() : ''}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!analysis && !loading && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <Cpu size={40} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No Analysis Yet</h3>
          <p className="text-slate-400 text-sm mb-6">
            Click "Run Analysis" to get AI-powered insights on your productivity.
            Make sure your GitHub is connected and synced.
          </p>
          <button onClick={handleAnalyze} className="btn-primary mx-auto">
            <Zap size={14} /> Run My First Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
