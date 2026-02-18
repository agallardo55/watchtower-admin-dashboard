
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { icons, sidebarNav } from './constants';
import { IconProps } from './types';
import { supabase } from './lib/supabase';
import Dashboard from './pages/Dashboard';
import Development from './pages/Development';
import AllUsers from './pages/AllUsers';
import Settings from './pages/Settings';
import Tickets from './pages/Tickets';
import BITWManager from './pages/BITWManager';
import DevelopmentOverview from './pages/DevelopmentOverview';
import NotFound from './pages/NotFound';
import DailyTasks from './pages/DailyTasks';
import FeatureRequests from './pages/FeatureRequests';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

const Layout: React.FC<{ children: React.ReactNode; darkMode: boolean; toggleTheme: () => void }> = ({ children, darkMode, toggleTheme }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-expand parent nav when a child route is active
  useEffect(() => {
    sidebarNav.forEach(item => {
      if (item.children && item.children.some(c => c.path === location.pathname)) {
        setExpandedNav(prev => prev.includes(item.label) ? prev : [...prev, item.label]);
      }
    });
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

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
    if (path.startsWith('/development/')) {
      const slug = path.split('/')[2];
      return `Development / ${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
    }
    return 'Dashboard';
  };

  const sidebarContent = (
    <>
      <div className={`p-4 lg:p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-lg flex-shrink-0">W</div>
          {!isSidebarCollapsed && <span className="font-bold text-lg">Watchtower</span>}
        </div>
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto py-4 space-y-1 ${isSidebarCollapsed ? 'px-2' : 'px-3 lg:px-4'}`}>
        {sidebarNav.map((item) => {
          const Icon = (icons as Record<string, React.FC<IconProps>>)[item.icon];
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedNav.includes(item.label);
          const isParentActive = hasChildren
            ? location.pathname.startsWith(item.path)
            : location.pathname === item.path;

          if (hasChildren) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => isSidebarCollapsed ? navigate(item.path) : toggleNavExpand(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative ${
                    isSidebarCollapsed ? 'justify-center' : ''
                  } ${
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
                          ) : child.icon && (icons as Record<string, React.FC<IconProps>>)[child.icon] ? (
                            <span className="text-slate-500">{React.createElement((icons as Record<string, React.FC<IconProps>>)[child.icon])}</span>
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
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                isParentActive
                  ? (darkMode ? `bg-blue-600/10 text-blue-500 ${isSidebarCollapsed ? '' : 'border-l-2 border-blue-600 rounded-l-none'}` : `bg-blue-50 text-blue-600 ${isSidebarCollapsed ? '' : 'border-l-2 border-blue-600 rounded-l-none'}`)
                  : 'hover:bg-white/5 text-slate-500 hover:text-slate-200'
              }`}
            >
              <div className={`${isParentActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300'}`}>
                <Icon />
              </div>
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle — sidebar footer, desktop only */}
      <div className={`hidden lg:flex justify-center p-4 border-t ${darkMode ? 'border-white/5' : 'border-slate-200'}`}>
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`flex items-center justify-center p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 flex-shrink-0 ${isSidebarCollapsed ? 'rotate-180' : ''}`}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9-3 3 3 3"/></svg>
        </button>
      </div>
    </>
  );

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — desktop: static, mobile: fixed overlay */}
      <aside style={isSidebarCollapsed ? { width: 80, minWidth: 80, maxWidth: 80 } : { width: 240, minWidth: 240, maxWidth: 240 }} className={`
        flex flex-col border-r transition-all duration-300 overflow-hidden flex-shrink-0
        ${darkMode ? 'bg-slate-950 border-white/5' : 'bg-white border-slate-200'}
        hidden lg:flex
      `}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col border-r transition-transform duration-300 ease-in-out lg:hidden
        ${darkMode ? 'bg-slate-950 border-white/5' : 'bg-white border-slate-200'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className={`sticky top-0 z-30 flex items-center justify-between px-3 py-2.5 border-b lg:hidden ${darkMode ? 'bg-slate-950 border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">W</div>
              <span className="font-bold text-base">Watchtower</span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </button>
        </div>

        {/* Desktop Header */}
        <header className={`sticky top-0 z-30 h-16 hidden lg:flex items-center justify-between px-8 border-b ${darkMode ? 'bg-slate-950/80 border-white/5 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'}`}>
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

            <div className="flex items-center gap-3 ml-2">
              <div className="text-right">
                <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Adam Gallardo</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Super Admin</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">AG</div>
            </div>

            <button
              onClick={() => supabase.auth.signOut()}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-slate-400 hover:text-red-400' : 'hover:bg-slate-100 text-slate-600 hover:text-red-500'}`}
              title="Sign out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>

          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'forgot'>('login');

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setAuthView('login'); // reset view on sign in
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading...</div>
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
      <Layout darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/development/overview" element={<DevelopmentOverview />} />
          <Route path="/development/:appSlug?" element={<Development />} />
          <Route path="/users/:appSlug?" element={<AllUsers />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/bitw" element={<BITWManager />} />
          <Route path="/daily-tasks" element={<DailyTasks />} />
          <Route path="/feature-requests" element={<FeatureRequests />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
