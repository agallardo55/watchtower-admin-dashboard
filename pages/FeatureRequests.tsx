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

const statusStyle: Record<FeatureStatus, React.CSSProperties> = {
  'new':         { color: '#3B82F6', background: 'rgba(59,130,246,0.1)',  border: '1px solid rgba(59,130,246,0.2)',  padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' },
  'planned':     { color: '#A78BFA', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' },
  'in-progress': { color: '#F59E0B', background: 'rgba(245,158,11,0.1)',  border: '1px solid rgba(245,158,11,0.2)',  padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' },
  'shipped':     { color: '#4ADE80', background: 'rgba(74,222,128,0.1)',  border: '1px solid rgba(74,222,128,0.2)',  padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' },
  'declined':    { color: '#EF4444', background: 'rgba(239,68,68,0.1)',   border: '1px solid rgba(239,68,68,0.2)',   padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' },
};

const statusDot: Record<FeatureStatus, string> = {
  'new':         '#3B82F6',
  'planned':     '#A78BFA',
  'in-progress': '#F59E0B',
  'shipped':     '#4ADE80',
  'declined':    '#EF4444',
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
      <div className="space-y-6 max-w-7xl mx-auto">
        <div style={{ color: '#444444', fontSize: 12, padding: '40px 0', textAlign: 'center' }}>loading feature requests...</div>
      </div>
    );
  }

  // Error
  if (error && items.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', borderRadius: 4, padding: '10px 14px', fontSize: 13 }}>
          // error: {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ background: '#4ADE80', color: '#000', border: 'none', borderRadius: 4, padding: '6px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Inline error */}
      {error && items.length > 0 && (
        <div
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', borderRadius: 4, padding: '10px 14px', fontSize: 13 }}
          className="flex items-center justify-between"
        >
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ color: '#EF4444', marginLeft: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div style={{ fontSize: 11, color: '#444444', marginBottom: 4 }}>// feature-requests</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e0e0e0', margin: 0 }}>Feature Requests</h1>
          <p style={{ fontSize: 12, color: '#666666', marginTop: 4 }}>
            {items.length} requests across {appNames.length} app{appNames.length !== 1 ? 's' : ''} — sorted by demand
          </p>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          disabled={items.length === 0}
          style={{ background: 'transparent', border: '1px solid #222222', borderRadius: '4px', color: '#666666', fontSize: 12, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', opacity: items.length === 0 ? 0.5 : 1 }}
          className="self-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterApp}
          onChange={e => setFilterApp(e.target.value)}
          style={{ background: '#0d0d0d', border: '1px solid #222222', borderRadius: '4px', color: '#e0e0e0', fontSize: 13, padding: '6px 10px', outline: 'none', fontFamily: 'inherit' }}
        >
          <option value="all">All Apps</option>
          {appNames.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ background: '#0d0d0d', border: '1px solid #222222', borderRadius: '4px', color: '#e0e0e0', fontSize: 13, padding: '6px 10px', outline: 'none', fontFamily: 'inherit' }}
        >
          <option value="all">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search requests..."
          style={{ background: '#0d0d0d', border: '1px solid #222222', borderRadius: '4px', color: '#e0e0e0', fontSize: 13, padding: '6px 10px', outline: 'none', fontFamily: 'inherit', width: 192 }}
        />
        {(filterApp !== 'all' || filterStatus !== 'all' || search) && (
          <button
            onClick={() => { setFilterApp('all'); setFilterStatus('all'); setSearch(''); }}
            style={{ padding: '6px 12px', borderRadius: '4px', fontSize: 12, color: '#666666', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div style={{ background: '#111111', border: '1px solid #222222', borderRadius: '4px', padding: 48, textAlign: 'center', color: '#444444', fontSize: 12 }}>
          // no feature requests
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#111111', border: '1px solid #222222', borderRadius: '4px', padding: 48, textAlign: 'center', color: '#444444', fontSize: 12 }}>
          // no feature requests
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => { setFilterApp('all'); setFilterStatus('all'); setSearch(''); }}
              style={{ fontSize: 13, color: '#4ADE80', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block" style={{ background: '#111111', border: '1px solid #222222', borderRadius: '4px', overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]" style={{ fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ fontSize: 10, fontWeight: 600, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 16px', borderBottom: '1px solid #1a1a1a', textAlign: 'left', background: '#0d0d0d', width: 64 }}>
                      <button
                        onClick={() => toggleSort('votes')}
                        style={{ background: 'transparent', border: 'none', color: sortField === 'votes' ? '#e0e0e0' : '#444444', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}
                      >
                        Votes <span style={{ fontSize: 10 }}>{sortIcon('votes')}</span>
                      </button>
                    </th>
                    <th style={{ fontSize: 10, fontWeight: 600, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 16px', borderBottom: '1px solid #1a1a1a', textAlign: 'left', background: '#0d0d0d' }}>Request</th>
                    <th style={{ fontSize: 10, fontWeight: 600, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 16px', borderBottom: '1px solid #1a1a1a', textAlign: 'left', background: '#0d0d0d', width: 128 }}>App</th>
                    <th style={{ fontSize: 10, fontWeight: 600, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 16px', borderBottom: '1px solid #1a1a1a', textAlign: 'left', background: '#0d0d0d', width: 128 }}>Status</th>
                    <th style={{ fontSize: 10, fontWeight: 600, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 16px', borderBottom: '1px solid #1a1a1a', textAlign: 'left', background: '#0d0d0d', width: 144 }}>Source</th>
                    <th style={{ fontSize: 10, fontWeight: 600, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 16px', borderBottom: '1px solid #1a1a1a', textAlign: 'left', background: '#0d0d0d', width: 112 }}>
                      <button
                        onClick={() => toggleSort('date')}
                        style={{ background: 'transparent', border: 'none', color: sortField === 'date' ? '#e0e0e0' : '#444444', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}
                      >
                        Date <span style={{ fontSize: 10 }}>{sortIcon('date')}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid #1a1a1a' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#111111')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => handleVote(r.id)}
                          disabled={votingIds.has(r.id)}
                          style={{ background: 'transparent', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '4px', color: '#4ADE80', fontSize: 12, padding: '4px 12px', cursor: 'pointer', minWidth: 52, textAlign: 'center', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: votingIds.has(r.id) ? 0.5 : 1 }}
                          title="Upvote"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{r.votes}</span>
                        </button>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 500, color: '#e0e0e0', padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#e0e0e0' }}>{r.title}</div>
                        {r.description && <p style={{ fontSize: 11, color: '#666666', marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{r.description}</p>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#1a1a1a', border: '1px solid #222222', borderRadius: 3, padding: '2px 8px', fontSize: 10, color: '#666666' }}>{r.app}</span>
                      </td>
                      <td style={{ padding: '12px 16px', position: 'relative' }}>
                        {editingStatusId === r.id ? (
                          <select
                            autoFocus
                            value={r.status}
                            onChange={e => handleStatusChange(r.id, e.target.value as FeatureStatus)}
                            onBlur={() => setEditingStatusId(null)}
                            style={{ background: '#0d0d0d', border: '1px solid #4ADE80', borderRadius: '4px', color: '#e0e0e0', fontSize: 11, padding: '2px 6px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingStatusId(r.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', ...statusStyle[r.status] }}
                            title="Click to change status"
                          >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot[r.status], display: 'inline-block', flexShrink: 0 }} />
                            {r.status}
                          </button>
                        )}
                      </td>
                      <td style={{ fontSize: 11, color: '#666666', padding: '12px 16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{r.source}</td>
                      <td style={{ fontSize: 11, color: '#444444', padding: '12px 16px' }}>{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(r => (
              <div key={r.id} style={{ background: '#111111', border: '1px solid #222222', borderRadius: '4px', padding: 16 }}>
                <div className="flex items-start justify-between gap-3" style={{ marginBottom: 8 }}>
                  <div className="flex-1 min-w-0">
                    <h4 style={{ fontSize: 13, fontWeight: 500, color: '#e0e0e0', margin: 0 }}>{r.title}</h4>
                    {r.description && <p style={{ fontSize: 11, color: '#666666', marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.description}</p>}
                  </div>
                  <button
                    onClick={() => handleVote(r.id)}
                    disabled={votingIds.has(r.id)}
                    style={{ background: 'transparent', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '4px', color: '#4ADE80', fontSize: 12, padding: '4px 12px', cursor: 'pointer', minWidth: 52, textAlign: 'center', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: votingIds.has(r.id) ? 0.5 : 1, minHeight: 44, justifyContent: 'center' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#4ADE80' }}>{r.votes}</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span style={{ background: '#1a1a1a', border: '1px solid #222222', borderRadius: 3, padding: '2px 8px', fontSize: 10, color: '#666666' }}>{r.app}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...statusStyle[r.status] }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot[r.status], display: 'inline-block', flexShrink: 0 }} />
                    {r.status}
                  </span>
                  <span style={{ fontSize: 11, color: '#444444', marginLeft: 'auto' }}>{r.source} &middot; {r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
