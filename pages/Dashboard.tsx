
import React, { useState, useEffect } from 'react';
import { icons } from '../constants';
import { useApps } from '../hooks/useApps';
import { useStats } from '../hooks/useStats';
import { supabaseAdmin } from '../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
}

function guessActivityType(action: string): string {
  if (!action) return 'feature';
  const lower = action.toLowerCase();
  if (lower.includes('deploy') || lower.includes('launch')) return 'deploy';
  if (lower.includes('spec') || lower.includes('doc')) return 'spec';
  if (lower.includes('schema') || lower.includes('table') || lower.includes('migration')) return 'schema';
  if (lower.includes('launch') || lower.includes('release')) return 'launch';
  return 'feature';
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'analytics', label: 'Analytics' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useStats();
  const { apps } = useApps();

  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState(0);

  const liveApps = apps.filter(a => a.status === 'live');
  const totalUsers = apps.reduce((sum, a) => sum + a.users, 0);

  useEffect(() => {
    async function fetchDashboardData() {
      // Daily stats for chart
      const { data: statsData } = await supabaseAdmin
        .from('wt_daily_stats')
        .select('date, users_total, signups, app_id, wt_app_registry(name)')
        .order('date', { ascending: true })
        .limit(50);

      if (statsData && statsData.length > 0) {
        const byDate: Record<string, any> = {};
        statsData.forEach((row: any) => {
          const d = row.date;
          if (!byDate[d]) byDate[d] = { name: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
          const appName = row.wt_app_registry?.name || 'Unknown';
          byDate[d][appName.toLowerCase().replace(/\s+/g, '')] = row.users_total || 0;
        });
        setChartData(Object.values(byDate));
      }

      // Recent activity from wt_activity_log
      const { data: activityData } = await supabaseAdmin
        .from('wt_activity_log')
        .select('id, action, actor, description, created_at, wt_app_registry(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityData) {
        setRecentActivity(activityData.map((a: any) => ({
          app: a.wt_app_registry?.name || a.actor || 'Watchtower',
          action: a.description || a.action,
          time: formatRelativeTime(a.created_at),
          type: guessActivityType(a.action),
        })));
      }

      // Pending invitations
      const { count } = await supabaseAdmin
        .from('wt_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setPendingInvitations(count || 0);
    }
    fetchDashboardData();
  }, []);

  const dashboardStats = [
    { label: 'Total Apps', value: String(stats.totalApps), sublabel: `${stats.liveApps} public, ${stats.internalApps} internal`, trend: `${stats.liveApps} live`, color: 'blue', icon: 'grid' },
    { label: 'Total Users', value: String(stats.totalUsers), sublabel: 'Across all apps', trend: 'Live count', color: 'emerald', icon: 'users' },
    { label: 'Database Tables', value: String(stats.totalTables), sublabel: 'Watchtower shared DB', trend: `${stats.schemaCount} schemas`, color: 'purple', icon: 'database' },
    { label: 'Pending Invitations', value: String(pendingInvitations), sublabel: 'Awaiting response', trend: pendingInvitations > 0 ? 'Needs attention' : 'All clear', color: 'orange', icon: 'mail' },
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6 lg:space-y-8 max-w-7xl mx-auto animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass p-4 lg:p-6 rounded-xl h-36">
              <div className="h-4 bg-slate-800 rounded w-24 mb-4" />
              <div className="h-8 bg-slate-800 rounded w-16 mb-2" />
              <div className="h-3 bg-slate-800 rounded w-32" />
            </div>
          ))}
        </div>
        <div className="glass rounded-xl h-64" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Failed to load dashboard</h3>
        <p className="text-sm text-slate-500 mb-6">{statsError}</p>
        <button onClick={refetchStats} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {dashboardStats.map((stat) => {
          const Icon = (icons as Record<string, React.FC>)[stat.icon];
          const colorMap: Record<string, string> = {
            blue: 'text-blue-500 bg-blue-500/10',
            emerald: 'text-emerald-500 bg-emerald-500/10',
            purple: 'text-purple-500 bg-purple-500/10',
            orange: 'text-orange-500 bg-orange-500/10',
          };
          return (
            <div key={stat.label} className="glass p-4 lg:p-6 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${colorMap[stat.color]}`}>
                  <Icon />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                  {stat.trend}
                </span>
              </div>
              <div>
                <h4 className="text-2xl lg:text-3xl font-bold mb-1 tracking-tight">{stat.value}</h4>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
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
              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <p className="text-sm text-slate-500">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, idx) => {
                  const colorType: Record<string, string> = {
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
                      <div className={`mt-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 z-10 ${colorType[activity.type] || 'bg-emerald-500'}`}></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-100">{activity.app}</span>
                          <span className="text-[10px] text-slate-500">{activity.time}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{activity.action}</p>
                      </div>
                    </div>
                  );
                })
              )}
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
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] lg:h-[300px]">
                <p className="text-sm text-slate-500">No analytics data yet</p>
              </div>
            ) : (
              <div style={{ width: '100%', minHeight: 250 }} className="h-[250px] lg:h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
            )}
          </div>

          {/* Per-App Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
