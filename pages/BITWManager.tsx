import React, { useState, useEffect, useCallback } from 'react';
import { apps, icons } from '../constants';
import { supabase } from '../lib/supabase';

const publicApps = apps.filter(a => a.url);

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

export default function BITWManager() {
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

    if (votesRes.error) {
      setError(`Failed to load votes: ${votesRes.error.message}`);
      setLoading(false);
      return;
    }
    if (waitlistRes.error) {
      setError(`Failed to load waitlist: ${waitlistRes.error.message}`);
      setLoading(false);
      return;
    }

    setVotes(votesRes.data as VoteRow[]);
    setWaitlist(waitlistRes.data as WaitlistRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const upVotes = votes.filter(v => v.vote === 'up').length;
  const downVotes = votes.filter(v => v.vote === 'down').length;

  const votesByApp: Record<string, number> = {};
  votes.filter(v => v.vote === 'up').forEach(v => {
    const appName = v.wt_app_registry?.name ?? 'Unknown';
    votesByApp[appName] = (votesByApp[appName] || 0) + 1;
  });
  const topVoted = Object.entries(votesByApp).sort((a, b) => b[1] - a[1])[0];

  const stats = [
    { label: 'Total Votes', value: votes.length, sub: `👍 ${upVotes}  👎 ${downVotes}`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Waitlist Signups', value: waitlist.length, sub: `${new Set(waitlist.map(w => w.wt_app_registry?.name).filter(Boolean)).size} apps`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Top Voted', value: topVoted?.[0] || '—', sub: `${topVoted?.[1] || 0} upvotes`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Public Apps', value: publicApps.length, sub: 'In showroom', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  const tabs = [
    { id: 'showroom', label: 'Public Showroom' },
    { id: 'votes', label: `Votes (${votes.length})` },
    { id: 'waitlist', label: `Waitlist (${waitlist.length})` },
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

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Build In The Wild</h2>
          <p className="text-slate-500 mt-1">Manage the public showcase, votes, and waitlist signups.</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-500 text-sm">Loading data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Build In The Wild</h2>
          <p className="text-slate-500 mt-1">Manage the public showcase, votes, and waitlist signups.</p>
        </div>
        <div className="glass rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Failed to load data</h3>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Build In The Wild</h2>
        <p className="text-slate-500 mt-1">Manage the public showcase, votes, and waitlist signups.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass p-4 lg:p-5 rounded-xl">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{s.label}</span>
            <div className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</div>
            <span className="text-xs text-slate-500 mt-1 block">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as 'showroom' | 'votes' | 'waitlist')} className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${tab === t.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
            {t.label}
            {tab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t"></div>}
          </button>
        ))}
      </div>

      {/* Showroom Tab */}
      {tab === 'showroom' && (
        <div className="space-y-4">
          {publicApps.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">No public apps yet</h3>
              <p className="text-sm text-slate-500">Apps with a public URL will appear here.</p>
            </div>
          ) : (
          <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Drag items to reorder priority</span>
          </div>
          {publicApps.map((app) => (
            <div key={app.name} className="glass p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors flex items-center gap-5">
              <div className="cursor-move text-slate-700 hover:text-slate-500 transition-colors">
                <icons.grid className="w-5 h-5" />
              </div>
              <div className="w-12 h-12 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-2xl">{app.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-100">{app.name}</h4>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{app.status}</span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5 truncate">{app.description}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>{app.users} users</div>
                <div className="mt-1">{votesByApp[app.name] || 0} 👍</div>
              </div>
              {app.url && (
                <a href={app.url} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-blue-400 transition-colors">
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
        <div className="glass rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">👍</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">No votes yet</h3>
          <p className="text-sm text-slate-500">Votes from the public showroom will appear here.</p>
        </div>
      )}
      {tab === 'votes' && votes.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">App</th>
                <th className="px-4 py-3">Vote</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {votes.map(v => (
                <tr key={v.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-200">{v.wt_app_registry?.name ?? 'Unknown'}</td>
                  <td className="px-4 py-3 text-lg">{v.vote === 'up' ? '👍' : '👎'}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[400px] truncate">{v.reason || <span className="text-slate-600 italic">No reason given</span>}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(v.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Waitlist Tab */}
      {tab === 'waitlist' && waitlist.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">No signups yet</h3>
          <p className="text-sm text-slate-500">Waitlist signups will appear here when people join.</p>
        </div>
      )}
      {tab === 'waitlist' && waitlist.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={exportCsv} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <icons.externalLink /> Export CSV
            </button>
          </div>
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">App</th>
                  <th className="px-4 py-3">Signed Up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {waitlist.map(w => (
                  <tr key={w.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">{w.email}</td>
                    <td className="px-4 py-3 text-slate-400">{w.wt_app_registry?.name ?? 'Unknown'}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(w.created_at).toLocaleDateString()}</td>
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
