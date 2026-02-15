import { supabase } from '../lib/supabase';
import { AppEntry } from '../types';

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
  table_count: number | null;
  user_count: number;
  graduation_stage: string | null;
  pipeline_note: string | null;
  updated_at: string;
}

function formatDb(row: DbApp): string {
  if (row.supabase_project_id === 'fdcfdbjputcitgxosnyk') return `Dedicated (${row.supabase_project_id})`;
  if (row.supabase_project_id === 'dedicated' || row.supabase_project_id === 'suykcdomvqmkjwmbtyzk') return `Dedicated (${row.supabase_project_id})`;
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

function mapStatus(dbStatus: string): AppEntry['status'] {
  const map: Record<string, AppEntry['status']> = {
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

function mapToAppEntry(row: DbApp): AppEntry & { id: string; slug: string; graduationStage: string | null; pipelineNote: string | null } {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon_emoji || '📦',
    status: mapStatus(row.status),
    db: formatDb(row),
    users: row.user_count,
    lastActivity: formatRelativeTime(row.updated_at),
    url: row.app_url,
    category: row.category || 'Other',
    description: row.description || '',
    schemaPrefix: row.schema_prefix || undefined,
    tableCount: row.table_count || 0,
    graduationStage: row.graduation_stage,
    pipelineNote: row.pipeline_note,
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
