import React, { useState, useEffect, useCallback } from 'react';
import { icons } from '../constants';
import { useApps } from '../hooks/useApps';
import { supabase } from '../lib/supabase';

interface VoteRow {
  id: string;
  app_id: string;
  vote: string;
  ip_hash: string;
  reason: string | null;
  created_at: string;
  wt_app_registry: { name: string } | null;
}

interface WaitlistRow {
  id: string;
  app_id: string;
  email: string;
  created_at: string;
  wt_app_registry: { name: string } | null;
}

const statColors: Record<number, { value: string; bg: string; border: string }> = {
  0: { value: `var(--info)`, bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.15)'  },
  1: { value: 'var(--accent)', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.15)'  },
  2: { value: `var(--purple)`, bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
  3: { value: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.15)'  },
};

export default function BITWManager() {
  const { apps } = useApps();
  const publicApps = apps.filter(a => a.appUrl);
  const [tab, setTab] = useState<'showroom' | 'votes' | 'waitlist'>('showroom');
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [votesRes, waitlistRes] = await Promise.all([
      supabase.from('wt_votes').select('*, wt_app_registry(name)'),
      supabase.from('wt_waitlist').select('*, wt_app_registry(name)'),
    ]);

    if (votesRes.error) { setError(`Failed to load votes: ${votesRes.error.message}`); setLoading(false); return; }
    if (waitlistRes.error) { setError(`Failed to load waitlist: ${waitlistRes.error.message}`); setLoading(false); return; }

    setVotes(votesRes.data as VoteRow[]);
    setWaitlist(waitlistRes.data as WaitlistRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const upVotes = votes.filter(v => v.vote === 'up').length;
  const downVotes = votes.filter(v => v.vote === 'down').length;

  const votesByApp: Record<string, number> = {};
  votes.filter(v => v.vote === 'up').forEach(v => {
    const appName = v.wt_app_registry?.name ?? 'Unknown';
    votesByApp[appName] = (votesByApp[appName] || 0) + 1;
  });
  const topVoted = Object.entries(votesByApp).sort((a, b) => b[1] - a[1])[0];

  const stats = [
    { label: 'Total Votes',      value: String(votes.length),         sub: `${upVotes} up · ${downVotes} down` },
    { label: 'Waitlist Signups', value: String(waitlist.length),       sub: `${new Set(waitlist.map(w => w.wt_app_registry?.name).filter(Boolean)).size} apps` },
    { label: 'Top Voted',        value: topVoted?.[0] || '—',         sub: `${topVoted?.[1] || 0} upvotes` },
    { label: 'Public Apps',      value: String(publicApps.length),    sub: 'In showroom' },
  ];

  const exportCsv = () => {
    const header = 'Email,App,Signed Up\n';
    const rows = waitlist.map(w =>
      `"${w.email}","${w.wt_app_registry?.name ?? 'Unknown'}","${new Date(w.created_at).toLocaleDateString()}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waitlist-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'showroom', label: 'Public Showroom' },
    { id: 'votes',    label: `Votes (${votes.length})` },
    { id: 'waitlist', label: `Waitlist (${waitlist.length})` },
  ];

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>// bitw</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Build In The Wild</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 12 }}>
          loading data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>// bitw</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Build In The Wild</h2>
        </div>
        <div className="terminal-card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>// error: failed to load data</div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</p>
          <button onClick={fetchData} style={{ padding: '8px 16px', background: 'var(--accent)', color: 'var(--bg-primary)', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            $ retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>// bitw</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Build In The Wild</h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Manage the public showcase, votes, and waitlist signups.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {stats.map((s, i) => {
          const c = statColors[i] || statColors[0];
          return (
            <div key={s.label} className="terminal-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: c.value, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'showroom' | 'votes' | 'waitlist')}
            style={{
              padding: '8px 20px',
              fontSize: 12,
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-dim)',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              marginBottom: -1,
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'; }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Showroom Tab */}
      {tab === 'showroom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {publicApps.length === 0 ? (
            <div className="terminal-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              // no public apps yet — apps with a public URL will appear here
            </div>
          ) : (
            <>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Drag items to reorder priority</div>
              {publicApps.map((app) => (
                <div
                  key={app.name}
                  className="terminal-card"
                  style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color 0.15s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
                >
                  <div style={{ color: 'var(--text-faint)', cursor: 'move', flexShrink: 0 }}>
                    <icons.grid />
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: 4, background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {app.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{app.name}</span>
                      <span className={`badge-${app.status === 'live' ? 'live' : app.status === 'beta' ? 'beta' : 'inactive'}`}>{app.status}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>
                    <div>{app.users} users</div>
                    <div style={{ marginTop: 2, color: 'var(--accent)' }}>{votesByApp[app.name] || 0} ▲</div>
                  </div>
                  {app.appUrl && (
                    <a href={app.appUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}>
                      <icons.externalLink />
                    </a>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Votes Tab */}
      {tab === 'votes' && votes.length === 0 && (
        <div className="terminal-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          // no votes yet — votes from the public showroom will appear here
        </div>
      )}
      {tab === 'votes' && votes.length > 0 && (
        <div className="terminal-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="terminal-table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)' }}>
                  <th style={{ textAlign: 'left' }}>APP</th>
                  <th style={{ textAlign: 'left' }}>VOTE</th>
                  <th style={{ textAlign: 'left' }}>REASON</th>
                  <th style={{ textAlign: 'left' }}>DATE</th>
                </tr>
              </thead>
              <tbody>
                {votes.map(v => (
                  <tr key={v.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v.wt_app_registry?.name ?? 'Unknown'}</td>
                    <td>
                      <span style={v.vote === 'up'
                        ? { color: 'var(--accent)', fontSize: 12, fontWeight: 600 }
                        : { color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>
                        {v.vote === 'up' ? '▲ up' : '▼ down'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-dim)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.reason || <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>No reason given</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(v.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Waitlist Tab */}
      {tab === 'waitlist' && waitlist.length === 0 && (
        <div className="terminal-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          // no signups yet — waitlist signups will appear here when people join
        </div>
      )}
      {tab === 'waitlist' && waitlist.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={exportCsv}
              style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--accent)', borderRadius: 4, color: 'var(--accent)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <icons.externalLink /> Export CSV
            </button>
          </div>
          <div className="terminal-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="terminal-table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 400 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)' }}>
                    <th style={{ textAlign: 'left' }}>EMAIL</th>
                    <th style={{ textAlign: 'left' }}>APP</th>
                    <th style={{ textAlign: 'left' }}>SIGNED UP</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map(w => (
                    <tr key={w.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{w.email}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{w.wt_app_registry?.name ?? 'Unknown'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
