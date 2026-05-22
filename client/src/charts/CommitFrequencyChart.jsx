/**
 * charts/CommitFrequencyChart.jsx – Daily Commit Activity Area Chart
 */

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800/95 border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-blue-400 font-bold">{payload[0].value} commits</p>
      </div>
    );
  }
  return null;
};

const CommitFrequencyChart = ({ data = [], loading }) => {
  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-4 w-40 bg-white/5 rounded mb-4" />
        <div className="h-48 bg-white/5 rounded-lg" />
      </div>
    );
  }

  // Format dates for display
  const formattedData = data.map((d) => ({
    ...d,
    displayDate: (() => {
      try { return format(parseISO(d.date), 'MMM dd'); } catch { return d.date; }
    })(),
  }));

  // Show only every 5th label to avoid clutter
  const tickFormatter = (_, index) => {
    if (index % 5 !== 0) return '';
    const item = formattedData[index];
    return item?.displayDate || '';
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="section-title">Commit Frequency</h3>
          <p className="section-subtitle">Daily commits over the last 30 days</p>
        </div>
        <span className="badge-blue">
          {data.reduce((sum, d) => sum + d.count, 0)} total
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formattedData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="displayDate"
            tickFormatter={(val, i) => (i % 5 === 0 ? val : '')}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#commitGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CommitFrequencyChart;
