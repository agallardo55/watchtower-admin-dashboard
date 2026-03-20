import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AppActivity } from '../types';
import { icons } from '../constants';
import { useApps } from '../hooks/useApps';

interface AppStats {
  app_slug: string;
  total_events: number;
  events_today: number;
  unique_users: number;
  last_activity: string | null;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

function healthDot(lastActivity: string | null, totalEvents: number): { color: string; label: string } {
  if (totalEvents === 0 || !lastActivity) return { color: 'var(--text-muted)', label: 'No events' };
  const hours = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
  if (hours < 24) return { color: 'var(--accent)', label: 'Active' };
  if (hours < 168) return { color: 'var(--warning)', label: 'Quiet' };
  return { color: 'var(--danger)', label: 'Inactive' };
}

const eventTypeStyle = (eventType: string): React.CSSProperties => {
  if (eventType === 'signup') return { background: 'var(--accent-bg-hover)', color: 'var(--accent)', border: '1px solid var(--accent-border)' };
  if (eventType === 'error') return { background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' };
  return { background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border)' };
};

const eventRowBorder = (eventType: string): React.CSSProperties => {
  if (eventType === 'signup') return { borderLeft: '2px solid var(--accent)' };
  if (eventType === 'error') return { borderLeft: '2px solid #EF4444' };
  return { borderLeft: '2px solid transparent' };
};

export default function ActivityOverview() {
  const { apps } = useApps();
  const appDisplayNames: Record<string, string> = {};
  apps.forEach(a => {
    appDisplayNames[a.slug || a.name.toLowerCase().replace(/\s+/g, '')] = a.name;
  });

  const [stats, setStats] = useState<AppStats[]>([]);
  const [events, setEvents] = useState<AppActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [appFilter, setAppFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const PAGE_SIZE = 25;

  const fetchStats = useCallback(async () => {
    // Get all events grouped by app_slug for stats
    const { data } = await supabase
      .from('wt_app_activity')
      .select('app_slug, event_type, user_email, created_at');

    if (!data) return;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const grouped: Record<string, AppStats> = {};
    const types = new Set<string>();

    for (const row of data) {
      types.add(row.event_type);
      if (!grouped[row.app_slug]) {
        grouped[row.app_slug] = {
          app_slug: row.app_slug,
          total_events: 0,
          events_today: 0,
          unique_users: 0,
          last_activity: null,
        };
      }
      const s = grouped[row.app_slug];
      s.total_events++;
      if (row.created_at >= todayStart) s.events_today++;
      if (!s.last_activity || row.created_at > s.last_activity) s.last_activity = row.created_at;
    }

    // Count unique users per app
    for (const slug of Object.keys(grouped)) {
      const emails = new Set(data.filter(r => r.app_slug === slug && r.user_email).map(r => r.user_email));
      grouped[slug].unique_users = emails.size;
    }

    setStats(Object.values(grouped));
    setEventTypes(Array.from(types).sort());
  }, []);

  const fetchEvents = useCallback(async () => {
    let query = supabase
      .from('wt_app_activity')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (appFilter !== 'all') query = query.eq('app_slug', appFilter);
    if (typeFilter !== 'all') query = query.eq('event_type', typeFilter);
    if (search.trim()) query = query.ilike('user_email', `%${search.trim()}%`);

    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count } = await query;
    setEvents(data || []);
    setTotal(count || 0);
  }, [page, appFilter, typeFilter, search]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchEvents()]).then(() => setLoading(false));
  }, [fetchStats, fetchEvents]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [appFilter, typeFilter, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem', color: 'var(--text-muted)', fontSize: '13px' }}>
        LOADING...
      </div>
    );
  }

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    color: 'var(--text-primary)',
    fontSize: '12px',
    padding: '6px 10px',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
          WATCHTOWER
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
          // ACTIVITY
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
          Cross-app user activity across all BITW apps
        </p>
      </div>

      {/* KPI Cards */}
      {stats.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {stats.map((s) => {
            const h = healthDot(s.last_activity, s.total_events);
            return (
              <Link
                key={s.app_slug}
                to={`/activity/${s.app_slug}`}
                className="terminal-card"
                style={{
                  display: 'block',
                  padding: '16px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-faint)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {appDisplayNames[s.app_slug] || s.app_slug}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      title={h.label}
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: h.color,
                        boxShadow: h.color === 'var(--accent)' ? `0 0 6px ${h.color}` : 'none',
                      }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{h.label}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</p>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{s.total_events.toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</p>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', margin: 0 }}>{s.events_today.toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Users</p>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{s.unique_users.toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last</p>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', margin: 0 }}>
                      {s.last_activity ? relativeTime(s.last_activity) : '—'}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div
          className="terminal-card"
          style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}
        >
          No activity recorded yet. Once apps start sending events, you'll see them here.
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
        <select
          value={appFilter}
          onChange={(e) => setAppFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All Apps</option>
          {Object.entries(appDisplayNames).map(([slug, name]) => (
            <option key={slug} value={slug}>{name}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All Events</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <icons.search />
          </div>
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...selectStyle,
              paddingLeft: '32px',
              width: '220px',
            }}
          />
        </div>

        {(appFilter !== 'all' || typeFilter !== 'all' || search) && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {total.toLocaleString()} result{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Activity Feed Table */}
      <div className="terminal-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="terminal-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Time</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>App</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Event</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}
                  >
                    No activity found matching your filters.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr
                    key={ev.id}
                    style={{
                      ...eventRowBorder(ev.event_type),
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.01)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {relativeTime(ev.created_at)}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <Link
                        to={`/activity/${ev.app_slug}`}
                        style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent)')}
                      >
                        {appDisplayNames[ev.app_slug] || ev.app_slug}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span
                        style={{
                          ...eventTypeStyle(ev.event_type),
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        {ev.event_type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-primary)' }}>
                      {ev.user_email || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '11px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.metadata && Object.keys(ev.metadata).length > 0
                        ? JSON.stringify(ev.metadata)
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderTop: '1px solid #1a1a1a',
            fontSize: '12px',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {total.toLocaleString()} total events
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{
                  padding: '4px 12px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: page === 0 ? 'var(--text-faint)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { if (page !== 0) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = page === 0 ? 'var(--text-faint)' : 'var(--text-secondary)'; }}
              >
                Prev
              </button>
              <span style={{ color: 'var(--text-muted)', minWidth: '60px', textAlign: 'center' }}>
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  padding: '4px 12px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: page >= totalPages - 1 ? 'var(--text-faint)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { if (page < totalPages - 1) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = page >= totalPages - 1 ? 'var(--text-faint)' : 'var(--text-secondary)'; }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
