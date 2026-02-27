import { supabase } from '../lib/supabase';

export interface RoadmapItem {
  text: string;
  done: boolean;
}

interface DbApp {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_emoji: string | null;
  icon_url: string | null;
  status: string;
  category: string | null;
  supabase_project_id: string | null;
  schema_prefix: string | null;
  app_url: string | null;
  repo_url: string | null;
  table_count: number | null;
  user_count: number;
  graduation_stage: string | null;
  pipeline_note: string | null;
  overview: string | null;
  target_users: string[] | null;
  roadmap: RoadmapItem[] | null;
  screenshots: string[] | null;
  updated_at: string;
}

function formatDb(row: DbApp): string {
  // If it has its own Supabase project (not the Watchtower ref), it's dedicated
  if (row.supabase_project_id && row.supabase_project_id !== 'txlbhwvlzbceegzkoimr') {
    return `Dedicated (${row.supabase_project_id})`;
  }
  if (row.schema_prefix) return `Watchtower (${row.schema_prefix}*)`;
  return 'Watchtower';
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
}

function mapStatus(dbStatus: string): 'idea' | 'beta' | 'live' | 'paused' {
  const map: Record<string, 'idea' | 'beta' | 'live' | 'paused'> = {
    idea: 'idea',
    spec: 'idea',
    building: 'idea',
    beta: 'beta',
    live: 'live',
    archived: 'paused',
  };
  return map[dbStatus] || 'idea';
}

export interface DbAppRow extends DbApp {
  id: string;
}

function mapToAppEntry(row: DbApp) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon_emoji || '📦',
    iconEmoji: row.icon_emoji || '',
    iconUrl: row.icon_url || '',
    status: mapStatus(row.status),
    dbStatus: row.status,
    db: formatDb(row),
    users: row.user_count,
    lastActivity: formatRelativeTime(row.updated_at),
    url: row.app_url,
    appUrl: row.app_url || '',
    repoUrl: row.repo_url || '',
    category: row.category || 'Other',
    description: row.description || '',
    schemaPrefix: row.schema_prefix || '',
    supabaseProjectId: row.supabase_project_id || '',
    tableCount: row.table_count || 0,
    graduationStage: row.graduation_stage,
    pipelineNote: row.pipeline_note,
    overview: row.overview || '',
    targetUsers: row.target_users || [],
    roadmap: (row.roadmap || []) as RoadmapItem[],
    screenshots: row.screenshots || [],
  };
}

export type AppEntryWithMeta = ReturnType<typeof mapToAppEntry>;

export async function getApps(): Promise<AppEntryWithMeta[]> {
  const { data, error } = await supabase
    .from('wt_app_registry')
    .select('*')
    .is('deleted_at', null)
    .order('name');

  if (error) throw error;
  return (data as DbApp[]).map(mapToAppEntry);
}

export interface AppFormData {
  name: string;
  description: string;
  status: string;
  category: string;
  icon_emoji: string;
  schema_prefix: string;
  supabase_project_id: string;
  graduation_stage: string;
  pipeline_note: string;
  icon_url: string;
  app_url: string;
  repo_url: string;
  overview: string;
  target_users: string[];
  roadmap: RoadmapItem[];
  screenshots: string[];
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function createApp(data: AppFormData): Promise<void> {
  const { error } = await supabase
    .from('wt_app_registry')
    .insert({
      name: data.name,
      slug: toSlug(data.name),
      description: data.description || null,
      status: data.status || 'idea',
      category: data.category || null,
      icon_emoji: data.icon_emoji || null,
      schema_prefix: data.schema_prefix || null,
      supabase_project_id: data.supabase_project_id || null,
      graduation_stage: data.graduation_stage || 'idea',
      pipeline_note: data.pipeline_note || null,
      icon_url: data.icon_url || null,
      app_url: data.app_url || null,
      repo_url: data.repo_url || null,
      overview: data.overview || null,
      target_users: data.target_users.length > 0 ? data.target_users : null,
      roadmap: data.roadmap.length > 0 ? data.roadmap : null,
      screenshots: data.screenshots.length > 0 ? data.screenshots : null,
    });

  if (error) throw error;
}

export async function updateApp(id: string, data: Partial<AppFormData>): Promise<void> {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description || null;
  if (data.status !== undefined) payload.status = data.status;
  if (data.category !== undefined) payload.category = data.category || null;
  if (data.icon_emoji !== undefined) payload.icon_emoji = data.icon_emoji || null;
  if (data.schema_prefix !== undefined) payload.schema_prefix = data.schema_prefix || null;
  if (data.supabase_project_id !== undefined) payload.supabase_project_id = data.supabase_project_id || null;
  if (data.graduation_stage !== undefined) payload.graduation_stage = data.graduation_stage;
  if (data.pipeline_note !== undefined) payload.pipeline_note = data.pipeline_note || null;
  if (data.icon_url !== undefined) payload.icon_url = data.icon_url || null;
  if (data.app_url !== undefined) payload.app_url = data.app_url || null;
  if (data.repo_url !== undefined) payload.repo_url = data.repo_url || null;
  if (data.overview !== undefined) payload.overview = data.overview || null;
  if (data.target_users !== undefined) payload.target_users = data.target_users.length > 0 ? data.target_users : null;
  if (data.roadmap !== undefined) payload.roadmap = data.roadmap.length > 0 ? data.roadmap : null;
  if (data.screenshots !== undefined) payload.screenshots = data.screenshots.length > 0 ? data.screenshots : null;

  const { error } = await supabase
    .from('wt_app_registry')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}

export async function updatePipelineNote(id: string, note: string): Promise<void> {
  const { error } = await supabase
    .from('wt_app_registry')
    .update({ pipeline_note: note })
    .eq('id', id);

  if (error) throw error;
}

export async function updateGraduationStage(id: string, stage: string): Promise<void> {
  const { error } = await supabase
    .from('wt_app_registry')
    .update({ graduation_stage: stage })
    .eq('id', id);

  if (error) throw error;
}
