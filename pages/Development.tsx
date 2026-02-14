
import React, { useState } from 'react';
import { apps } from '../constants';

type TaskStatus = 'todo' | 'review' | 'done';
interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  status: TaskStatus;
  priority: 'high' | 'medium' | 'low';
  category: string;
  app: string;
}

const initialTasks: Task[] = [
  { id: '1', title: 'Dealerment spec', description: 'Onboarding workflow, account setup, copilot', completed: false, status: 'todo', priority: 'high', category: 'Specs', app: 'Dealerment' },
  { id: '2', title: 'BITW consulting agency spec', description: 'Service offerings, pricing, positioning', completed: false, status: 'todo', priority: 'high', category: 'Specs', app: 'Watchtower' },
  { id: '3', title: 'Substack charts', description: 'AI \u00d7 knowledge work convergence + atoms/physical work 20yr trend', completed: false, status: 'review', priority: 'medium', category: 'Content', app: 'Watchtower' },
  { id: '4', title: 'Research: AI Mac file sync', description: 'How heavy users solve dedicated machine syncing', completed: false, status: 'todo', priority: 'medium', category: 'Research', app: 'Watchtower' },
  { id: '5', title: 'Research: AirPods/Watch \u2192 Telegram', description: 'Seamless voice trigger to Kitt', completed: false, status: 'todo', priority: 'medium', category: 'Research', app: 'Sidepilot' },
  { id: '6', title: 'Research: content repurposing', description: 'One video \u2192 YouTube + Twitter + Facebook + Substack', completed: false, status: 'review', priority: 'medium', category: 'Research', app: 'Watchtower' },
  { id: '7', title: 'Research: token usage tracking', description: 'Measure output across all AI tools', completed: false, status: 'todo', priority: 'medium', category: 'Research', app: 'Watchtower' },
  { id: '8', title: 'Research: local compute', description: 'Used Mac Minis for 24/7 inference', completed: false, status: 'todo', priority: 'low', category: 'Research', app: 'Watchtower' },
  { id: '9', title: 'Sales manager workflow map', description: 'Full responsibility breakdown + token cost analysis', completed: false, status: 'todo', priority: 'medium', category: 'Research', app: 'SalesboardHQ' },
  { id: '10', title: 'Apply SalesLogHQ schema', description: 'Run migration against Watchtower Supabase', completed: false, status: 'todo', priority: 'high', category: 'Infrastructure', app: 'SalesLogHQ' },
  { id: '11', title: 'Fix NAS backup cron', description: 'Hung mount issue on WD MyCloud', completed: false, status: 'review', priority: 'medium', category: 'Infrastructure', app: 'Watchtower' },
  { id: '12', title: 'Codex CLI re-auth', description: 'Needs escalated permissions', completed: false, status: 'todo', priority: 'medium', category: 'Infrastructure', app: 'Watchtower' },
  { id: '13', title: 'Netlify CLI re-auth', description: 'netlify logout && netlify login', completed: false, status: 'todo', priority: 'low', category: 'Infrastructure', app: 'Watchtower' },
  { id: '14', title: 'Kitt memory upgrade', description: 'Evaluate SQLite + vector DB', completed: false, status: 'todo', priority: 'low', category: 'Infrastructure', app: 'Sidepilot' },
  { id: '15', title: 'Pipeline spec', description: 'Specs/build-in-the-wild/PIPELINE.md (11KB)', completed: true, status: 'done', priority: 'high', category: 'Specs', app: 'Watchtower' },
  { id: '16', title: 'Human-in-the-loop gates', description: '2 gates: approve idea, approve product', completed: true, status: 'done', priority: 'high', category: 'Specs', app: 'Agentflow' },
  { id: '17', title: 'Obsidian Sync setup', description: 'Vault at ~/Documents/CMIG Partners/', completed: true, status: 'done', priority: 'high', category: 'Infrastructure', app: 'Watchtower' },
  { id: '18', title: 'Substack posts merged', description: 'Workflow V2 + Issue #2 combined', completed: true, status: 'done', priority: 'medium', category: 'Content', app: 'Watchtower' },
  { id: '19', title: 'V2 bid response portal', description: 'Buyer-facing bid response page + SMS integration', completed: false, status: 'todo', priority: 'high', category: 'Specs', app: 'BuybidHQ' },
  { id: '20', title: 'Wholesale order PDF export', description: 'WA Form #2060 download button', completed: false, status: 'review', priority: 'medium', category: 'Infrastructure', app: 'BuybidHQ' },
];

