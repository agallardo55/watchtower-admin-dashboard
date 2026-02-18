import React, { useState, useEffect, useCallback } from 'react';
import { icons } from '../constants';
import { supabase } from '../lib/supabase';

interface AppRegistry {
  name: string;
}

interface Ticket {
  id: string;
  title: string;
  app_id: string;
  assigned_to: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
  ai_summary: string | null;
  feedback_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  wt_app_registry: AppRegistry | null;
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  low: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  in_progress: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  wont_fix: 'bg-slate-500/10 text-slate-500 border border-slate-500/20',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  wont_fix: "Won't Fix",
};

const statusOptions: { value: string; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'wont_fix', label: "Won't Fix" },
];

function getAppName(ticket: Ticket): string {
  return ticket.wt_app_registry?.name ?? 'Unknown App';
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [appFilter, setAppFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [statusDropdown, setStatusDropdown] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('wt_tickets')
      .select('*, wt_app_registry(name)')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setTickets((data as Ticket[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    setUpdating(true);
    setUpdateError(null);

    const now = new Date().toISOString();
    const updates: Record<string, string> = { status: newStatus, updated_at: now };
    if (newStatus === 'resolved') {
      updates.resolved_at = now;
    }

    const { error: updateErr } = await supabase
      .from('wt_tickets')
      .update(updates)
      .eq('id', ticketId);

    if (updateErr) {
      setUpdateError(updateErr.message);
      setUpdating(false);
      return;
    }

    setTickets(prev =>
      prev.map(t =>
        t.id === ticketId
          ? { ...t, status: newStatus as Ticket['status'], updated_at: now, ...(newStatus === 'resolved' ? { resolved_at: now } : {}) }
          : t
      )
    );

    if (selected?.id === ticketId) {
      setSelected(prev =>
        prev ? { ...prev, status: newStatus as Ticket['status'], updated_at: now, ...(newStatus === 'resolved' ? { resolved_at: now } : {}) } : null
      );
    }

    setStatusDropdown(false);
    setUpdating(false);
  };

  const allApps = [...new Set(tickets.map(t => getAppName(t)))].sort();

  const filtered = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (appFilter !== 'all' && getAppName(t) !== appFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !getAppName(t).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const today = new Date().toISOString().slice(0, 10);
  const openCount = tickets.filter(t => t.status === 'open').length;
  const criticalCount = tickets.filter(t => t.priority === 'critical' && t.status !== 'closed' && t.status !== 'resolved').length;
  const resolvedToday = tickets.filter(t => t.status === 'resolved' && t.updated_at.startsWith(today)).length;
  const feedbackToday = tickets.filter(t => t.created_at.startsWith(today)).length;

  const stats = [
    { label: 'Open Tickets', value: openCount, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: 'mail' },
    { label: 'Critical', value: criticalCount, color: 'text-red-400', bg: 'bg-red-500/10', icon: 'activity' },
    { label: 'Resolved Today', value: resolvedToday, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: 'archive' },
    { label: 'New Feedback', value: feedbackToday, color: 'text-purple-400', bg: 'bg-purple-500/10', icon: 'bell' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Tickets</h2>
          <p className="text-slate-500 mt-1">Cross-app feedback and AI-triaged issues.</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-slate-400 text-sm">Loading tickets...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Tickets</h2>
          <p className="text-slate-500 mt-1">Cross-app feedback and AI-triaged issues.</p>
        </div>
        <div className="glass rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Failed to load tickets</h3>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={fetchTickets} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Tickets</h2>
          <p className="text-slate-500 mt-1">Cross-app feedback and AI-triaged issues.</p>
        </div>
        <div className="glass rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🎫</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">No tickets yet</h3>
          <p className="text-sm text-slate-500">Tickets are created from user feedback via the AI triage system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Tickets</h2>
        <p className="text-slate-500 mt-1">Cross-app feedback and AI-triaged issues.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map(s => {
          const Icon = (icons as Record<string, React.FC>)[s.icon];
          return (
            <div key={s.label} className="glass p-4 lg:p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${s.bg}`}><Icon /></div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{s.label}</span>
              </div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="wont_fix">Won't Fix</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500">
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={appFilter} onChange={e => setAppFilter(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500">
          <option value="all">All Apps</option>
          {allApps.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <icons.search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Mobile Cards */}
        <div className={`lg:hidden flex-1 space-y-3 ${selected ? 'hidden' : ''}`}>
          {filtered.map(t => (
            <div key={t.id} onClick={() => setSelected(selected?.id === t.id ? null : t)} className={`glass rounded-xl p-4 cursor-pointer transition-colors ${selected?.id === t.id ? 'border-blue-500 border' : 'border border-white/5 hover:border-white/10'}`}>
              <p className="font-medium text-sm text-slate-200 mb-2">{t.title}</p>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[t.priority]}`}>{t.priority}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{getAppName(t)}</span>
                <span>{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="glass rounded-xl p-12 text-center">
              <div className="text-4xl mb-4">🎫</div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">No tickets found</h3>
              <p className="text-sm text-slate-500">Try adjusting your filters.</p>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className={`glass rounded-xl overflow-hidden flex-1 transition-all hidden lg:block ${selected ? 'lg:max-w-[60%]' : ''}`}>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">App</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden lg:table-cell">Category</th>
                <th className="px-4 py-3 hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(t => (
                <tr key={t.id} onClick={() => setSelected(selected?.id === t.id ? null : t)} className={`hover:bg-white/5 cursor-pointer transition-colors ${selected?.id === t.id ? 'bg-blue-500/5 border-l-2 border-blue-500' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-200 max-w-[280px] truncate">{t.title}</td>
                  <td className="px-4 py-3 text-slate-400">{getAppName(t)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[t.priority]}`}>{t.priority}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[t.status]}`}>{statusLabels[t.status]}</span></td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{t.category}</td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No tickets match your filters.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-full lg:w-[400px] glass rounded-xl p-4 lg:p-6 space-y-5 animate-in slide-in-from-right">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{selected.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{getAppName(selected)} · {selected.category}</p>
              </div>
              <button onClick={() => { setSelected(null); setStatusDropdown(false); }} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 block">Priority</label>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[selected.priority]}`}>{selected.priority}</span>
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 block">Status</label>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[selected.status]}`}>{statusLabels[selected.status]}</span>
              </div>
            </div>

            {selected.ai_summary && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block">🤖 AI Summary</label>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 rounded-lg p-3 border border-white/5">{selected.ai_summary}</p>
              </div>
            )}

            {selected.tags && selected.tags.length > 0 && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map(tag => (
                    <span key={tag} className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-md border border-white/5">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-white/5 pt-4">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block">Timeline</label>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  <span>Created {new Date(selected.created_at).toLocaleString()}</span>
                </div>
                {selected.updated_at !== selected.created_at && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    <span>Updated {new Date(selected.updated_at).toLocaleString()}</span>
                  </div>
                )}
                {selected.resolved_at && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span>Resolved {new Date(selected.resolved_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative pt-2">
              {updateError && (
                <p className="text-xs text-red-400 mb-2">{updateError}</p>
              )}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <button
                    onClick={() => setStatusDropdown(!statusDropdown)}
                    disabled={updating}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {updating ? 'Updating...' : 'Update Status'}
                  </button>
                  {statusDropdown && (
                    <div className="absolute bottom-full left-0 mb-1 w-full bg-slate-800 border border-white/10 rounded-lg overflow-hidden shadow-xl z-10">
                      {statusOptions
                        .filter(opt => opt.value !== selected.status)
                        .map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => updateTicketStatus(selected.id, opt.value)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                          >
                            {opt.label}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/5">Assign</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
