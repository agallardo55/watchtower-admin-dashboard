import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, DashboardStats } from '../services/stats';

export function useStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalApps: 0,
    liveApps: 0,
    internalApps: 0,
    totalUsers: 0,
    totalTables: 0,
    schemaCount: 0,
  });
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
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
