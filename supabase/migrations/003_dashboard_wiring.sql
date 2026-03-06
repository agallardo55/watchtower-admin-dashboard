-- ============================================================================
-- 003_dashboard_wiring.sql
-- Add columns needed by Watchtower dashboard frontend
-- Project: txlbhwvlzbceegzkoimr
-- ============================================================================

-- Add missing columns to wt_app_registry
ALTER TABLE wt_app_registry
  ADD COLUMN IF NOT EXISTS icon_emoji text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS user_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS graduation_stage text DEFAULT 'idea'
    CHECK (graduation_stage IN ('idea', 'spec', 'dev', 'wired', 'qa', 'live')),
  ADD COLUMN IF NOT EXISTS pipeline_note text;

-- Allow anon SELECT on wt_app_registry for dashboard reads during dev
DROP POLICY IF EXISTS "wt_app_registry_anon_select" ON wt_app_registry;
CREATE POLICY "wt_app_registry_anon_select" ON wt_app_registry
  FOR SELECT USING (true);

-- Allow anon UPDATE on wt_app_registry for pipeline note editing during dev
DROP POLICY IF EXISTS "wt_app_registry_anon_update" ON wt_app_registry;
CREATE POLICY "wt_app_registry_anon_update" ON wt_app_registry
  FOR UPDATE USING (true);

-- Seed the new columns with matching data from the frontend constants
UPDATE wt_app_registry SET
  icon_emoji = '🏷️',
  category = 'Sales',
  user_count = 12,
  graduation_stage = 'wired',
  pipeline_note = 'Bid lifecycle working. Extension + RN cleaned up.'
WHERE slug = 'buybid-hq';

UPDATE wt_app_registry SET
  icon_emoji = '📈',
  category = 'Sales',
  user_count = 23,
  graduation_stage = 'live',
  pipeline_note = '9 edge functions. Stripe active. SEO needed.'
WHERE slug = 'salesboard-hq';

UPDATE wt_app_registry SET
  icon_emoji = '🤖',
  category = 'AI',
  user_count = 0,
  graduation_stage = 'spec',
  pipeline_note = 'Chrome extension + web dashboard. Full spec written.'
WHERE slug = 'sidepilot';

UPDATE wt_app_registry SET
  icon_emoji = '🚗',
  category = 'Operations',
  user_count = 0,
  graduation_stage = 'wired',
  pipeline_note = 'Schema applied. Web + RN wired. Needs Stripe.'
WHERE slug = 'demolight';

UPDATE wt_app_registry SET
  icon_emoji = '📄',
  category = 'Operations',
  user_count = 0,
  graduation_stage = 'dev',
  pipeline_note = 'SOP platform for dealerships. Schema planned.'
WHERE slug = 'dealerment';

UPDATE wt_app_registry SET
  icon_emoji = '💰',
  category = 'AI',
  user_count = 0,
  graduation_stage = 'spec',
  pipeline_note = 'Acquisition intelligence platform. Stitch UI done.'
WHERE slug = 'marbitrage';

UPDATE wt_app_registry SET
  icon_emoji = '🔄',
  category = 'Operations',
  user_count = 0,
  graduation_stage = 'idea',
  pipeline_note = 'AI workflow automation — needs spec'
WHERE slug = 'agentflow';

UPDATE wt_app_registry SET
  icon_emoji = '📊',
  category = 'Finance',
  user_count = 0,
  graduation_stage = 'idea',
  pipeline_note = 'Rate tracking and comparison for credit union direct lending.'
WHERE slug = 'cudl-rate-capture';

UPDATE wt_app_registry SET
  icon_emoji = '🤝',
  category = 'Sales',
  user_count = 0,
  graduation_stage = 'idea',
  pipeline_note = 'Lightweight CRM built specifically for high-velocity sales.'
WHERE slug = 'sidecar-crm';

UPDATE wt_app_registry SET
  icon_emoji = '📝',
  category = 'Sales',
  user_count = 0,
  graduation_stage = 'qa',
  pipeline_note = 'Blueprint done. Need live Stripe products + deploy.'
WHERE slug = 'saleslog-hq';
