
import React, { useState, useEffect, useMemo } from 'react';
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
import ActivityOverview from './pages/ActivityOverview';
import AppActivity from './pages/AppActivity';
import SecondBrain from './pages/SecondBrain';
import { useApps } from './hooks/useApps';

const Layout: React.FC<{ children: React.ReactNode; theme: 'light' | 'dark'; onToggleTheme: () => void }> = ({ children, theme, onToggleTheme }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { apps } = useApps();

  const dynamicNav = useMemo(() => {
    return sidebarNav.map(item => {
      if (item.label === 'Development' && item.children) {
        return {
          ...item,
          children: [
            ...item.children,
            ...apps.map(a => ({ label: a.name, icon: a.icon || 'package', iconUrl: a.iconUrl, path: `/development/${a.name.toLowerCase().replace(/\s+/g, '-')}` })),
          ],
        };
      }
      if (item.label === 'Users' && item.children) {
        return {
          ...item,
          children: [
            ...item.children,
            ...apps.map(a => ({ label: a.name, icon: a.icon || 'package', iconUrl: a.iconUrl, path: `/users/${a.name.toLowerCase().replace(/\s+/g, '-')}` })),
          ],
        };
      }
      if (item.label === 'Activity' && item.children) {
        return {
          ...item,
          children: [
            ...item.children,
            ...apps.map(a => ({ label: a.name, icon: a.icon || 'package', iconUrl: a.iconUrl, path: `/activity/${a.slug || a.name.toLowerCase().replace(/\s+/g, '-')}` })),
          ],
        };
      }
      return item;
    });
  }, [apps]);

  // Auto-expand parent nav when a child route is active
  useEffect(() => {
    dynamicNav.forEach(item => {
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
    for (const item of dynamicNav) {
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
        <div className={`flex items-center gap-1.5 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <img src="/watchtower-icon.png" alt="Watchtower" className="w-8 h-8 flex-shrink-0" />
          {!isSidebarCollapsed && <span className="font-bold text-lg text-slate-900 tracking-tight">Watchtower</span>}
        </div>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto py-4 space-y-0.5 ${isSidebarCollapsed ? 'px-2' : 'px-2 lg:px-3'}`}>
        {dynamicNav.map((item) => {
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
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition-all group relative ${
                    isSidebarCollapsed ? 'justify-center' : ''
                  } ${
                    isParentActive
                      ? 'text-blue-400 bg-blue-500/5 border-l-2 border-blue-500'
                      : 'hover:bg-[#111] text-slate-600 hover:text-slate-900 border-l-2 border-transparent'
                  }`}
                >
                  <div className={`${isParentActive ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                    <Icon />
                  </div>
                  {!isSidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left text-[13px] leading-5">{item.label}</span>
                      <icons.chevronDown className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
                {isExpanded && !isSidebarCollapsed && (
                  <div className="ml-4 mt-0.5 space-y-0 border-l border-[#1e293b] pl-3">
                    {item.children!.map(child => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`flex items-center gap-2 px-3 py-1 text-xs transition-all ${
                            isChildActive
                              ? 'text-blue-400'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {child.iconUrl ? (
                            <img src={child.iconUrl} alt="" className="w-4 h-4 border border-[#1e293b] bg-[#111] object-contain" />
                          ) : child.icon && (icons as Record<string, React.FC<IconProps>>)[child.icon] ? (
                            <span className="text-slate-500">{React.createElement((icons as Record<string, React.FC<IconProps>>)[child.icon])}</span>
                          ) : child.icon ? (
                            <span className="text-slate-500"><icons.package className="w-4 h-4" /></span>
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
              className={`flex items-center gap-3 px-3 py-2 text-xs transition-all group relative ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                isParentActive
                  ? 'text-blue-400 bg-blue-500/5 border-l-2 border-blue-500'
                  : 'hover:bg-[#111] text-slate-600 hover:text-slate-900 border-l-2 border-transparent'
              }`}
            >
              <div className={`${isParentActive ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                <Icon />
              </div>
              {!isSidebarCollapsed && <span className="text-[13px] leading-5">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="hidden lg:flex justify-end p-4 border-t border-[#1e293b]">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="flex items-center justify-center p-1.5 hover:bg-[#111] text-slate-500 hover:text-slate-900 transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 flex-shrink-0 ${isSidebarCollapsed ? 'rotate-180' : ''}`}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9-3 3 3 3"/></svg>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-slate-900">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={isSidebarCollapsed ? { width: 80, minWidth: 80, maxWidth: 80 } : { width: 240, minWidth: 240, maxWidth: 240 }} className="flex flex-col border-r transition-all duration-300 overflow-hidden flex-shrink-0 bg-[#0a0a0a] border-[#1e293b] hidden lg:flex shadow-[18px_0_48px_rgba(15,23,42,0.06)]">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col border-r transition-transform duration-300 ease-in-out lg:hidden bg-[#0a0a0a] border-[#1e293b] shadow-[18px_0_48px_rgba(15,23,42,0.12)] ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-3 py-2.5 border-b lg:hidden bg-[#0a0a0a] border-[#1e293b] backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-[#111] text-slate-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <div className="flex items-center gap-2">
              <img src="/watchtower-icon.png" alt="Watchtower" className="w-7 h-7" />
              <span className="font-bold text-base text-slate-900">Watchtower</span>
            </div>
          </div>
          <button
            onClick={onToggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-[#1e293b] bg-[#111] px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-[#111]"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <icons.moon className="w-4 h-4" /> : <icons.sun className="w-4 h-4" />}
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>
        </div>

        {/* Desktop Header */}
        <header className="sticky top-0 z-30 h-14 hidden lg:flex items-center justify-between px-6 border-b bg-[#0a0a0a] border-[#1e293b] backdrop-blur">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Watchtower</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-900">{getBreadcrumb()}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onToggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-[#1e293b] bg-[#111] px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-[#111]"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <icons.moon className="w-4 h-4" /> : <icons.sun className="w-4 h-4" />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                <icons.search />
              </div>
              <input
                type="text"
                placeholder="Global Search..."
                className="pl-10 pr-4 py-1.5 text-xs w-56 border bg-[#111] border-[#1e293b] rounded-full focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button className="relative p-2 hover:bg-[#111] text-slate-500 transition-colors">
              <icons.bell />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a]"></span>
            </button>

            <div className="flex items-center gap-3 ml-2">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-900">Adam Gallardo</p>
                <p className="text-[9px] text-slate-600 uppercase font-bold tracking-wider">Super Admin</p>
              </div>
              <div className="w-8 h-8 bg-[#111] border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-700">AG</div>
            </div>

            <button
              onClick={() => supabase.auth.signOut()}
              className="p-2 hover:bg-[#111] text-slate-600 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>

          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-6 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'forgot'>('login');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem('watchtower-theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setAuthView('login');
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('watchtower-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="rounded-full border border-[#1e293b] bg-white/80 px-4 py-2 text-slate-600 text-xs shadow-sm">Loading...</div>
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
      <Layout theme={theme} onToggleTheme={toggleTheme}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/development/overview" element={<DevelopmentOverview />} />
          <Route path="/development/:appSlug?" element={<Development />} />
          <Route path="/users/:appSlug?" element={<AllUsers />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/bitw" element={<BITWManager />} />
          <Route path="/daily-tasks" element={<DailyTasks />} />
          <Route path="/activity" element={<ActivityOverview />} />
          <Route path="/activity/:appSlug" element={<AppActivity />} />
          <Route path="/second-brain" element={<SecondBrain />} />
          <Route path="/second-brain/:category" element={<SecondBrain />} />
          <Route path="/feature-requests" element={<FeatureRequests />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
