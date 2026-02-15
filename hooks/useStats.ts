import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, DashboardStats } from '../services/stats';

const FALLBACK_STATS: DashboardStats = {
  totalApps: 10,
  liveApps: 2,
  internalApps: 8,
  totalUsers: 47,
  totalTables: 36,
  schemaCount: 3,
};

export function useStats() {
  const [stats, setStats] = useState<DashboardStats>(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats, using fallback:', err);
      setError((err as Error).message);
      setStats(FALLBACK_STATS);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
