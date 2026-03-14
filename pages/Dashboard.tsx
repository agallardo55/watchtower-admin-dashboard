
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
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function guessActivityType(action: string): string {
  if (!action) return 'feature';
  const lower = action.toLowerCase();
  if (lower.includes('deploy') || lower.includes('launch')) return 'deploy';
  if (lower.includes('spec') || lower.includes('doc')) return 'spec';
  if (lower.includes('schema') || lower.includes('table') || lower.includes('migration')) return 'schema';
  if (lower.includes('launch') || lower.includes('release')) return 'launch';
  if (lower.includes('signup') || lower.includes('user')) return 'signup';
  if (lower.includes('ticket') || lower.includes('bug')) return 'ticket';
  if (lower.includes('alert') || lower.includes('error')) return 'alert';
  return 'feature';
}

const activityTagStyle: Record<string, React.CSSProperties> = {
  deploy:  { color: '#4ADE80', background: 'rgba(74,222,128,0.08)',  border: '1px solid rgba(74,222,128,0.15)' },
  feature: { color: '#4ADE80', background: 'rgba(74,222,128,0.08)',  border: '1px solid rgba(74,222,128,0.15)' },
  signup:  { color: '#3B82F6', background: 'rgba(59,130,246,0.08)',  border: '1px solid rgba(59,130,246,0.15)' },
  spec:    { color: '#3B82F6', background: 'rgba(59,130,246,0.08)',  border: '1px solid rgba(59,130,246,0.15)' },
  schema:  { color: '#A78BFA', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' },
  ticket:  { color: '#F59E0B', background: 'rgba(245,158,11,0.08)',  border: '1px solid rgba(245,158,11,0.15)' },
  alert:   { color: '#EF4444', background: 'rgba(239,68,68,0.08)',   border: '1px solid rgba(239,68,68,0.15)' },
  launch:  { color: '#EF4444', background: 'rgba(239,68,68,0.08)',   border: '1px solid rgba(239,68,68,0.15)' },
};

const tabs = [
  { id: 'overview', label: 'overview' },
  { id: 'analytics', label: 'analytics' },
];

function getStatusBadgeClass(status: string) {
  if (status === 'live') return 'badge-live';
  if (status === 'beta') return 'badge-beta';
  if (status === 'paused') return 'badge-paused';
  if (status === 'down') return 'badge-down';
  return 'badge-inactive';
}

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

      const { data: activityData } = await supabaseAdmin
        .from('wt_activity_log')
        .select('id, action, actor, description, created_at, wt_app_registry(name)')
        .order('created_at', { ascending: false })
        .limit(12);

      if (activityData) {
        setRecentActivity(activityData.map((a: any) => ({
          app: a.wt_app_registry?.name || a.actor || 'watchtower',
          action: a.description || a.action,
          time: formatRelativeTime(a.created_at),
          timestamp: formatTimestamp(a.created_at),
          type: guessActivityType(a.action),
        })));
      }

      const { count } = await supabaseAdmin
        .from('wt_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setPendingInvitations(count || 0);
    }
    fetchDashboardData();
  }, []);

  if (statsLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="terminal-card" style={{ padding: 20, height: 120, opacity: 0.5 }}>
              <div style={{ height: 10, background: '#1a1a1a', borderRadius: 2, width: '60%', marginBottom: 12 }} />
              <div style={{ height: 28, background: '#1a1a1a', borderRadius: 2, width: '40%', marginBottom: 8 }} />
              <div style={{ height: 8, background: '#1a1a1a', borderRadius: 2, width: '80%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 8 }}>// error: failed to load dashboard</div>
        <div style={{ fontSize: 11, color: '#444444', marginBottom: 16 }}>{statsError}</div>
        <button onClick={refetchStats} className="btn-secondary" style={{ fontSize: 12 }}>$ retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#444444', marginBottom: 4 }}>// DASHBOARD</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#e0e0e0' }}>Mission Control</div>
      </div>

      {/* KPI — code syntax card */}
      <div className="terminal-card-glow" style={{ marginBottom: 24, padding: '20px 24px' }}>
        <div style={{ color: '#4ADE80', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>const system = {'{'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 32px' }} className="sm:grid-cols-4">
          <StatLine label="total_apps" value={String(stats.totalApps)} sub={`${stats.liveApps} live`} />
          <StatLine label="total_users" value={String(stats.totalUsers)} sub="across all apps" />
          <StatLine label="db_tables" value={String(stats.totalTables)} sub={`${stats.schemaCount} schemas`} />
          <StatLine label="pending_invites" value={String(pendingInvitations)} sub={pendingInvitations > 0 ? 'needs attention' : 'all clear'} warn={pendingInvitations > 0} />
        </div>
        <div style={{ color: '#4ADE80', fontSize: 12, fontWeight: 600, marginTop: 16 }}>{'}'}</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #1a1a1a', paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #4ADE80' : '2px solid transparent',
              color: activeTab === tab.id ? '#4ADE80' : '#555555',
              cursor: 'pointer',
              transition: 'all 0.1s',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }} className="lg:grid-cols-[1fr_380px] grid-cols-1">
          {/* App Status Table */}
          <div className="terminal-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>## app_status</span>
              <button style={{ fontSize: 10, color: '#4ADE80', background: 'transparent', border: 'none', cursor: 'pointer' }}>view_all →</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="terminal-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d0d0d' }}>
                    <th style={{ textAlign: 'left' }}>APP</th>
                    <th style={{ textAlign: 'left' }}>STATUS</th>
                    <th style={{ textAlign: 'left' }}>DATABASE</th>
                    <th style={{ textAlign: 'right' }}>USERS</th>
                    <th style={{ textAlign: 'left' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.slice(0, 6).map((app) => (
                    <tr key={app.name}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 16 }}>{app.icon}</span>
                          <div>
                            <div style={{ color: '#e0e0e0', fontWeight: 500, fontSize: 12 }}>{app.name}</div>
                            <div style={{ color: '#444444', fontSize: 10 }}>{app.category || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(app.status)}>
                          {app.status === 'live' || app.status === 'beta' ? '● ' : '○ '}{app.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#555555', fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{app.db || '—'}</span>
                      </td>
                      <td style={{ textAlign: 'right', color: '#4ADE80', fontWeight: 600 }}>{app.users}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button style={{ padding: '4px 6px', background: 'transparent', border: 'none', color: '#444444', cursor: 'pointer', borderRadius: 3 }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1a1a1a'; (e.currentTarget as HTMLElement).style.color = '#e0e0e0'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#444444'; }}>
                            <icons.edit />
                          </button>
                          {app.url && (
                            <a href={app.url} target="_blank" style={{ padding: '4px 6px', background: 'transparent', border: 'none', color: '#444444', cursor: 'pointer', borderRadius: 3, display: 'inline-flex', alignItems: 'center' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1a1a1a'; (e.currentTarget as HTMLElement).style.color = '#4ADE80'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#444444'; }}>
                              <icons.externalLink />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Log — terminal output */}
          <div className="terminal-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a1a1a' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>## activity_log</span>
            </div>
            <div style={{ padding: '12px 16px', flex: 1, overflow: 'hidden' }}>
              {recentActivity.length === 0 ? (
                <div style={{ color: '#444444', fontSize: 12, padding: '24px 0', textAlign: 'center' }}>// no recent activity</div>
              ) : (
                recentActivity.map((activity, idx) => {
                  const tagStyle = activityTagStyle[activity.type] || activityTagStyle.feature;
                  return (
                    <div key={idx} className="terminal-log-line">
                      <span className="terminal-log-time">[{activity.timestamp}]</span>
                      <span className="terminal-log-tag" style={tagStyle}>{activity.type}</span>
                      <span className="terminal-log-desc" style={{ fontSize: 11 }}>
                        <span style={{ color: '#666666' }}>{activity.app.toLowerCase()} — </span>
                        {activity.action}
                      </span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Cross-App User Growth */}
          <div className="terminal-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>## user_growth</div>
                <div style={{ fontSize: 12, color: '#555555' }}>cumulative active users across apps</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['7d', '30d', '90d'].map((range) => (
                  <button
                    key={range}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      borderRadius: '3px',
                      background: range === '30d' ? 'rgba(74,222,128,0.1)' : 'transparent',
                      border: range === '30d' ? '1px solid rgba(74,222,128,0.2)' : '1px solid #222222',
                      color: range === '30d' ? '#4ADE80' : '#555555',
                      cursor: 'pointer',
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            {chartData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                <span style={{ color: '#444444', fontSize: 12 }}>// no analytics data yet</span>
              </div>
            ) : (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorBuybid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4ADE80" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#444444', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#444444', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111111', borderColor: '#222222', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
                      itemStyle={{ color: '#e0e0e0' }}
                      labelStyle={{ color: '#666666', marginBottom: 4 }}
                    />
                    <Area type="monotone" dataKey="buybid" stroke="#4ADE80" strokeWidth={2} fillOpacity={1} fill="url(#colorBuybid)" name="BuybidHQ" />
                    <Area type="monotone" dataKey="salesboard" stroke="#A78BFA" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="SalesboardHQ" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Per-App Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {liveApps.map((app) => (
              <div key={app.name} className="terminal-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 18 }}>{app.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e0e0e0' }}>{app.name}</div>
                    <span className={getStatusBadgeClass(app.status)}>{app.status}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444444', marginBottom: 4 }}>USERS</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#4ADE80' }}>{app.users}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444444', marginBottom: 4 }}>TABLES</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#e0e0e0' }}>{app.tableCount || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444444', marginBottom: 4 }}>SHARE</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#e0e0e0' }}>{totalUsers > 0 ? Math.round((app.users / totalUsers) * 100) : 0}%</div>
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

function StatLine({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#555555', marginBottom: 4 }}>
        <span style={{ color: '#666666' }}>  </span>
        <span style={{ color: '#A78BFA' }}>{label}</span>
        <span style={{ color: '#666666' }}>:</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: warn ? '#F59E0B' : '#4ADE80', lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 10, color: '#444444' }}>{sub}</span>
      </div>
    </div>
  );
}
