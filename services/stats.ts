import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

export interface DashboardStats {
  totalApps: number;
  liveApps: number;
  internalApps: number;
  totalUsers: number;
  totalTables: number;
  schemaCount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // Fetch app registry counts
  const { data: apps, error } = await supabase
    .from('wt_app_registry')
    .select('status, table_count, schema_prefix, user_count')
    .is('deleted_at', null);

  if (error) throw error;

  const totalApps = apps?.length || 0;
  const liveApps = apps?.filter(a => a.status === 'live').length || 0;
  const internalApps = totalApps - liveApps;
  const totalTables = apps?.reduce((sum, a) => sum + (a.table_count || 0), 0) || 0;
  const schemaCount = new Set(apps?.map(a => a.schema_prefix).filter(Boolean)).size;

  // Try to get user count from edge function
  let totalUsers = apps?.reduce((sum, a) => sum + (a.user_count || 0), 0) || 0;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || supabaseAnonKey;
    const res = await fetch(`${supabaseUrl}/functions/v1/all-users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const users = await res.json();
      if (Array.isArray(users) && users.length > 0) {
        totalUsers = users.length;
      }
    }
  } catch {
    // Fall back to user_count from app registry
  }

  return { totalApps, liveApps, internalApps, totalUsers, totalTables, schemaCount };
}
