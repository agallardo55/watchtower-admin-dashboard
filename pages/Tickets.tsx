import React, { useState } from 'react';
import { icons } from '../constants';

interface Ticket {
  id: string;
  title: string;
  app: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
  category: string;
  aiSummary: string;
  feedbackMessage: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const mockTickets: Ticket[] = [
  { id: '1', title: 'Stripe checkout returns 500 on annual plan', app: 'SalesLogHQ', priority: 'critical', status: 'open', category: 'Billing', aiSummary: 'Stripe webhook failing for annual plan tier. Price ID mismatch between sl_plans and Stripe Dashboard. Likely caused by test vs live mode key confusion.', feedbackMessage: 'I tried to subscribe to the annual plan but got a server error after clicking Pay. Monthly works fine.', tags: ['stripe', 'checkout', 'pricing'], createdAt: '2026-02-14T08:30:00Z', updatedAt: '2026-02-14T08:30:00Z' },
  { id: '2', title: 'VIN decoder returns wrong trim for 2024 Tacoma', app: 'BuybidHQ', priority: 'high', status: 'open', category: 'Data', aiSummary: 'CarAPI returns incorrect trim level for certain Toyota VINs. NHTSA fallback also lacks trim data. May need to add a manual override field.', feedbackMessage: 'Entered VIN for a 2024 Tacoma TRD Pro and it came back as SR5. Wrong trim entirely.', tags: ['vin', 'carapi', 'toyota'], createdAt: '2026-02-14T07:15:00Z', updatedAt: '2026-02-14T07:15:00Z' },
  { id: '3', title: 'Camera permission denied on iOS 17.3', app: 'Demolight', priority: 'high', status: 'in_progress', category: 'Mobile', aiSummary: 'iOS 17.3 changed camera permission flow. App requests permission but iOS shows a blank dialog. Likely needs NSCameraUsageDescription update in Info.plist.', feedbackMessage: 'Camera just shows black screen on my iPhone 15. Android works fine.', tags: ['ios', 'camera', 'permissions'], createdAt: '2026-02-13T16:00:00Z', updatedAt: '2026-02-14T09:00:00Z' },
  { id: '4', title: 'Voting widget not persisting votes', app: 'Build In The Wild', priority: 'medium', status: 'open', category: 'Feature', aiSummary: 'Voting widget currently logs to console only. Needs wiring to wt_votes table via Supabase client or edge function.', feedbackMessage: 'I clicked thumbs up on SalesLogHQ but when I refresh the page it doesn\'t show my vote.', tags: ['voting', 'supabase', 'persistence'], createdAt: '2026-02-13T14:20:00Z', updatedAt: '2026-02-13T14:20:00Z' },
  { id: '5', title: 'Demo mode shows stale data after login', app: 'SalesLogHQ', priority: 'medium', status: 'open', category: 'Auth', aiSummary: 'When user logs into real account after using demo mode, some demo data persists in state. DemoContext cleanup needed on auth state change.', feedbackMessage: 'Played with the demo first, then created an account. Still seeing the fake dealership name in the header.', tags: ['demo-mode', 'auth', 'state'], createdAt: '2026-02-13T11:00:00Z', updatedAt: '2026-02-13T11:00:00Z' },
  { id: '6', title: 'Commission tracker rounding error on splits', app: 'SalesLogHQ', priority: 'low', status: 'open', category: 'Calculation', aiSummary: 'Split commission calculations show $0.01 discrepancy on odd amounts due to floating point. Should use integer cents math.', feedbackMessage: 'My 50/50 split on a $1,501 deal shows $750.51 and $750.50. Penny discrepancy.', tags: ['money', 'rounding', 'splits'], createdAt: '2026-02-12T09:30:00Z', updatedAt: '2026-02-12T09:30:00Z' },
  { id: '7', title: 'Bid notification email has wrong vehicle photo', app: 'BuybidHQ', priority: 'medium', status: 'resolved', category: 'Email', aiSummary: 'Email template pulls first photo from vehicle_photos array, but array order isn\'t guaranteed. Should use is_primary flag or sort by position.', feedbackMessage: 'Got a bid notification but the car photo was of a completely different vehicle than what I bid on.', tags: ['email', 'photos', 'resend'], createdAt: '2026-02-11T15:00:00Z', updatedAt: '2026-02-13T10:00:00Z' },
  { id: '8', title: 'Waitlist form accepts invalid emails', app: 'Build In The Wild', priority: 'low', status: 'open', category: 'Validation', aiSummary: 'Email input on waitlist form only checks for @ symbol. Needs proper regex validation and blur-on-validate pattern.', feedbackMessage: 'I accidentally typed "test@" without a domain and it still submitted.', tags: ['validation', 'email', 'forms'], createdAt: '2026-02-11T12:00:00Z', updatedAt: '2026-02-11T12:00:00Z' },
  { id: '9', title: 'Leaderboard not updating in real-time', app: 'SalesboardHQ', priority: 'medium', status: 'in_progress', category: 'Performance', aiSummary: 'Supabase realtime subscription drops after ~30 min idle. Need to implement reconnection logic or polling fallback.', feedbackMessage: 'Board freezes after lunch break. Have to refresh to see updated numbers.', tags: ['realtime', 'supabase', 'websocket'], createdAt: '2026-02-10T14:00:00Z', updatedAt: '2026-02-13T16:00:00Z' },
  { id: '10', title: 'Test drive timer doesn\'t stop on app background', app: 'Demolight', priority: 'high', status: 'open', category: 'Mobile', aiSummary: 'Timer component uses setInterval which pauses when app is backgrounded on iOS. Need to use absolute timestamps and calculate elapsed on foreground.', feedbackMessage: 'Started a test drive timer, locked my phone for 10 minutes. Timer only shows 2 minutes when I come back.', tags: ['timer', 'background', 'ios'], createdAt: '2026-02-10T11:00:00Z', updatedAt: '2026-02-10T11:00:00Z' },
  { id: '11', title: 'PDF export cuts off vehicle condition notes', app: 'BuybidHQ', priority: 'low', status: 'closed', category: 'Export', aiSummary: 'Long condition notes overflow PDF page boundary. Need page break logic or text truncation with "see full report" link.', feedbackMessage: 'Exported a bid sheet and half the condition notes are missing on the printout.', tags: ['pdf', 'export', 'overflow'], createdAt: '2026-02-09T09:00:00Z', updatedAt: '2026-02-12T14:00:00Z' },
  { id: '12', title: 'Mobile nav hamburger menu overlaps header on Android', app: 'SalesLogHQ', priority: 'low', status: 'open', category: 'UI', aiSummary: 'Hamburger menu z-index conflicts with sticky header on Android Chrome. Need z-index audit on mobile breakpoints.', feedbackMessage: 'On my Galaxy S24 the menu button is behind the logo. Can\'t tap it.', tags: ['mobile', 'android', 'z-index'], createdAt: '2026-02-08T16:00:00Z', updatedAt: '2026-02-08T16:00:00Z' },
];

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

const allApps = [...new Set(mockTickets.map(t => t.app))];

export default function Tickets() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [appFilter, setAppFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);

