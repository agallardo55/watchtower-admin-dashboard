
import React, { useState, useRef } from 'react';
import { useApps } from '../hooks/useApps';
import { updateApp, createApp, AppFormData, RoadmapItem, AppEntryWithMeta } from '../services/apps';
import { supabase } from '../lib/supabase';

interface PipelineStageConfig {
  stage: string;
  key: string;
  color: string;
}

const stageConfigs: PipelineStageConfig[] = [
  { stage: 'Idea', key: 'idea', color: 'slate' },
  { stage: 'Spec', key: 'spec', color: 'purple' },
  { stage: 'Dev', key: 'dev', color: 'blue' },
  { stage: 'Wired', key: 'wired', color: 'yellow' },
  { stage: 'QA', key: 'qa', color: 'orange' },
  { stage: 'Live', key: 'live', color: 'emerald' },
  { stage: 'Marketing', key: 'marketing', color: 'pink' },
];

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  slate:   { border: 'border-slate-500',   bg: 'bg-slate-500/10',   text: 'text-slate-400' },
  purple:  { border: 'border-purple-500',  bg: 'bg-purple-500/10',  text: 'text-purple-400' },
  blue:    { border: 'border-blue-500',    bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  yellow:  { border: 'border-yellow-500',  bg: 'bg-yellow-500/10',  text: 'text-yellow-400' },
  orange:  { border: 'border-orange-500',  bg: 'bg-orange-500/10',  text: 'text-orange-400' },
  emerald: { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  pink:    { border: 'border-pink-500',    bg: 'bg-pink-500/10',    text: 'text-pink-400' },
};

const statusOptions = ['idea', 'spec', 'building', 'beta', 'live', 'archived'];
const categoryOptions = ['SaaS', 'Internal Tool', 'Chrome Extension', 'AI Agent', 'Other'];

function emptyFormData(): AppFormData {
  return {
    name: '',
    description: '',
    status: 'idea',
    category: '',
    icon_emoji: '',
    icon_url: '',
    schema_prefix: '',
    supabase_project_id: '',
    graduation_stage: 'idea',
    pipeline_note: '',
    icon_url: '',
    app_url: '',
    repo_url: '',
    overview: '',
    target_users: [],
    roadmap: [],
    screenshots: [],
  };
}

function appToFormData(app: AppEntryWithMeta): AppFormData {
  return {
    name: app.name,
    description: app.description,
    status: app.dbStatus,
    category: app.category,
    icon_emoji: app.iconEmoji,
    schema_prefix: app.schemaPrefix,
    supabase_project_id: app.supabaseProjectId,
    graduation_stage: app.graduationStage || 'idea',
    pipeline_note: app.pipelineNote || '',
    icon_url: app.iconUrl,
    app_url: app.appUrl,
    repo_url: app.repoUrl,
    overview: app.overview,
    target_users: [...app.targetUsers],
    roadmap: app.roadmap.map(r => ({ ...r })),
    screenshots: [...app.screenshots],
  };
}

// ─── Tag Input ───────────────────────────────────────────────
function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full border border-blue-500/20">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((_, j) => j !== i))} className="hover:text-red-400 transition-colors">&times;</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
        onBlur={addTag}
        placeholder={placeholder}
        className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
      />
    </div>
  );
}

// ─── Roadmap Editor ──────────────────────────────────────────
function RoadmapEditor({ items, onChange }: { items: RoadmapItem[]; onChange: (r: RoadmapItem[]) => void }) {
  const addItem = () => onChange([...items, { text: '', done: false }]);
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, patch: Partial<RoadmapItem>) => {
    onChange(items.map((item, i) => i === idx ? { ...item, ...patch } : item));
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={item.done}
            onChange={e => updateItem(i, { done: e.target.checked })}
            className="w-4 h-4 rounded border-white/20 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <input
            type="text"
            value={item.text}
            onChange={e => updateItem(i, { text: e.target.value })}
            placeholder="Feature description..."
            className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
          />
          <button type="button" onClick={() => removeItem(i)} className="text-slate-600 hover:text-red-400 transition-colors text-lg">&times;</button>
        </div>
      ))}
      <button type="button" onClick={addItem} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
        + Add roadmap item
      </button>
    </div>
  );
}

