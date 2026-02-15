
import React, { useState } from 'react';
import { apps, recentActivity, icons } from '../constants';
import { useStats } from '../hooks/useStats';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Jan 10', buybid: 2, salesboard: 5 },
  { name: 'Jan 15', buybid: 4, salesboard: 8 },
  { name: 'Jan 20', buybid: 6, salesboard: 12 },
  { name: 'Jan 25', buybid: 9, salesboard: 18 },
  { name: 'Jan 30', buybid: 10, salesboard: 20 },
  { name: 'Feb 05', buybid: 12, salesboard: 23 },
];

// KPI stats are now driven by useStats() hook inside the component

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'analytics', label: 'Analytics' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { stats, loading: statsLoading } = useStats();
  const liveApps = apps.filter(a => a.status === 'live');
  const totalUsers = apps.reduce((sum, a) => sum + a.users, 0);

  const dashboardStats = [
    { label: 'Total Apps', value: String(stats.totalApps), sublabel: `${stats.liveApps} public, ${stats.internalApps} internal`, trend: `${stats.liveApps} live`, color: 'blue', icon: 'grid' },
    { label: 'Total Users', value: String(stats.totalUsers), sublabel: 'Across all apps', trend: 'Live count', color: 'emerald', icon: 'users' },
    { label: 'Database Tables', value: String(stats.totalTables), sublabel: 'Watchtower shared DB', trend: `${stats.schemaCount} schemas`, color: 'purple', icon: 'database' },
    { label: 'Pending Invitations', value: '8', sublabel: '5 accepted this week', trend: '62% acceptance', color: 'orange', icon: 'mail' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => {
          const Icon = (icons as any)[stat.icon];
          const colorMap: Record<string, string> = {
            blue: 'text-blue-500 bg-blue-500/10',
            emerald: 'text-emerald-500 bg-emerald-500/10',
            purple: 'text-purple-500 bg-purple-500/10',
            orange: 'text-orange-500 bg-orange-500/10',
          };
          return (
            <div key={stat.label} className="glass p-6 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${colorMap[stat.color]}`}>
                  <Icon />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                  {stat.trend}
                </span>
              </div>
              <div>
                <h4 className="text-3xl font-bold mb-1 tracking-tight">{stat.value}</h4>
                <p className="text-sm font-medium text-slate-300 mb-1">{stat.label}</p>
                <p className="text-[11px] text-slate-500">{stat.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}>{tab.label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* App Status Table */}
          <div className="lg:col-span-2 glass rounded-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-lg">App Status Overview</h3>
              <button className="text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 border-b border-white/5 bg-white/2">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">App</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Database</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Users</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {apps.slice(0, 6).map((app) => (
                    <tr key={app.name} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{app.icon}</span>
                          <div>
                            <p className="font-semibold">{app.name}</p>
                            <p className="text-[10px] text-slate-500">{app.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          app.status === 'live' ? 'bg-emerald-500/10 text-emerald-500' :
                          app.status === 'beta' ? 'bg-yellow-500/10 text-yellow-500' :
                          app.status === 'paused' ? 'bg-orange-500/10 text-orange-500' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-400 truncate max-w-[140px]">{app.db}</p>
                      </td>
                      <td className="px-6 py-4 font-medium">{app.users}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><icons.edit /></button>
                          {app.url && <a href={app.url} target="_blank" className="p-1.5 hover:bg-white/10 rounded-lg text-blue-500 transition-colors"><icons.externalLink /></a>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="glass rounded-xl flex flex-col">
            <div className="p-5 border-b border-white/5">
              <h3 className="font-semibold text-lg">Recent Activity</h3>
            </div>
            <div className="p-5 flex-1 space-y-6">
              {recentActivity.map((activity, idx) => {
                const colorType = {
                  feature: 'bg-emerald-500',
                  spec: 'bg-blue-500',
                  schema: 'bg-purple-500',
                  deploy: 'bg-orange-500',
                  launch: 'bg-red-500',
                };
                return (
                  <div key={idx} className="flex gap-4 relative">
                    {idx !== recentActivity.length - 1 && (
                      <div className="absolute top-6 left-[7px] w-px h-[calc(100%-12px)] bg-slate-800"></div>
                    )}
                    <div className={`mt-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 z-10 ${colorType[activity.type]}`}></div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100">{activity.app}</span>
                        <span className="text-[10px] text-slate-500">{activity.time}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{activity.action}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
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
      )}
    </div>
  );
}
