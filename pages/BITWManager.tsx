import React, { useState } from 'react';
import { apps, icons } from '../constants';

const publicApps = apps.filter(a => a.url);

const mockVotes = [
  { id: '1', app: 'SalesLogHQ', vote: 'up' as const, reason: 'Finally a simple sales tracker that doesn\'t require 3 days of training.', createdAt: '2026-02-14T09:15:00Z' },
  { id: '2', app: 'BuybidHQ', vote: 'up' as const, reason: 'Love the VIN decoder integration. Saves so much time.', createdAt: '2026-02-14T08:30:00Z' },
  { id: '3', app: 'Demolight', vote: 'down' as const, reason: 'Needs Android support. Most of our sales team uses Samsung.', createdAt: '2026-02-13T16:00:00Z' },
  { id: '4', app: 'SalesboardHQ', vote: 'up' as const, reason: 'Our team checks this more than their email now.', createdAt: '2026-02-13T14:20:00Z' },
  { id: '5', app: 'SalesLogHQ', vote: 'up' as const, reason: null, createdAt: '2026-02-13T11:00:00Z' },
  { id: '6', app: 'BuybidHQ', vote: 'up' as const, reason: 'Need this in our wholesale department ASAP.', createdAt: '2026-02-12T15:30:00Z' },
  { id: '7', app: 'Demolight', vote: 'up' as const, reason: 'Solves a real problem. We lose track of test drives all the time.', createdAt: '2026-02-12T10:00:00Z' },
  { id: '8', app: 'SalesboardHQ', vote: 'down' as const, reason: 'Would be better with CRM integration.', createdAt: '2026-02-11T14:00:00Z' },
  { id: '9', app: 'SalesLogHQ', vote: 'up' as const, reason: 'Clean UI. My reps would actually use this.', createdAt: '2026-02-11T09:00:00Z' },
  { id: '10', app: 'BuybidHQ', vote: 'up' as const, reason: null, createdAt: '2026-02-10T16:00:00Z' },
];

const mockWaitlist = [
  { id: '1', app: 'SalesLogHQ', email: 'mike.thompson@lakecityauto.com', createdAt: '2026-02-14T08:00:00Z' },
  { id: '2', app: 'BuybidHQ', email: 'sarah.j@northwestmotors.com', createdAt: '2026-02-13T15:30:00Z' },
  { id: '3', app: 'Demolight', email: 'operations@bellevueauto.com', createdAt: '2026-02-13T12:00:00Z' },
  { id: '4', app: 'SalesLogHQ', email: 'jared.k@premiergroup.com', createdAt: '2026-02-12T10:00:00Z' },
  { id: '5', app: 'SalesboardHQ', email: 'lisa.m@soundtoyota.com', createdAt: '2026-02-11T14:00:00Z' },
  { id: '6', app: 'SalesLogHQ', email: 'david.chen@luxuryimports.com', createdAt: '2026-02-10T09:00:00Z' },
];

export default function BITWManager() {
  const [tab, setTab] = useState<'showroom' | 'votes' | 'waitlist'>('showroom');

  const upVotes = mockVotes.filter(v => v.vote === 'up').length;
  const downVotes = mockVotes.filter(v => v.vote === 'down').length;

  // Count votes per app
  const votesByApp: Record<string, number> = {};
  mockVotes.filter(v => v.vote === 'up').forEach(v => {
    votesByApp[v.app] = (votesByApp[v.app] || 0) + 1;
  });
  const topVoted = Object.entries(votesByApp).sort((a, b) => b[1] - a[1])[0];

  const stats = [
    { label: 'Total Votes', value: mockVotes.length, sub: `👍 ${upVotes}  👎 ${downVotes}`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Waitlist Signups', value: mockWaitlist.length, sub: `${new Set(mockWaitlist.map(w => w.app)).size} apps`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Top Voted', value: topVoted?.[0] || '—', sub: `${topVoted?.[1] || 0} upvotes`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Public Apps', value: publicApps.length, sub: 'In showroom', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  const tabs = [
    { id: 'showroom', label: 'Public Showroom' },
    { id: 'votes', label: `Votes (${mockVotes.length})` },
    { id: 'waitlist', label: `Waitlist (${mockWaitlist.length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Build In The Wild</h2>
        <p className="text-slate-500 mt-1">Manage the public showcase, votes, and waitlist signups.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass p-5 rounded-xl">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{s.label}</span>
            <div className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</div>
            <span className="text-xs text-slate-500 mt-1 block">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${tab === t.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
            {t.label}
            {tab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t"></div>}
          </button>
        ))}
      </div>

      {/* Showroom Tab */}
      {tab === 'showroom' && (
        <div className="space-y-4">
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
        </div>
      )}

      {/* Votes Tab */}
      {tab === 'votes' && (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">App</th>
                <th className="px-4 py-3">Vote</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockVotes.map(v => (
                <tr key={v.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-200">{v.app}</td>
                  <td className="px-4 py-3 text-lg">{v.vote === 'up' ? '👍' : '👎'}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[400px] truncate">{v.reason || <span className="text-slate-600 italic">No reason given</span>}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(v.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Waitlist Tab */}
      {tab === 'waitlist' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <icons.externalLink /> Export CSV
            </button>
          </div>
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">App</th>
                  <th className="px-4 py-3">Signed Up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockWaitlist.map(w => (
                  <tr key={w.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">{w.email}</td>
                    <td className="px-4 py-3 text-slate-400">{w.app}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(w.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
