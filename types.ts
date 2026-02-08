
export type AppStatus = 'idea' | 'building' | 'beta' | 'live' | 'paused';

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
