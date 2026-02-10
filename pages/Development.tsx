
import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate?: string;
}

const initialTasks: Task[] = [
  // Specs
  { id: '1', title: 'Dealerment spec', description: 'Onboarding workflow, account setup, copilot', completed: false, priority: 'high', category: 'Specs' },
  { id: '2', title: 'BITW consulting agency spec', description: 'Service offerings, pricing, positioning', completed: false, priority: 'high', category: 'Specs' },
  { id: '3', title: 'Substack charts', description: 'AI × knowledge work convergence + atoms/physical work 20yr trend', completed: false, priority: 'medium', category: 'Content' },
  // Research
  { id: '4', title: 'Research: AI Mac file sync', description: 'How heavy users solve dedicated machine syncing', completed: false, priority: 'medium', category: 'Research' },
  { id: '5', title: 'Research: AirPods/Watch → Telegram', description: 'Seamless voice trigger to Kitt', completed: false, priority: 'medium', category: 'Research' },
  { id: '6', title: 'Research: content repurposing', description: 'One video → YouTube + Twitter + Facebook + Substack', completed: false, priority: 'medium', category: 'Research' },
  { id: '7', title: 'Research: token usage tracking', description: 'Measure output across all AI tools', completed: false, priority: 'medium', category: 'Research' },
  { id: '8', title: 'Research: local compute', description: 'Used Mac Minis for 24/7 inference', completed: false, priority: 'low', category: 'Research' },
  { id: '9', title: 'Sales manager workflow map', description: 'Full responsibility breakdown + token cost analysis', completed: false, priority: 'medium', category: 'Research' },
  // Infrastructure
  { id: '10', title: 'Apply SalesLogHQ schema', description: 'Run migration against Watchtower Supabase', completed: false, priority: 'high', category: 'Infrastructure' },
  { id: '11', title: 'Fix NAS backup cron', description: 'Hung mount issue on WD MyCloud', completed: false, priority: 'medium', category: 'Infrastructure' },
  { id: '12', title: 'Codex CLI re-auth', description: 'Needs escalated permissions', completed: false, priority: 'medium', category: 'Infrastructure' },
  { id: '13', title: 'Netlify CLI re-auth', description: 'netlify logout && netlify login', completed: false, priority: 'low', category: 'Infrastructure' },
  { id: '14', title: 'Kitt memory upgrade', description: 'Evaluate SQLite + vector DB', completed: false, priority: 'low', category: 'Infrastructure' },
  // Completed
  { id: '15', title: 'Pipeline spec', description: 'Specs/build-in-the-wild/PIPELINE.md (11KB)', completed: true, priority: 'high', category: 'Specs' },
  { id: '16', title: 'Human-in-the-loop gates', description: '2 gates: approve idea, approve product', completed: true, priority: 'high', category: 'Specs' },
  { id: '17', title: 'Obsidian Sync setup', description: 'Vault at ~/Documents/CMIG Partners/', completed: true, priority: 'high', category: 'Infrastructure' },
  { id: '18', title: 'Substack posts merged', description: 'Workflow V2 + Issue #2 combined', completed: true, priority: 'medium', category: 'Content' },
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
  const [filter, setFilter] = useState<string>('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as Task['priority'], category: 'Specs' });

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description || undefined,
      completed: false,
      priority: newTask.priority,
      category: newTask.category,
    };
    setTasks(prev => [task, ...prev]);
    setNewTask({ title: '', description: '', priority: 'medium', category: 'Specs' });
    setShowAddTask(false);
  };

  const todoTasks = tasks.filter(t => !t.completed && (filter === 'all' || t.category === filter));
  const doneTasks = tasks.filter(t => t.completed);
  const categories = ['all', ...Array.from(new Set(tasks.map(t => t.category)))];

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.completed).length,
    high: tasks.filter(t => !t.completed && t.priority === 'high').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Development</h1>
          <p className="text-slate-500 text-sm mt-1">Daily tasks and individual work items</p>
        </div>
        <button
          onClick={() => setShowAddTask(!showAddTask)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Task
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-white/5 rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium">Total Tasks</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium">Completed</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">{stats.done}</p>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium">Remaining</p>
          <p className="text-2xl font-bold mt-1 text-blue-400">{stats.total - stats.done}</p>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium">High Priority</p>
          <p className="text-2xl font-bold mt-1 text-red-400">{stats.high}</p>
        </div>
      </div>

      {/* Add Task Panel */}
      {showAddTask && (
        <div className="bg-slate-900 border border-white/5 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold">New Task</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Task title..."
              value={newTask.title}
              onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              className="bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 col-span-2"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              className="bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 col-span-2"
            />
            <select
              value={newTask.priority}
              onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
              className="bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select
              value={newTask.category}
              onChange={e => setNewTask(prev => ({ ...prev, category: e.target.value }))}
              className="bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="Specs">Specs</option>
              <option value="Research">Research</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Content">Content</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={addTask} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">Save Task</button>
            <button onClick={() => setShowAddTask(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'bg-slate-900 text-slate-500 border border-white/5 hover:text-slate-300'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* To Do */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-semibold text-lg">📋 To Do</h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{todoTasks.length}</span>
          </div>
          <div className="space-y-2">
            {todoTasks.map(task => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="bg-slate-900 border border-white/5 rounded-xl p-4 cursor-pointer hover:border-white/10 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded border-2 border-slate-600 group-hover:border-blue-500 transition-colors flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{task.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-slate-500 text-xs mt-1">{task.description}</p>
                    )}
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium mt-2 ${categoryColors[task.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {task.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {todoTasks.length === 0 && (
              <div className="text-center py-12 text-slate-600 text-sm">
                No tasks in this category 🎉
              </div>
            )}
          </div>
        </div>

        {/* Done */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-semibold text-lg">✅ Done</h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">{doneTasks.length}</span>
          </div>
          <div className="space-y-2">
            {doneTasks.map(task => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="bg-slate-900/50 border border-white/5 rounded-xl p-4 cursor-pointer hover:border-white/10 transition-all group opacity-60"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm line-through text-slate-500">{task.title}</span>
                    {task.description && (
                      <p className="text-slate-600 text-xs mt-1 line-through">{task.description}</p>
                    )}
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium mt-2 ${categoryColors[task.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {task.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