const categoryColors: Record<string, string> = {
  'Specs': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Research': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Infrastructure': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Content': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const priorityColors: Record<string, string> = {
  'high': 'bg-red-500/10 text-red-400',
  'medium': 'bg-yellow-500/10 text-yellow-400',
  'low': 'bg-slate-500/10 text-slate-400',
};

export default function Development() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [appTab, setAppTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as Task['priority'], category: 'Specs', status: 'todo' as TaskStatus, app: 'Watchtower' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Build app tabs from tasks + known apps
  const taskApps = Array.from(new Set(tasks.map(t => t.app)));
  const appTabs = ['all', ...taskApps.sort()];

  // Filter by app tab, then by category
  const appFiltered = appTab === 'all' ? tasks : tasks.filter(t => t.app === appTab);
  const filtered = categoryFilter === 'all' ? appFiltered : appFiltered.filter(t => t.category === categoryFilter);

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const byPriority = (a: Task, b: Task) => priorityOrder[a.priority] - priorityOrder[b.priority];
  const todoTasks = filtered.filter(t => t.status === 'todo').sort(byPriority);
  const reviewTasks = filtered.filter(t => t.status === 'review').sort(byPriority);
  const doneTasks = filtered.filter(t => t.status === 'done').sort(byPriority);
  const categories = ['all', ...Array.from(new Set(tasks.map(t => t.category)))];

  const stats = {
    total: appFiltered.length,
    done: appFiltered.filter(t => t.completed).length,
    high: appFiltered.filter(t => !t.completed && t.priority === 'high').length,
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description || undefined,
      completed: newTask.status === 'done',
      status: newTask.status,
      priority: newTask.priority,
      category: newTask.category,
      app: newTask.app,
    };
    setTasks(prev => [task, ...prev]);
    setNewTask({ title: '', description: '', priority: 'medium', category: 'Specs', status: 'todo', app: appTab === 'all' ? 'Watchtower' : appTab });
    setShowAddTask(false);
  };

  const saveEditTask = () => {
    if (!editingTask) return;
    const updated = { ...editingTask, completed: editingTask.status === 'done' };
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTask(null);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setEditingTask(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Development</h2>
          <p className="text-slate-500 mt-1">Daily tasks and work items across all applications.</p>
        </div>
        <button
          onClick={() => { setNewTask(prev => ({ ...prev, app: appTab === 'all' ? 'Watchtower' : appTab })); setShowAddTask(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Task
        </button>
      </div>

      {/* App Tabs */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg w-fit overflow-x-auto">
        {appTabs.map(tab => {
          const appEntry = apps.find(a => a.name === tab);
          const count = tab === 'all' ? tasks.length : tasks.filter(t => t.app === tab).length;
          return (
            <button
              key={tab}
              onClick={() => { setAppTab(tab); setCategoryFilter('all'); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                appTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'all' ? 'All Apps' : <><span>{appEntry?.icon || ''}</span>{tab}</>}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${appTab === tab ? 'bg-white/20' : 'bg-white/5'}`}>{count}</span>
            </button>
          );
        })}
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
      <div className="flex gap-2">
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
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* 3-column kanban */}
      <div className="grid grid-cols-3 gap-6">
        {/* To Do */}
        <div>
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
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${categoryColors[task.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{task.category}</span>
                  {appTab === 'all' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 font-medium">{task.app}</span>
                  )}
                </div>
              </div>
            ))}
            {todoTasks.length === 0 && <div className="text-center py-12 text-slate-600 text-sm">No tasks here</div>}
          </div>
        </div>

        {/* Review */}
        <div>
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
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${categoryColors[task.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{task.category}</span>
                  {appTab === 'all' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 font-medium">{task.app}</span>
                  )}
                </div>
              </div>
            ))}
            {reviewTasks.length === 0 && <div className="text-center py-12 text-slate-600 text-sm">No tasks in review</div>}
          </div>
        </div>

        {/* Done */}
        <div>
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
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${categoryColors[task.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{task.category}</span>
                  {appTab === 'all' && (
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
                    <option value="Specs">Specs</option>
                    <option value="Research">Research</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Content">Content</option>
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
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowAddTask(false)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">Add Task</button>
              </div>
            </form>
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
                    <option value="Specs">Specs</option>
                    <option value="Research">Research</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Content">Content</option>
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
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => deleteTask(editingTask.id)} className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-semibold transition-colors">Delete</button>
                <div className="flex-1" />
                <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
