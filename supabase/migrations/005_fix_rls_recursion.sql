-- ============================================================================
-- 005_fix_rls_recursion.sql
-- Fix infinite recursion in wt_users RLS policies
-- The super_admin check on wt_users references wt_users itself, causing recursion
-- Solution: SECURITY DEFINER function that bypasses RLS for the admin check
-- ============================================================================

-- Helper function to check if current user is super_admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM wt_users WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Fix wt_users policies to use the helper function
DROP POLICY IF EXISTS "wt_users_select_super_admin" ON wt_users;
CREATE POLICY "wt_users_select_super_admin" ON wt_users
  FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "wt_users_all_super_admin" ON wt_users;
CREATE POLICY "wt_users_all_super_admin" ON wt_users
  FOR ALL USING (is_super_admin());

-- Fix wt_app_registry policies to use the helper function
DROP POLICY IF EXISTS "wt_app_registry_select_super_admin" ON wt_app_registry;
CREATE POLICY "wt_app_registry_select_super_admin" ON wt_app_registry
  FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "wt_app_registry_all_super_admin" ON wt_app_registry;
CREATE POLICY "wt_app_registry_all_super_admin" ON wt_app_registry
  FOR ALL USING (is_super_admin());

-- Fix other tables that use the same recursive pattern
DROP POLICY IF EXISTS "wt_business_units_select_super_admin" ON wt_business_units;
CREATE POLICY "wt_business_units_select_super_admin" ON wt_business_units
  FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "wt_business_units_all_super_admin" ON wt_business_units;
CREATE POLICY "wt_business_units_all_super_admin" ON wt_business_units
  FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "wt_tasks_select_super_admin" ON wt_tasks;
CREATE POLICY "wt_tasks_select_super_admin" ON wt_tasks
  FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "wt_tasks_all_super_admin" ON wt_tasks;
CREATE POLICY "wt_tasks_all_super_admin" ON wt_tasks
  FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "wt_invitations_select_super_admin" ON wt_invitations;
CREATE POLICY "wt_invitations_select_super_admin" ON wt_invitations
  FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "wt_invitations_all_super_admin" ON wt_invitations;
CREATE POLICY "wt_invitations_all_super_admin" ON wt_invitations
  FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "wt_graduation_queue_select_super_admin" ON wt_graduation_queue;
CREATE POLICY "wt_graduation_queue_select_super_admin" ON wt_graduation_queue
  FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "wt_graduation_queue_all_super_admin" ON wt_graduation_queue;
CREATE POLICY "wt_graduation_queue_all_super_admin" ON wt_graduation_queue
  FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "wt_activity_log_select_super_admin" ON wt_activity_log;
CREATE POLICY "wt_activity_log_select_super_admin" ON wt_activity_log
  FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "wt_activity_log_all_super_admin" ON wt_activity_log;
CREATE POLICY "wt_activity_log_all_super_admin" ON wt_activity_log
  FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "wt_daily_stats_select_super_admin" ON wt_daily_stats;
CREATE POLICY "wt_daily_stats_select_super_admin" ON wt_daily_stats
  FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "wt_daily_stats_all_super_admin" ON wt_daily_stats;
CREATE POLICY "wt_daily_stats_all_super_admin" ON wt_daily_stats
  FOR ALL USING (is_super_admin());
