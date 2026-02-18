import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apps } from '../constants';

// --- Types ---

type Priority = 'low' | 'medium' | 'high';
type TaskStatus = 'todo' | 'in_progress' | 'done';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  app: string;
  dueDate: string | null;
  createdAt: string;
  rolledOver: boolean;
}

// --- Constants ---

const STORAGE_KEY = 'watchtower_daily_tasks';

const priorityBorder: Record<Priority, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-400',
  low: 'border-l-slate-500',
};

const priorityBadge: Record<Priority, string> = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const statusColors: Record<TaskStatus, { dot: string; label: string }> = {
  todo: { dot: 'bg-blue-500', label: 'To Do' },
  in_progress: { dot: 'bg-purple-500', label: 'In Progress' },
  done: { dot: 'bg-emerald-500', label: 'Done' },
};

const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'done'];

const appList = apps.map(a => a.name);

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

function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

// --- Persistence ---

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function processRollover(tasks: Task[]): Task[] {
  const today = todayStr();
  return tasks.map(t => {
    if (t.status !== 'done' && t.dueDate && t.dueDate < today && !t.rolledOver) {
      return { ...t, rolledOver: true };
    }
    return t;
  });
}

// --- Modal Component ---

interface TaskModalProps {
  task: Partial<Task> | null;
  isEdit: boolean;
  defaultDate?: string;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'rolledOver'> & { id?: string }) => void;
  onClose: () => void;
}

