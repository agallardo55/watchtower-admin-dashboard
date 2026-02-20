
import React from 'react';

export type AppStatus = 'idea' | 'beta' | 'live' | 'paused';

export interface AppEntry {
  name: string;
  icon: string;
  status: AppStatus;
  db: string;
  users: number;
  lastActivity: string;
  url: string | null;
  category: string;
  description?: string;
  schemaPrefix?: string;
  tableCount?: number;
  id?: string;
  slug?: string;
  graduationStage?: string | null;
  pipelineNote?: string | null;
}

export interface ActivityEntry {
  app: string;
  action: string;
  time: string;
  type: 'feature' | 'spec' | 'schema' | 'deploy' | 'launch';
}

export interface GraduationStage {
  stage: string;
  description: string;
  apps: string[];
}

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  children?: NavItem[];
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export interface TicketEntry {
  id: string;
  title: string;
  app: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
  category: string;
  aiSummary: string;
  feedbackMessage: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VoteEntry {
  id: string;
  app: string;
  vote: 'up' | 'down';
  reason: string | null;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  app: string;
  email: string;
  createdAt: string;
}

export interface AppActivity {
  id: string;
  app_slug: string;
  event_type: string;
  user_email: string | null;
  user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** SVG icon component props — allows className and all SVG attributes */
export type IconProps = Record<string, unknown>;

/** Record of icon name → component */
export type IconMap = Record<string, React.FC<IconProps>>;

/** Edge function user response shape */
export interface EdgeFunctionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  app?: string;
  last_sign_in_at?: string;
  created_at?: string;
}
