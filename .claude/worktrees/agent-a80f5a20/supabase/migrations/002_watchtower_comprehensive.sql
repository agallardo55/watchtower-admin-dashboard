-- ============================================================================
-- 002_watchtower_comprehensive.sql
-- Watchtower + BITW comprehensive schema migration
-- Project: txlbhwvlzbceegzkoimr
--
-- SAFE: Uses CREATE TABLE IF NOT EXISTS. Does NOT drop existing app tables.
-- Approach for betahub_*: We leave betahub_apps and betahub_feedback in place
-- and create the new bitw_* tables alongside them. Data can be migrated manually
-- then the old tables dropped in a future migration once verified.
-- ============================================================================

-- ===========================================
-- 0. TRIGGER FUNCTION: set_updated_at()
-- ===========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 1. CORE PLATFORM TABLES (wt_ prefix)
-- ===========================================

-- wt_users
CREATE TABLE IF NOT EXISTS wt_users (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'admin', 'member')),
  display_name text,
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_wt_users_role ON wt_users(role);

DROP TRIGGER IF EXISTS trg_wt_users_updated_at ON wt_users;
CREATE TRIGGER trg_wt_users_updated_at
  BEFORE UPDATE ON wt_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE wt_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wt_users_select_super_admin" ON wt_users;
CREATE POLICY "wt_users_select_super_admin" ON wt_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );

DROP POLICY IF EXISTS "wt_users_all_super_admin" ON wt_users;
CREATE POLICY "wt_users_all_super_admin" ON wt_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );


-- wt_business_units
CREATE TABLE IF NOT EXISTS wt_business_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_wt_business_units_updated_at ON wt_business_units;
CREATE TRIGGER trg_wt_business_units_updated_at
  BEFORE UPDATE ON wt_business_units
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE wt_business_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wt_business_units_select_super_admin" ON wt_business_units;
CREATE POLICY "wt_business_units_select_super_admin" ON wt_business_units
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );

DROP POLICY IF EXISTS "wt_business_units_all_super_admin" ON wt_business_units;
CREATE POLICY "wt_business_units_all_super_admin" ON wt_business_units
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );


-- wt_app_registry
CREATE TABLE IF NOT EXISTS wt_app_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon_url text,
  status text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'spec', 'building', 'beta', 'live', 'archived')),
  business_unit_id uuid REFERENCES wt_business_units(id) ON DELETE SET NULL,
  schema_prefix text,
  supabase_project_id text,
  table_count int DEFAULT 0,
  app_url text,
  repo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_wt_app_registry_status ON wt_app_registry(status);
CREATE INDEX IF NOT EXISTS idx_wt_app_registry_business_unit_id ON wt_app_registry(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_wt_app_registry_slug ON wt_app_registry(slug);

DROP TRIGGER IF EXISTS trg_wt_app_registry_updated_at ON wt_app_registry;
CREATE TRIGGER trg_wt_app_registry_updated_at
  BEFORE UPDATE ON wt_app_registry
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE wt_app_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wt_app_registry_select_super_admin" ON wt_app_registry;
CREATE POLICY "wt_app_registry_select_super_admin" ON wt_app_registry
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );

DROP POLICY IF EXISTS "wt_app_registry_all_super_admin" ON wt_app_registry;
CREATE POLICY "wt_app_registry_all_super_admin" ON wt_app_registry
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );


-- ===========================================
-- 2. BUILD IN THE WILD TABLES (bitw_ prefix)
-- Public SELECT, super_admin write
-- ===========================================

-- bitw_build_logs
CREATE TABLE IF NOT EXISTS bitw_build_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES wt_app_registry(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  agent text CHECK (agent IN ('kitt', 'claude_code', 'gemini', 'adam')),
  stage text CHECK (stage IN ('spec', 'schema', 'ui', 'wiring', 'deploy', 'fix')),
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bitw_build_logs_app_id ON bitw_build_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_bitw_build_logs_stage ON bitw_build_logs(stage);

ALTER TABLE bitw_build_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bitw_build_logs_public_select" ON bitw_build_logs;
CREATE POLICY "bitw_build_logs_public_select" ON bitw_build_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "bitw_build_logs_admin_all" ON bitw_build_logs;
CREATE POLICY "bitw_build_logs_admin_all" ON bitw_build_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );


-- bitw_changelogs
CREATE TABLE IF NOT EXISTS bitw_changelogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES wt_app_registry(id) ON DELETE CASCADE,
  version text,
  title text NOT NULL,
  changes text[],
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bitw_changelogs_app_id ON bitw_changelogs(app_id);
CREATE INDEX IF NOT EXISTS idx_bitw_changelogs_published ON bitw_changelogs(published);

ALTER TABLE bitw_changelogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bitw_changelogs_public_select" ON bitw_changelogs;
CREATE POLICY "bitw_changelogs_public_select" ON bitw_changelogs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "bitw_changelogs_admin_all" ON bitw_changelogs;
CREATE POLICY "bitw_changelogs_admin_all" ON bitw_changelogs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );


-- bitw_subscribers
CREATE TABLE IF NOT EXISTS bitw_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz
);

