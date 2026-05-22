/**
 * charts/ContributorActivityChart.jsx – Bar Chart of contributor commit counts
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#84cc16'];

const ContributorActivityChart = ({ data = [], loading }) => {
  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-4 w-44 bg-white/5 rounded mb-4" />
        <div className="h-48 bg-white/5 rounded-lg" />
      </div>
    );
  }

  const chartData = data.slice(0, 8); // Show top 8 contributors

  return (
    <div className="glass-card p-5">
      <div className="mb-5">
        <h3 className="section-title">Contributor Activity</h3>
        <p className="section-subtitle">Commits per contributor (last 30 days)</p>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
          No contributor data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 20, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              angle={-30}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value) => [`${value} commits`]}
              contentStyle={{
                background: 'rgba(30,41,59,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="commits" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ContributorActivityChart;
