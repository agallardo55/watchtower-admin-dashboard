-- New table: Cross-app user activity tracking
-- Owner: Watchtower
-- Consumers: All BITW apps POST here via log-activity edge function
-- Does NOT affect any existing tables
create table if not exists wt_app_activity (
  id uuid primary key default gen_random_uuid(),
  app_slug text not null,
  event_type text not null,
  user_email text,
  user_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_wt_app_activity_app on wt_app_activity(app_slug, created_at desc);
create index idx_wt_app_activity_type on wt_app_activity(event_type, created_at desc);
create index idx_wt_app_activity_created on wt_app_activity(created_at desc);

-- RLS
alter table wt_app_activity enable row level security;
create policy "Service role full access" on wt_app_activity for all using (true);

-- Common event types for reference (not enforced):
-- signup, login, logout, page_view, feature_use,
-- sale_created, bid_submitted, scan_completed, demo_started,
-- checkout_started, subscription_created, error
-- Table + column comments (mandatory for all new tables)
comment on table wt_app_activity is 'Cross-app user activity feed. All BITW apps POST events here via log-activity edge function. Owner: Watchtower.';
comment on column wt_app_activity.app_slug is 'Lowercase app identifier: salesloghq, buybidhq, demolight, dealerscore, salesboardhq, bitw';
comment on column wt_app_activity.event_type is 'Event name: signup, login, sale_created, bid_submitted, scan_completed, demo_started, checkout_started, error, etc.';
comment on column wt_app_activity.metadata is 'Flexible JSON for app-specific event data (e.g., scan_id, vehicle_vin, deal_amount)';
