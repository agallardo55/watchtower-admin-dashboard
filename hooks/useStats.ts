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
      const message = err instanceof Error ? err.message : 'Failed to load stats';
      setError(message);
      setStats(FALLBACK_STATS);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
