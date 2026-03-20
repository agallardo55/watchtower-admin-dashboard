
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

const categoryStyles: Record<string, React.CSSProperties> = {
  specs:          { color: 'var(--info)', background: 'rgba(59,130,246,0.1)',   border: '1px solid rgba(59,130,246,0.2)',   padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  research:       { color: 'var(--purple)', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  infrastructure: { color: 'var(--warning)', background: 'rgba(245,158,11,0.1)',  border: '1px solid rgba(245,158,11,0.2)',  padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  content:        { color: 'var(--accent)', background: 'var(--accent-bg-hover)',  border: '1px solid var(--accent-border)',  padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  development:    { color: 'var(--info)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
};

const defaultCategoryStyle: React.CSSProperties = {
  color: 'var(--text-secondary)', background: 'rgba(102,102,102,0.1)', border: '1px solid rgba(102,102,102,0.2)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600,
};

const categoryLabels: Record<string, string> = {
  specs: 'Specs', research: 'Research', infrastructure: 'Infrastructure',
  content: 'Content', development: 'Development',
};

const priorityStyles: Record<string, React.CSSProperties> = {
  high:   { color: 'var(--danger)', background: 'rgba(239,68,68,0.1)',   border: '1px solid rgba(239,68,68,0.2)',   padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  medium: { color: 'var(--warning)', background: 'rgba(245,158,11,0.1)',  border: '1px solid rgba(245,158,11,0.2)',  padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  low:    { color: 'var(--text-secondary)', background: 'rgba(102,102,102,0.1)', border: '1px solid rgba(102,102,102,0.2)', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '8px 12px',
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
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
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>// development</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {currentApp ? `${apps.find(a => a.name === currentApp)?.icon || ''} ${currentApp}` : 'development'}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {currentApp ? `Tasks for ${currentApp}.` : 'Daily tasks and work items across all applications.'}
          </p>
        </div>
        <button
          onClick={() => { setNewTask(prev => ({ ...prev, app: currentApp || 'Watchtower' })); setShowAddTask(true); }}
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)', border: 'none', borderRadius: '4px', padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Task
        </button>
      </div>

      {/* Stat line */}
      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{stats.total}</span> tasks
        <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>&middot;</span>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{stats.done}</span> completed
        <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>&middot;</span>
        <span style={{ color: 'var(--info)', fontWeight: 600 }}>{stats.total - stats.done}</span> remaining
        <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>&middot;</span>
        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{stats.high}</span> high priority
      </p>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={
              categoryFilter === cat
                ? { background: 'var(--accent-bg-hover)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: '999px', padding: '6px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
                : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '999px', padding: '6px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
            }
          >
            {cat === 'all' ? 'All' : (categoryLabels[cat] || cat)}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>loading tasks...</p>}

      {/* 3-column kanban */}
      <div className="flex lg:grid lg:grid-cols-3 gap-4 lg:gap-6 overflow-x-auto pb-4 lg:pb-0 -mx-1 px-1">
        {/* To Do */}
        <div className="min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
          <div className="flex items-center gap-3 mb-4">
            <h2 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              To Do
            </h2>
            <span style={{ fontSize: 10, background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '1px 8px', borderRadius: '999px', border: '1px solid var(--border)' }}>
              {todoTasks.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todoTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                currentApp={currentApp}
                onClick={() => setEditingTask({ ...task })}
              />
            ))}
            {todoTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>No tasks here</div>
            )}
          </div>
        </div>

        {/* Review */}
        <div className="min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
          <div className="flex items-center gap-3 mb-4">
            <h2 style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              Review
            </h2>
            <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', padding: '1px 8px', borderRadius: '999px', border: '1px solid rgba(245,158,11,0.2)' }}>
              {reviewTasks.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reviewTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                currentApp={currentApp}
                onClick={() => setEditingTask({ ...task })}
                accentBorder="rgba(245,158,11,0.15)"
                accentBorderHover="rgba(245,158,11,0.3)"
              />
            ))}
            {reviewTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>No tasks in review</div>
            )}
          </div>
        </div>

        {/* Done */}
        <div className="min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
          <div className="flex items-center gap-3 mb-4">
            <h2 style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              Done
            </h2>
            <span style={{ fontSize: 10, background: 'var(--accent-bg-hover)', color: 'var(--accent)', padding: '1px 8px', borderRadius: '999px', border: '1px solid var(--accent-border)' }}>
              {doneTasks.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {doneTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                currentApp={currentApp}
                onClick={() => setEditingTask({ ...task })}
                done
              />
            ))}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(10,10,10,0.9)' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', maxWidth: 540, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>New Task</h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>Add a new task to your development board.</p>
              </div>
              <button onClick={() => setShowAddTask(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <form style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={e => { e.preventDefault(); addTask(); }}>
              <div>
                <label style={labelStyle}>Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Additional details (optional)"
                  value={newTask.description}
                  onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  style={{ ...inputStyle, resize: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>App</label>
                  <select
                    value={newTask.app}
                    onChange={e => setNewTask(prev => ({ ...prev, app: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <option value="Watchtower">Watchtower</option>
                    {apps.map(a => (
                      <option key={a.name} value={a.name}>{a.icon} {a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={newTask.category}
                    onChange={e => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <option value="specs">Specs</option>
                    <option value="research">Research</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="content">Content</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={newTask.status}
                    onChange={e => setNewTask(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, paddingTop: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '4px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ flex: 1, padding: '8px 16px', background: 'var(--accent)', color: 'var(--bg-primary)', border: 'none', borderRadius: '4px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.5 : 1 }}
                >
                  {saving ? 'Saving...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ background: 'rgba(10,10,10,0.9)' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', maxWidth: 400, padding: '24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--danger)', marginBottom: 8, marginTop: 0 }}>Delete Task</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Are you sure? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '4px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                style={{ flex: 1, padding: '8px 16px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.5 : 1 }}
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(10,10,10,0.9)' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', maxWidth: 540, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Edit Task</h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>Update task details or mark as complete.</p>
              </div>
              <button onClick={() => setEditingTask(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <form style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={e => { e.preventDefault(); saveEditTask(); }}>
              <div>
                <label style={labelStyle}>Task Title</label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Additional details (optional)"
                  value={editingTask.description || ''}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>App</label>
                  <select
                    value={editingTask.app}
                    onChange={e => setEditingTask({ ...editingTask, app: e.target.value })}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <option value="Watchtower">Watchtower</option>
                    {apps.map(a => (
                      <option key={a.name} value={a.name}>{a.icon} {a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={editingTask.category}
                    onChange={e => setEditingTask({ ...editingTask, category: e.target.value })}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <option value="specs">Specs</option>
                    <option value="research">Research</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="content">Content</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={editingTask.status}
                    onChange={e => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, paddingTop: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => deleteTask(editingTask.id)}
                  style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', borderRadius: '4px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Delete
                </button>
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '4px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 16px', background: 'var(--accent)', color: 'var(--bg-primary)', border: 'none', borderRadius: '4px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.5 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TaskCard ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  currentApp: string | null;
  onClick: () => void;
  done?: boolean;
  accentBorder?: string;
  accentBorderHover?: string;
}

function TaskCard({ task, currentApp, onClick, done, accentBorder, accentBorderHover }: TaskCardProps) {
  const [hovered, setHovered] = useState(false);

  const baseBorder = accentBorder || 'var(--border)';
  const hoverBorder = accentBorderHover || 'var(--border-accent)';

  const cardStyle: React.CSSProperties = {
    background: done ? 'var(--bg-input)' : (hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)'),
    border: `1px solid ${hovered ? hoverBorder : baseBorder}`,
    borderRadius: '4px',
    padding: 16,
    cursor: 'pointer',
    marginBottom: 0,
    opacity: done ? 0.5 : 1,
    transition: 'background 0.15s, border-color 0.15s',
  };

  const catStyle = categoryStyles[task.category] || defaultCategoryStyle;
  const priStyle = priorityStyles[task.priority] || priorityStyles['low'];

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={done ? { fontWeight: 500, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' } : { fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>
          {task.title}
        </span>
        <span style={priStyle}>
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p style={done ? { color: 'var(--text-muted)', fontSize: 11, marginTop: 4, textDecoration: 'line-through', marginBottom: 0 } : { color: 'var(--text-muted)', fontSize: 11, marginTop: 4, marginBottom: 0 }}>
          {task.description}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={catStyle}>
          {categoryLabels[task.category] || task.category}
        </span>
        {!currentApp && (
          <span style={{ background: 'var(--bg-elevated)', color: 'var(--text-dim)', fontSize: 10, padding: '1px 8px', borderRadius: 3, border: '1px solid var(--border)' }}>
            {task.app}
          </span>
        )}
      </div>
    </div>
  );
}
