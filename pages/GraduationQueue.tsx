
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { icons } from '../constants';

const STAGES = ['Idea', 'Building', 'Beta', 'Live', 'Paused'] as const;
type Stage = typeof STAGES[number];

interface AppRegistry {
  name: string;
  status: string;
  icon: string;
  category: string;
  users: number;
}

interface GraduationRecord {
  id: string;
  app_id: string;
  current_stage: string;
  checklist: Record<string, boolean> | null;
  notes: string | null;
  graduated_at: string | null;
  created_at: string;
  updated_at: string;
  wt_app_registry: AppRegistry | null;
}

export default function GraduationQueue() {
  const [records, setRecords] = useState<GraduationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('wt_graduation_queue')
      .select('*, wt_app_registry(name, status, icon, category, users)');

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setRecords((data as GraduationRecord[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleStageChange = async (id: string, newStage: string) => {
    setUpdatingId(id);
    const { error: updateError } = await supabase
      .from('wt_graduation_queue')
      .update({ current_stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      setUpdatingId(null);
      return;
    }

    setRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, current_stage: newStage, updated_at: new Date().toISOString() } : r))
    );
    setUpdatingId(null);
  };

  const grouped: Record<Stage, GraduationRecord[]> = {
    Idea: [],
    Building: [],
    Beta: [],
    Live: [],
    Paused: [],
  };

  for (const record of records) {
    const stage = record.current_stage as Stage;
    if (grouped[stage]) {
      grouped[stage].push(record);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Graduation Queue</h2>
          <p className="text-slate-500 mt-1">Manage the lifecycle of apps as they grow from ideas to dedicated infrastructure.</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-500 text-sm animate-pulse">Loading graduation queue...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Graduation Queue</h2>
          <p className="text-slate-500 mt-1">Manage the lifecycle of apps as they grow from ideas to dedicated infrastructure.</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-red-400 text-sm">Failed to load graduation queue: {error}</p>
            <button
              onClick={fetchRecords}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Graduation Queue</h2>
        <p className="text-slate-500 mt-1">Manage the lifecycle of apps as they grow from ideas to dedicated infrastructure.</p>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {STAGES.map((stage) => {
          const items = grouped[stage];
          return (
            <div key={stage} className="flex-none w-[320px] flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h3 className="font-bold text-sm tracking-tight">{stage}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{items.length} APPS</p>
                </div>
                <button className="p-1 hover:bg-white/5 rounded transition-colors">
                  <icons.more className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <div className="flex-1 bg-slate-900/30 rounded-2xl p-3 border border-white/5 space-y-3 overflow-y-auto custom-scrollbar">
                {items.length === 0 ? (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-slate-700 text-[10px] font-bold uppercase tracking-widest">
                    Empty Stage
                  </div>
                ) : (
                  items.map((record) => {
                    const app = record.wt_app_registry;
                    if (!app) return null;
                    const isUpdating = updatingId === record.id;
                    return (
                      <div key={record.id} className="glass p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-grab active:cursor-grabbing group">
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
                            <span className="text-xs font-semibold">{app.users ?? 0}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-600 text-[9px] uppercase font-bold">Stage</span>
                            <select
                              value={record.current_stage}
                              disabled={isUpdating}
                              onChange={(e) => handleStageChange(record.id, e.target.value)}
                              className="text-xs font-semibold bg-transparent border-none outline-none cursor-pointer text-white disabled:opacity-50 p-0 -ml-0.5"
                            >
                              {STAGES.map((s) => (
                                <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-600">
                            Updated {record.updated_at ? new Date(record.updated_at).toLocaleDateString() : '—'}
                          </span>
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
          );
        })}
      </div>
    </div>
  );
}
