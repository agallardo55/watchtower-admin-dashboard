
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { icons, sidebarNav } from './constants';
import Dashboard from './pages/Dashboard';
import AppRegistry from './pages/AppRegistry';
import Development from './pages/Development';
import AllUsers from './pages/AllUsers';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

const Layout: React.FC<{ children: React.ReactNode; darkMode: boolean; toggleTheme: () => void; onSignOut: () => void }> = ({ children, darkMode, toggleTheme, onSignOut }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  const getBreadcrumb = () => {
    const path = location.pathname;
    const findItem = sidebarNav.find(i => i.path === path);
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

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {sidebarNav.map((item) => {
            const Icon = (icons as any)[item.icon];
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative ${
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
            {!isSidebarCollapsed && (
              <button
                onClick={onSignOut}
                className="text-slate-500 hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              </button>
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'forgot'>('login');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('bg-slate-950');
      document.body.classList.remove('bg-slate-50');
    } else {
      document.body.classList.remove('bg-slate-950');
      document.body.classList.add('bg-slate-50');
    }
  }, [darkMode]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    if (authView === 'forgot') {
      return <ForgotPassword onBack={() => setAuthView('login')} />;
    }
    return <Login onForgotPassword={() => setAuthView('forgot')} />;
  }

  return (
    <HashRouter>
      <Layout darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} onSignOut={handleSignOut}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/apps" element={<AppRegistry />} />
          <Route path="/development" element={<Development />} />
          <Route path="/users" element={<AllUsers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<div className="flex items-center justify-center h-full text-slate-500">Module under development</div>} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