  const filtered = mockTickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (appFilter !== 'all' && t.app !== appFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.app.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openCount = mockTickets.filter(t => t.status === 'open').length;
  const criticalCount = mockTickets.filter(t => t.priority === 'critical' && t.status !== 'closed' && t.status !== 'resolved').length;
  const resolvedToday = mockTickets.filter(t => t.status === 'resolved' && t.updatedAt.startsWith('2026-02-14')).length;
  const feedbackToday = mockTickets.filter(t => t.createdAt.startsWith('2026-02-14')).length;

  const stats = [
    { label: 'Open Tickets', value: openCount, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: 'mail' },
    { label: 'Critical', value: criticalCount, color: 'text-red-400', bg: 'bg-red-500/10', icon: 'activity' },
    { label: 'Resolved Today', value: resolvedToday, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: 'archive' },
    { label: 'New Feedback', value: feedbackToday, color: 'text-purple-400', bg: 'bg-purple-500/10', icon: 'bell' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tickets</h2>
        <p className="text-slate-500 mt-1">Cross-app feedback and AI-triaged issues.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = (icons as any)[s.icon];
          return (
            <div key={s.label} className="glass p-5 rounded-xl">
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

      <div className="flex gap-6">
        {/* Table */}
        <div className={`glass rounded-xl overflow-hidden flex-1 transition-all ${selected ? 'max-w-[60%]' : ''}`}>
          <table className="w-full text-sm">
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
                  <td className="px-4 py-3 text-slate-400">{t.app}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[t.priority]}`}>{t.priority}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[t.status]}`}>{statusLabels[t.status]}</span></td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{t.category}</td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No tickets match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-[400px] glass rounded-xl p-6 space-y-5 animate-in slide-in-from-right">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{selected.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{selected.app} · {selected.category}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
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

            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block">🤖 AI Summary</label>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 rounded-lg p-3 border border-white/5">{selected.aiSummary}</p>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block">💬 Original Feedback</label>
              <p className="text-sm text-slate-400 leading-relaxed italic">"{selected.feedbackMessage}"</p>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {selected.tags.map(tag => (
                  <span key={tag} className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-md border border-white/5">{tag}</span>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block">Timeline</label>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  <span>Created {new Date(selected.createdAt).toLocaleString()}</span>
                </div>
                {selected.updatedAt !== selected.createdAt && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    <span>Updated {new Date(selected.updatedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Update Status</button>
              <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/5">Assign</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
