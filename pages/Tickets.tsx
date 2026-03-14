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

const priorityStyles: Record<string, React.CSSProperties> = {
  critical: { color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  high:     { color: '#F59E0B', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  medium:   { color: '#F59E0B', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  low:      { color: '#666666', background: 'rgba(102,102,102,0.08)', border: '1px solid rgba(102,102,102,0.15)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
};

const statusStyles: Record<string, React.CSSProperties> = {
  open:        { color: '#3B82F6', background: 'rgba(59,130,246,0.08)',  border: '1px solid rgba(59,130,246,0.15)',  padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  in_progress: { color: '#A78BFA', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  resolved:    { color: '#4ADE80', background: 'rgba(74,222,128,0.08)',  border: '1px solid rgba(74,222,128,0.15)',  padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  closed:      { color: '#666666', background: 'rgba(102,102,102,0.08)', border: '1px solid rgba(102,102,102,0.15)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  wont_fix:    { color: '#666666', background: 'rgba(102,102,102,0.06)', border: '1px solid rgba(102,102,102,0.12)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
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

const statKpiColors: Record<string, { value: string; dot: string }> = {
  mail:     { value: '#3B82F6', dot: 'rgba(59,130,246,0.15)' },
  activity: { value: '#EF4444', dot: 'rgba(239,68,68,0.15)' },
  archive:  { value: '#4ADE80', dot: 'rgba(74,222,128,0.15)' },
  bell:     { value: '#A78BFA', dot: 'rgba(167,139,250,0.15)' },
};

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
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

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
    { label: 'Open Tickets',    value: openCount,      icon: 'mail' },
    { label: 'Critical',        value: criticalCount,  icon: 'activity' },
    { label: 'Resolved Today',  value: resolvedToday,  icon: 'archive' },
    { label: 'New Feedback',    value: feedbackToday,  icon: 'bell' },
  ];

  const selectStyle: React.CSSProperties = {
    background: '#0d0d0d',
    border: '1px solid #222222',
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 13,
    color: '#e0e0e0',
    outline: 'none',
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.08em', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>// TICKETS</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#e0e0e0', margin: 0 }}>Tickets</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ width: 28, height: 28, border: '2px solid #222222', borderTopColor: '#4ADE80', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ marginLeft: 12, color: '#666666', fontSize: 13 }}>loading tickets...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.08em', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>// TICKETS</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#e0e0e0', margin: 0 }}>Tickets</h2>
        </div>
        <div className="terminal-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ color: '#EF4444', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, marginBottom: 8 }}>// ERROR: failed to load tickets</div>
          <p style={{ fontSize: 12, color: '#666666', marginBottom: 16 }}>{error}</p>
          <button
            onClick={fetchTickets}
            style={{ background: '#4ADE80', color: '#000', fontWeight: 600, borderRadius: 4, padding: '8px 16px', fontSize: 13, border: 'none', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.08em', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>// TICKETS</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#e0e0e0', margin: 0 }}>Tickets</h2>
        </div>
        <div className="terminal-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ color: '#444444', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, marginBottom: 8 }}>// no tickets yet</div>
          <p style={{ fontSize: 12, color: '#666666' }}>Tickets are created from user feedback via the AI triage system.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div>
        <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.08em', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>// TICKETS</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#e0e0e0', margin: 0 }}>Tickets</h2>
        <p style={{ fontSize: 13, color: '#666666', marginTop: 4 }}>Cross-app feedback and AI-triaged issues.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {stats.map(s => {
          const Icon = (icons as Record<string, React.FC>)[s.icon];
          const kpiColor = statKpiColors[s.icon];
          return (
            <div key={s.label} className="terminal-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 10, color: '#444444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                {s.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: kpiColor.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 28, fontWeight: 700, color: kpiColor.value, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="wont_fix">Won't Fix</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={appFilter} onChange={e => setAppFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Apps</option>
          {allApps.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <icons.search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#444444', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets..."
            style={{ ...selectStyle, width: '100%', boxSizing: 'border-box', paddingLeft: 34 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Mobile Cards */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }} className={`lg-hidden ${selected ? 'hidden' : ''}`}>
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => setSelected(selected?.id === t.id ? null : t)}
              className="terminal-card"
              style={{
                padding: 16,
                cursor: 'pointer',
                ...(selected?.id === t.id
                  ? { background: 'rgba(74,222,128,0.05)', borderLeft: '2px solid #4ADE80' }
                  : {}),
              }}
            >
              <p style={{ fontWeight: 500, fontSize: 13, color: '#e0e0e0', marginBottom: 8 }}>{t.title}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <span style={priorityStyles[t.priority]}>{t.priority}</span>
                <span style={statusStyles[t.status]}>{statusLabels[t.status]}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666666' }}>
                <span>{getAppName(t)}</span>
                <span>{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="terminal-card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ color: '#444444', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>// no tickets found</div>
              <p style={{ fontSize: 12, color: '#666666', marginTop: 8 }}>Try adjusting your filters.</p>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div
          className="terminal-card"
          style={{
            flex: 1,
            overflow: 'hidden',
            ...(selected ? { maxWidth: '60%' } : {}),
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="terminal-table" style={{ width: '100%', fontSize: 13, minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222222', textAlign: 'left' }}>
                  <th style={{ padding: '10px 16px', fontSize: 10, color: '#444444', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Title</th>
                  <th style={{ padding: '10px 16px', fontSize: 10, color: '#444444', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>App</th>
                  <th style={{ padding: '10px 16px', fontSize: 10, color: '#444444', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Priority</th>
                  <th style={{ padding: '10px 16px', fontSize: 10, color: '#444444', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: 10, color: '#444444', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '10px 16px', fontSize: 10, color: '#444444', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(selected?.id === t.id ? null : t)}
                    onMouseEnter={() => setHoveredRow(t.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid #1a1a1a',
                      ...(selected?.id === t.id
                        ? { background: 'rgba(74,222,128,0.05)', borderLeft: '2px solid #4ADE80' }
                        : hoveredRow === t.id
                        ? { background: '#1a1a1a' }
                        : {}),
                    }}
                  >
                    <td style={{ padding: '10px 16px', color: '#e0e0e0', fontWeight: 500, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                    <td style={{ padding: '10px 16px', color: '#666666' }}>{getAppName(t)}</td>
                    <td style={{ padding: '10px 16px' }}><span style={priorityStyles[t.priority]}>{t.priority}</span></td>
                    <td style={{ padding: '10px 16px' }}><span style={statusStyles[t.status]}>{statusLabels[t.status]}</span></td>
                    <td style={{ padding: '10px 16px', color: '#444444' }}>{t.category}</td>
                    <td style={{ padding: '10px 16px', color: '#444444' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: '#444444', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                      // no tickets match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div
            className="terminal-card"
            style={{ width: 400, flexShrink: 0, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e0e0e0', margin: 0 }}>{selected.title}</h3>
                <p style={{ fontSize: 11, color: '#666666', marginTop: 4 }}>{getAppName(selected)} · {selected.category}</p>
              </div>
              <button
                onClick={() => { setSelected(null); setStatusDropdown(false); }}
                style={{ background: 'none', border: 'none', color: '#666666', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#444444', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>Priority</div>
                <span style={priorityStyles[selected.priority]}>{selected.priority}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#444444', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>Status</div>
                <span style={statusStyles[selected.status]}>{statusLabels[selected.status]}</span>
              </div>
            </div>

            {selected.ai_summary && (
              <div>
                <div style={{ fontSize: 9, color: '#444444', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>AI Summary</div>
                <p style={{ fontSize: 12, color: '#e0e0e0', lineHeight: 1.6, background: '#0d0d0d', borderRadius: 4, padding: 12, border: '1px solid #222222', margin: 0 }}>{selected.ai_summary}</p>
              </div>
            )}

            {selected.tags && selected.tags.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: '#444444', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>Tags</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.tags.map(tag => (
                    <span key={tag} style={{ background: '#1a1a1a', color: '#666666', fontSize: 11, padding: '2px 8px', borderRadius: 3, border: '1px solid #222222' }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid #222222', paddingTop: 16 }}>
              <div style={{ fontSize: 9, color: '#444444', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>Timeline</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#666666' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }} />
                  <span>Created {new Date(selected.created_at).toLocaleString()}</span>
                </div>
                {selected.updated_at !== selected.created_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#666666' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#A78BFA', flexShrink: 0 }} />
                    <span>Updated {new Date(selected.updated_at).toLocaleString()}</span>
                  </div>
                )}
                {selected.resolved_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#666666' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
                    <span>Resolved {new Date(selected.resolved_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ position: 'relative', paddingTop: 8 }}>
              {updateError && (
                <p style={{ fontSize: 11, color: '#EF4444', marginBottom: 8 }}>{updateError}</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <button
                    onClick={() => setStatusDropdown(!statusDropdown)}
                    disabled={updating}
                    style={{
                      width: '100%',
                      background: '#4ADE80',
                      color: '#000',
                      fontWeight: 600,
                      borderRadius: 4,
                      padding: '8px 16px',
                      fontSize: 13,
                      border: 'none',
                      cursor: updating ? 'not-allowed' : 'pointer',
                      opacity: updating ? 0.5 : 1,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {updating ? 'Updating...' : 'Update Status'}
                  </button>
                  {statusDropdown && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      marginBottom: 4,
                      width: '100%',
                      background: '#111111',
                      border: '1px solid #222222',
                      borderRadius: 4,
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      zIndex: 10,
                    }}>
                      {statusOptions
                        .filter(opt => opt.value !== selected.status)
                        .map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => updateTicketStatus(selected.id, opt.value)}
                            onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 12px',
                              fontSize: 13,
                              color: '#e0e0e0',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'JetBrains Mono, monospace',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <button
                  style={{
                    background: '#1a1a1a',
                    color: '#e0e0e0',
                    padding: '8px 16px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 500,
                    border: '1px solid #222222',
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