// ─── Screenshot URL List ─────────────────────────────────────
function ScreenshotList({ urls, onChange }: { urls: string[]; onChange: (u: string[]) => void }) {
  const [input, setInput] = useState('');

  const addUrl = () => {
    const val = input.trim();
    if (val && !urls.includes(val)) {
      onChange([...urls, val]);
    }
    setInput('');
  };

  return (
    <div className="space-y-2">
      {urls.map((url, i) => (
        <div key={i} className="flex items-center gap-2">
          <img src={url} alt="" className="w-16 h-10 object-cover rounded border border-white/10 bg-slate-900" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span className="flex-1 text-xs text-slate-400 truncate">{url}</span>
          <button type="button" onClick={() => onChange(urls.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-400 transition-colors text-lg">&times;</button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          placeholder="https://...png"
          className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
        />
        <button type="button" onClick={addUrl} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300 transition-colors">
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Icon Upload ─────────────────────────────────────────────
function IconUpload({ url, appName, onUploaded, onRemoved }: { url: string; appName: string; onUploaded: (url: string) => void; onRemoved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB');
      return;
    }

    setUploading(true);
    setError(null);

    const ext = file.name.split('.').pop() || 'png';
    const slug = (appName || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const path = `${slug}-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('app-icons')
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('app-icons')
      .getPublicUrl(path);

    onUploaded(urlData.publicUrl);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">App Icon</label>
      <div className="flex items-start gap-4">
        {/* Preview / Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-white/10 bg-slate-900 flex items-center justify-center cursor-pointer hover:border-blue-500/40 transition-colors flex-shrink-0 overflow-hidden"
        >
          {uploading ? (
            <div className="text-xs text-blue-400 animate-pulse">Uploading...</div>
          ) : url ? (
            <img src={url} alt="" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              <span className="text-[10px] text-slate-600 mt-1 block">Upload</span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
          >
            {url ? 'Replace Image' : 'Choose File'}
          </button>
          {url && (
            <button
              type="button"
              onClick={onRemoved}
              className="ml-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-medium text-red-400 transition-colors"
            >
              Remove
            </button>
          )}
          <p className="text-[10px] text-slate-600">PNG, JPG, SVG. Max 2MB. Drag & drop or click.</p>
          {error && <p className="text-[10px] text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── App Form Modal ──────────────────────────────────────────
function AppFormModal({ app, onClose, onSaved }: { app: AppEntryWithMeta | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = app !== null;
  const [form, setForm] = useState<AppFormData>(app ? appToFormData(app) : emptyFormData());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = <K extends keyof AppFormData>(key: K, value: AppFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setSaveError('Name is required');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (isEdit && app) {
        await updateApp(app.id, form);
      } else {
        await createApp(form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    }
    setSaving(false);
  };

  const inputCls = "w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600";
  const labelCls = "text-xs font-bold text-slate-500 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border-white/10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {isEdit && (
              app.iconUrl
                ? <img src={app.iconUrl} alt="" className="w-10 h-10 rounded-lg border border-white/10 bg-slate-900 object-contain" />
                : <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-lg text-slate-500">{app.name.charAt(0)}</div>
            )}
            <div>
              <h3 className="text-lg font-bold">{isEdit ? app.name : 'Add New App'}</h3>
              <p className="text-xs text-slate-500">{isEdit ? 'Edit app details and BITW card data' : 'Register a new app in Watchtower'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* ── Core Fields ── */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className={labelCls}>Name *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="My App" className={inputCls} />
            </div>

            {/* Icon / Logo Upload */}
            <IconUpload
              url={form.icon_url}
              appName={form.name}
              onUploaded={(url) => set('icon_url', url)}
              onRemoved={() => set('icon_url', '')}
            />

            <div className="space-y-2">
              <label className={labelCls}>Description</label>
              <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description for cards..." className={inputCls} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className={labelCls}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                  {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                  <option value="">Select...</option>
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Stage</label>
                <select value={form.graduation_stage} onChange={e => set('graduation_stage', e.target.value)} className={inputCls}>
                  {stageConfigs.map(s => <option key={s.key} value={s.key}>{s.stage}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelCls}>Schema Prefix</label>
                <input type="text" value={form.schema_prefix} onChange={e => set('schema_prefix', e.target.value)} placeholder="sbhq_" className={inputCls} />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Supabase Project ID</label>
                <input type="text" value={form.supabase_project_id} onChange={e => set('supabase_project_id', e.target.value)} placeholder="abc123..." className={inputCls} />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Pipeline Note</label>
              <textarea rows={3} value={form.pipeline_note} onChange={e => set('pipeline_note', e.target.value)} placeholder="Context, blockers, next steps..." className={inputCls + ' resize-none'} />
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-white/5 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">BITW Card Data</h4>
          </div>

          {/* ── BITW Fields ── */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelCls}>App URL</label>
                <input type="text" value={form.app_url} onChange={e => set('app_url', e.target.value)} placeholder="https://myapp.com" className={inputCls} />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Repo URL</label>
                <input type="text" value={form.repo_url} onChange={e => set('repo_url', e.target.value)} placeholder="https://github.com/org/repo" className={inputCls} />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Overview</label>
              <textarea rows={4} value={form.overview} onChange={e => set('overview', e.target.value)} placeholder="Detailed description shown in the app modal..." className={inputCls + ' resize-none'} />
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Who It's For</label>
              <TagInput tags={form.target_users} onChange={t => set('target_users', t)} placeholder="Type a role and press Enter..." />
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Roadmap / What's Coming Next</label>
              <RoadmapEditor items={form.roadmap} onChange={r => set('roadmap', r)} />
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Screenshots</label>
              <ScreenshotList urls={form.screenshots} onChange={u => set('screenshots', u)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex-shrink-0">
          {saveError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
              {saveError}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add App'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function DevelopmentOverview() {
  const { apps, loading, error: fetchError, refetch } = useApps();
  const [editingApp, setEditingApp] = useState<AppEntryWithMeta | null>(null);
  const [showModal, setShowModal] = useState(false);

  const openAdd = () => {
    setEditingApp(null);
    setShowModal(true);
  };

  const openEdit = (app: AppEntryWithMeta) => {
    setEditingApp(app);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingApp(null);
  };

  // Group apps by graduation_stage
  const groupedApps: Record<string, AppEntryWithMeta[]> = {};
  for (const app of apps) {
    const key = app.graduationStage || 'idea';
    if (!groupedApps[key]) groupedApps[key] = [];
    groupedApps[key].push(app);
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
        <div>
          <div className="h-8 bg-slate-800 rounded w-64 mb-2" />
          <div className="h-4 bg-slate-800 rounded w-96" />
        </div>
        <div className="glass rounded-xl p-6">
          <div className="flex gap-4">
            {[1,2,3,4].map(i => <div key={i} className="flex-1 h-64 bg-slate-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError && apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Failed to load apps</h3>
        <p className="text-sm text-slate-500 mb-6">{fetchError}</p>
        <button onClick={refetch} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Development Overview</h2>
          <p className="text-slate-500 mt-1">Portfolio-wide development metrics and readiness.</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add App
        </button>
      </div>

      {/* App Pipeline Board */}
      <div className="glass rounded-xl p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-lg">App Pipeline</h3>
          <p className="text-sm text-slate-500">
            Development lifecycle — click cards to edit
            {loading && <span className="ml-2 text-blue-400 animate-pulse">Loading...</span>}
          </p>
        </div>
        <div className="overflow-x-auto lg:overflow-x-visible">
          <div className="flex gap-4 min-h-[500px] w-full lg:min-w-0" style={{ minWidth: 'max(100%, 1080px)' }}>
            {stageConfigs.map(({ stage, key, color }) => {
              const c = colorMap[color] || colorMap.slate;
              const stageApps = groupedApps[key] || [];
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
                        onClick={() => openEdit(app)}
                        className="bg-slate-800/80 border border-white/5 rounded-xl p-4 hover:border-white/15 transition-all cursor-pointer shadow-lg shadow-black/20 min-h-[100px]"
                      >
                        <div className="flex items-center gap-2">
                          {app.iconUrl
                            ? <img src={app.iconUrl} alt="" className="w-7 h-7 rounded-md border border-white/10 bg-slate-900 object-contain flex-shrink-0" />
                            : <div className="w-7 h-7 rounded-md bg-slate-700 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">{app.name.charAt(0)}</div>
                          }
                          <span className="text-sm font-semibold">{app.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-3">{app.pipelineNote || app.description}</p>
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

      {/* Modal */}
      {showModal && (
        <AppFormModal
          app={editingApp}
          onClose={closeModal}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
