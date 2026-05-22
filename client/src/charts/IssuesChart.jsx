/**
 * charts/IssuesChart.jsx – Issues Open vs Closed Chart
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const IssuesChart = ({ data = {}, loading }) => {
  const { openIssues = 0, totalIssues = 0 } = data;
  const closedIssues = totalIssues - openIssues;

  const chartData = [
    { name: 'Open',   count: openIssues },
    { name: 'Closed', count: closedIssues },
  ];

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
        <h3 className="section-title">Issues Overview</h3>
        <p className="section-subtitle">{totalIssues} total issues tracked</p>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(30,41,59,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}
            fill="#6366f1"
            label={{ position: 'top', fill: '#94a3b8', fontSize: 11 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IssuesChart;
