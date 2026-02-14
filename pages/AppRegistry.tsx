
import React, { useState } from 'react';
import { apps, icons, graduationStages } from '../constants';
import { AppEntry } from '../types';

// ── Status badge helper ────────────────────────────────────────────
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    live: 'bg-emerald-500/10 text-emerald-500',
    beta: 'bg-yellow-500/10 text-yellow-500',
    idea: 'bg-slate-500/10 text-slate-500',
    paused: 'bg-orange-500/10 text-orange-500',
  };
  return map[status] || 'bg-slate-500/10 text-slate-500';
};

// ── Tab definitions ────────────────────────────────────────────────
const tabs = [
  { id: 'registry', label: 'Registry' },
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'showcase', label: 'Showcase' },
];

// ════════════════════════════════════════════════════════════════════
// Component
// ════════════════════════════════════════════════════════════════════
export default function AppRegistry() {
  const [activeTab, setActiveTab] = useState('registry');

  // ── Registry state ─────────────────────────────────────────────
  const [editingApp, setEditingApp] = useState<AppEntry | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [newApp, setNewApp] = useState<Partial<AppEntry>>({
    name: '', icon: '', status: 'idea', db: 'Watchtower', users: 0, category: 'Sales', description: '', schemaPrefix: '', url: null,
  });

  // ── Showcase data ──────────────────────────────────────────────
  const publicApps = apps.filter(a => a.url);

  // ════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Apps</h2>
        <p className="text-slate-500 mt-1">Manage your portfolio of AI-incubated applications.</p>
      </div>

      {/* Tab bar + action buttons row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right-aligned action buttons depending on tab */}
        {activeTab === 'registry' && (
          <button
            onClick={() => setShowRegister(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Register New App
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* REGISTRY TAB                                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'registry' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {apps.map((app) => (
            <div key={app.name} className="glass rounded-xl p-6 flex flex-col group hover:border-blue-500/30 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform shadow-inner">
                    {app.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{app.name}</h3>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${statusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">{app.category}</span>
                  </div>
                </div>
                <button className="text-slate-500 hover:text-slate-200"><icons.more /></button>
              </div>

              <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-2 leading-relaxed italic">
                "{app.description || 'No description provided yet.'}"
              </p>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Database</p>
                    <p className="text-xs font-medium truncate" title={app.db}>{app.db}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Schema Prefix</p>
                    <p className="text-xs font-mono text-blue-400">{app.schemaPrefix || 'watchtower_'}*</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px]">Tables</span>
                      <span>{app.tableCount || 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px]">Users</span>
                      <span>{app.users}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-slate-500 text-[10px]">Updated</span>
                    <span>{app.lastActivity}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setEditingApp({ ...app })}
                  className="flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors border border-white/5"
                >
                  <icons.edit className="w-3.5 h-3.5" />
                  Edit App
                </button>
                {app.url ? (
                  <a href={app.url} target="_blank" className="flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg">
                    <icons.externalLink className="w-3.5 h-3.5" />
                    Open App
                  </a>
                ) : (
                  <button className="flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-slate-800 text-slate-500 rounded-lg cursor-not-allowed border border-white/5">
                    No URL
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit App Modal ─────────────────────────────────────── */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border-white/10">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-2xl">
                  {editingApp.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">Edit App</h3>
                  <p className="text-xs text-slate-500">{editingApp.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingApp(null)} className="text-slate-500 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <form className="p-6 space-y-5" onSubmit={(e) => { e.preventDefault(); setEditingApp(null); }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">App Name</label>
                  <input type="text" value={editingApp.name} onChange={(e) => setEditingApp({ ...editingApp, name: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <select value={editingApp.category} onChange={(e) => setEditingApp({ ...editingApp, category: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option>Sales</option>
                    <option>AI</option>
                    <option>Operations</option>
                    <option>Finance</option>
                    <option>Marketing</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <textarea rows={3} value={editingApp.description || ''} onChange={(e) => setEditingApp({ ...editingApp, description: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Schema Prefix</label>
                  <input type="text" value={editingApp.schemaPrefix || ''} onChange={(e) => setEditingApp({ ...editingApp, schemaPrefix: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select value={editingApp.status} onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value as AppEntry['status'] })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="idea">Idea</option>
                    <option value="beta">Beta</option>
                    <option value="live">Live</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Database</label>
                  <input type="text" value={editingApp.db} onChange={(e) => setEditingApp({ ...editingApp, db: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">URL</label>
                  <input type="url" placeholder="https://..." value={editingApp.url || ''} onChange={(e) => setEditingApp({ ...editingApp, url: e.target.value || null })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600" />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setEditingApp(null)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Register New App Modal ─────────────────────────────── */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border-white/10">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Register New App</h3>
              <button onClick={() => setShowRegister(false)} className="text-slate-500 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <form className="p-6 space-y-5" onSubmit={(e) => { e.preventDefault(); setShowRegister(false); }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">App Name</label>
                  <input type="text" placeholder="e.g. My Great App" value={newApp.name} onChange={e => setNewApp({ ...newApp, name: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <select value={newApp.category} onChange={e => setNewApp({ ...newApp, category: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option>Sales</option>
                    <option>AI</option>
                    <option>Operations</option>
                    <option>Finance</option>
                    <option>Marketing</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Internal Description</label>
                <textarea rows={3} placeholder="What does this app do?" value={newApp.description} onChange={e => setNewApp({ ...newApp, description: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Schema Prefix</label>
                  <input type="text" placeholder="e.g. app_" value={newApp.schemaPrefix} onChange={e => setNewApp({ ...newApp, schemaPrefix: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 font-mono placeholder-slate-600" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select value={newApp.status} onChange={e => setNewApp({ ...newApp, status: e.target.value as AppEntry['status'] })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="idea">Idea</option>
                    <option value="beta">Beta</option>
                    <option value="live">Live</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowRegister(false)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">Register App</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* LIFECYCLE TAB                                             */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'lifecycle' && (
        <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
          {graduationStages.map((column) => (
            <div key={column.stage} className="flex-none w-[320px] flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h3 className="font-bold text-sm tracking-tight">{column.stage}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{column.apps.length} APPS</p>
                </div>
                <button className="p-1 hover:bg-white/5 rounded transition-colors">
                  <icons.more className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <div className="flex-1 bg-slate-900/30 rounded-2xl p-3 border border-white/5 space-y-3 overflow-y-auto custom-scrollbar">
                {column.apps.length === 0 ? (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-slate-700 text-[10px] font-bold uppercase tracking-widest">
                    Empty Stage
                  </div>
                ) : (
                  column.apps.map((appName) => {
                    const app = apps.find(a => a.name === appName);
                    if (!app) return null;
                    return (
                      <div key={appName} className="glass p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-grab active:cursor-grabbing group">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-xl shadow-inner border border-white/5">
                            {app.icon}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-bold text-sm truncate">{app.name}</h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold uppercase tracking-wider">{app.category}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pb-3 border-b border-white/5 mb-3">
                          <div className="flex flex-col">
                            <span className="text-slate-600 text-[9px] uppercase font-bold">Users</span>
                            <span className="text-xs font-semibold">{app.users}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-600 text-[9px] uppercase font-bold">Tables</span>
                            <span className="text-xs font-semibold">{app.tableCount}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-600">Active {app.lastActivity}</span>
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {[1, 2].map(i => (
                              <div key={i} className="w-5 h-5 rounded-full border border-slate-900 bg-slate-800 text-[8px] flex items-center justify-center font-bold">U{i}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SHOWCASE TAB                                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'showcase' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Public Preview List */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Public Showroom</h3>
              <span className="text-xs text-slate-500">Drag items to reorder priority</span>
            </div>

            <div className="space-y-4">
              {publicApps.map((app) => (
                <div key={app.name} className="glass p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors flex items-center gap-5">
                  <div className="cursor-move text-slate-700 hover:text-slate-500 transition-colors">
                    <icons.grid className="w-5 h-5" />
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-2xl">{app.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{app.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold uppercase tracking-wider">Public</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-md">{app.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors border border-white/5">Preview</button>
                    <button className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 rounded-lg text-xs font-semibold transition-colors border border-blue-600/20">Edit Page</button>
                  </div>
                </div>
              ))}

              {/* Hidden Apps */}
              <div className="pt-8 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Incubating (Hidden)</h4>
                {apps.filter(a => !a.url).slice(0, 3).map((app) => (
                  <div key={app.name} className="glass p-5 rounded-xl opacity-60 border border-white/5 hover:border-white/10 transition-colors flex items-center gap-5">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-2xl">{app.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold">{app.name}</h4>
                      <p className="text-xs text-slate-500 truncate max-w-md">{app.description}</p>
                    </div>
                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors border border-white/5">Make Public</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Site Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold">Global Site Settings</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Site Title</label>
                  <input type="text" defaultValue="Build In The Wild" className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hero Headline</label>
                  <input type="text" defaultValue="Building profitable apps out loud." className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Substack URL</label>
                  <input type="text" placeholder="https://..." className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">About Bio</label>
                  <textarea rows={4} defaultValue="I'm a one-person incubator building a portfolio of strategic dealership software. This is my public workspace." className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-blue-500/20">Save Settings</button>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Changelog Manager</h3>
                <button className="text-xs font-bold text-blue-500 hover:text-blue-400">+ Add Entry</button>
              </div>
              <div className="space-y-4">
                {[
                  { app: 'BuybidHQ', date: 'Feb 07', title: 'New VIN Decoding Engine' },
                  { app: 'SalesboardHQ', date: 'Jan 28', title: 'V2 Dashboard Update' },
                ].map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5">
                    <div>
                      <p className="text-xs font-bold">{log.title}</p>
                      <p className="text-[10px] text-slate-500">{log.app} &bull; {log.date}</p>
                    </div>
                    <icons.edit className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-white transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
