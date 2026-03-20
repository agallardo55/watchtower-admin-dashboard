import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useApps } from '../hooks/useApps';

// --- Types ---

type Priority = 'low' | 'medium' | 'high' | 'critical';
type TaskStatus = 'todo' | 'in_progress' | 'done';

interface WtAppRegistry {
  name: string;
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  app_id: string | null;
  assigned_to: string | null;
  category: string | null;
  priority: Priority;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  wt_app_registry: WtAppRegistry | null;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  app: string;
  app_id: string | null;
  category: string | null;
  assigned_to: string | null;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

// --- Constants ---

const priorityBorderStyle: Record<Priority, React.CSSProperties> = {
  critical: { borderLeft: '3px solid #EF4444' },
  high: { borderLeft: '3px solid #EF4444' },
  medium: { borderLeft: '3px solid #F59E0B' },
  low: { borderLeft: '3px solid #444444' },
};

const priorityBadgeStyle: Record<Priority, React.CSSProperties> = {
  critical: { color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  high: { color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  medium: { color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  low: { color: 'var(--text-secondary)', background: 'rgba(102,102,102,0.1)', border: '1px solid rgba(102,102,102,0.2)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
};

const statusDotColor: Record<TaskStatus, string> = {
  todo: `var(--info)`,
  in_progress: `var(--purple)`,
  done: 'var(--accent)',
};

const statusColors: Record<TaskStatus, { dot: string; label: string }> = {
  todo: { dot: 'bg-blue-500', label: 'To Do' },
  in_progress: { dot: 'bg-purple-500', label: 'In Progress' },
  done: { dot: 'bg-emerald-500', label: 'Done' },
};

const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'done'];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Get Sunday of the week containing the given date
function getWeekStart(d: Date): Date {
  const result = new Date(d);
  result.setDate(result.getDate() - result.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

// Get array of 7 dates for the week
function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = weekStart.toLocaleDateString('en-US', opts);
  const endStr = end.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

function formatDayHeader(d: Date): { dayName: string; dayNum: string; monthStr: string } {
  return {
    dayName: DAY_NAMES[d.getDay()],
    dayNum: String(d.getDate()),
    monthStr: d.toLocaleDateString('en-US', { month: 'short' }),
  };
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    priority: row.priority,
    status: row.status,
    app: row.wt_app_registry?.name ?? row.category ?? '',
    app_id: row.app_id,
    category: row.category,
    assigned_to: row.assigned_to,
    dueDate: row.due_date,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

// --- Modal Component ---

interface TaskModalProps {
  task: Partial<Task> | null;
  isEdit: boolean;
  defaultDate?: string;
  onSave: (task: { id?: string; title: string; description: string; priority: Priority; status: TaskStatus; app: string; dueDate: string | null }) => void;
  onClose: () => void;
  saving: boolean;
  appList: string[];
}

function TaskModal({ task, isEdit, defaultDate, onSave, onClose, saving, appList }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [app, setApp] = useState(task?.app || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || defaultDate || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [titleError, setTitleError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    onSave({
      ...(isEdit && task?.id ? { id: task.id } : {}),
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      app,
      dueDate: dueDate || null,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    color: 'var(--text-primary)',
    fontSize: 13,
    padding: '8px 12px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    display: 'block',
    marginBottom: 6,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(10,10,10,0.9)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); setTitleError(''); }}
                onBlur={() => { if (!title.trim()) setTitleError('Title is required'); }}
                style={{ ...inputStyle, border: titleError ? '1px solid #EF4444' : '1px solid #222222' }}
                placeholder="What needs to be done?"
                autoFocus
              />
              {titleError && (
                <p style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{titleError}</p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ ...inputStyle, resize: 'none' }}
                rows={3}
                placeholder="Optional details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as Priority)}
                  style={inputStyle}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>App</label>
                <select
                  value={app}
                  onChange={e => setApp(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">None</option>
                  {appList.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Day</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as TaskStatus)}
                  style={inputStyle}
                >
                  {statusOrder.map(s => <option key={s} value={s}>{statusColors[s].label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2" style={{ paddingTop: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                style={{
                  padding: '7px 16px',
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
                  opacity: saving || !title.trim() ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'inherit',
                }}
              >
                {saving && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                )}
                {isEdit ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- Delete Confirmation ---

function DeleteConfirm({ taskTitle, onConfirm, onCancel, deleting }: { taskTitle: string; onConfirm: () => void; onCancel: () => void; deleting: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(10,10,10,0.9)' }}
        onClick={onCancel}
      />
      <div
        className="relative w-full"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          maxWidth: 384,
          padding: 24,
          boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Delete Task</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Are you sure you want to delete "<span style={{ color: 'var(--text-primary)' }}>{taskTitle}</span>"? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '4px', fontSize: 13, cursor: 'pointer', opacity: deleting ? 0.5 : 1, fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              background: 'var(--danger)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.5 : 1,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'inherit',
            }}
          >
            {deleting && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Task Card (compact for weekly view) ---

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusCycle: (task: Task) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

function TaskCard({ task, onEdit, onDelete, onStatusCycle, onDragStart }: TaskCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, task.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '8px 10px',
        cursor: 'pointer',
        marginBottom: 6,
        ...priorityBorderStyle[task.priority],
      }}
    >
      <div className="flex items-start gap-1.5">
        {/* Status dot — click to cycle */}
        <button
          onClick={() => onStatusCycle(task)}
          className="mt-0.5 flex-shrink-0"
          title={`${statusColors[task.status].label} — click to change`}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          {task.status === 'done' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={statusDotColor.done} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
            </svg>
          ) : (
            <div style={{
              width: 14,
              height: 14,
              borderRadius: '999px',
              border: `2px solid ${statusDotColor[task.status]}`,
              background: task.status === 'in_progress' ? 'rgba(167,139,250,0.2)' : 'transparent',
            }} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
              textDecoration: task.status === 'done' ? 'line-through' : 'none',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {task.title}
          </p>
          <div className="flex items-center flex-wrap gap-1" style={{ marginTop: 4 }}>
            {task.app && (
              <span style={{ padding: '1px 4px', borderRadius: 3, fontSize: 9, fontWeight: 500, background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid var(--border)', display: 'inline-block', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.app}
              </span>
            )}
            <span style={priorityBadgeStyle[task.priority]}>
              {task.priority[0].toUpperCase()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-0.5 flex-shrink-0"
          style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}
        >
          <button
            onClick={() => onEdit(task)}
            style={{ padding: 2, borderRadius: 3, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
          <button
            onClick={() => onDelete(task)}
            style={{ padding: 2, borderRadius: 3, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Backlog Panel ---

interface BacklogProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusCycle: (task: Task) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
}

function Backlog({ tasks, onEdit, onDelete, onStatusCycle, onDragStart, onDragOver, onDrop, isDragOver }: BacklogProps) {
  return (
    <div
      style={{
        background: isDragOver ? 'rgba(245,158,11,0.05)' : 'var(--bg-surface)',
        border: isDragOver ? '1px solid rgba(245,158,11,0.4)' : '1px solid #222222',
        borderRadius: '4px',
        overflow: 'hidden',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onDragOver={onDragOver}
      onDragLeave={e => e.preventDefault()}
      onDrop={onDrop}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: '8px 12px', borderBottom: '1px solid #222222' }}
      >
        <div className="flex items-center gap-2">
          <div style={{ width: 8, height: 8, borderRadius: '999px', background: 'var(--warning)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>Backlog</span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '999px', border: '1px solid var(--border)' }}>{tasks.length}</span>
      </div>
      <div className="max-h-[300px] overflow-y-auto" style={{ padding: 8 }}>
        {tasks.length === 0 ? (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No unscheduled tasks</p>
        ) : (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} onStatusCycle={onStatusCycle} onDragStart={onDragStart} />
          ))
        )}
      </div>
    </div>
  );
}

// --- Main Page ---

export default function DailyTasks() {
  const { apps } = useApps();
  const appList = apps.map(a => a.name);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [appFilter, setAppFilter] = useState('all');
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [showBacklog, setShowBacklog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const weekStart = useMemo(() => {
    const base = getWeekStart(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const today = todayStr();

  // --- Fetch tasks from Supabase ---
  const fetchTasks = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('wt_tasks')
      .select('*, wt_app_registry(name)')
      .is('deleted_at', null)
      .order('due_date');

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const mapped = (data as TaskRow[]).map(rowToTask);
    setTasks(mapped);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    if (appFilter === 'all') return tasks;
    return tasks.filter(t => t.app === appFilter);
  }, [tasks, appFilter]);

  const usedApps = useMemo(() => {
    return [...new Set(tasks.map(t => t.app).filter(Boolean))].sort();
  }, [tasks]);

  // Group tasks by date string
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = { backlog: [] };
    weekDates.forEach(d => { map[dateStr(d)] = []; });

    filteredTasks.forEach(t => {
      if (!t.dueDate) {
        map.backlog.push(t);
      } else if (map[t.dueDate]) {
        map[t.dueDate].push(t);
      }
    });

    // Sort each day: high first, done last
    const priorityWeight: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusWeight: Record<TaskStatus, number> = { in_progress: 0, todo: 1, done: 2 };
    Object.values(map).forEach(arr => {
      arr.sort((a, b) => statusWeight[a.status] - statusWeight[b.status] || priorityWeight[a.priority] - priorityWeight[b.priority]);
    });

    return map;
  }, [filteredTasks, weekDates]);

  // Overdue tasks (before this week, not done, have a date)
  const overdueCount = useMemo(() => {
    const weekStartStr = dateStr(weekStart);
    return tasks.filter(t => t.dueDate && t.dueDate < weekStartStr && t.status !== 'done').length;
  }, [tasks, weekStart]);

  // --- Create task ---
  const handleAddTask = useCallback(async (data: { title: string; description: string; priority: Priority; status: TaskStatus; app: string; dueDate: string | null }) => {
    setSaving(true);
    const { error: insertError } = await supabase
      .from('wt_tasks')
      .insert({
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        category: data.app || null,
        due_date: data.dueDate,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setModalOpen(false);
    setModalDefaultDate('');
    await fetchTasks();
  }, [fetchTasks]);

  // --- Edit task ---
  const handleEditTask = useCallback(async (data: { id?: string; title: string; description: string; priority: Priority; status: TaskStatus; app: string; dueDate: string | null }) => {
    if (!data.id) return;
    setSaving(true);

    const updates: Record<string, string | null> = {
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      status: data.status,
      category: data.app || null,
      due_date: data.dueDate,
      updated_at: new Date().toISOString(),
    };

    if (data.status === 'done') {
      updates.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('wt_tasks')
      .update(updates)
      .eq('id', data.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditingTask(null);
    await fetchTasks();
  }, [fetchTasks]);

  // --- Status cycle ---
  const handleStatusCycle = useCallback(async (task: Task) => {
    const next: Record<TaskStatus, TaskStatus> = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
    const newStatus = next[task.status];

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, completedAt: newStatus === 'done' ? new Date().toISOString() : null } : t));

    const updates: Record<string, string | null> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'done') {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }

    const { error: updateError } = await supabase
      .from('wt_tasks')
      .update(updates)
      .eq('id', task.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      await fetchTasks(); // revert optimistic update
    }
  }, [fetchTasks]);

  // --- Soft delete ---
  const handleDelete = useCallback(async () => {
    if (!deletingTask) return;
    setDeleting(true);

    const { error: deleteError } = await supabase
      .from('wt_tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deletingTask.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    setDeleting(false);
    setDeletingTask(null);
    await fetchTasks();
  }, [deletingTask, fetchTasks]);

  // --- Move overdue to today ---
  const handleMoveOverdueToToday = useCallback(async () => {
    const weekStartStr = dateStr(weekStart);
    const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < weekStartStr && t.status !== 'done');

    // Optimistic update
    setTasks(prev => prev.map(t => {
      if (t.dueDate && t.dueDate < weekStartStr && t.status !== 'done') {
        return { ...t, dueDate: today };
      }
      return t;
    }));

    // Update each overdue task
    const promises = overdueTasks.map(t =>
      supabase
        .from('wt_tasks')
        .update({ due_date: today, updated_at: new Date().toISOString() })
        .eq('id', t.id)
    );

    const results = await Promise.all(promises);
    const failed = results.some(r => r.error);

    if (failed) {
      setError('Some tasks failed to update');
      await fetchTasks();
    }
  }, [weekStart, today, tasks, fetchTasks]);

  // --- Drag and drop ---
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, target: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(target);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetDate: string | null) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) {
      setDragOverTarget(null);
      return;
    }

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, dueDate: targetDate } : t));
    setDragOverTarget(null);

    const { error: updateError } = await supabase
      .from('wt_tasks')
      .update({ due_date: targetDate, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      await fetchTasks(); // revert optimistic update
    }
  }, [fetchTasks]);

  // Stats
  const weekTaskCount = useMemo(() => {
    let total = 0, done = 0;
    weekDates.forEach(d => {
      const key = dateStr(d);
      const dayTasks = tasksByDate[key] || [];
      total += dayTasks.length;
      done += dayTasks.filter(t => t.status === 'done').length;
    });
    return { total, done };
  }, [weekDates, tasksByDate]);

  // --- Loading state ---
  if (loading) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '40px 0' }}>loading tasks...</div>
    );
  }

  // --- Error state ---
  if (error && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div
          className="w-12 h-12 flex items-center justify-center"
          style={{ borderRadius: '999px', background: 'rgba(239,68,68,0.1)', marginBottom: 16 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Failed to load tasks</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); fetchTasks(); }}
          style={{ padding: '8px 16px', borderRadius: '4px', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: 'var(--bg-primary)', border: 'none', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inline error banner */}
      {error && (
        <div
          className="flex items-center justify-between"
          style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px' }}
        >
          <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>
          <button
            onClick={() => setError(null)}
            style={{ fontSize: 11, color: 'var(--danger)', marginLeft: 16, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Weekly Tasks</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{formatWeekRange(weekStart)}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={appFilter}
            onChange={e => setAppFilter(e.target.value)}
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: 12, padding: '5px 10px', outline: 'none', fontFamily: 'inherit' }}
          >
            <option value="all">All Apps</option>
            {usedApps.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button
            onClick={() => setShowBacklog(!showBacklog)}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: 12,
              fontWeight: 500,
              border: showBacklog ? '1px solid rgba(245,158,11,0.3)' : '1px solid #222222',
              background: showBacklog ? 'rgba(245,158,11,0.1)' : 'transparent',
              color: showBacklog ? 'var(--warning)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Backlog
          </button>
          <button
            onClick={() => { setModalDefaultDate(today); setModalOpen(true); }}
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)', border: 'none', borderRadius: '4px', padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            Add Task
          </button>
        </div>
      </div>

      {/* Week nav + stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 8px', lineHeight: 1, display: 'flex', alignItems: 'center' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: weekOffset === 0 ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
              padding: '4px 10px',
              fontFamily: 'inherit',
            }}
          >
            This Week
          </button>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 8px', lineHeight: 1, display: 'flex', alignItems: 'center' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <div className="flex items-center gap-4" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {weekTaskCount.total > 0 && (
            <span>
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{weekTaskCount.done}</span>/{weekTaskCount.total} done
            </span>
          )}
          {overdueCount > 0 && (
            <button
              onClick={handleMoveOverdueToToday}
              className="flex items-center gap-1"
              style={{ color: 'var(--warning)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
            >
              {overdueCount} overdue — move to today
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16"
          style={{ border: '1px solid var(--border)', borderRadius: '4px', background: 'rgba(17,17,17,0.5)' }}
        >
          <div
            className="w-12 h-12 flex items-center justify-center"
            style={{ borderRadius: '999px', background: 'var(--bg-elevated)', marginBottom: 16 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#444444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No tasks yet</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Create your first task to get started</p>
          <button
            onClick={() => { setModalDefaultDate(today); setModalOpen(true); }}
            style={{ padding: '8px 16px', borderRadius: '4px', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: 'var(--bg-primary)', border: 'none', cursor: 'pointer' }}
          >
            Add Task
          </button>
        </div>
      )}

      {/* Weekly Grid + Backlog */}
      {tasks.length > 0 && (
        <div className={`grid gap-2 ${showBacklog ? 'grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr_180px]' : 'grid-cols-7'}`}>
          {/* 7 Day Columns */}
          {weekDates.map(d => {
            const key = dateStr(d);
            const isToday = key === today;
            const isPast = key < today;
            const dayTasks = tasksByDate[key] || [];
            const isDragOver = dragOverTarget === key;
            const { dayName, dayNum } = formatDayHeader(d);

            return (
              <div
                key={key}
                style={{
                  background: isDragOver
                    ? 'rgba(59,130,246,0.05)'
                    : isToday
                    ? 'rgba(74,222,128,0.03)'
                    : 'rgba(17,17,17,0.5)',
                  border: isDragOver
                    ? '1px dashed rgba(59,130,246,0.3)'
                    : isToday
                    ? '1px solid rgba(74,222,128,0.25)'
                    : '1px solid #222222',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s, background 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onDragOver={e => handleDragOver(e, key)}
                onDragLeave={() => setDragOverTarget(null)}
                onDrop={e => handleDrop(e, key)}
              >
                {/* Day header */}
                <div
                  className="flex items-center justify-between"
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #222222',
                    borderTop: isToday ? '2px solid rgba(74,222,128,0.4)' : '2px solid transparent',
                    background: isToday ? 'rgba(74,222,128,0.07)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: isToday ? 'var(--accent)' : 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {dayName}
                    </span>
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: isToday ? 'var(--accent)' : 'var(--text-primary)',
                        lineHeight: 1,
                      }}
                    >
                      {dayNum}
                    </span>
                  </div>
                  <button
                    onClick={() => { setModalDefaultDate(key); setModalOpen(true); }}
                    style={{ padding: 2, borderRadius: 3, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                    title={`Add task to ${DAY_NAMES_FULL[d.getDay()]}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                  </button>
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto" style={{ padding: 6, minHeight: 120 }}>
                  {dayTasks.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', padding: '16px 0' }}>
                      {isPast ? '—' : ''}
                    </p>
                  ) : (
                    dayTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={setEditingTask}
                        onDelete={setDeletingTask}
                        onStatusCycle={handleStatusCycle}
                        onDragStart={handleDragStart}
                      />
                    ))
                  )}
                </div>

                {/* Day task count */}
                {dayTasks.length > 0 && (
                  <div style={{ padding: '4px 8px', borderTop: '1px solid #222222', fontSize: 10, color: 'var(--text-muted)' }}>
                    {dayTasks.filter(t => t.status === 'done').length}/{dayTasks.length}
                  </div>
                )}
              </div>
            );
          })}

          {/* Backlog column */}
          {showBacklog && (
            <Backlog
              tasks={tasksByDate.backlog || []}
              onEdit={setEditingTask}
              onDelete={setDeletingTask}
              onStatusCycle={handleStatusCycle}
              onDragStart={handleDragStart}
              onDragOver={e => handleDragOver(e, 'backlog')}
              onDrop={e => handleDrop(e, null)}
              isDragOver={dragOverTarget === 'backlog'}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <TaskModal task={null} isEdit={false} defaultDate={modalDefaultDate} onSave={handleAddTask} onClose={() => { setModalOpen(false); setModalDefaultDate(''); }} saving={saving} appList={appList} />
      )}
      {editingTask && (
        <TaskModal task={editingTask} isEdit={true} onSave={handleEditTask} onClose={() => setEditingTask(null)} saving={saving} appList={appList} />
      )}
      {deletingTask && (
        <DeleteConfirm taskTitle={deletingTask.title} onConfirm={handleDelete} onCancel={() => setDeletingTask(null)} deleting={deleting} />
      )}
    </div>
  );
}
