import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AppActivity as AppActivityType } from '../types';
import { icons } from '../constants';

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

const appDisplayNames: Record<string, string> = {
  salesloghq: 'SaleslogHQ',
  buybidhq: 'BuybidHQ',
  demolight: 'Demolight',
  dealerscore: 'DealerScore',
  salesboardhq: 'SalesboardHQ',
  bitw: 'BITW',
};

interface UserRow {
  email: string;
  first_seen: string;
  last_active: string;
  total_events: number;
  most_recent_event: string;
}

interface EventBreakdown {
  event_type: string;
  count: number;
}

export default function AppActivity() {
  const { appSlug } = useParams<{ appSlug: string }>();
  const [events, setEvents] = useState<AppActivityType[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [breakdown, setBreakdown] = useState<EventBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [appInfo, setAppInfo] = useState<{ name: string; app_url: string | null; status: string } | null>(null);

  // Metrics
  const [totalSignups, setTotalSignups] = useState(0);
  const [activeThisWeek, setActiveThisWeek] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [topEvent, setTopEvent] = useState('—');
  const [lastActivity, setLastActivity] = useState<string | null>(null);

  // Pagination
  const [eventsPage, setEventsPage] = useState(0);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const EVENTS_PER_PAGE = 50;
  const USERS_PER_PAGE = 25;

  const displayName = appDisplayNames[appSlug || ''] || appSlug || 'Unknown';

  const fetchAll = useCallback(async () => {
    if (!appSlug) return;
    setLoading(true);

    // Fetch app info from registry
    const { data: regData } = await supabase
      .from('wt_app_registry')
      .select('name, app_url, status')
      .eq('slug', appSlug)
      .maybeSingle();
    setAppInfo(regData);

    // Fetch all events for this app (for stats)
    const { data: allEvents } = await supabase
      .from('wt_app_activity')
      .select('event_type, user_email, created_at')
      .eq('app_slug', appSlug);

    if (allEvents) {
      setTotalEvents(allEvents.length);

      // Signups
      const signupEmails = new Set(allEvents.filter(e => e.event_type === 'signup' && e.user_email).map(e => e.user_email));
      setTotalSignups(signupEmails.size);

      // Active this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const weekEmails = new Set(allEvents.filter(e => e.created_at >= weekAgo && e.user_email).map(e => e.user_email));
      setActiveThisWeek(weekEmails.size);

      // Last activity
      const sorted = [...allEvents].sort((a, b) => b.created_at.localeCompare(a.created_at));
      setLastActivity(sorted[0]?.created_at || null);

      // Event breakdown
      const counts: Record<string, number> = {};
      for (const e of allEvents) {
        counts[e.event_type] = (counts[e.event_type] || 0) + 1;
      }
      const bd = Object.entries(counts)
        .map(([event_type, count]) => ({ event_type, count }))
        .sort((a, b) => b.count - a.count);
      setBreakdown(bd);
      setTopEvent(bd[0]?.event_type || '—');

      // Users table
      const userMap: Record<string, UserRow> = {};
      for (const e of allEvents) {
        if (!e.user_email) continue;
        if (!userMap[e.user_email]) {
          userMap[e.user_email] = {
            email: e.user_email,
            first_seen: e.created_at,
            last_active: e.created_at,
            total_events: 0,
            most_recent_event: e.event_type,
          };
        }
        const u = userMap[e.user_email];
        u.total_events++;
        if (e.created_at < u.first_seen) u.first_seen = e.created_at;
        if (e.created_at > u.last_active) {
          u.last_active = e.created_at;
          u.most_recent_event = e.event_type;
        }
      }
      const userList = Object.values(userMap).sort((a, b) => b.last_active.localeCompare(a.last_active));
      setUsers(userList);
    }

    // Paginated events for timeline
    const { data: pageEvents, count } = await supabase
      .from('wt_app_activity')
      .select('*', { count: 'exact' })
      .eq('app_slug', appSlug)
      .order('created_at', { ascending: false })
      .range(eventsPage * EVENTS_PER_PAGE, (eventsPage + 1) * EVENTS_PER_PAGE - 1);

    setEvents(pageEvents || []);
    setEventsTotal(count || 0);
    setLoading(false);
  }, [appSlug, eventsPage]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const eventsTotalPages = Math.ceil(eventsTotal / EVENTS_PER_PAGE);
  const paginatedUsers = users.slice(usersPage * USERS_PER_PAGE, (usersPage + 1) * USERS_PER_PAGE);
  const usersTotalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const maxBreakdownCount = breakdown[0]?.count || 1;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* App Header */}
      <div className="flex items-center gap-4">
        <Link to="/activity" className="text-slate-500 hover:text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{appInfo?.name || displayName}</h1>
          <div className="flex items-center gap-3 mt-1">
            {appInfo?.app_url && (
              <a href={appInfo.app_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                {appInfo.app_url} <icons.externalLink />
              </a>
            )}
            {appInfo?.status && (
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                appInfo.status === 'live' ? 'bg-emerald-500/10 text-emerald-400' :
                appInfo.status === 'beta' ? 'bg-amber-500/10 text-amber-400' :
                'bg-slate-500/10 text-slate-400'
              }`}>
                {appInfo.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', value: totalSignups.toLocaleString() },
          { label: 'Active This Week', value: activeThisWeek.toLocaleString() },
          { label: 'Total Events', value: totalEvents.toLocaleString() },
          { label: 'Top Event', value: topEvent },
          { label: 'Last Activity', value: lastActivity ? relativeTime(lastActivity) : '—' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className="text-lg font-bold">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      {users.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Users</h2>
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">First Seen</th>
                    <th className="px-4 py-3 font-medium">Last Active</th>
                    <th className="px-4 py-3 font-medium">Total Events</th>
                    <th className="px-4 py-3 font-medium">Most Recent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedUsers.map((u) => (
                    <tr key={u.email} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-slate-300">{u.email}</td>
                      <td className="px-4 py-3 text-slate-400">{relativeTime(u.first_seen)}</td>
                      <td className="px-4 py-3 text-slate-400">{relativeTime(u.last_active)}</td>
                      <td className="px-4 py-3">{u.total_events}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-500/10 text-slate-400">
                          {u.most_recent_event}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {usersTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-sm">
                <span className="text-slate-500">{users.length} users</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setUsersPage(Math.max(0, usersPage - 1))} disabled={usersPage === 0} className="px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">Prev</button>
                  <span className="text-slate-500">{usersPage + 1} / {usersTotalPages}</span>
                  <button onClick={() => setUsersPage(Math.min(usersTotalPages - 1, usersPage + 1))} disabled={usersPage >= usersTotalPages - 1} className="px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Type Breakdown */}
      {breakdown.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Event Breakdown</h2>
          <div className="rounded-xl border border-white/5 bg-slate-900/50 p-5 space-y-3">
            {breakdown.map((b) => (
              <div key={b.event_type} className="flex items-center gap-3">
                <span className="text-sm text-slate-400 w-40 truncate">{b.event_type}</span>
                <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-600/60 rounded"
                    style={{ width: `${(b.count / maxBreakdownCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Timeline */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Event Timeline</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No activity recorded yet. Once apps start sending events, you'll see them here.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} className={`hover:bg-white/[0.02] ${
                      ev.event_type === 'signup' ? 'border-l-2 border-emerald-500' :
                      ev.event_type === 'error' ? 'border-l-2 border-red-500' : ''
                    }`}>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{relativeTime(ev.created_at)}</td>
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
          {eventsTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-sm">
              <span className="text-slate-500">{eventsTotal.toLocaleString()} events</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setEventsPage(Math.max(0, eventsPage - 1))} disabled={eventsPage === 0} className="px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">Prev</button>
                <span className="text-slate-500">{eventsPage + 1} / {eventsTotalPages}</span>
                <button onClick={() => setEventsPage(Math.min(eventsTotalPages - 1, eventsPage + 1))} disabled={eventsPage >= eventsTotalPages - 1} className="px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
