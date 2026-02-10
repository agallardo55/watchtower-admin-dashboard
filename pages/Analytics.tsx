
import React from 'react';
import { apps } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Jan 10', buybid: 2, salesboard: 5 },
  { name: 'Jan 15', buybid: 4, salesboard: 8 },
  { name: 'Jan 20', buybid: 6, salesboard: 12 },
  { name: 'Jan 25', buybid: 9, salesboard: 18 },
  { name: 'Jan 30', buybid: 10, salesboard: 20 },
  { name: 'Feb 05', buybid: 12, salesboard: 23 },
];

export default function Analytics() {
  const liveApps = apps.filter(a => a.status === 'live');
  const totalUsers = apps.reduce((sum, a) => sum + a.users, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-slate-500 mt-1">Growth metrics and usage insights across all applications.</p>
      </div>

      {/* Cross-App User Growth */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-semibold text-lg">Cross-App User Growth</h3>
            <p className="text-sm text-slate-500">Cumulative active users across top performing projects</p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((range) => (
              <button key={range} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${range === '30d' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}>
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBuybid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#325AE7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#325AE7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <Tooltip
                contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px'}}
                itemStyle={{color: '#f1f5f9'}}
              />
              <Area type="monotone" dataKey="buybid" stroke="#325AE7" strokeWidth={2} fillOpacity={1} fill="url(#colorBuybid)" name="BuybidHQ" />
              <Area type="monotone" dataKey="salesboard" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="SalesboardHQ" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-App Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveApps.map((app) => (
          <div key={app.name} className="glass rounded-xl p-6 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{app.icon}</span>
              <div>
                <p className="font-semibold">{app.name}</p>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                  app.status === 'live' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                }`}>{app.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Users</p>
                <p className="text-xl font-bold mt-1">{app.users}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tables</p>
                <p className="text-xl font-bold mt-1">{app.tableCount || 0}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Share</p>
                <p className="text-xl font-bold mt-1">{totalUsers > 0 ? Math.round((app.users / totalUsers) * 100) : 0}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
