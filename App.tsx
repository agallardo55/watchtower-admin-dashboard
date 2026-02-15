
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { icons, sidebarNav } from './constants';
import Dashboard from './pages/Dashboard';
import Development from './pages/Development';
import AllUsers from './pages/AllUsers';
import Settings from './pages/Settings';
import Tickets from './pages/Tickets';
import BITWManager from './pages/BITWManager';
import DevelopmentOverview from './pages/DevelopmentOverview';

const Layout: React.FC<{ children: React.ReactNode; darkMode: boolean; toggleTheme: () => void }> = ({ children, darkMode, toggleTheme }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedNav, setExpandedNav] = useState<string[]>([]);
  const location = useLocation();

  // Auto-expand parent nav when a child route is active
  useEffect(() => {
    sidebarNav.forEach(item => {
      if (item.children && item.children.some(c => c.path === location.pathname)) {
        setExpandedNav(prev => prev.includes(item.label) ? prev : [...prev, item.label]);
      }
    });
  }, [location.pathname]);

  const toggleNavExpand = (label: string) => {
    setExpandedNav(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    for (const item of sidebarNav) {
      if (item.path === path && !item.children) return item.label;
      if (item.children) {
        const child = item.children.find(c => c.path === path);
        if (child) return child.path === item.path ? item.label : `${item.label} / ${child.label}`;
      }
    }
    // Handle dynamic /development/:slug not in static children
    if (path.startsWith('/development/')) {
      const slug = path.split('/')[2];
      return `Development / ${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
    }
    return 'Dashboard';
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
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedNav.includes(item.label);
            const isParentActive = hasChildren
              ? location.pathname.startsWith(item.path)
              : location.pathname === item.path;

            if (hasChildren) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleNavExpand(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative ${
                      isParentActive
                        ? (darkMode ? 'bg-blue-600/10 text-blue-500' : 'bg-blue-50 text-blue-600')
                        : 'hover:bg-white/5 text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <div className={`${isParentActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300'}`}>
                      <Icon />
                    </div>
                    {!isSidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <icons.chevronDown className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </>
                    )}
                    {isSidebarCollapsed && (
                      <div className="absolute left-14 bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </button>
                  {isExpanded && !isSidebarCollapsed && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-white/5 pl-3">
                      {item.children!.map(child => {
                        const isChildActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                              isChildActive
                                ? (darkMode ? 'text-blue-400 bg-blue-600/5' : 'text-blue-600 bg-blue-50')
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            {child.icon && child.icon.length <= 3 ? (
                              <span className="text-sm">{child.icon}</span>
                            ) : child.icon && (icons as any)[child.icon] ? (
                              <span className="text-slate-500">{React.createElement((icons as any)[child.icon])}</span>
                            ) : null}
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative ${
                  isParentActive
                    ? (darkMode ? 'bg-blue-600/10 text-blue-500 border-l-2 border-blue-600 rounded-l-none' : 'bg-blue-50 text-blue-600 border-l-2 border-blue-600 rounded-l-none')
                    : 'hover:bg-white/5 text-slate-500 hover:text-slate-200'
                }`}
              >
                <div className={`${isParentActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300'}`}>
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
          <Route path="/development/overview" element={<DevelopmentOverview />} />
          <Route path="/development/:appSlug?" element={<Development />} />
          <Route path="/users/:appSlug?" element={<AllUsers />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/bitw" element={<BITWManager />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<div className="flex items-center justify-center h-full text-slate-500">Module under development</div>} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
