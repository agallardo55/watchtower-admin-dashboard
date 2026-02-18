import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// --- Types ---

type Priority = 'low' | 'medium' | 'high' | 'critical';
type FeatureStatus = 'new' | 'planned' | 'in-progress' | 'shipped' | 'declined';
type SortField = 'date' | 'priority' | 'status' | 'votes';
type SortDir = 'asc' | 'desc';

interface FeedbackMetadata {
  priority: Priority;
  status: FeatureStatus;
  votes: number;
  requestedBy: string;
}

interface FeedbackRow {
  id: string;
  app_id: string;
  type: string;
  subject: string;
  message: string;
  user_email: string;
  metadata: FeedbackMetadata;
  created_at: string;
  wt_app_registry: { name: string } | null;
}

interface FeatureRequest {
  id: string;
  app_id: string;
  app: string;
  title: string;
  description: string;
  priority: Priority;
  status: FeatureStatus;
  requestedBy: string;
  dateSubmitted: string;
  votes: number;
  createdAt: string;
  metadata: FeedbackMetadata;
}

interface AppOption {
  id: string;
  name: string;
}

// --- Constants ---

const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];
const statuses: FeatureStatus[] = ['new', 'planned', 'in-progress', 'shipped', 'declined'];

const statusBadge: Record<FeatureStatus, string> = {
  'new': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'planned': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'shipped': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'declined': 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusDot: Record<FeatureStatus, string> = {
  'new': 'bg-blue-400',
  'planned': 'bg-purple-400',
  'in-progress': 'bg-amber-400',
  'shipped': 'bg-emerald-400',
  'declined': 'bg-red-400',
};

const priorityBadge: Record<Priority, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const priorityOrder: Record<Priority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const statusOrder: Record<FeatureStatus, number> = { 'new': 1, 'planned': 2, 'in-progress': 3, 'shipped': 4, 'declined': 5 };

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapRow(row: FeedbackRow): FeatureRequest {
  const meta = row.metadata;
  return {
    id: row.id,
    app_id: row.app_id,
    app: row.wt_app_registry?.name ?? 'Unknown',
    title: row.subject,
    description: row.message,
    priority: meta?.priority ?? 'medium',
    status: meta?.status ?? 'new',
    requestedBy: meta?.requestedBy ?? '',
    dateSubmitted: row.created_at ? row.created_at.slice(0, 10) : todayStr(),
    votes: meta?.votes ?? 0,
    createdAt: row.created_at,
    metadata: meta,
  };
}

// --- CSV ---

function exportCsv(requests: FeatureRequest[]): void {
  const headers = ['ID', 'App', 'Title', 'Description', 'Priority', 'Status', 'Requested By', 'Date Submitted', 'Votes'];
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = requests.map(r => [
    r.id, escape(r.app), escape(r.title), escape(r.description),
    r.priority, r.status, escape(r.requestedBy), r.dateSubmitted, String(r.votes),
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `feature-requests-${todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Modal Component ---

interface RequestModalProps {
  request: Partial<FeatureRequest> | null;
  isEdit: boolean;
  apps: AppOption[];
  onSave: (data: {
    id?: string;
    app_id: string;
    title: string;
    description: string;
    priority: Priority;
    status: FeatureStatus;
    requestedBy: string;
    votes: number;
    user_email: string;
  }) => Promise<void>;
  onClose: () => void;
}

function RequestModal({ request, isEdit, apps, onSave, onClose }: RequestModalProps) {
  const [appId, setAppId] = useState(request?.app_id || '');
  const [title, setTitle] = useState(request?.title || '');
  const [description, setDescription] = useState(request?.description || '');
  const [priority, setPriority] = useState<Priority>(request?.priority || 'medium');
  const [status, setStatus] = useState<FeatureStatus>(request?.status || 'new');
  const [requestedBy, setRequestedBy] = useState(request?.requestedBy || '');
  const [votes, setVotes] = useState(request?.votes ?? 0);
  const [titleError, setTitleError] = useState('');
  const [appError, setAppError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!title.trim()) { setTitleError('Title is required'); valid = false; }
    if (!appId) { setAppError('App is required'); valid = false; }
    if (!valid) return;

    setSaving(true);
    setSaveError('');
    try {
      await onSave({
        ...(isEdit && request?.id ? { id: request.id } : {}),
        app_id: appId,
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        requestedBy: requestedBy.trim() || 'internal',
        votes,
        user_email: requestedBy.trim() || 'internal',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">{isEdit ? 'Edit Feature Request' : 'New Feature Request'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* App */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">App *</label>
              <select
                value={appId}
                onChange={e => { setAppId(e.target.value); setAppError(''); }}
                onBlur={() => { if (!appId) setAppError('App is required'); }}
                className={`w-full px-3 py-2 rounded-lg bg-slate-800 border text-sm focus:outline-none focus:border-blue-500 transition-colors ${appError ? 'border-red-500' : 'border-white/10'}`}
              >
                <option value="">Select app...</option>
                {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {appError && <p className="text-xs text-red-400 mt-1">{appError}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); setTitleError(''); }}
                onBlur={() => { if (!title.trim()) setTitleError('Title is required'); }}
                className={`w-full px-3 py-2 rounded-lg bg-slate-800 border text-sm focus:outline-none focus:border-blue-500 transition-colors ${titleError ? 'border-red-500' : 'border-white/10'}`}
                placeholder="Feature request title"
                autoFocus
              />
              {titleError && <p className="text-xs text-red-400 mt-1">{titleError}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                rows={3}
                placeholder="Describe the feature..."
              />
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500">
                  {priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as FeatureStatus)} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500">
                  {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Requested By */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Requested By</label>
              <input
                type="text"
                value={requestedBy}
                onChange={e => setRequestedBy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder='Name, email, or "internal"'
              />
            </div>

            {/* Votes (edit only) */}
            {isEdit && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Votes</label>
                <input
                  type="number"
                  min={0}
                  value={votes}
                  onChange={e => setVotes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-32 px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Save error */}
            {saveError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {saveError}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim() || !appId}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                {isEdit ? 'Save Changes' : 'Add Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- Delete Confirmation ---

function DeleteConfirm({ title, deleting, onConfirm, onCancel }: { title: string; deleting: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold mb-2">Delete Feature Request</h3>
        <p className="text-sm text-slate-400 mb-4">
          Are you sure you want to delete "<span className="text-slate-200">{title}</span>"? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} disabled={deleting} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2">
            {deleting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function FeatureRequests() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<FeatureRequest | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<FeatureRequest | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [votingIds, setVotingIds] = useState<Set<string>>(new Set());
  const [appOptions, setAppOptions] = useState<AppOption[]>([]);

  // Filters
  const [filterApp, setFilterApp] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Sort
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Load apps for dropdown
  useEffect(() => {
    async function loadApps() {
      const { data } = await supabase
        .from('wt_app_registry')
        .select('id, name')
        .order('name');
      if (data) {
        setAppOptions(data as AppOption[]);
      }
    }
    loadApps();
  }, []);

  // Load feature requests
  useEffect(() => {
    async function loadRequests() {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('wt_feedback')
        .select('*, wt_app_registry(name)')
        .eq('type', 'feature_request')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setRequests((data as FeedbackRow[]).map(mapRow));
      setLoading(false);
    }
    loadRequests();
  }, []);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let result = [...requests];
    if (filterApp !== 'all') result = result.filter(r => r.app === filterApp);
    if (filterStatus !== 'all') result = result.filter(r => r.status === filterStatus);
    if (filterPriority !== 'all') result = result.filter(r => r.priority === filterPriority);

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date': cmp = a.dateSubmitted.localeCompare(b.dateSubmitted); break;
        case 'priority': cmp = priorityOrder[a.priority] - priorityOrder[b.priority]; break;
        case 'status': cmp = statusOrder[a.status] - statusOrder[b.status]; break;
        case 'votes': cmp = a.votes - b.votes; break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [requests, filterApp, filterStatus, filterPriority, sortField, sortDir]);

  // Stats
  const stats = useMemo(() => {
    const byStatus: Record<FeatureStatus, number> = { 'new': 0, 'planned': 0, 'in-progress': 0, 'shipped': 0, 'declined': 0 };
    requests.forEach(r => byStatus[r.status]++);
    return { total: requests.length, ...byStatus };
  }, [requests]);

  // Unique app names for filter dropdown (from loaded data)
  const appNamesInData = useMemo(() => {
    const names = new Set(requests.map(r => r.app));
    return Array.from(names).sort();
  }, [requests]);

  const handleAdd = useCallback(async (data: {
    app_id: string;
    title: string;
    description: string;
    priority: Priority;
    status: FeatureStatus;
    requestedBy: string;
    votes: number;
    user_email: string;
  }) => {
    const { data: row, error: insertError } = await supabase
      .from('wt_feedback')
      .insert({
        type: 'feature_request',
        subject: data.title,
        message: data.description,
        app_id: data.app_id,
        user_email: data.user_email,
        metadata: {
          priority: data.priority,
          status: 'new' as FeatureStatus,
          votes: 0,
          requestedBy: data.requestedBy,
        },
      })
      .select('*, wt_app_registry(name)')
      .single();

    if (insertError) throw new Error(insertError.message);
    setRequests(prev => [mapRow(row as FeedbackRow), ...prev]);
    setModalOpen(false);
  }, []);

  const handleEdit = useCallback(async (data: {
    id?: string;
    app_id: string;
    title: string;
    description: string;
    priority: Priority;
    status: FeatureStatus;
    requestedBy: string;
    votes: number;
    user_email: string;
  }) => {
    if (!data.id) return;

    const existing = requests.find(r => r.id === data.id);
    if (!existing) return;

    const { data: row, error: updateError } = await supabase
      .from('wt_feedback')
      .update({
        subject: data.title,
        message: data.description,
        app_id: data.app_id,
        user_email: data.user_email,
        metadata: {
          ...existing.metadata,
          priority: data.priority,
          status: data.status,
          votes: data.votes,
          requestedBy: data.requestedBy,
        },
      })
      .eq('id', data.id)
      .select('*, wt_app_registry(name)')
      .single();

    if (updateError) throw new Error(updateError.message);
    setRequests(prev => prev.map(r => r.id === data.id ? mapRow(row as FeedbackRow) : r));
    setEditingRequest(null);
  }, [requests]);

  const handleDelete = useCallback(async () => {
    if (!deletingRequest) return;
    setDeletingInProgress(true);

    const { error: deleteError } = await supabase
      .from('wt_feedback')
      .delete()
      .eq('id', deletingRequest.id);

    setDeletingInProgress(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setRequests(prev => prev.filter(r => r.id !== deletingRequest.id));
    setDeletingRequest(null);
  }, [deletingRequest]);

  const handleVote = useCallback(async (id: string) => {
    const target = requests.find(r => r.id === id);
    if (!target || votingIds.has(id)) return;

    setVotingIds(prev => new Set(prev).add(id));

    const newVotes = target.votes + 1;
    const { error: voteError } = await supabase
      .from('wt_feedback')
      .update({
        metadata: {
          ...target.metadata,
          votes: newVotes,
        },
      })
      .eq('id', id);

    setVotingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (voteError) {
      setError(voteError.message);
      return;
    }

    setRequests(prev => prev.map(r => r.id === id ? { ...r, votes: newVotes, metadata: { ...r.metadata, votes: newVotes } } : r));
  }, [requests, votingIds]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return '\u2195';
    return sortDir === 'desc' ? '\u2193' : '\u2191';
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-lg w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-20 bg-slate-800/50 rounded-xl" />)}
        </div>
        <div className="h-64 bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  // Error state
  if (error && requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        </div>
        <h3 className="text-lg font-semibold mb-1">Failed to load feature requests</h3>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inline error banner */}
      {error && requests.length > 0 && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 ml-4">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Feature Requests</h1>
          <p className="text-sm text-slate-500 mt-1">{stats.total} total requests across all apps</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export */}
          <button
            onClick={() => exportCsv(requests)}
            disabled={requests.length === 0}
            className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 bg-slate-800 border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export
          </button>
          {/* Add */}
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            Add Request
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-200', bg: 'bg-slate-500/10' },
          { label: 'New', value: stats['new'], color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Planned', value: stats['planned'], color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'In Progress', value: stats['in-progress'], color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Shipped', value: stats['shipped'], color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Declined', value: stats['declined'], color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterApp} onChange={e => setFilterApp(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500">
          <option value="all">All Apps</option>
          {appNamesInData.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500">
          <option value="all">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500">
          <option value="all">All Priorities</option>
          {priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        {(filterApp !== 'all' || filterStatus !== 'all' || filterPriority !== 'all') && (
          <button
            onClick={() => { setFilterApp('all'); setFilterStatus('all'); setFilterPriority('all'); }}
            className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Empty State */}
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
          </div>
          <h3 className="text-lg font-semibold mb-1">No feature requests yet</h3>
          <p className="text-sm text-slate-500 mb-4">Start tracking ideas and feedback across your apps.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Add Your First Request
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-slate-500">No requests match your filters.</p>
          <button
            onClick={() => { setFilterApp('all'); setFilterStatus('all'); setFilterPriority('all'); }}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-slate-900/30 border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('votes')} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                      Votes <span className="text-[10px]">{sortIcon('votes')}</span>
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">App</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('priority')} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                      Priority <span className="text-[10px]">{sortIcon('priority')}</span>
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                      Status <span className="text-[10px]">{sortIcon('status')}</span>
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Requested By</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('date')} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                      Date <span className="text-[10px]">{sortIcon('date')}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleVote(r.id)}
                        disabled={votingIds.has(r.id)}
                        className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-colors group min-w-[40px] disabled:opacity-50"
                        title="Upvote"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 group-hover:text-blue-400 transition-colors"><path d="m18 15-6-6-6 6"/></svg>
                        <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-400">{r.votes}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.title}</div>
                      {r.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{r.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-800 px-2 py-1 rounded border border-white/5">{r.app}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityBadge[r.priority]}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${statusBadge[r.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[r.status]}`} />
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{r.requestedBy}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.dateSubmitted}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingRequest(r)} className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        </button>
                        <button onClick={() => setDeletingRequest(r)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(r => (
              <div key={r.id} className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{r.title}</h4>
                    {r.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{r.description}</p>}
                  </div>
                  <button
                    onClick={() => handleVote(r.id)}
                    disabled={votingIds.has(r.id)}
                    className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-800 border border-white/5 min-w-[44px] min-h-[44px] justify-center disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="m18 15-6-6-6 6"/></svg>
                    <span className="text-xs font-semibold text-blue-400">{r.votes}</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded border border-white/5">{r.app}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityBadge[r.priority]}`}>{r.priority}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${statusBadge[r.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[r.status]}`} />
                    {r.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {r.requestedBy} &middot; {r.dateSubmitted}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingRequest(r)} className="p-2 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button onClick={() => setDeletingRequest(r)} className="p-2 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {modalOpen && <RequestModal request={null} isEdit={false} apps={appOptions} onSave={handleAdd} onClose={() => setModalOpen(false)} />}
      {editingRequest && <RequestModal request={editingRequest} isEdit={true} apps={appOptions} onSave={handleEdit} onClose={() => setEditingRequest(null)} />}
      {deletingRequest && <DeleteConfirm title={deletingRequest.title} deleting={deletingInProgress} onConfirm={handleDelete} onCancel={() => setDeletingRequest(null)} />}
    </div>
  );
}
