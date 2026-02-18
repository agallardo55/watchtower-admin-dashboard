
import React, { useEffect, useState } from 'react';
import { apps } from '../constants';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ActivityRow {
  id: string;
  app_id: string;
  action: string;
  actor: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  wt_app_registry: { name: string } | null;
}

interface BarDatum {
  name: string;
  count: number;
  color: string;
}

interface PowerUser {
  actor: string;
  appCount: number;
  appNames: string[];
  totalActions: number;
  lastSeen: string;
}

const APP_COLORS = ['#10b981', '#f59e0b', '#325AE7', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

export default function CrossAppActivity() {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('wt_activity_log')
        .select('*, wt_app_registry(name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setActivities((data as ActivityRow[]) ?? []);
      }
      setLoading(false);
    }
    fetchActivity();
  }, []);

  // Compute bar chart data: group by app name, count activities
  const barData: BarDatum[] = (() => {
    const counts = new Map<string, number>();
    for (const row of activities) {
      const appName = row.wt_app_registry?.name ?? 'Unknown';
      counts.set(appName, (counts.get(appName) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        color: APP_COLORS[idx % APP_COLORS.length],
      }));
  })();

  // Compute power users: actors active in 3+ distinct apps
  const powerUsers: PowerUser[] = (() => {
    const actorMap = new Map<string, { apps: Set<string>; total: number; lastSeen: string }>();
    for (const row of activities) {
      const appName = row.wt_app_registry?.name ?? 'Unknown';
      const existing = actorMap.get(row.actor);
      if (existing) {
        existing.apps.add(appName);
        existing.total += 1;
        if (row.created_at > existing.lastSeen) {
          existing.lastSeen = row.created_at;
        }
      } else {
        actorMap.set(row.actor, {
          apps: new Set([appName]),
          total: 1,
          lastSeen: row.created_at,
        });
      }
    }
    return Array.from(actorMap.entries())
      .filter(([, v]) => v.apps.size >= 3)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([actor, v]) => ({
        actor,
        appCount: v.apps.size,
        appNames: Array.from(v.apps),
        totalActions: v.total,
        lastSeen: v.lastSeen,
      }));
  })();

  function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cross-App Activity</h2>
          <p className="text-slate-500 mt-1">Analyze how users move between and engage with multiple apps in the ecosystem.</p>
        </div>
        <div className="flex items-center justify-center py-24 text-slate-500">Loading activity data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cross-App Activity</h2>
          <p className="text-slate-500 mt-1">Analyze how users move between and engage with multiple apps in the ecosystem.</p>
        </div>
        <div className="flex items-center justify-center py-24 text-red-400">Failed to load activity data: {error}</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cross-App Activity</h2>
          <p className="text-slate-500 mt-1">Analyze how users move between and engage with multiple apps in the ecosystem.</p>
        </div>
        <div className="flex items-center justify-center py-24 text-slate-500">No activity recorded yet.</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cross-App Activity</h2>
        <p className="text-slate-500 mt-1">Analyze how users move between and engage with multiple apps in the ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overlap Matrix */}
        <div className="glass rounded-xl p-6">
          <div className="mb-6">
            <h3 className="font-bold text-lg">User Overlap Heatmap</h3>
            <p className="text-xs text-slate-500">Number of shared users between different applications</p>
          </div>

          <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
            No overlap data yet
          </div>
        </div>

        {/* Engagement Bar Chart */}
        <div className="glass rounded-xl p-6">
          <div className="mb-6">
            <h3 className="font-bold text-lg">Total Engagement by App</h3>
            <p className="text-xs text-slate-500">Activity count per app from recent logs</p>
          </div>
          <div className="h-[300px] w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} hide />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">No chart data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Power Users Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Cross-App Power Users</h3>
            <p className="text-xs text-slate-500">Users active across 3 or more applications</p>
          </div>
          <button
            title="Coming soon"
            className="text-xs font-bold text-blue-500 border border-blue-500/20 px-3 py-1 rounded-lg hover:bg-blue-500/10 transition-colors"
          >
            Export Segment
          </button>
        </div>
        {powerUsers.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
            No power users found (requires activity in 3+ apps)
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-white/2 text-slate-500 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Actor</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Apps</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">App Count</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Total Actions</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {powerUsers.map((user) => (
                <tr key={user.actor} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-semibold">{user.actor}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {user.appNames.map((name) => (
                        <span
                          key={name}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-xs text-slate-300"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-blue-400">{user.appCount}</td>
                  <td className="px-6 py-4 font-mono font-bold text-blue-400">{user.totalActions}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs italic">{formatRelativeTime(user.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
