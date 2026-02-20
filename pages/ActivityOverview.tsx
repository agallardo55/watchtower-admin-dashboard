import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AppActivity } from '../types';
import { icons } from '../constants';

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
  if (totalEvents === 0 || !lastActivity) return { color: 'bg-slate-400', label: 'No events' };
  const hours = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
  if (hours < 24) return { color: 'bg-emerald-400', label: 'Active' };
  if (hours < 168) return { color: 'bg-amber-400', label: 'Quiet' };
  return { color: 'bg-red-400', label: 'Inactive' };
}

const appDisplayNames: Record<string, string> = {
  salesloghq: 'SaleslogHQ',
  buybidhq: 'BuybidHQ',
  demolight: 'Demolight',
  dealerscore: 'DealerScore',
  salesboardhq: 'SalesboardHQ',
  bitw: 'BITW',
};

const eventRowClass = (eventType: string): string => {
  if (eventType === 'signup') return 'border-l-2 border-emerald-500';
  if (eventType === 'error') return 'border-l-2 border-red-500';
  return '';
};

export default function ActivityOverview() {
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
    return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-slate-500 text-sm mt-1">Cross-app user activity across all BITW apps</p>
      </div>

      {/* KPI Cards */}
      {stats.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stats.map((s) => {
            const h = healthDot(s.last_activity, s.total_events);
            return (
              <Link
                key={s.app_slug}
                to={`/activity/${s.app_slug}`}
                className="block rounded-xl border border-white/5 bg-slate-900/50 p-5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-sm">{appDisplayNames[s.app_slug] || s.app_slug}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${h.color}`} title={h.label} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-500">Total Events</p>
                    <p className="text-lg font-bold">{s.total_events.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Today</p>
                    <p className="text-lg font-bold">{s.events_today.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Unique Users</p>
                    <p className="text-lg font-bold">{s.unique_users.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Last Activity</p>
                    <p className="font-medium">{s.last_activity ? relativeTime(s.last_activity) : '—'}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-8 text-center text-slate-500 text-sm">
          No activity recorded yet. Once apps start sending events, you'll see them here.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={appFilter}
          onChange={(e) => setAppFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-slate-900 border border-white/10 text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Apps</option>
          {Object.entries(appDisplayNames).map(([slug, name]) => (
            <option key={slug} value={slug}>{name}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-slate-900 border border-white/10 text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Events</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <icons.search />
          </div>
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-1.5 rounded-lg text-sm bg-slate-900 border border-white/10 text-slate-300 focus:outline-none focus:border-blue-500 w-56"
          />
        </div>
      </div>

      {/* Activity Feed Table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">App</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No activity found matching your filters.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className={`hover:bg-white/[0.02] ${eventRowClass(ev.event_type)}`}>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{relativeTime(ev.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/activity/${ev.app_slug}`}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {appDisplayNames[ev.app_slug] || ev.app_slug}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        ev.event_type === 'signup' ? 'bg-emerald-500/10 text-emerald-400' :
                        ev.event_type === 'error' ? 'bg-red-500/10 text-red-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{ev.user_email || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-sm">
            <span className="text-slate-500">
              {total.toLocaleString()} total events
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="text-slate-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
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
