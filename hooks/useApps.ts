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
      console.error('Failed to fetch apps, using fallback:', err);
      setError((err as Error).message);
      // Map DEMO_APPS to include the extra fields
      setApps(DEMO_APPS.map((a, i) => ({
        ...a,
        id: `demo-${i}`,
        slug: a.name.toLowerCase().replace(/\s+/g, '-'),
        graduationStage: a.status === 'live' ? 'live' : 'idea',
        pipelineNote: a.description || null,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  return { apps, loading, error, refetch: fetchApps };
}
