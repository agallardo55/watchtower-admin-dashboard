import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// --- Types ---

type FeatureStatus = 'new' | 'planned' | 'in-progress' | 'shipped' | 'declined';
type SortField = 'votes' | 'date';
type SortDir = 'asc' | 'desc';

interface FeedbackMetadata {
  priority?: string;
  status: FeatureStatus;
  votes: number;
  requestedBy: string;
}

interface FeedbackRow {
  id: string;
  app_id: string;
  type: string;
  subject: string;
  message: string;
  user_email: string;
  metadata: FeedbackMetadata;
  created_at: string;
  wt_app_registry: { name: string } | null;
}

interface FeedbackItem {
  id: string;
  app: string;
  title: string;
  description: string;
  status: FeatureStatus;
  source: string;
  votes: number;
  date: string;
  metadata: FeedbackMetadata;
}

// --- Constants ---

const statuses: FeatureStatus[] = ['new', 'planned', 'in-progress', 'shipped', 'declined'];

const statusStyle: Record<FeatureStatus, string> = {
  'new': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'planned': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'shipped': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'declined': 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusDot: Record<FeatureStatus, string> = {
  'new': 'bg-blue-400',
  'planned': 'bg-purple-400',
  'in-progress': 'bg-amber-400',
  'shipped': 'bg-emerald-400',
  'declined': 'bg-red-400',
};

function mapRow(row: FeedbackRow): FeedbackItem {
  const meta = row.metadata;
  return {
    id: row.id,
    app: row.wt_app_registry?.name ?? 'Unknown',
    title: row.subject,
    description: row.message,
    status: meta?.status ?? 'new',
    source: meta?.requestedBy || row.user_email || '',
    votes: meta?.votes ?? 0,
    date: row.created_at ? row.created_at.slice(0, 10) : '',
    metadata: meta,
  };
}

function exportCsv(items: FeedbackItem[]): void {
  const headers = ['Request', 'App', 'Status', 'Votes', 'Source', 'Date'];
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = items.map(r => [esc(r.title), esc(r.app), r.status, String(r.votes), esc(r.source), r.date].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `feature-requests-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Main Page ---

export default function FeatureRequests() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votingIds, setVotingIds] = useState<Set<string>>(new Set());

  // Filters
  const [filterApp, setFilterApp] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Sort
  const [sortField, setSortField] = useState<SortField>('votes');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Inline status edit
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  // Load feedback
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('wt_feedback')
        .select('*, wt_app_registry(name)')
        .eq('type', 'feature_request')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setItems((data as FeedbackRow[]).map(mapRow));
      setLoading(false);
    }
    load();
  }, []);

  // App names for filter
  const appNames = useMemo(() => {
    return Array.from(new Set(items.map(i => i.app))).sort();
  }, [items]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let result = [...items];
    if (filterApp !== 'all') result = result.filter(r => r.app === filterApp);
    if (filterStatus !== 'all') result = result.filter(r => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.app.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      const cmp = sortField === 'votes' ? a.votes - b.votes : a.date.localeCompare(b.date);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [items, filterApp, filterStatus, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return '\u2195';
    return sortDir === 'desc' ? '\u2193' : '\u2191';
  };

  // Vote
  const handleVote = useCallback(async (id: string) => {
    const target = items.find(r => r.id === id);
    if (!target || votingIds.has(id)) return;

    setVotingIds(prev => new Set(prev).add(id));
    const newVotes = target.votes + 1;

    const { error: voteError } = await supabase
      .from('wt_feedback')
      .update({ metadata: { ...target.metadata, votes: newVotes } })
      .eq('id', id);

    setVotingIds(prev => { const next = new Set(prev); next.delete(id); return next; });

    if (voteError) { setError(voteError.message); return; }
    setItems(prev => prev.map(r => r.id === id ? { ...r, votes: newVotes, metadata: { ...r.metadata, votes: newVotes } } : r));
  }, [items, votingIds]);

  // Inline status change
  const handleStatusChange = useCallback(async (id: string, newStatus: FeatureStatus) => {
    const target = items.find(r => r.id === id);
    if (!target) return;

    const { error: updateError } = await supabase
      .from('wt_feedback')
      .update({ metadata: { ...target.metadata, status: newStatus } })
      .eq('id', id);

    if (updateError) { setError(updateError.message); return; }
    setItems(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, metadata: { ...r.metadata, status: newStatus } } : r));
    setEditingStatusId(null);
  }, [items]);

  // Loading
  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-800 rounded-lg w-64" />
        <div className="h-10 bg-slate-800/50 rounded-lg w-full" />
        <div className="h-96 bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  // Error
  if (error && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-7xl mx-auto">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold mb-1">Failed to load feedback</h3>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Inline error */}
      {error && items.length > 0 && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 ml-4">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Feature Requests</h1>
          <p className="text-sm text-slate-500 mt-1">
            {items.length} requests across {appNames.length} app{appNames.length !== 1 ? 's' : ''} — sorted by demand
          </p>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          disabled={items.length === 0}
          className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 bg-slate-800 border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50 flex items-center gap-1.5 self-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterApp} onChange={e => setFilterApp(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500">
          <option value="all">All Apps</option>
          {appNames.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500">
          <option value="all">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search requests..."
          className="px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600 w-48"
        />
        {(filterApp !== 'all' || filterStatus !== 'all' || search) && (
          <button
            onClick={() => { setFilterApp('all'); setFilterStatus('all'); setSearch(''); }}
            className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">💡</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">No feature requests yet</h3>
          <p className="text-sm text-slate-500">Feature requests from your apps will appear here as users submit feedback.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-sm text-slate-500">No requests match your filters.</p>
          <button onClick={() => { setFilterApp('all'); setFilterStatus('all'); setSearch(''); }} className="mt-2 text-sm text-blue-400 hover:text-blue-300">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 w-16">
                      <button onClick={() => toggleSort('votes')} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                        Votes <span className="text-[10px]">{sortIcon('votes')}</span>
                      </button>
                    </th>
                    <th className="px-4 py-3">Request</th>
                    <th className="px-4 py-3 w-32">App</th>
                    <th className="px-4 py-3 w-32">Status</th>
                    <th className="px-4 py-3 w-36">Source</th>
                    <th className="px-4 py-3 w-28">
                      <button onClick={() => toggleSort('date')} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                        Date <span className="text-[10px]">{sortIcon('date')}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleVote(r.id)}
                          disabled={votingIds.has(r.id)}
                          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-colors group min-w-[40px] disabled:opacity-50"
                          title="Upvote"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 group-hover:text-blue-400 transition-colors"><path d="m18 15-6-6-6 6"/></svg>
                          <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-400">{r.votes}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{r.title}</div>
                        {r.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{r.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-800 px-2 py-1 rounded border border-white/5">{r.app}</span>
                      </td>
                      <td className="px-4 py-3 relative">
                        {editingStatusId === r.id ? (
                          <select
                            autoFocus
                            value={r.status}
                            onChange={e => handleStatusChange(r.id, e.target.value as FeatureStatus)}
                            onBlur={() => setEditingStatusId(null)}
                            className="px-2 py-1 rounded bg-slate-800 border border-blue-500 text-xs focus:outline-none"
                          >
                            {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingStatusId(r.id)}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${statusStyle[r.status]}`}
                            title="Click to change status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[r.status]}`} />
                            {r.status}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 truncate max-w-[140px]">{r.source}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(r => (
              <div key={r.id} className="glass rounded-xl p-4 border border-white/5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-slate-200">{r.title}</h4>
                    {r.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{r.description}</p>}
                  </div>
                  <button
                    onClick={() => handleVote(r.id)}
                    disabled={votingIds.has(r.id)}
                    className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-800 border border-white/5 min-w-[44px] min-h-[44px] justify-center disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="m18 15-6-6-6 6"/></svg>
                    <span className="text-xs font-semibold text-blue-400">{r.votes}</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded border border-white/5">{r.app}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${statusStyle[r.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[r.status]}`} />
                    {r.status}
                  </span>
                  <span className="text-xs text-slate-600 ml-auto">{r.source} &middot; {r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
