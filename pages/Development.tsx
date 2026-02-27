
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useApps } from '../hooks/useApps';
import { supabaseAdmin } from '../lib/supabase';

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  status: TaskStatus;
  priority: 'high' | 'medium' | 'low';
  category: string;
  app: string;
  app_id: string | null;
}

const categoryColors: Record<string, string> = {
  'specs': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'research': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'infrastructure': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'content': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'development': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const categoryLabels: Record<string, string> = {
  specs: 'Specs', research: 'Research', infrastructure: 'Infrastructure',
  content: 'Content', development: 'Development',
};

const priorityColors: Record<string, string> = {
  'high': 'bg-red-500/10 text-red-400',
  'medium': 'bg-yellow-500/10 text-yellow-400',
  'low': 'bg-slate-500/10 text-slate-400',
};

export default function Development() {
  const { apps } = useApps();
  const { appSlug } = useParams<{ appSlug?: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  // Build app lookup maps
  const appIdToName = Object.fromEntries(apps.map(a => [a.id, a.name]));
  const appNameToId = Object.fromEntries(apps.map(a => [a.name, a.id]));

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseAdmin
      .from('wt_tasks')
      .select('id, title, description, category, priority, status, app_id, completed_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch tasks:', error.message);
      setTasks([]);
    } else {
      setTasks((data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || undefined,
        completed: row.status === 'done',
        status: row.status as TaskStatus,
        priority: row.priority,
        category: row.category || 'development',
        app: appIdToName[row.app_id] || 'Watchtower',
        app_id: row.app_id,
      })));
    }
    setLoading(false);
  }, [apps.length]);

  useEffect(() => {
    if (apps.length > 0) fetchTasks();
  }, [fetchTasks, apps.length]);

  // Resolve app name from slug
  const currentApp = appSlug
    ? apps.find(a => a.name.toLowerCase().replace(/\s+/g, '-') === appSlug)?.name
      || tasks.find(t => t.app.toLowerCase().replace(/\s+/g, '-') === appSlug)?.app
      || null
    : null;

  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as Task['priority'], category: 'specs', status: 'todo' as TaskStatus, app: currentApp || 'Watchtower' });

  // Filter by app from URL, then by category
  const appFiltered = currentApp ? tasks.filter(t => t.app === currentApp) : tasks;
  const filtered = categoryFilter === 'all' ? appFiltered : appFiltered.filter(t => t.category === categoryFilter);

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const byPriority = (a: Task, b: Task) => priorityOrder[a.priority] - priorityOrder[b.priority];
  const todoTasks = filtered.filter(t => t.status === 'todo' || t.status === 'in_progress').sort(byPriority);
  const reviewTasks = filtered.filter(t => t.status === 'review').sort(byPriority);
  const doneTasks = filtered.filter(t => t.status === 'done').sort(byPriority);
  const categories = ['all', ...Array.from(new Set(tasks.map(t => t.category)))];

  const stats = {
    total: appFiltered.length,
    done: appFiltered.filter(t => t.completed).length,
    high: appFiltered.filter(t => !t.completed && t.priority === 'high').length,
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    setSaving(true);
    const { error } = await supabaseAdmin
      .from('wt_tasks')
      .insert({
        title: newTask.title,
        description: newTask.description || null,
        status: newTask.status,
        priority: newTask.priority,
        category: newTask.category,
        app_id: appNameToId[newTask.app] || null,
        completed_at: newTask.status === 'done' ? new Date().toISOString() : null,
      });

    if (error) {
      console.error('Failed to create task:', error.message);
    } else {
      setNewTask({ title: '', description: '', priority: 'medium', category: 'specs', status: 'todo', app: currentApp || 'Watchtower' });
      setShowAddTask(false);
      fetchTasks();
    }
    setSaving(false);
  };

  const saveEditTask = async () => {
    if (!editingTask) return;
    setSaving(true);
    const { error } = await supabaseAdmin
      .from('wt_tasks')
      .update({
        title: editingTask.title,
        description: editingTask.description || null,
        status: editingTask.status,
        priority: editingTask.priority,
        category: editingTask.category,
        app_id: appNameToId[editingTask.app] || null,
        completed_at: editingTask.status === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', editingTask.id);

    if (error) {
      console.error('Failed to update task:', error.message);
    } else {
      setEditingTask(null);
      fetchTasks();
    }
    setSaving(false);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const deleteTask = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    setSaving(true);
    const { error } = await supabaseAdmin
      .from('wt_tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', showDeleteConfirm);

    if (error) {
      console.error('Failed to delete task:', error.message);
    } else {
      setShowDeleteConfirm(null);
      setEditingTask(null);
      fetchTasks();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {currentApp ? `${apps.find(a => a.name === currentApp)?.icon || ''} ${currentApp}` : 'Development'}
          </h2>
          <p className="text-slate-500 mt-1">
            {currentApp ? `Tasks for ${currentApp}.` : 'Daily tasks and work items across all applications.'}
          </p>
        </div>
        <button
          onClick={() => { setNewTask(prev => ({ ...prev, app: currentApp || 'Watchtower' })); setShowAddTask(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Task
        </button>
      </div>

      {/* Stat line */}
      <p className="text-sm text-slate-400">
        <span className="text-slate-200 font-semibold">{stats.total}</span> tasks
        <span className="mx-1.5 text-slate-700">&middot;</span>
        <span className="text-emerald-400 font-semibold">{stats.done}</span> completed
        <span className="mx-1.5 text-slate-700">&middot;</span>
        <span className="text-blue-400 font-semibold">{stats.total - stats.done}</span> remaining
        <span className="mx-1.5 text-slate-700">&middot;</span>
        <span className="text-red-400 font-semibold">{stats.high}</span> high priority
      </p>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'bg-slate-900 text-slate-500 border border-white/5 hover:text-slate-300'
            }`}
          >
            {cat === 'all' ? 'All' : (categoryLabels[cat] || cat)}
          </button>
        ))}
      </div>

      {loading && <p className="text-slate-500 text-sm">Loading tasks...</p>}

      {/* 3-column kanban */}
      <div className="flex lg:grid lg:grid-cols-3 gap-4 lg:gap-6 overflow-x-auto pb-4 lg:pb-0 -mx-1 px-1">
        {/* Each column needs min-width on mobile for horizontal scroll */}
        {/* To Do */}
        <div className="min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-semibold text-lg">To Do</h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{todoTasks.length}</span>
          </div>
          <div className="space-y-2">
            {todoTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setEditingTask({ ...task })}
                className="bg-slate-900 border border-white/5 rounded-xl p-4 cursor-pointer hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{task.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>{task.priority}</span>
                </div>
                {task.description && <p className="text-slate-500 text-xs mt-1">{task.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${categoryColors[task.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{categoryLabels[task.category] || task.category}</span>
                  {!currentApp && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 font-medium">{task.app}</span>
                  )}
                </div>
              </div>
            ))}
            {todoTasks.length === 0 && <div className="text-center py-12 text-slate-600 text-sm">No tasks here</div>}
          </div>
        </div>

        {/* Review */}
        <div className="min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-semibold text-lg">Review</h2>
            <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">{reviewTasks.length}</span>
          </div>
          <div className="space-y-2">
            {reviewTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setEditingTask({ ...task })}
                className="bg-slate-900 border border-yellow-500/10 rounded-xl p-4 cursor-pointer hover:border-yellow-500/20 transition-all"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{task.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>{task.priority}</span>
                </div>
                {task.description && <p className="text-slate-500 text-xs mt-1">{task.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${categoryColors[task.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{categoryLabels[task.category] || task.category}</span>
                  {!currentApp && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 font-medium">{task.app}</span>
                  )}
                </div>
              </div>
            ))}
            {reviewTasks.length === 0 && <div className="text-center py-12 text-slate-600 text-sm">No tasks in review</div>}
          </div>
        </div>

        {/* Done */}
        <div className="min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-semibold text-lg">Done</h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">{doneTasks.length}</span>
          </div>
          <div className="space-y-2">
            {doneTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setEditingTask({ ...task })}
                className="bg-slate-900/50 border border-white/5 rounded-xl p-4 cursor-pointer hover:border-white/10 transition-all opacity-60"
              >
                <span className="font-medium text-sm line-through text-slate-500">{task.title}</span>
                {task.description && <p className="text-slate-600 text-xs mt-1 line-through">{task.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${categoryColors[task.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{categoryLabels[task.category] || task.category}</span>
                  {!currentApp && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 font-medium">{task.app}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border-white/10">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">New Task</h3>
                <p className="text-xs text-slate-500 mt-1">Add a new task to your development board.</p>
              </div>
              <button onClick={() => setShowAddTask(false)} className="text-slate-500 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <form className="p-6 space-y-5" onSubmit={e => { e.preventDefault(); addTask(); }}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Task Title</label>
                <input type="text" required placeholder="What needs to be done?" value={newTask.title} onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <textarea rows={3} placeholder="Additional details (optional)" value={newTask.description} onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">App</label>
                  <select value={newTask.app} onChange={e => setNewTask(prev => ({ ...prev, app: e.target.value }))} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="Watchtower">Watchtower</option>
                    {apps.map(a => (
                      <option key={a.name} value={a.name}>{a.icon} {a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <select value={newTask.category} onChange={e => setNewTask(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="specs">Specs</option>
                    <option value="research">Research</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="content">Content</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select value={newTask.status} onChange={e => setNewTask(prev => ({ ...prev, status: e.target.value as TaskStatus }))} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowAddTask(false)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50">{saving ? 'Saving...' : 'Add Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-400">Delete Task</h3>
            <p className="text-sm text-slate-400">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={saving} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">{saving ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border-white/10">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Edit Task</h3>
                <p className="text-xs text-slate-500 mt-1">Update task details or mark as complete.</p>
              </div>
              <button onClick={() => setEditingTask(null)} className="text-slate-500 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <form className="p-6 space-y-5" onSubmit={e => { e.preventDefault(); saveEditTask(); }}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Task Title</label>
                <input type="text" required value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <textarea rows={3} placeholder="Additional details (optional)" value={editingTask.description || ''} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">App</label>
                  <select value={editingTask.app} onChange={e => setEditingTask({ ...editingTask, app: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="Watchtower">Watchtower</option>
                    {apps.map(a => (
                      <option key={a.name} value={a.name}>{a.icon} {a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <select value={editingTask.category} onChange={e => setEditingTask({ ...editingTask, category: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="specs">Specs</option>
                    <option value="research">Research</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="content">Content</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Priority</label>
                  <select value={editingTask.priority} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select value={editingTask.status} onChange={e => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" disabled={saving} onClick={() => deleteTask(editingTask.id)} className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-semibold transition-colors">Delete</button>
                <div className="flex-1" />
                <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
