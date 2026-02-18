
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableGroup {
  prefix: string;
  tables: string[];
}

const PREFIX_MAP: Record<string, string> = {
  af_: 'Agentflow (af_)',
  cr_: 'CUDL Rate (cr_)',
  wt_: 'Watchtower (wt_)',
  bitw_: 'BITW (bitw_)',
  betahub_: 'BetaHub',
};

function groupTablesByPrefix(tableNames: string[]): TableGroup[] {
  const grouped: Record<string, string[]> = {};
  const other: string[] = [];

  for (const name of tableNames) {
    let matched = false;
    for (const prefix of Object.keys(PREFIX_MAP)) {
      if (name.startsWith(prefix)) {
        const label = PREFIX_MAP[prefix];
        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(name);
        matched = true;
        break;
      }
    }
    if (!matched) {
      other.push(name);
    }
  }

  const groups: TableGroup[] = [];
  for (const [prefix, tables] of Object.entries(grouped)) {
    groups.push({ prefix, tables });
  }
  groups.sort((a, b) => a.prefix.localeCompare(b.prefix));

  if (other.length > 0) {
    groups.push({ prefix: 'Core', tables: other });
  }

  return groups;
}

export default function SchemaBrowser() {
  const [tables, setTables] = useState<string[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState<string | null>(null);

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [columnsError, setColumnsError] = useState<string | null>(null);

  // Load table list
  useEffect(() => {
    let cancelled = false;
    async function fetchTables() {
      setTablesLoading(true);
      setTablesError(null);
      const { data, error } = await supabase.rpc('get_public_tables');
      if (cancelled) return;
      if (error) {
        setTablesError(error.message);
        setTablesLoading(false);
        return;
      }
      const names = (data as { table_name: string }[]).map((r) => r.table_name);
      setTables(names);
      if (names.length > 0 && !selectedTable) {
        setSelectedTable(names[0]);
      }
      setTablesLoading(false);
    }
    fetchTables();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load columns for selected table
  const fetchColumns = useCallback(async (tableName: string) => {
    setColumnsLoading(true);
    setColumnsError(null);
    setColumns([]);
    const { data, error } = await supabase.rpc('get_table_columns', { p_table_name: tableName });
    if (error) {
      setColumnsError(error.message);
      setColumnsLoading(false);
      return;
    }
    setColumns(data as TableColumn[]);
    setColumnsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchColumns(selectedTable);
    }
  }, [selectedTable, fetchColumns]);

  const schemas = groupTablesByPrefix(tables);

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
          {tablesLoading && (
            <div className="flex items-center justify-center py-8">
              <span className="text-xs text-slate-500 animate-pulse">Loading tables...</span>
            </div>
          )}
          {tablesError && (
            <div className="px-3 py-4 text-xs text-red-400">{tablesError}</div>
          )}
          {!tablesLoading && !tablesError && tables.length === 0 && (
            <div className="px-3 py-4 text-xs text-slate-500">No tables found</div>
          )}
          {!tablesLoading && !tablesError && schemas.map((group) => (
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
              <h2 className="text-xl font-bold font-mono text-blue-400">{selectedTable ?? '—'}</h2>
              {selectedTable && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold uppercase tracking-wider">Table</span>
              )}
            </div>
            <p className="text-xs text-slate-500">Public Schema</p>
          </div>
          <div className="flex gap-2">
            <button title="Coming soon" className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold border border-white/10 transition-colors">Export SQL</button>
            <button title="Coming soon" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg">New Migration</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            {/* Columns section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Columns</h3>

              {columnsLoading && (
                <div className="flex items-center justify-center py-12">
                  <span className="text-xs text-slate-500 animate-pulse">Loading columns...</span>
                </div>
              )}

              {columnsError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
                  {columnsError}
                </div>
              )}

              {!columnsLoading && !columnsError && !selectedTable && (
                <div className="rounded-xl border border-white/5 p-6 text-center text-xs text-slate-500">
                  Select a table to view its columns
                </div>
              )}

              {!columnsLoading && !columnsError && selectedTable && columns.length === 0 && (
                <div className="rounded-xl border border-white/5 p-6 text-center text-xs text-slate-500">
                  No columns found for this table
                </div>
              )}

              {!columnsLoading && !columnsError && columns.length > 0 && (
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
                      {columns.map((col) => (
                        <tr key={col.column_name} className="hover:bg-white/2">
                          <td className="px-6 py-4">
                            <span className="text-slate-300">{col.column_name}</span>
                          </td>
                          <td className="px-6 py-4 text-blue-400">{col.data_type}</td>
                          <td className="px-6 py-4 text-slate-500 italic">{col.is_nullable}</td>
                          <td className="px-6 py-4 text-slate-500 italic">{col.column_default ?? '-'}</td>
                          <td className="px-6 py-4 text-slate-500">-</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
