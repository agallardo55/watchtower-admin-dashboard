
import React from 'react';
import { AppEntry, ActivityEntry, GraduationStage, NavSection } from './types';

export const sidebarNav: NavSection[] = [
  { section: "Overview", items: [
    { label: "Dashboard", icon: "home", path: "/" },
    { label: "Analytics", icon: "chart", path: "/analytics" }
  ]},
  { section: "Apps", items: [
    { label: "App Registry", icon: "grid", path: "/apps" },
    { label: "Development", icon: "edit", path: "/development" },
    { label: "Build In The Wild", icon: "globe", path: "/bitw" },
    { label: "Graduation Queue", icon: "rocket", path: "/graduation" }
  ]},
  { section: "Users", items: [
    { label: "All Users", icon: "users", path: "/users" },
    { label: "Invitations", icon: "mail", path: "/invitations" },
    { label: "Cross-App Activity", icon: "activity", path: "/cross-app" }
  ]},
  { section: "Database", items: [
    { label: "Schema Browser", icon: "database", path: "/schema" },
    { label: "Migrations", icon: "git-branch", path: "/migrations" }
  ]},
  { section: "Settings", items: [
    { label: "Configuration", icon: "settings", path: "/settings" }
  ]}
];

export const apps: AppEntry[] = [
  // Live
  { name: "SalesboardHQ", icon: "📊", status: "live", db: "Dedicated (suykcdomvqmkjwmbtyzk)", users: 23, lastActivity: "2026-02-01", url: "https://salesboardhq.netlify.app", category: "Sales", description: "Real-time leaderboard and sales performance tracker.", schemaPrefix: "sb_", tableCount: 12 },
  { name: "BuybidHQ", icon: "🏷️", status: "live", db: "Dedicated (fdcfdbjputcitgxosnyk)", users: 12, lastActivity: "2026-02-07", url: "https://sandbox-buybidhq.netlify.app", category: "Sales", description: "Strategic bidding and inventory management for auto wholesalers.", schemaPrefix: "bb_", tableCount: 14 },
  // Idea
  { name: "Agentflow", icon: "🔄", status: "idea", db: "Watchtower (af_*)", users: 0, lastActivity: "2026-02-03", url: null, category: "Operations", description: "Low-code automation for internal dealership workflows.", schemaPrefix: "af_", tableCount: 7 },
  { name: "CUDL Rate Capture", icon: "📈", status: "idea", db: "Watchtower (cr_*)", users: 0, lastActivity: "2026-02-03", url: null, category: "Finance", description: "Rate tracking and comparison for credit union direct lending.", schemaPrefix: "cr_", tableCount: 6 },
  { name: "Sidecar CRM", icon: "🤝", status: "idea", db: "Watchtower (sidecar_*)", users: 0, lastActivity: "2026-02-03", url: null, category: "Sales", description: "Lightweight CRM built specifically for high-velocity sales.", schemaPrefix: "sidecar_", tableCount: 3 },
  { name: "Sidepilot", icon: "🤖", status: "idea", db: "Watchtower (copilot_*)", users: 0, lastActivity: "2026-02-07", url: null, category: "AI", description: "AI-driven customer outreach and deal closing assistant.", schemaPrefix: "copilot_", tableCount: 3 },
  { name: "Demolight", icon: "🚗", status: "idea", db: "Watchtower (dl_*)", users: 0, lastActivity: "2026-01-15", url: null, category: "Operations", description: "Fleet tracking and demo drive management system.", schemaPrefix: "dl_", tableCount: 4 },
  { name: "Dealerment", icon: "📄", status: "idea", db: "Watchtower", users: 0, lastActivity: "2026-01-20", url: null, category: "Finance", description: "Centralized document vault for dealer compliance.", schemaPrefix: "dd_", tableCount: 2 },
  { name: "Marbitrage", icon: "💰", status: "idea", db: "Watchtower", users: 0, lastActivity: "2026-02-05", url: null, category: "AI", description: "Market data analysis for finding profitable vehicle trade spreads.", schemaPrefix: "mmr_", tableCount: 5 },
  { name: "SalesLogHQ", icon: "📝", status: "idea", db: "Watchtower (saleslog_*)", users: 0, lastActivity: "2026-01-28", url: null, category: "Sales", description: "Quick entry daily log for dealership sales staff.", schemaPrefix: "saleslog_", tableCount: 2 }
];

export const recentActivity: ActivityEntry[] = [
  { app: "BuybidHQ", action: "VIN decoder wired with cascading dropdowns", time: "2 hours ago", type: "feature" },
  { app: "Sidepilot", action: "Product spec completed (19KB)", time: "5 hours ago", type: "spec" },
  { app: "Watchtower", action: "betahub_apps and betahub_feedback tables created", time: "1 day ago", type: "schema" },
  { app: "BuybidHQ", action: "Stripe signup flow — 5 edge functions deployed", time: "2 days ago", type: "feature" },
  { app: "Build In The Wild", action: "Landing page UI generated", time: "3 hours ago", type: "deploy" },
  { app: "SalesboardHQ", action: "Launched on Product Hunt", time: "1 week ago", type: "launch" }
];

export const graduationStages: GraduationStage[] = [
  {
    stage: "Idea",
    description: "Concept stage — spec or research in progress",
    apps: apps.filter(a => a.status === 'idea').map(a => a.name)
  },
  {
    stage: "Beta",
    description: "In testing — early users and feedback",
    apps: apps.filter(a => a.status === 'beta').map(a => a.name)
  },
  {
    stage: "Live",
    description: "Deployed and serving users",
    apps: apps.filter(a => a.status === 'live').map(a => a.name)
  },
  {
    stage: "Paused",
    description: "On hold — not actively developed",
    apps: apps.filter(a => a.status === 'paused').map(a => a.name)
  }
];

export const icons = {
  home: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  chart: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  grid: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  globe: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  rocket: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.5-1 1-4c1.5 0 3 .5 3 .5L12 11"/><path d="M15 9s.5 1.5.5 3c-3 0-4-1-4-1L12 8s1 0 3 1z"/></svg>,
  users: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  mail: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  activity: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  database: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>,
  'git-branch': (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>,
  settings: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  search: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  bell: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  moon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  sun: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  chevronDown: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m6 9 6 6 6-6"/></svg>,
  externalLink: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 22 3 22 10"/><line x1="14" y1="10" x2="22" y2="2"/></svg>,
  more: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  edit: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
  archive: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>,
};