function TaskModal({ task, isEdit, defaultDate, onSave, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [app, setApp] = useState(task?.app || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || defaultDate || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [titleError, setTitleError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      onSave({
        ...(isEdit && task?.id ? { id: task.id } : {}),
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        app,
        dueDate: dueDate || null,
      });
      setSaving(false);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); setTitleError(''); }}
                onBlur={() => { if (!title.trim()) setTitleError('Title is required'); }}
                className={`w-full px-3 py-2 rounded-lg bg-slate-800 border text-sm focus:outline-none focus:border-blue-500 transition-colors ${titleError ? 'border-red-500' : 'border-white/10'}`}
                placeholder="What needs to be done?"
                autoFocus
              />
              {titleError && <p className="text-xs text-red-400 mt-1">{titleError}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                rows={3}
                placeholder="Optional details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">App</label>
                <select
                  value={app}
                  onChange={e => setApp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">None</option>
                  {appList.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Day</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm focus:outline-none focus:border-blue-500"
                >
                  {statusOrder.map(s => <option key={s} value={s}>{statusColors[s].label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

function DeleteConfirm({ taskTitle, onConfirm, onCancel }: { taskTitle: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold mb-2">Delete Task</h3>
        <p className="text-sm text-slate-400 mb-4">
          Are you sure you want to delete "<span className="text-slate-200">{taskTitle}</span>"? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors">Delete</button>
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
  const st = statusColors[task.status];

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, task.id)}
      className={`bg-slate-800/60 border border-white/5 rounded-lg p-2 border-l-[3px] ${priorityBorder[task.priority]} cursor-grab active:cursor-grabbing hover:border-white/10 transition-all group`}
    >
      <div className="flex items-start gap-1.5">
        {/* Status dot — click to cycle */}
        <button
          onClick={() => onStatusCycle(task)}
          className="mt-0.5 flex-shrink-0"
          title={`${st.label} — click to change`}
        >
          {task.status === 'done' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
            </svg>
          ) : (
            <div className={`w-3.5 h-3.5 rounded-full border-2 ${task.status === 'in_progress' ? 'border-purple-400 bg-purple-400/20' : 'border-slate-500'}`} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium leading-tight truncate ${task.status === 'done' ? 'line-through text-slate-500' : ''}`}>
            {task.title}
          </p>
          <div className="flex items-center flex-wrap gap-1 mt-1">
            {task.app && (
              <span className="px-1 py-0 rounded text-[9px] font-medium bg-slate-700/50 text-slate-400 border border-white/5 truncate max-w-[80px]">
                {task.app}
              </span>
            )}
            <span className={`px-1 py-0 rounded text-[9px] font-medium border ${priorityBadge[task.priority]}`}>
              {task.priority[0].toUpperCase()}
            </span>
            {task.rolledOver && (
              <span className="text-[9px] text-orange-400" title="Rolled over">🔄</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(task)} className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-slate-200" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
          <button onClick={() => onDelete(task)} className="p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400" title="Delete">
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
      className={`bg-slate-900/30 border rounded-xl overflow-hidden transition-colors ${isDragOver ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/5'}`}
      onDragOver={onDragOver}
      onDragLeave={e => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs font-semibold">Backlog</span>
        </div>
        <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="p-2 space-y-1.5 max-h-[300px] overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-[10px] text-slate-600 text-center py-4">No unscheduled tasks</p>
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [appFilter, setAppFilter] = useState('all');
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [showBacklog, setShowBacklog] = useState(true);

  const weekStart = useMemo(() => {
    const base = getWeekStart(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const today = todayStr();

  useEffect(() => {
    const raw = loadTasks();
    const processed = processRollover(raw);
    setTasks(processed);
    saveTasks(processed);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveTasks(tasks);
  }, [tasks, loaded]);

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
      // tasks outside this week aren't shown (except backlog)
    });

    // Sort each day: high first, done last
    const priorityWeight: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
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

  const handleAddTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'rolledOver'> & { id?: string }) => {
    const newTask: Task = {
      id: generateId(),
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      app: data.app,
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
      rolledOver: false,
    };
    setTasks(prev => [newTask, ...prev]);
    setModalOpen(false);
    setModalDefaultDate('');
  }, []);

  const handleEditTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'rolledOver'> & { id?: string }) => {
    if (!data.id) return;
    setTasks(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
    setEditingTask(null);
  }, []);

  const handleStatusCycle = useCallback((task: Task) => {
    const next: Record<TaskStatus, TaskStatus> = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next[t.status] } : t));
  }, []);

  const handleDelete = useCallback(() => {
    if (!deletingTask) return;
    setTasks(prev => prev.filter(t => t.id !== deletingTask.id));
    setDeletingTask(null);
  }, [deletingTask]);

  const handleMoveOverdueToToday = useCallback(() => {
    const weekStartStr = dateStr(weekStart);
    setTasks(prev => prev.map(t => {
      if (t.dueDate && t.dueDate < weekStartStr && t.status !== 'done') {
        return { ...t, dueDate: today, rolledOver: true };
      }
      return t;
    }));
  }, [weekStart, today]);

  // Drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, target: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(target);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetDate: string | null) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, dueDate: targetDate } : t));
    }
    setDragOverTarget(null);
  }, []);

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

  if (!loaded) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-lg w-64" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-800/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Weekly Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">{formatWeekRange(weekStart)}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={appFilter}
            onChange={e => setAppFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Apps</option>
            {usedApps.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button
            onClick={() => setShowBacklog(!showBacklog)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${showBacklog ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-white/10 text-slate-400'}`}
          >
            Backlog
          </button>
          <button
            onClick={() => { setModalDefaultDate(today); setModalOpen(true); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5"
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
            className="p-1.5 rounded-lg bg-slate-800 border border-white/10 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${weekOffset === 0 ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-white/10 text-slate-400 hover:text-white'}`}
          >
            This Week
          </button>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="p-1.5 rounded-lg bg-slate-800 border border-white/10 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          {weekTaskCount.total > 0 && (
            <span>
              <span className="text-emerald-400 font-medium">{weekTaskCount.done}</span>/{weekTaskCount.total} done
            </span>
          )}
          {overdueCount > 0 && (
            <button
              onClick={handleMoveOverdueToToday}
              className="text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
            >
              🔄 {overdueCount} overdue — move to today
            </button>
          )}
        </div>
      </div>

      {/* Weekly Grid + Backlog */}
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
              className={`bg-slate-900/30 border rounded-xl overflow-hidden transition-colors flex flex-col ${
                isDragOver ? 'border-blue-500/50 bg-blue-500/5' :
                isToday ? 'border-blue-500/30 bg-blue-500/[0.03]' :
                'border-white/5'
              }`}
              onDragOver={e => handleDragOver(e, key)}
              onDragLeave={() => setDragOverTarget(null)}
              onDrop={e => handleDrop(e, key)}
            >
              {/* Day header */}
              <div className={`px-2 py-2 border-b border-white/5 flex items-center justify-between ${isToday ? 'bg-blue-500/10' : ''}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-medium uppercase tracking-wide ${isToday ? 'text-blue-400' : isPast ? 'text-slate-600' : 'text-slate-500'}`}>
                    {dayName}
                  </span>
                  <span className={`text-sm font-bold ${isToday ? 'text-blue-400' : isPast ? 'text-slate-600' : 'text-slate-300'}`}>
                    {dayNum}
                  </span>
                </div>
                <button
                  onClick={() => { setModalDefaultDate(key); setModalOpen(true); }}
                  className="p-0.5 rounded hover:bg-white/10 text-slate-600 hover:text-slate-300 transition-colors"
                  title={`Add task to ${DAY_NAMES_FULL[d.getDay()]}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                </button>
              </div>

              {/* Tasks */}
              <div className="p-1.5 space-y-1.5 flex-1 min-h-[120px] overflow-y-auto">
                {dayTasks.length === 0 ? (
                  <p className="text-[10px] text-slate-700 text-center py-6">
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
                <div className="px-2 py-1 border-t border-white/5 text-[10px] text-slate-600">
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

      {/* Modals */}
      {modalOpen && (
        <TaskModal task={null} isEdit={false} defaultDate={modalDefaultDate} onSave={handleAddTask} onClose={() => { setModalOpen(false); setModalDefaultDate(''); }} />
      )}
      {editingTask && (
        <TaskModal task={editingTask} isEdit={true} onSave={handleEditTask} onClose={() => setEditingTask(null)} />
      )}
      {deletingTask && (
        <DeleteConfirm taskTitle={deletingTask.title} onConfirm={handleDelete} onCancel={() => setDeletingTask(null)} />
      )}
    </div>
  );
}
