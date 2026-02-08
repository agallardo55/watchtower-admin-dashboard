
import React from 'react';
import { graduationStages, apps, icons } from '../constants';

export default function GraduationQueue() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Graduation Queue</h2>
        <p className="text-slate-500 mt-1">Manage the lifecycle of apps as they grow from ideas to dedicated infrastructure.</p>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
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
                           {[1,2].map(i => (
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
    </div>
  );
}