ALTER TABLE bitw_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bitw_subscribers_public_insert" ON bitw_subscribers;
CREATE POLICY "bitw_subscribers_public_insert" ON bitw_subscribers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "bitw_subscribers_admin_all" ON bitw_subscribers;
CREATE POLICY "bitw_subscribers_admin_all" ON bitw_subscribers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );


-- bitw_feedback
CREATE TABLE IF NOT EXISTS bitw_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES wt_app_registry(id) ON DELETE CASCADE,
  email text,
  feedback_type text CHECK (feedback_type IN ('bug', 'feature', 'praise', 'other')),
  title text NOT NULL,
  description text,
  screenshot_url text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'planned', 'closed')),
  votes int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bitw_feedback_app_id ON bitw_feedback(app_id);
CREATE INDEX IF NOT EXISTS idx_bitw_feedback_status ON bitw_feedback(status);

ALTER TABLE bitw_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bitw_feedback_public_select" ON bitw_feedback;
CREATE POLICY "bitw_feedback_public_select" ON bitw_feedback
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "bitw_feedback_public_insert" ON bitw_feedback;
CREATE POLICY "bitw_feedback_public_insert" ON bitw_feedback
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "bitw_feedback_admin_all" ON bitw_feedback;
CREATE POLICY "bitw_feedback_admin_all" ON bitw_feedback
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );


-- ===========================================
-- 3. INVITATION & ONBOARDING (wt_ prefix)
-- ===========================================

CREATE TABLE IF NOT EXISTS wt_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  business_unit_id uuid REFERENCES wt_business_units(id) ON DELETE SET NULL,
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wt_invitations_status ON wt_invitations(status);
CREATE INDEX IF NOT EXISTS idx_wt_invitations_email ON wt_invitations(email);
CREATE INDEX IF NOT EXISTS idx_wt_invitations_token ON wt_invitations(token);

ALTER TABLE wt_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wt_invitations_select_super_admin" ON wt_invitations;
CREATE POLICY "wt_invitations_select_super_admin" ON wt_invitations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );

DROP POLICY IF EXISTS "wt_invitations_all_super_admin" ON wt_invitations;
CREATE POLICY "wt_invitations_all_super_admin" ON wt_invitations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );


-- ===========================================
-- 4. TASK MANAGEMENT (wt_ prefix)
-- ===========================================

CREATE TABLE IF NOT EXISTS wt_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  category text CHECK (category IN ('specs', 'research', 'infrastructure', 'content', 'development')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  due_date date,
  completed_at timestamptz,
  app_id uuid REFERENCES wt_app_registry(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_wt_tasks_status ON wt_tasks(status);
CREATE INDEX IF NOT EXISTS idx_wt_tasks_priority ON wt_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_wt_tasks_assigned_to ON wt_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_wt_tasks_app_id ON wt_tasks(app_id);

DROP TRIGGER IF EXISTS trg_wt_tasks_updated_at ON wt_tasks;
CREATE TRIGGER trg_wt_tasks_updated_at
  BEFORE UPDATE ON wt_tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE wt_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wt_tasks_select_super_admin" ON wt_tasks;
CREATE POLICY "wt_tasks_select_super_admin" ON wt_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );

DROP POLICY IF EXISTS "wt_tasks_all_super_admin" ON wt_tasks;
CREATE POLICY "wt_tasks_all_super_admin" ON wt_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );


-- ===========================================
-- 5. GRADUATION PIPELINE (wt_ prefix)
-- ===========================================

CREATE TABLE IF NOT EXISTS wt_graduation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES wt_app_registry(id) ON DELETE CASCADE,
  current_stage text NOT NULL DEFAULT 'incubating' CHECK (current_stage IN ('incubating', 'ready', 'migrating', 'graduated')),
  checklist jsonb DEFAULT '{}'::jsonb,
  notes text,
  graduated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wt_graduation_queue_app_id ON wt_graduation_queue(app_id);
CREATE INDEX IF NOT EXISTS idx_wt_graduation_queue_current_stage ON wt_graduation_queue(current_stage);

DROP TRIGGER IF EXISTS trg_wt_graduation_queue_updated_at ON wt_graduation_queue;
CREATE TRIGGER trg_wt_graduation_queue_updated_at
  BEFORE UPDATE ON wt_graduation_queue
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE wt_graduation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wt_graduation_queue_select_super_admin" ON wt_graduation_queue;
CREATE POLICY "wt_graduation_queue_select_super_admin" ON wt_graduation_queue
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );

DROP POLICY IF EXISTS "wt_graduation_queue_all_super_admin" ON wt_graduation_queue;
CREATE POLICY "wt_graduation_queue_all_super_admin" ON wt_graduation_queue
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );


-- ===========================================
-- 6. ANALYTICS / CROSS-APP ACTIVITY (wt_ prefix)
-- ===========================================

