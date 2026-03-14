
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
  { stage: 'Idea',      key: 'idea',      color: 'slate' },
  { stage: 'Spec',      key: 'spec',      color: 'purple' },
  { stage: 'Dev',       key: 'dev',       color: 'blue' },
  { stage: 'Wired',     key: 'wired',     color: 'yellow' },
  { stage: 'QA',        key: 'qa',        color: 'orange' },
  { stage: 'Live',      key: 'live',      color: 'emerald' },
  { stage: 'Marketing', key: 'marketing', color: 'pink' },
];

const colorMap: Record<string, { borderColor: string; bg: string; text: string }> = {
  slate:   { borderColor: '#555555', bg: 'rgba(85,85,85,0.08)',    text: '#888888' },
  purple:  { borderColor: '#A78BFA', bg: 'rgba(167,139,250,0.08)', text: '#A78BFA' },
  blue:    { borderColor: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  text: '#3B82F6' },
  yellow:  { borderColor: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  text: '#F59E0B' },
  orange:  { borderColor: '#F97316', bg: 'rgba(249,115,22,0.08)',  text: '#F97316' },
  emerald: { borderColor: '#4ADE80', bg: 'rgba(74,222,128,0.08)',  text: '#4ADE80' },
  pink:    { borderColor: '#EC4899', bg: 'rgba(236,72,153,0.08)',  text: '#EC4899' },
};

const statusOptions = ['idea', 'spec', 'building', 'beta', 'live', 'archived'];
const categoryOptions = ['SaaS', 'Internal Tool', 'Chrome Extension', 'AI Agent', 'Other'];

function emptyFormData(): AppFormData {
  return {
    name: '', description: '', status: 'idea', category: '', icon_emoji: '', icon_url: '',
    schema_prefix: '', supabase_project_id: '', graduation_stage: 'idea', pipeline_note: '',
    app_url: '', repo_url: '', overview: '', target_users: [], roadmap: [], screenshots: [],
  };
}

function appToFormData(app: AppEntryWithMeta): AppFormData {
  return {
    name: app.name, description: app.description, status: app.dbStatus, category: app.category,
    icon_emoji: app.iconEmoji, schema_prefix: app.schemaPrefix, supabase_project_id: app.supabaseProjectId,
    graduation_stage: app.graduationStage || 'idea', pipeline_note: app.pipelineNote || '',
    icon_url: app.iconUrl, app_url: app.appUrl, repo_url: app.repoUrl, overview: app.overview,
    target_users: [...app.targetUsers], roadmap: app.roadmap.map(r => ({ ...r })), screenshots: [...app.screenshots],
  };
}

// ─── Shared input styles ─────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%',
  background: '#0d0d0d',
  border: '1px solid #222222',
  borderRadius: '4px',
  padding: '8px 12px',
  fontSize: 13,
  color: '#e0e0e0',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const labelSt: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: '#666666',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  display: 'block',
  marginBottom: 6,
};

function focusGreen(e: React.FocusEvent<HTMLElement>) {
  (e.currentTarget as HTMLElement).style.borderColor = '#4ADE80';
}
function blurGray(e: React.FocusEvent<HTMLElement>) {
  (e.currentTarget as HTMLElement).style.borderColor = '#222222';
}

// ─── Tag Input ───────────────────────────────────────────────
function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const addTag = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tags.map((tag, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 11, padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(59,130,246,0.2)' }}>
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>&times;</button>
          </span>
        ))}
      </div>
      <input type="text" value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
        onBlur={addTag} placeholder={placeholder} style={inputSt}
        onFocus={focusGreen as any} />
    </div>
  );
}

