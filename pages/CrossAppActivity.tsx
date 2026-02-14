
import React from 'react';
import { apps, icons } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const barData = apps.slice(0, 8).map(app => ({
  name: app.name,
  users: app.users + Math.floor(Math.random() * 10),
  color: app.status === 'live' ? '#10b981' : app.status === 'beta' ? '#f59e0b' : '#325AE7'
}));

const overlapData = [
  { appA: 'BuybidHQ', appB: 'SalesboardHQ', count: 12 },
  { appA: 'BuybidHQ', appB: 'Copilot', count: 5 },
  { appA: 'SalesboardHQ', appB: 'Copilot', count: 8 },
  { appA: 'Demolight', appB: 'SalesLog', count: 14 }
];

export default function CrossAppActivity() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cross-App Activity</h2>
        <p className="text-slate-500 mt-1">Analyze how users move between and engage with multiple apps in the ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overlap Matrix */}
        <div className="glass rounded-xl p-6">
          <div className="mb-6">
            <h3 className="font-bold text-lg">User Overlap Heatmap</h3>
            <p className="text-xs text-slate-500">Number of shared users between different applications</p>
          </div>
          
          <div className="relative overflow-x-auto">
             <table className="w-full text-xs border-collapse">
               <thead>
                 <tr>
                   <th className="p-2"></th>
                   {apps.slice(0, 5).map(app => (
                     <th key={app.name} className="p-2 font-mono text-slate-500 -rotate-45 h-20 origin-bottom-left text-[10px]">{app.name}</th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {apps.slice(0, 5).map((appY, idxY) => (
                   <tr key={appY.name}>
                     <td className="p-2 font-bold text-right text-slate-500 border-r border-white/5">{appY.name}</td>
                     {apps.slice(0, 5).map((appX, idxX) => {
                       const count = idxX === idxY ? appY.users : Math.floor(Math.random() * 15);
                       const intensity = idxX === idxY ? 'bg-blue-600/60' : count > 10 ? 'bg-blue-600/40' : count > 5 ? 'bg-blue-600/20' : 'bg-blue-600/5';
                       return (
                         <td key={appX.name} className={`p-4 border border-white/5 text-center ${intensity} font-bold text-slate-100`}>
                           {count}
                         </td>
                       );
                     })}
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>

        {/* Engagement Bar Chart */}
        <div className="glass rounded-xl p-6">
          <div className="mb-6">
            <h3 className="font-bold text-lg">Total Engagement by App</h3>
            <p className="text-xs text-slate-500">Active sessions per app in the last 30 days</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} hide />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px'}}
                  itemStyle={{color: '#f1f5f9'}}
                />
                <Bar dataKey="users" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Power Users Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Cross-App Power Users</h3>
            <p className="text-xs text-slate-500">Users active across 3 or more applications</p>
          </div>
          <button className="text-xs font-bold text-blue-500 border border-blue-500/20 px-3 py-1 rounded-lg hover:bg-blue-500/10 transition-colors">Export Segment</button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-white/2 text-slate-500 border-b border-white/5">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">User</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Email</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">App Access</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Total Sessions</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              { name: 'John Doe', email: 'john@carsoft.com', active: ['🏷️', '📊', '🤖'], sessions: 142, last: '2 hours ago' },
              { name: 'Sarah Wilson', email: 'sarah@dealers.io', active: ['🏷️', '📈', '🔄'], sessions: 98, last: '5 hours ago' },
              { name: 'Mike Miller', email: 'mike@millerauto.net', active: ['📊', '📈', '🤝'], sessions: 84, last: '1 day ago' },
              { name: 'Emma Watson', email: 'emma@watsonauto.com', active: ['🤖', '🔄', '📝'], sessions: 210, last: '12 mins ago' }
            ].map((user, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-semibold">{user.name}</td>
                <td className="px-6 py-4 text-slate-400 text-xs">{user.email}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {user.active.map((emoji, i) => (
                      <span key={i} className="w-6 h-6 rounded bg-slate-900 border border-white/5 flex items-center justify-center text-xs shadow-inner" title="App Access">{emoji}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-blue-400">{user.sessions}</td>
                <td className="px-6 py-4 text-slate-500 text-xs italic">{user.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
