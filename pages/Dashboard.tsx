
import React from 'react';
import { apps, recentActivity, icons } from '../constants';
const dashboardStats = [
  { label: "Total Apps", value: "10", sublabel: "6 public, 4 internal", trend: "+2 this month", color: "blue", icon: "grid" },
  { label: "Total Users", value: "47", sublabel: "Across all apps", trend: "+12 this week", color: "emerald", icon: "users" },
  { label: "Database Tables", value: "36", sublabel: "Watchtower shared DB", trend: "3 schemas", color: "purple", icon: "database" },
  { label: "Pending Invitations", value: "8", sublabel: "5 accepted this week", trend: "62% acceptance", color: "orange", icon: "mail" }
];

export default function Dashboard() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => {
          const Icon = (icons as any)[stat.icon];
          const colorMap: Record<string, string> = {
            blue: 'text-blue-500 bg-blue-500/10',
            emerald: 'text-emerald-500 bg-emerald-500/10',
            purple: 'text-purple-500 bg-purple-500/10',
            orange: 'text-orange-500 bg-orange-500/10',
          };
          return (
            <div key={stat.label} className="glass p-6 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${colorMap[stat.color]}`}>
                  <Icon />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                  {stat.trend}
                </span>
              </div>
              <div>
                <h4 className="text-3xl font-bold mb-1 tracking-tight">{stat.value}</h4>
                <p className="text-sm font-medium text-slate-300 mb-1">{stat.label}</p>
                <p className="text-[11px] text-slate-500">{stat.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* App Status Table */}
        <div className="lg:col-span-2 glass rounded-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-lg">App Status Overview</h3>
            <button className="text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 border-b border-white/5 bg-white/2">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">App</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Database</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Users</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {apps.slice(0, 6).map((app) => (
                  <tr key={app.name} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{app.icon}</span>
                        <div>
                          <p className="font-semibold">{app.name}</p>
                          <p className="text-[10px] text-slate-500">{app.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        app.status === 'live' ? 'bg-emerald-500/10 text-emerald-500' :
                        app.status === 'beta' ? 'bg-yellow-500/10 text-yellow-500' :
                        app.status === 'paused' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-slate-500/10 text-slate-500'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400 truncate max-w-[140px]">{app.db}</p>
                    </td>
                    <td className="px-6 py-4 font-medium">{app.users}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><icons.edit /></button>
                        {app.url && <a href={app.url} target="_blank" className="p-1.5 hover:bg-white/10 rounded-lg text-blue-500 transition-colors"><icons.externalLink /></a>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="glass rounded-xl flex flex-col">
          <div className="p-5 border-b border-white/5">
            <h3 className="font-semibold text-lg">Recent Activity</h3>
          </div>
          <div className="p-5 flex-1 space-y-6">
            {recentActivity.map((activity, idx) => {
              const colorType = {
                feature: 'bg-emerald-500',
                spec: 'bg-blue-500',
                schema: 'bg-purple-500',
                deploy: 'bg-orange-500',
                launch: 'bg-red-500',
              };
              return (
                <div key={idx} className="flex gap-4 relative">
                  {idx !== recentActivity.length - 1 && (
                    <div className="absolute top-6 left-[7px] w-px h-[calc(100%-12px)] bg-slate-800"></div>
                  )}
                  <div className={`mt-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 z-10 ${colorType[activity.type]}`}></div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">{activity.app}</span>
                      <span className="text-[10px] text-slate-500">{activity.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{activity.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
