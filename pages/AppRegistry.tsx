
import React, { useState } from 'react';
import { apps, icons } from '../constants';

export default function AppRegistry() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">App Registry</h2>
          <p className="text-slate-500 mt-1">Manage your complete portfolio of AI-incubated applications.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg flex items-center gap-2"
        >
          <icons.grid className="w-4 h-4" />
          Register New App
        </button>
      </div>

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
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      app.status === 'live' ? 'bg-emerald-500/10 text-emerald-500' :
                      app.status === 'beta' ? 'bg-yellow-500/10 text-yellow-500' :
                      app.status === 'building' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
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
              <button className="flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors border border-white/5">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border-white/10 animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Register New App</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <form className="p-6 space-y-5" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">App Name</label>
                  <input type="text" placeholder="e.g. My Great App" className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <select className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
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
                <textarea rows={3} placeholder="What does this app do?" className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Schema Prefix</label>
                  <input type="text" placeholder="e.g. app_" className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option>Idea</option>
                    <option>Building</option>
                    <option>Beta</option>
                    <option>Live</option>
                    <option>Paused</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">Register App</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
