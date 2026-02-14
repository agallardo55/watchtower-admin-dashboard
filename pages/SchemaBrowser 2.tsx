
import React, { useState } from 'react';

const schemas = [
  { prefix: 'Core', tables: ['apps', 'profiles', 'invitations', 'app_access'] },
  { prefix: 'BetaHub', tables: ['betahub_apps', 'betahub_feedback'] },
  { prefix: 'Agentflow (af_)', tables: ['af_flows', 'af_nodes', 'af_edges', 'af_logs', 'af_sessions', 'af_variables', 'af_triggers'] },
  { prefix: 'CUDL Rate (cr_)', tables: ['cr_rates', 'cr_unions', 'cr_history', 'cr_alerts', 'cr_configs', 'cr_mapping'] },
  { prefix: 'Other', tables: ['prolease_calculations'] }
];

const mockColumns = [
  { name: 'id', type: 'uuid', nullable: 'NO', default: 'gen_random_uuid()', pk: true },
  { name: 'created_at', type: 'timestamp with time zone', nullable: 'NO', default: 'now()', pk: false },
  { name: 'app_name', type: 'text', nullable: 'NO', default: 'NULL', pk: false },
  { name: 'owner_id', type: 'uuid', nullable: 'NO', default: 'NULL', pk: false, fk: 'profiles.id' },
  { name: 'status', type: 'text', nullable: 'YES', default: "'idea'", pk: false }
];

export default function SchemaBrowser() {
  const [selectedTable, setSelectedTable] = useState('apps');

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 max-w-7xl mx-auto overflow-hidden">
      {/* Table List */}
      <div className="w-[300px] flex flex-col glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/2">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
            Watchtower DB
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-4">
          {schemas.map((group) => (
            <div key={group.prefix}>
              <h4 className="px-3 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-widest">{group.prefix}</h4>
              <div className="space-y-0.5">
                {group.tables.map((table) => (
                  <button
                    key={table}
                    onClick={() => setSelectedTable(table)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2 ${
                      selectedTable === table 
                        ? 'bg-blue-600 text-white font-semibold' 
                        : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="opacity-50">#</span>
                    {table}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Detail */}
      <div className="flex-1 flex flex-col glass rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold font-mono text-blue-400">{selectedTable}</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold uppercase tracking-wider">Table</span>
            </div>
            <p className="text-xs text-slate-500">Public Schema • 47 rows • 1.2MB total size</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold border border-white/10 transition-colors">Export SQL</button>
            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg">New Migration</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            {/* Columns section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Columns</h3>
              <div className="rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-500 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Column</th>
                      <th className="px-6 py-3 font-semibold">Type</th>
                      <th className="px-6 py-3 font-semibold">Nullable</th>
                      <th className="px-6 py-3 font-semibold">Default</th>
                      <th className="px-6 py-3 font-semibold">References</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-950">
                    {mockColumns.map((col) => (
                      <tr key={col.name} className="hover:bg-white/2">
                        <td className="px-6 py-4 flex items-center gap-2">
                          {col.pk && (
                            <svg className="text-yellow-500" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
                          )}
                          <span className={col.pk ? 'text-slate-100 font-bold' : 'text-slate-300'}>{col.name}</span>
                        </td>
                        <td className="px-6 py-4 text-blue-400">{col.type}</td>
                        <td className="px-6 py-4 text-slate-500 italic">{col.nullable}</td>
                        <td className="px-6 py-4 text-slate-500 italic">{col.default}</td>
                        <td className="px-6 py-4">
                          {col.fk ? (
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">{col.fk}</span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sample Data (Read Only)</h3>
                <span className="text-[10px] text-slate-600">Showing first 5 rows</span>
              </div>
              <div className="rounded-xl border border-white/5 overflow-hidden bg-slate-900/50 p-6 flex flex-col items-center justify-center h-48 border-dashed">
                 <svg className="text-slate-800 mb-3" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                 <p className="text-sm font-medium text-slate-700 uppercase tracking-widest">Preview Mode Enabled</p>
                 <p className="text-[10px] text-slate-800 mt-1">Connect to live instance to browse rows</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
