/**
 * charts/PRStatusChart.jsx – Pull Request Status Donut Chart
 */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  open:   '#3b82f6',
  merged: '#10b981',
  closed: '#6366f1',
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const PRStatusChart = ({ data = {}, loading }) => {
  const { openPRs = 0, closedPRs = 0, totalPRs = 0 } = data;
  const mergedPRs = closedPRs; // simplified

  const chartData = [
    { name: 'Open',   value: openPRs,   color: COLORS.open },
    { name: 'Merged', value: mergedPRs, color: COLORS.merged },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-4 w-32 bg-white/5 rounded mb-4" />
        <div className="h-44 bg-white/5 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="mb-5">
        <h3 className="section-title">Pull Request Status</h3>
        <p className="section-subtitle">{totalPRs} total pull requests</p>
      </div>

      {totalPRs === 0 ? (
        <div className="h-44 flex items-center justify-center text-slate-500 text-sm">
          No pull request data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.4))' }}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} PRs`, name]}
              contentStyle={{
                background: 'rgba(30,41,59,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '12px',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PRStatusChart;
