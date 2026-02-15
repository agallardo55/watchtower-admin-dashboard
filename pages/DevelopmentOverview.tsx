
import React, { useState } from 'react';

interface PipelineApp {
  name: string;
  icon: string;
  note: string;
}

interface PipelineStage {
  stage: string;
  color: string;
  apps: PipelineApp[];
}

const initialPipelineStages: PipelineStage[] = [
  {
    stage: 'Idea',
    color: 'slate',
    apps: [
      { name: 'Agentflow', icon: '🤖', note: 'AI workflow automation — needs spec' },
    ],
  },
  {
    stage: 'Spec',
    color: 'purple',
    apps: [
      { name: 'Marbitrage', icon: '💰', note: 'Acquisition intelligence platform. Stitch UI done.' },
      { name: 'Copilot', icon: '🎯', note: 'Chrome extension + web dashboard. Full spec written.' },
    ],
  },
  {
    stage: 'Dev',
    color: 'blue',
    apps: [
      { name: 'Thoth', icon: '🧠', note: 'Calculator MVP built. Needs auth + Stripe.' },
      { name: 'Dealerment', icon: '📄', note: 'SOP platform for dealerships. Schema planned.' },
    ],
  },
  {
    stage: 'Wired',
    color: 'yellow',
    apps: [
      { name: 'BITW', icon: '🏗️', note: 'Voting widget done. Waitlist + feedback need DB wiring.' },
      { name: 'Demolight', icon: '🚗', note: 'Schema applied. Web + RN wired. Needs Stripe.' },
      { name: 'BuybidHQ', icon: '🟡', note: 'Bid lifecycle working. Extension + RN cleaned up.' },
    ],
  },
  {
    stage: 'QA',
    color: 'orange',
    apps: [
      { name: 'SaleslogHQ', icon: '📊', note: 'Blueprint done. Need live Stripe products + deploy.' },
    ],
  },
  {
    stage: 'Live',
    color: 'emerald',
    apps: [
      { name: 'SalesboardHQ', icon: '📈', note: '9 edge functions. Stripe active. SEO needed.' },
    ],
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  slate:   { border: 'border-slate-500',   bg: 'bg-slate-500/10',   text: 'text-slate-400' },
  purple:  { border: 'border-purple-500',  bg: 'bg-purple-500/10',  text: 'text-purple-400' },
  blue:    { border: 'border-blue-500',    bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  yellow:  { border: 'border-yellow-500',  bg: 'bg-yellow-500/10',  text: 'text-yellow-400' },
  orange:  { border: 'border-orange-500',  bg: 'bg-orange-500/10',  text: 'text-orange-400' },
  emerald: { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
};

export default function DevelopmentOverview() {
  const [stages, setStages] = useState<PipelineStage[]>(initialPipelineStages);
  const [editing, setEditing] = useState<{ stage: string; appName: string } | null>(null);
  const [editNote, setEditNote] = useState('');

  const openEdit = (stageName: string, app: PipelineApp) => {
    setEditing({ stage: stageName, appName: app.name });
    setEditNote(app.note);
  };

  const saveNote = () => {
    if (!editing) return;
    setStages(prev =>
      prev.map(s =>
        s.stage === editing.stage
          ? { ...s, apps: s.apps.map(a => a.name === editing.appName ? { ...a, note: editNote } : a) }
          : s
      )
    );
    setEditing(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Development Overview</h2>
        <p className="text-slate-500 mt-1">Portfolio-wide development metrics and readiness.</p>
      </div>

      {/* App Pipeline Board */}
      <div className="glass rounded-xl p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-lg">App Pipeline</h3>
          <p className="text-sm text-slate-500">Development lifecycle — click cards to edit notes</p>
        </div>
        <div className="overflow-x-auto lg:overflow-x-visible">
          <div className="flex gap-4 min-h-[500px] w-full lg:min-w-0" style={{ minWidth: 'max(100%, 1080px)' }}>
            {stages.map(({ stage, color, apps: stageApps }) => {
              const c = colorMap[color] || colorMap.slate;
              return (
                <div key={stage} className="flex-1 min-w-[180px] flex flex-col">
                  {/* Column header */}
                  <div className={`border-t-4 ${c.border} ${c.bg} rounded-t-lg px-4 py-3`}>
                    <span className={`text-sm font-bold ${c.text}`}>{stage}</span>
                    <span className="text-xs text-slate-500 ml-1.5">({stageApps.length})</span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 pt-3 space-y-2.5">
                    {stageApps.length > 0 ? stageApps.map(app => (
                      <div
                        key={app.name}
                        onClick={() => openEdit(stage, app)}
                        className="bg-slate-800/80 border border-white/5 rounded-xl p-4 hover:border-white/15 transition-all cursor-pointer shadow-lg shadow-black/20 min-h-[100px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{app.icon}</span>
                          <span className="text-sm font-semibold">{app.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-3">{app.note}</p>
                      </div>
                    )) : (
                      <div className="border border-dashed border-slate-700 rounded-xl py-8 flex items-center justify-center text-slate-600 text-xs min-h-[100px]">
                        No apps
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Note Modal */}
      {editing && (() => {
        const stageData = stages.find(s => s.stage === editing.stage);
        const appData = stageData?.apps.find(a => a.name === editing.appName);
        if (!appData) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className="glass w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-white/10">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{appData.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold">{appData.name}</h3>
                    <p className="text-xs text-slate-500">{editing.stage} stage</p>
                  </div>
                </div>
                <button onClick={() => setEditing(null)} className="text-slate-500 hover:text-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Note</label>
                  <textarea
                    rows={4}
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600 resize-none"
                    placeholder="Add context, blockers, next steps..."
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setEditing(null)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveNote} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
