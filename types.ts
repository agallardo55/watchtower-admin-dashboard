
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