-- wt_activity_log
CREATE TABLE IF NOT EXISTS wt_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES wt_app_registry(id) ON DELETE CASCADE,
  action text NOT NULL,
  description text,
  actor text CHECK (actor IN ('kitt', 'claude_code', 'adam', 'system')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wt_activity_log_app_id ON wt_activity_log(app_id);
CREATE INDEX IF NOT EXISTS idx_wt_activity_log_action ON wt_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_wt_activity_log_created_at ON wt_activity_log(created_at);

ALTER TABLE wt_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wt_activity_log_select_super_admin" ON wt_activity_log;
CREATE POLICY "wt_activity_log_select_super_admin" ON wt_activity_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );

DROP POLICY IF EXISTS "wt_activity_log_all_super_admin" ON wt_activity_log;
CREATE POLICY "wt_activity_log_all_super_admin" ON wt_activity_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );


-- wt_daily_stats
CREATE TABLE IF NOT EXISTS wt_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES wt_app_registry(id) ON DELETE CASCADE,
  date date NOT NULL,
  users_total int NOT NULL DEFAULT 0,
  users_new int NOT NULL DEFAULT 0,
  signups int NOT NULL DEFAULT 0,
  revenue_cents int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wt_daily_stats_app_date ON wt_daily_stats(app_id, date);
CREATE INDEX IF NOT EXISTS idx_wt_daily_stats_date ON wt_daily_stats(date);

ALTER TABLE wt_daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wt_daily_stats_select_super_admin" ON wt_daily_stats;
CREATE POLICY "wt_daily_stats_select_super_admin" ON wt_daily_stats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );

DROP POLICY IF EXISTS "wt_daily_stats_all_super_admin" ON wt_daily_stats;
CREATE POLICY "wt_daily_stats_all_super_admin" ON wt_daily_stats
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );


-- ===========================================
-- 7. SEED DATA
-- ===========================================

-- Seed wt_business_units
INSERT INTO wt_business_units (name, description, icon, color) VALUES
  ('Automotive', 'Vehicle sourcing, inventory, and dealer tools', 'car', '#3B82F6'),
  ('AI', 'AI-powered assistants and copilots', 'brain', '#8B5CF6'),
  ('Operations', 'Internal ops, docs, and workflow tools', 'cog', '#F59E0B'),
  ('Finance', 'Rate capture, lending, and financial tools', 'dollar', '#10B981'),
  ('Sales', 'CRM, sales tracking, and pipeline tools', 'chart', '#EF4444')
ON CONFLICT DO NOTHING;

-- Seed wt_app_registry (10 apps)
-- Use a DO block to safely reference business_unit_ids
DO $$
DECLARE
  bu_automotive uuid;
  bu_ai uuid;
  bu_operations uuid;
  bu_finance uuid;
  bu_sales uuid;
BEGIN
  SELECT id INTO bu_automotive FROM wt_business_units WHERE name = 'Automotive' LIMIT 1;
  SELECT id INTO bu_ai FROM wt_business_units WHERE name = 'AI' LIMIT 1;
  SELECT id INTO bu_operations FROM wt_business_units WHERE name = 'Operations' LIMIT 1;
  SELECT id INTO bu_finance FROM wt_business_units WHERE name = 'Finance' LIMIT 1;
  SELECT id INTO bu_sales FROM wt_business_units WHERE name = 'Sales' LIMIT 1;

  INSERT INTO wt_app_registry (name, slug, description, status, business_unit_id, schema_prefix, supabase_project_id, app_url, table_count) VALUES
    ('BuybidHQ', 'buybid-hq', 'Wholesale vehicle sourcing platform for auto dealers', 'live', bu_automotive, NULL, 'fdcfdbjputcitgxosnyk', 'https://buybidhq.com', 0),
    ('SalesboardHQ', 'salesboard-hq', 'Real-time sales dashboard for dealership teams', 'live', bu_sales, 'sl_', 'dedicated', 'https://salesboardhq.com', 6),
    ('Sidepilot', 'sidepilot', 'AI sales copilot for auto dealers', 'spec', bu_ai, 'copilot_', NULL, NULL, 3),
    ('Demolight', 'demolight', 'Streamlined demo and vehicle showcase tool', 'idea', bu_operations, 'dl_', NULL, NULL, 5),
    ('Dealerment', 'dealerment', 'Document management for dealerships', 'spec', bu_operations, 'dd_', NULL, NULL, 0),
    ('Marbitrage', 'marbitrage', 'MMR arbitrage opportunity finder', 'idea', bu_ai, 'mmr_', NULL, NULL, 0),
    ('Agentflow', 'agentflow', 'AI agent orchestration and workflow builder', 'building', bu_operations, 'af_', NULL, NULL, 8),
    ('CUDL Rate Capture', 'cudl-rate-capture', 'Automated CUDL rate sheet capture and comparison', 'building', bu_finance, 'cr_', NULL, NULL, 6),
    ('Sidecar CRM', 'sidecar-crm', 'Lightweight CRM for independent dealers', 'building', bu_sales, 'sidecar_', NULL, NULL, 3),
    ('SalesLogHQ', 'saleslog-hq', 'Sales activity logging and goal tracking', 'spec', bu_sales, 'saleslog_', NULL, NULL, 2)
  ON CONFLICT (slug) DO NOTHING;
END $$;
