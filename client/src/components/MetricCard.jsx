/**
 * components/MetricCard.jsx – Dashboard Metric Card
 * Displays a single KPI with icon, label, value, and trend.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard = ({
  icon: Icon,
  label,
  value,
  subtext,
  trend,        // 'up' | 'down' | 'neutral'
  trendValue,
  color = 'blue',
  loading = false,
}) => {
  const colorMap = {
    blue:   { icon: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    green:  { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    purple: { icon: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    amber:  { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    rose:   { icon: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    cyan:   { icon: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  };

  const colors = colorMap[color] || colorMap.blue;

  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-white/5" />
          <div className="h-4 w-24 bg-white/5 rounded" />
        </div>
        <div className="h-8 w-20 bg-white/5 rounded mb-2" />
        <div className="h-3 w-32 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="glass-card p-5 group hover:scale-[1.02] transition-transform duration-200 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-3`}>
          <div className={`p-2.5 rounded-lg ${colors.bg} border ${colors.border}`}>
            {Icon && <Icon size={18} className={colors.icon} />}
          </div>
          <span className="text-sm font-medium text-slate-400">{label}</span>
        </div>

        {/* Trend badge */}
        {trend && trendValue && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend === 'up'
                ? 'text-emerald-400 bg-emerald-500/10'
                : trend === 'down'
                ? 'text-rose-400 bg-rose-500/10'
                : 'text-slate-400 bg-white/5'
            }`}
          >
            {trend === 'up' ? (
              <TrendingUp size={12} />
            ) : trend === 'down' ? (
              <TrendingDown size={12} />
            ) : (
              <Minus size={12} />
            )}
            {trendValue}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-3xl font-bold text-white tracking-tight mb-1">{value}</div>

      {/* Subtext */}
      {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
    </div>
  );
};

export default MetricCard;
