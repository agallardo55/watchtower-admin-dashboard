
import React from 'react';
import { apps, icons } from '../constants';

const publicApps = apps.filter(a => a.url);

export default function BITWManager() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Build In The Wild Manager</h2>
        <p className="text-slate-500 mt-1">Control visibility and content on the public-facing showcase site.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Public Preview List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Public Showroom</h3>
            <span className="text-xs text-slate-500">Drag items to reorder priority</span>
          </div>
          
          <div className="space-y-4">
            {publicApps.map((app, idx) => (
              <div key={app.name} className="glass p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors flex items-center gap-5">
                <div className="cursor-move text-slate-700 hover:text-slate-500 transition-colors">
                  <icons.grid className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-2xl">
                  {app.icon}
                </div>
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
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-2xl">
                    {app.icon}
                  </div>
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
                <textarea rows={4} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">I'm a one-person incubator building a portfolio of strategic dealership software. This is my public workspace.</textarea>
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
                { app: 'SalesboardHQ', date: 'Jan 28', title: 'V2 Dashboard Update' }
              ].map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5">
                  <div>
                    <p className="text-xs font-bold">{log.title}</p>
                    <p className="text-[10px] text-slate-500">{log.app} • {log.date}</p>
                  </div>
                  <icons.edit className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
