
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
      <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass p-4 lg:p-5 rounded-none h-32">
              <div className="h-4 bg-slate-800 w-24 mb-4" />
              <div className="h-8 bg-slate-800 w-16 mb-2" />
              <div className="h-3 bg-slate-800 w-32" />
            </div>
          ))}
        </div>
        <div className="glass rounded-none h-64" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-center">
        <div className="mb-4 text-amber-400"><icons.alertTriangle className="w-10 h-10 mx-auto" /></div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Failed to load dashboard</h3>
        <p className="text-sm text-slate-500 mb-6">{statsError}</p>
        <button onClick={refetchStats} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-semibold transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {dashboardStats.map((stat) => {
          const Icon = (icons as Record<string, React.FC>)[stat.icon];
          const colorMap: Record<string, string> = {
            blue: 'text-blue-500 border-blue-500/30',
            emerald: 'text-emerald-500 border-emerald-500/30',
            purple: 'text-purple-500 border-purple-500/30',
            orange: 'text-orange-500 border-orange-500/30',
          };
          return (
            <div key={stat.label} className="glass p-4 lg:p-5 rounded-none flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-1.5 border ${colorMap[stat.color]}`}>
                  <Icon />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-400/30 px-2 py-0.5">
                  {stat.trend}
                </span>
              </div>
              <div>
                <h4 className="text-2xl lg:text-3xl font-bold mb-1 tracking-tight">{stat.value}</h4>
                <p className="text-xs font-medium text-slate-300 mb-0.5">{stat.label}</p>
                <p className="text-[10px] text-slate-500">{stat.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-0 border-b border-[#1e293b]">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>{tab.label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* App Status Table */}
          <div className="lg:col-span-2 glass rounded-none overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">App Status Overview</h3>
              <button className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 border-b border-[#1e293b]">
                  <tr>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">App</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Database</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Users</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {apps.slice(0, 6).map((app) => (
                    <tr key={app.name} className="hover:bg-[#111] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {app.iconUrl
                            ? <img src={app.iconUrl} alt="" className="w-6 h-6 border border-slate-600 bg-[#111] object-contain flex-shrink-0" />
                            : <div className="w-6 h-6 bg-[#111] border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">{app.name.charAt(0)}</div>
                          }
                          <div>
                            <p className="font-semibold text-xs">{app.name}</p>
                            <p className="text-[10px] text-slate-500">{app.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          app.status === 'live' ? 'border border-emerald-500/30 text-emerald-500' :
                          app.status === 'beta' ? 'border border-yellow-500/30 text-yellow-500' :
                          app.status === 'paused' ? 'border border-orange-500/30 text-orange-500' :
                          'border border-slate-500/30 text-slate-500'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{app.db}</p>
                      </td>
                      <td className="px-4 py-3 font-medium">{app.users}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-[#1e293b] text-slate-400 transition-colors"><icons.edit /></button>
                          {app.url && <a href={app.url} target="_blank" className="p-1 hover:bg-[#1e293b] text-blue-500 transition-colors"><icons.externalLink /></a>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="glass rounded-none flex flex-col">
            <div className="px-4 py-3 border-b border-[#1e293b]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Activity</h3>
            </div>
            <div className="p-4 flex-1 space-y-4">
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
          <div className="glass rounded-none p-4 lg:p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Cross-App User Growth</h3>
                <p className="text-[10px] text-slate-500">Cumulative active users across top performing projects</p>
              </div>
              <div className="flex gap-0 border border-[#1e293b]">
                {['7d', '30d', '90d'].map((range) => (
                  <button key={range} className={`px-3 py-1.5 text-[10px] font-bold uppercase ${range === '30d' ? 'bg-blue-600 text-white' : 'hover:bg-[#111] text-slate-400'} ${range !== '7d' ? 'border-l border-[#1e293b]' : ''}`}>
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
                      contentStyle={{backgroundColor: '#0f0f0f', borderColor: '#1e293b', borderRadius: '0', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace'}}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {liveApps.map((app) => (
              <div key={app.name} className="glass rounded-none p-4 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  {app.iconUrl
                    ? <img src={app.iconUrl} alt="" className="w-7 h-7 border border-slate-600 bg-[#111] object-contain flex-shrink-0" />
                    : <div className="w-7 h-7 bg-[#111] border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">{app.name.charAt(0)}</div>
                  }
                  <div>
                    <p className="font-semibold text-xs">{app.name}</p>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      app.status === 'live' ? 'border border-emerald-500/30 text-emerald-500' : 'border border-yellow-500/30 text-yellow-500'
                    }`}>{app.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Users</p>
                    <p className="text-lg font-bold mt-1">{app.users}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tables</p>
                    <p className="text-lg font-bold mt-1">{app.tableCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Share</p>
                    <p className="text-lg font-bold mt-1">{totalUsers > 0 ? Math.round((app.users / totalUsers) * 100) : 0}%</p>
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
