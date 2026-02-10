
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { icons, sidebarNav } from './constants';
import Dashboard from './pages/Dashboard';
import AppRegistry from './pages/AppRegistry';
import BITWManager from './pages/BITWManager';
import SchemaBrowser from './pages/SchemaBrowser';
import GraduationQueue from './pages/GraduationQueue';
import CrossAppActivity from './pages/CrossAppActivity';
import Development from './pages/Development';
import AllUsers from './pages/AllUsers';
import Analytics from './pages/Analytics';

const Layout: React.FC<{ children: React.ReactNode; darkMode: boolean; toggleTheme: () => void }> = ({ children, darkMode, toggleTheme }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  const getBreadcrumb = () => {
    const path = location.pathname;
    const findItem = sidebarNav.flatMap(s => s.items).find(i => i.path === path);
    return findItem ? findItem.label : 'Dashboard';
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside className={`flex flex-col border-r transition-all duration-300 ${darkMode ? 'bg-slate-950 border-white/5' : 'bg-white border-slate-200'} ${isSidebarCollapsed ? 'w-20' : 'w-[240px]'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-lg">W</div>
          {!isSidebarCollapsed && <span className="font-bold text-lg">Watchtower</span>}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {sidebarNav.map((section) => (
            <div key={section.section}>
              {!isSidebarCollapsed && <h3 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">{section.section}</h3>}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = (icons as any)[item.icon];
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group relative ${
                        isActive 
                          ? (darkMode ? 'bg-blue-600/10 text-blue-500 border-l-2 border-blue-600 rounded-l-none' : 'bg-blue-50 text-blue-600 border-l-2 border-blue-600 rounded-l-none') 
                          : 'hover:bg-white/5 text-slate-500 hover:text-slate-200'
                      }`}
                    >
                      <div className={`${isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        <Icon />
                      </div>
                      {!isSidebarCollapsed && <span>{item.label}</span>}
                      {isSidebarCollapsed && (
                        <div className="absolute left-14 bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={`p-4 border-t ${darkMode ? 'border-white/5' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">AG</div>
            {!isSidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">Adam Gallardo</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Super Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`sticky top-0 z-30 h-16 flex items-center justify-between px-8 border-b ${darkMode ? 'bg-slate-950/80 border-white/5 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'}`}>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <span>Watchtower</span>
            <span className="text-slate-700">/</span>
            <span className={darkMode ? 'text-slate-100' : 'text-slate-900'}>{getBreadcrumb()}</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <icons.search />
              </div>
              <input 
                type="text" 
                placeholder="Global Search..." 
                className={`pl-10 pr-4 py-1.5 rounded-lg text-sm w-64 border focus:outline-none transition-all ${
                  darkMode ? 'bg-slate-900 border-white/5 focus:border-blue-500 focus:bg-slate-800' : 'bg-slate-100 border-slate-200 focus:border-blue-500 focus:bg-white'
                }`}
              />
            </div>

            <button className={`relative p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
              <icons.bell />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
            </button>

            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="lg:hidden text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('bg-slate-950');
      document.body.classList.remove('bg-slate-50');
    } else {
      document.body.classList.remove('bg-slate-950');
      document.body.classList.add('bg-slate-50');
    }
  }, [darkMode]);

  return (
    <HashRouter>
      <Layout darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/apps" element={<AppRegistry />} />
          <Route path="/bitw" element={<BITWManager />} />
          <Route path="/schema" element={<SchemaBrowser />} />
          <Route path="/graduation" element={<GraduationQueue />} />
          <Route path="/users" element={<AllUsers />} />
          <Route path="/cross-app" element={<CrossAppActivity />} />
          <Route path="/development" element={<Development />} />
          {/* Placeholder routes */}
          <Route path="*" element={<div className="flex items-center justify-center h-full text-slate-500">Module under development</div>} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