// ─── Roadmap Editor ──────────────────────────────────────────
function RoadmapEditor({ items, onChange }: { items: RoadmapItem[]; onChange: (r: RoadmapItem[]) => void }) {
  const addItem = () => onChange([...items, { text: '', done: false }]);
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, patch: Partial<RoadmapItem>) =>
    onChange(items.map((item, i) => i === idx ? { ...item, ...patch } : item));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={item.done} onChange={e => updateItem(i, { done: e.target.checked })}
            style={{ width: 14, height: 14, accentColor: '#4ADE80', cursor: 'pointer', flexShrink: 0 }} />
          <input type="text" value={item.text} onChange={e => updateItem(i, { text: e.target.value })}
            placeholder="Feature description..." style={{ ...inputSt, flex: 1 }} />
          <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#444444', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>&times;</button>
        </div>
      ))}
      <button type="button" onClick={addItem} style={{ background: 'none', border: 'none', color: '#4ADE80', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: 'inherit' }}>
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
    if (val && !urls.includes(val)) onChange([...urls, val]);
    setInput('');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {urls.map((url, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={url} alt="" style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 3, border: '1px solid #222222', background: '#0d0d0d', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span style={{ flex: 1, fontSize: 11, color: '#666666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
          <button type="button" onClick={() => onChange(urls.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#444444', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>&times;</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          placeholder="https://...png" style={{ ...inputSt, flex: 1 }} />
        <button type="button" onClick={addUrl} style={{ padding: '8px 12px', background: 'transparent', border: '1px solid #222222', borderRadius: 4, fontSize: 12, color: '#666666', cursor: 'pointer', fontFamily: 'inherit' }}>
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
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2MB'); return; }
    setUploading(true);
    setError(null);
    const ext = file.name.split('.').pop() || 'png';
    const slug = (appName || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const path = `${slug}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('app-icons').upload(path, file, { upsert: true });
    if (uploadErr) { setError(uploadErr.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('app-icons').getPublicUrl(path);
    onUploaded(urlData.publicUrl);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFile(file); };

  return (
    <div>
      <label style={labelSt}>App Icon</label>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          style={{ width: 80, height: 80, borderRadius: 4, border: '2px dashed #333333', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, overflow: 'hidden', transition: 'border-color 0.15s' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = '#4ADE80')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = '#333333')}
        >
          {uploading ? (
            <span style={{ fontSize: 10, color: '#4ADE80' }}>Uploading...</span>
          ) : url ? (
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#444444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              <span style={{ fontSize: 10, color: '#444444', display: 'block', marginTop: 4 }}>Upload</span>
            </div>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #222222', borderRadius: 4, fontSize: 12, color: '#666666', cursor: 'pointer', fontFamily: 'inherit', opacity: uploading ? 0.5 : 1 }}>
            {url ? 'Replace Image' : 'Choose File'}
          </button>
          {url && (
            <button type="button" onClick={onRemoved} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, fontSize: 12, color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit' }}>
              Remove
            </button>
          )}
          <p style={{ fontSize: 10, color: '#444444', margin: 0 }}>PNG, JPG, SVG. Max 2MB. Drag & drop or click.</p>
          {error && <p style={{ fontSize: 10, color: '#EF4444', margin: 0 }}>{error}</p>}
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

  const set = <K extends keyof AppFormData>(key: K, value: AppFormData[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveError('Name is required'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      if (isEdit && app) { await updateApp(app.id, form); }
      else { await createApp(form); }
      onSaved();
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(10,10,10,0.9)' }}>
      <div style={{ background: '#111111', border: '1px solid #222222', borderRadius: 4, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.8)' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isEdit && (
              app!.iconUrl
                ? <img src={app!.iconUrl} alt="" style={{ width: 36, height: 36, borderRadius: 3, border: '1px solid #222222', background: '#0d0d0d', objectFit: 'contain' }} />
                : <div style={{ width: 36, height: 36, borderRadius: 3, background: '#1a1a1a', border: '1px solid #222222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#444444' }}>{app!.name.charAt(0)}</div>
            )}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', margin: 0 }}>{isEdit ? app!.name : 'Add New App'}</h3>
              <p style={{ fontSize: 11, color: '#444444', margin: 0 }}>{isEdit ? 'Edit app details and pipeline data' : 'Register a new app in Watchtower'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#e0e0e0')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#444444')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── Core Fields ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelSt}>Name *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="My App" style={inputSt}
                onFocus={focusGreen as any} onBlur={blurGray as any} />
            </div>

            <IconUpload url={form.icon_url} appName={form.name} onUploaded={url => set('icon_url', url)} onRemoved={() => set('icon_url', '')} />

            <div>
              <label style={labelSt}>Description</label>
              <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description for cards..." style={inputSt}
                onFocus={focusGreen as any} onBlur={blurGray as any} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelSt}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} style={inputSt}
                  onFocus={focusGreen as any} onBlur={blurGray as any}>
                  {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} style={inputSt}
                  onFocus={focusGreen as any} onBlur={blurGray as any}>
                  <option value="">Select...</option>
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Stage</label>
                <select value={form.graduation_stage} onChange={e => set('graduation_stage', e.target.value)} style={inputSt}
                  onFocus={focusGreen as any} onBlur={blurGray as any}>
                  {stageConfigs.map(s => <option key={s.key} value={s.key}>{s.stage}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelSt}>Schema Prefix</label>
                <input type="text" value={form.schema_prefix} onChange={e => set('schema_prefix', e.target.value)} placeholder="sbhq_" style={inputSt}
                  onFocus={focusGreen as any} onBlur={blurGray as any} />
              </div>
              <div>
                <label style={labelSt}>Supabase Project ID</label>
                <input type="text" value={form.supabase_project_id} onChange={e => set('supabase_project_id', e.target.value)} placeholder="abc123..." style={inputSt}
                  onFocus={focusGreen as any} onBlur={blurGray as any} />
              </div>
            </div>

            <div>
              <label style={labelSt}>Pipeline Note</label>
              <textarea rows={3} value={form.pipeline_note} onChange={e => set('pipeline_note', e.target.value)} placeholder="Context, blockers, next steps..." style={{ ...inputSt, resize: 'none' }}
                onFocus={focusGreen as any} onBlur={blurGray as any} />
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ borderTop: '1px dashed #1e1e1e', paddingTop: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>// BITW Card Data</span>
          </div>

          {/* ── BITW Fields ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelSt}>App URL</label>
                <input type="text" value={form.app_url} onChange={e => set('app_url', e.target.value)} placeholder="https://myapp.com" style={inputSt}
                  onFocus={focusGreen as any} onBlur={blurGray as any} />
              </div>
              <div>
                <label style={labelSt}>Repo URL</label>
                <input type="text" value={form.repo_url} onChange={e => set('repo_url', e.target.value)} placeholder="https://github.com/org/repo" style={inputSt}
                  onFocus={focusGreen as any} onBlur={blurGray as any} />
              </div>
            </div>

            <div>
              <label style={labelSt}>Overview</label>
              <textarea rows={4} value={form.overview} onChange={e => set('overview', e.target.value)} placeholder="Detailed description shown in the app modal..." style={{ ...inputSt, resize: 'none' }}
                onFocus={focusGreen as any} onBlur={blurGray as any} />
            </div>

            <div>
              <label style={labelSt}>Who It's For</label>
              <TagInput tags={form.target_users} onChange={t => set('target_users', t)} placeholder="Type a role and press Enter..." />
            </div>

            <div>
              <label style={labelSt}>Roadmap / What's Coming Next</label>
              <RoadmapEditor items={form.roadmap} onChange={r => set('roadmap', r)} />
            </div>

            <div>
              <label style={labelSt}>Screenshots</label>
              <ScreenshotList urls={form.screenshots} onChange={u => set('screenshots', u)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1a1a1a', flexShrink: 0 }}>
          {saveError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#EF4444', marginBottom: 12 }}>
              {saveError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '8px 14px', background: 'transparent', border: '1px solid #222222', borderRadius: 4, fontSize: 13, fontWeight: 500, color: '#666666', cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#444444'; (e.currentTarget as HTMLElement).style.color = '#e0e0e0'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#222222'; (e.currentTarget as HTMLElement).style.color = '#666666'; }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '8px 14px', background: '#4ADE80', color: '#000', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
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

  const openAdd = () => { setEditingApp(null); setShowModal(true); };
  const openEdit = (app: AppEntryWithMeta) => { setEditingApp(app); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingApp(null); };

  // Group apps by graduation_stage
  const groupedApps: Record<string, AppEntryWithMeta[]> = {};
  for (const app of apps) {
    const key = app.graduationStage || 'idea';
    if (!groupedApps[key]) groupedApps[key] = [];
    groupedApps[key].push(app);
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ height: 10, background: '#1a1a1a', borderRadius: 2, width: 200, marginBottom: 8 }} />
          <div style={{ height: 24, background: '#1a1a1a', borderRadius: 2, width: 300 }} />
        </div>
        <div className="terminal-card" style={{ padding: 24, height: 500, opacity: 0.5 }}>
          <div style={{ height: 12, background: '#1a1a1a', borderRadius: 2, width: '30%', marginBottom: 16 }} />
        </div>
      </div>
    );
  }

  if (fetchError && apps.length === 0) {
    return (
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 8 }}>// error: failed to load apps</div>
        <p style={{ fontSize: 11, color: '#444444', marginBottom: 16 }}>{fetchError}</p>
        <button onClick={refetch} style={{ padding: '8px 16px', background: '#4ADE80', color: '#000', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          $ retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: '#444444', marginBottom: 4 }}>// development</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e0e0e0', margin: 0 }}>Development Overview</h2>
          <p style={{ fontSize: 12, color: '#666666', marginTop: 4 }}>Portfolio-wide pipeline and app readiness.</p>
        </div>
        <button
          onClick={openAdd}
          style={{ padding: '8px 16px', background: '#4ADE80', color: '#000', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', flexShrink: 0 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add App
        </button>
      </div>

      {/* Pipeline Board */}
      <div className="terminal-card" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>## app_pipeline</span>
          <p style={{ fontSize: 11, color: '#444444', marginTop: 4, marginBottom: 0 }}>
            Development lifecycle — click cards to edit
          </p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 12, minHeight: 500, minWidth: 'max(100%, 1080px)' }}>
            {stageConfigs.map(({ stage, key, color }) => {
              const c = colorMap[color] || colorMap.slate;
              const stageApps = groupedApps[key] || [];
              return (
                <div key={stage} style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column' }}>
                  {/* Column header */}
                  <div style={{ borderTop: `3px solid ${c.borderColor}`, background: c.bg, borderRadius: '4px 4px 0 0', padding: '8px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{stage}</span>
                    <span style={{ fontSize: 10, color: '#444444', marginLeft: 6 }}>({stageApps.length})</span>
                  </div>

                  {/* Cards */}
                  <div style={{ flex: 1, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stageApps.length > 0 ? stageApps.map(app => (
                      <div
                        key={app.name}
                        onClick={() => openEdit(app)}
                        style={{ background: '#0d0d0d', border: '1px solid #222222', borderRadius: 4, padding: 12, cursor: 'pointer', minHeight: 90, transition: 'border-color 0.15s, background 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.background = '#141414'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#222222'; (e.currentTarget as HTMLElement).style.background = '#0d0d0d'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          {app.iconUrl
                            ? <img src={app.iconUrl} alt="" style={{ width: 22, height: 22, borderRadius: 3, border: '1px solid #222222', background: '#0d0d0d', objectFit: 'contain', flexShrink: 0 }} />
                            : <div style={{ width: 22, height: 22, borderRadius: 3, background: '#1a1a1a', border: '1px solid #222222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#444444', flexShrink: 0 }}>{app.name.charAt(0)}</div>
                          }
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</span>
                        </div>
                        <p style={{ fontSize: 10, color: '#555555', lineHeight: 1.4, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {app.pipelineNote || app.description}
                        </p>
                      </div>
                    )) : (
                      <div style={{ border: '1px dashed #1e1e1e', borderRadius: 4, padding: '24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333333', fontSize: 10, minHeight: 90 }}>
                        — empty —
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
        <AppFormModal app={editingApp} onClose={closeModal} onSaved={refetch} />
      )}
    </div>
  );
}
