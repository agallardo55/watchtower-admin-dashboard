import { useState, useEffect, useCallback } from 'react';
import { getApps, AppEntryWithMeta } from '../services/apps';
import { apps as DEMO_APPS } from '../constants';

export function useApps() {
  const [apps, setApps] = useState<AppEntryWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getApps();
      setApps(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load apps';
      setError(message);
      // Map DEMO_APPS to include the extra fields as fallback
      setApps(DEMO_APPS.map((a, i) => ({
        ...a,
        id: `demo-${i}`,
        slug: a.name.toLowerCase().replace(/\s+/g, '-'),
        iconEmoji: a.icon || '',
        iconUrl: '',
        dbStatus: a.status === 'live' ? 'live' : 'idea',
        appUrl: a.url || '',
        repoUrl: '',
        schemaPrefix: a.schemaPrefix || '',
        supabaseProjectId: '',
        graduationStage: a.status === 'live' ? 'live' : 'idea',
        pipelineNote: a.description || null,
        overview: '',
        targetUsers: [] as string[],
        roadmap: [] as { text: string; done: boolean }[],
        screenshots: [] as string[],
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  return { apps, loading, error, refetch: fetchApps };
}
