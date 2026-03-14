
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
import { useApps } from './hooks/useApps';

const Layout: React.FC<{ children: React.ReactNode; darkMode: boolean; toggleTheme: () => void }> = ({ children, darkMode, toggleTheme }) => {
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
            ...apps.map(a => ({ label: a.name, icon: a.icon || '📦', path: `/development/${a.name.toLowerCase().replace(/\s+/g, '-')}` })),
          ],
        };
      }
      if (item.label === 'Users' && item.children) {
        return {
          ...item,
          children: [
            ...item.children,
            ...apps.map(a => ({ label: a.name, icon: a.icon || '📦', path: `/users/${a.name.toLowerCase().replace(/\s+/g, '-')}` })),
          ],
        };
      }
      if (item.label === 'Activity' && item.children) {
        return {
          ...item,
          children: [
            ...item.children,
            ...apps.map(a => ({ label: a.name, icon: a.icon || '📦', path: `/activity/${a.slug || a.name.toLowerCase().replace(/\s+/g, '-')}` })),
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
      {/* Brand */}
      <div className={`px-4 py-5 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`} style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className={`flex items-center gap-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          {isSidebarCollapsed ? (
            <span style={{ color: '#4ADE80', fontSize: 18, fontWeight: 700 }}>◆</span>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#4ADE80', fontSize: 14, fontWeight: 700 }}>◆</span>
                <span style={{ color: '#e0e0e0', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em' }}>WATCHTOWER</span>
              </div>
              <div style={{ color: '#444444', fontSize: 10, marginTop: 1 }}>v2.0</div>
            </div>
          )}
        </div>
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden"
          style={{ color: '#666666', padding: '4px', borderRadius: '4px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-3 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`} style={{ gap: 2 }}>
        {dynamicNav.map((item) => {
          const Icon = (icons as Record<string, React.FC<IconProps>>)[item.icon];
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedNav.includes(item.label);
          const isParentActive = hasChildren
            ? location.pathname.startsWith(item.path)
            : location.pathname === item.path;

          if (hasChildren) {
            return (
              <div key={item.label} style={{ marginBottom: 2 }}>
                <button
                  onClick={() => isSidebarCollapsed ? navigate(item.path) : toggleNavExpand(item.label)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 10px',
                    borderRadius: '4px',
                    fontSize: 12,
                    cursor: 'pointer',
                    background: isParentActive ? 'rgba(74,222,128,0.06)' : 'transparent',
                    color: isParentActive ? '#4ADE80' : '#666666',
                    border: 'none',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { if (!isParentActive) { (e.currentTarget as HTMLElement).style.background = '#1a1a1a'; (e.currentTarget as HTMLElement).style.color = '#e0e0e0'; } }}
                  onMouseLeave={e => { if (!isParentActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#666666'; } }}
                >
                  <span style={{ color: isParentActive ? '#4ADE80' : '#555555', flexShrink: 0 }}>
                    <Icon />
                  </span>
                  {!isSidebarCollapsed && (
                    <>
                      <span style={{ flex: 1, textAlign: 'left' }}>{item.label.toLowerCase()}</span>
                      <icons.chevronDown style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#444444' }} />
                    </>
                  )}
                </button>
                {isExpanded && !isSidebarCollapsed && (
                  <div style={{ marginLeft: 12, marginTop: 2, paddingLeft: 10, borderLeft: '1px dashed #1e1e1e' }}>
                    {item.children!.map(child => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '5px 8px',
                            borderRadius: '3px',
                            fontSize: 11,
                            color: isChildActive ? '#4ADE80' : '#555555',
                            background: isChildActive ? 'rgba(74,222,128,0.05)' : 'transparent',
                            textDecoration: 'none',
                            transition: 'all 0.1s',
                          }}
                          onMouseEnter={e => { if (!isChildActive) { (e.currentTarget as HTMLElement).style.color = '#e0e0e0'; (e.currentTarget as HTMLElement).style.background = '#1a1a1a'; } }}
                          onMouseLeave={e => { if (!isChildActive) { (e.currentTarget as HTMLElement).style.color = '#555555'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
                        >
                          {child.icon && child.icon.length <= 3 ? (
                            <span style={{ fontSize: 11 }}>{child.icon}</span>
                          ) : child.icon && (icons as Record<string, React.FC<IconProps>>)[child.icon] ? (
                            <span>{React.createElement((icons as Record<string, React.FC<IconProps>>)[child.icon])}</span>
                          ) : null}
                          <span>{child.label.toLowerCase()}</span>
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 10px',
                borderRadius: '4px',
                fontSize: 12,
                color: isParentActive ? '#4ADE80' : '#666666',
                background: isParentActive ? 'rgba(74,222,128,0.06)' : 'transparent',
                borderLeft: isParentActive && !isSidebarCollapsed ? '2px solid #4ADE80' : '2px solid transparent',
                textDecoration: 'none',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                transition: 'all 0.1s',
                marginBottom: 2,
              }}
              onMouseEnter={e => { if (!isParentActive) { (e.currentTarget as HTMLElement).style.background = '#1a1a1a'; (e.currentTarget as HTMLElement).style.color = '#e0e0e0'; } }}
              onMouseLeave={e => { if (!isParentActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#666666'; } }}
            >
              <span style={{ color: isParentActive ? '#4ADE80' : '#555555', flexShrink: 0 }}>
                <Icon />
              </span>
              {!isSidebarCollapsed && <span>{item.label.toLowerCase()}</span>}
            </Link>
          );
        })}

        {/* Apps section divider */}
        {!isSidebarCollapsed && (
          <div style={{ marginTop: 16, marginBottom: 8, paddingTop: 12, borderTop: '1px dashed #1e1e1e' }}>
            <span style={{ color: '#444444', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', paddingLeft: 10 }}>// APPS</span>
          </div>
        )}
        {isSidebarCollapsed && <div style={{ margin: '12px 0', borderTop: '1px dashed #1e1e1e' }} />}
        {apps.map(app => {
          const dotColor = app.status === 'live' ? '#4ADE80' : app.status === 'beta' ? '#F59E0B' : '#444444';
          const appPath = `/activity/${app.slug || app.name.toLowerCase().replace(/\s+/g, '-')}`;
          const isActive = location.pathname === appPath;
          return (
            <Link
              key={app.name}
              to={appPath}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 10px',
                borderRadius: '3px',
                fontSize: 11,
                color: isActive ? '#e0e0e0' : '#555555',
                background: isActive ? '#1a1a1a' : 'transparent',
                textDecoration: 'none',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                marginBottom: 1,
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = '#e0e0e0'; (e.currentTarget as HTMLElement).style.background = '#1a1a1a'; } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = '#555555'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'inline-block' }} />
              {!isSidebarCollapsed && <span>{app.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px dashed #1e1e1e', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between' }}>
        {!isSidebarCollapsed && (
          <span style={{ fontSize: 11, color: '#444444' }}>adam@cmig <span style={{ color: '#4ADE80' }}>▸</span></span>
        )}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex items-center justify-center"
          style={{ background: 'transparent', border: 'none', color: '#444444', cursor: 'pointer', padding: 4, borderRadius: 3 }}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9-3 3 3 3"/></svg>
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0a0a', color: '#e0e0e0' }}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside
        style={{
          width: isSidebarCollapsed ? 60 : 220,
          minWidth: isSidebarCollapsed ? 60 : 220,
          maxWidth: isSidebarCollapsed ? 60 : 220,
          background: '#0a0a0a',
          borderRight: '1px solid #1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 0.3s, min-width 0.3s, max-width 0.3s',
        }}
        className="hidden lg:flex"
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 260,
          background: '#0a0a0a',
          borderRight: '1px solid #1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
        className="lg:hidden"
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile top bar */}
        <div
          className="sticky top-0 z-30 lg:hidden"
          style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{ background: 'transparent', border: 'none', color: '#666666', cursor: 'pointer', padding: 4 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <span style={{ color: '#4ADE80', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>◆ WATCHTOWER</span>
          </div>
        </div>

        {/* Desktop Header */}
        <header
          className="sticky top-0 z-30 hidden lg:flex items-center justify-between"
          style={{ height: 52, background: 'rgba(10,10,10,0.95)', borderBottom: '1px solid #1a1a1a', padding: '0 28px', backdropFilter: 'blur(12px)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#444444' }}>
            <span style={{ color: '#4ADE80' }}>$</span>
            <span>watchtower</span>
            <span style={{ color: '#333' }}>/</span>
            <span style={{ color: '#e0e0e0' }}>{getBreadcrumb().toLowerCase().replace(/ \/ /g, ' / ')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#444444' }}>
                <icons.search />
              </div>
              <input
                type="text"
                placeholder="search..."
                style={{
                  paddingLeft: 32,
                  paddingRight: 12,
                  paddingTop: 6,
                  paddingBottom: 6,
                  background: '#0d0d0d',
                  border: '1px solid #222222',
                  borderRadius: '4px',
                  fontSize: 12,
                  color: '#e0e0e0',
                  width: 200,
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = '#4ADE80'; }}
                onBlur={e => { e.target.style.borderColor = '#222222'; }}
              />
            </div>

            <button
              style={{ position: 'relative', background: 'transparent', border: 'none', color: '#444444', cursor: 'pointer', padding: 4 }}
            >
              <icons.bell />
              <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, background: '#EF4444', borderRadius: '50%', border: '1px solid #0a0a0a' }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#e0e0e0' }}>adam@cmig</p>
                <p style={{ fontSize: 9, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>super_admin</p>
              </div>
              <div style={{ width: 30, height: 30, borderRadius: '4px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#4ADE80' }}>AG</div>
            </div>

            <button
              onClick={() => supabase.auth.signOut()}
              style={{ background: 'transparent', border: 'none', color: '#444444', cursor: 'pointer', padding: 4, borderRadius: 3 }}
              title="Sign out"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#444444'; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '24px 28px' }}>
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

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#444444', fontSize: 12 }}>initializing...</div>
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
          <Route path="/activity" element={<ActivityOverview />} />
          <Route path="/activity/:appSlug" element={<AppActivity />} />
          <Route path="/feature-requests" element={<FeatureRequests />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
