# Watchtower Admin Dashboard -- Full Audit

**Date:** 2026-02-24
**Project:** `txlbhwvlzbceegzkoimr`
**Stack:** Vite + React + TypeScript + Tailwind + Supabase

---

## 1. Schema Map

All tables discovered in migrations 002-010 on the Watchtower Supabase project.

### Core Platform Tables (wt_ prefix)

#### wt_users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | FK -> profiles(id) ON DELETE CASCADE |
| role | text NOT NULL | CHECK ('super_admin', 'admin', 'member'), default 'member' |
| display_name | text | |
| avatar_url | text | |
| mfa_phone | text | Added in 004 |
| last_login_at | timestamptz | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | auto-updated by trigger |
| deleted_at | timestamptz | soft delete |

#### wt_business_units
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| name | text NOT NULL | |
| description | text | |
| icon | text | |
| color | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated by trigger |

Seeded values: Automotive, AI, Operations, Finance, Sales.

#### wt_app_registry
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| name | text NOT NULL | |
| slug | text UNIQUE NOT NULL | |
| description | text | |
| icon_url | text | |
| icon_emoji | text | Added in 003 |
| status | text NOT NULL | CHECK ('idea','spec','building','beta','live','archived'), default 'idea' |
| category | text | Added in 003 |
| business_unit_id | uuid FK | -> wt_business_units(id) |
| schema_prefix | text | |
| supabase_project_id | text | |
| table_count | int | default 0 |
| user_count | int NOT NULL | default 0, added in 003 |
| app_url | text | |
| repo_url | text | |
| graduation_stage | text | CHECK ('idea','spec','dev','wired','qa','live'), added in 003 |
| pipeline_note | text | Added in 003 |
| overview | text | Not in migrations -- likely added manually |
| target_users | text[] | Not in migrations -- likely added manually |
| roadmap | jsonb | Not in migrations -- likely added manually |
| screenshots | text[] | Not in migrations -- likely added manually |
| supabase_url | text | Not in migrations -- referenced by all-users edge function |
| supabase_ref | text | Not in migrations -- referenced by all-users edge function |
| users_table | text | Not in migrations -- referenced by all-users edge function |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated by trigger |
| deleted_at | timestamptz | soft delete |

#### wt_invitations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| email | text NOT NULL | |
| role | text NOT NULL | CHECK ('admin', 'member'), default 'member' |
| business_unit_id | uuid FK | -> wt_business_units(id) |
| invited_by | uuid FK | -> profiles(id) |
| status | text NOT NULL | CHECK ('pending','accepted','expired','revoked'), default 'pending' |
| token | text UNIQUE NOT NULL | |
| expires_at | timestamptz NOT NULL | |
| accepted_at | timestamptz | |
| created_at | timestamptz | |

#### wt_tasks
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| title | text NOT NULL | |
| description | text | |
| assigned_to | uuid FK | -> profiles(id) |
| category | text | CHECK ('specs','research','infrastructure','content','development') |
| priority | text NOT NULL | CHECK ('high','medium','low'), default 'medium' |
| status | text NOT NULL | CHECK ('todo','in_progress','review','done'), default 'todo' |
| due_date | date | |
| completed_at | timestamptz | |
| app_id | uuid FK | -> wt_app_registry(id) |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated by trigger |
| deleted_at | timestamptz | soft delete |

#### wt_graduation_queue
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| app_id | uuid FK | -> wt_app_registry(id) ON DELETE CASCADE |
| current_stage | text NOT NULL | CHECK ('incubating','ready','migrating','graduated'), default 'incubating' |
| checklist | jsonb | default '{}' |
| notes | text | |
| graduated_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated by trigger |

#### wt_activity_log
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| app_id | uuid FK | -> wt_app_registry(id) ON DELETE CASCADE |
| action | text NOT NULL | |
| description | text | |
| actor | text | CHECK ('kitt','claude_code','adam','system') |
| metadata | jsonb | default '{}' |
| created_at | timestamptz | |

#### wt_daily_stats
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| app_id | uuid FK | -> wt_app_registry(id) ON DELETE CASCADE |
| date | date NOT NULL | UNIQUE(app_id, date) |
| users_total | int NOT NULL | default 0 |
| users_new | int NOT NULL | default 0 |
| signups | int NOT NULL | default 0 |
| revenue_cents | int NOT NULL | default 0 |
| created_at | timestamptz | |

#### wt_mfa_codes (migration 004)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid NOT NULL FK | -> auth.users(id) ON DELETE CASCADE |
| code | text NOT NULL | |
| expires_at | timestamptz NOT NULL | |
| used | boolean NOT NULL | default false |
| created_at | timestamptz | |

#### wt_app_activity (migration 010)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| app_slug | text NOT NULL | Lowercase app identifier |
| event_type | text NOT NULL | signup, login, sale_created, etc. |
| user_email | text | |
| user_id | uuid | |
| metadata | jsonb | default '{}' |
| created_at | timestamptz | default now() |

### BITW Tables (bitw_ prefix)

#### bitw_build_logs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| app_id | uuid FK | -> wt_app_registry(id) ON DELETE CASCADE |
| title | text NOT NULL | |
| description | text | |
| agent | text | CHECK ('kitt','claude_code','gemini','adam') |
| stage | text | CHECK ('spec','schema','ui','wiring','deploy','fix') |
| logged_at | timestamptz | default now() |
| created_at | timestamptz | |

#### bitw_changelogs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| app_id | uuid FK | -> wt_app_registry(id) ON DELETE CASCADE |
| version | text | |
| title | text NOT NULL | |
| changes | text[] | |
| published | boolean NOT NULL | default false |
| published_at | timestamptz | |
| created_at | timestamptz | |

#### bitw_subscribers
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| email | text UNIQUE NOT NULL | |
| name | text | |
| subscribed_at | timestamptz | default now() |
| unsubscribed_at | timestamptz | |

#### bitw_feedback
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| app_id | uuid FK | -> wt_app_registry(id) ON DELETE CASCADE |
| email | text | |
| feedback_type | text | CHECK ('bug','feature','praise','other') |
| title | text NOT NULL | |
| description | text | |
| screenshot_url | text | |
| status | text NOT NULL | CHECK ('open','reviewed','planned','closed'), default 'open' |
| votes | int NOT NULL | default 0 |
| created_at | timestamptz | |

### Storage

- **app-icons** bucket (public, migration 009): authenticated upload/update/delete, public read.

### RPC Functions

- `set_updated_at()` -- trigger function for updated_at columns
- `is_super_admin()` -- SECURITY DEFINER, bypasses RLS to check wt_users role (migration 005)
- `get_table_columns(p_table_name text)` -- SECURITY DEFINER, reads information_schema (migrations 006/008)
- `get_public_tables()` -- SECURITY DEFINER, lists public tables (migrations 006/008)

---

## 2. App Registry

Seeded apps from migrations 002, 003, and 007:

| App | Slug | Status | Supabase Project | Category | Business Unit |
|-----|------|--------|-----------------|----------|---------------|
| BuybidHQ | buybid-hq | live | fdcfdbjputcitgxosnyk (standalone) | Sales | Automotive |
| SalesboardHQ | salesboard-hq | live | suykcdomvqmkjwmbtyzk (standalone) | Sales | Sales |
| Sidepilot | sidepilot | spec | none (Watchtower) | AI | AI |
| Demolight | demolight | idea | owjvzqtfiyfnrdtsumqa (standalone) | Operations | Operations |
| Dealerment | dealerment | spec | none (Watchtower) | Operations | Operations |
| Marbitrage | marbitrage | idea | none (Watchtower) | AI | AI |
| Agentflow | agentflow | building | none (Watchtower) | Operations | Operations |
| CUDL Rate Capture | cudl-rate-capture | building | none (Watchtower) | Finance | Finance |
| Sidecar CRM | sidecar-crm | building | none (Watchtower) | Sales | Sales |
| SalesLogHQ | saleslog-hq | spec | none (Watchtower) | Sales | Sales |
| DealerScore | dealerscore | (added in 007 seed) | none | -- | -- |

---

## 3. Auth Architecture

### Login Flow
- **Method:** `supabase.auth.signInWithPassword({ email, password })` (email/password only)
- **Session management:** `supabase.auth.getSession()` on mount + `supabase.auth.onAuthStateChange()` listener in `App.tsx`
- **Gate:** If no session, show `<Login>` or `<ForgotPassword>`. If session exists, show `<Layout>` with all routes.
- **Sign out:** `supabase.auth.signOut()` button in header.
- **No role check at the app level:** The dashboard does NOT verify `wt_users.role = 'super_admin'` in frontend code. It relies entirely on RLS to gate data access. Any authenticated Supabase user can see the UI shell.

### Password Reset Flow
- Custom MFA-based reset (NOT Supabase magic link):
  1. User enters email -> calls `password-reset-send` edge function -> sends SMS OTP to registered phone
  2. User enters 6-digit code + new password -> calls `password-reset-verify` edge function
- Uses `wt_mfa_codes` table for OTP storage

### Edge Functions (auth-related)
| Function | Purpose |
|----------|---------|
| password-reset-send | Generates OTP, sends via SMS, stores in wt_mfa_codes |
| password-reset-verify | Validates OTP, updates password via admin API |
| mfa-send | Sends MFA code (standalone MFA) |
| mfa-verify | Verifies MFA code |
| all-users | Cross-project user aggregation from multiple Supabase projects |
| log-activity | Accepts cross-app activity events into wt_app_activity |
| update-user | User management operations |

### Supabase Client Config
- `.env.local` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for project `txlbhwvlzbceegzkoimr`
- Single Supabase client instance in `lib/supabase.ts`
- Edge functions use `SUPABASE_SERVICE_ROLE_KEY` from Deno env for admin-level operations

---

## 4. RLS Policies

### Strategy
All wt_ core tables use the same pattern: `is_super_admin()` SECURITY DEFINER function (migration 005 fix). Only `super_admin` role in `wt_users` can read or write.

### Per-Table Policy Summary

| Table | Policy | Access |
|-------|--------|--------|
| **wt_users** | wt_users_select_super_admin | SELECT if is_super_admin() |
| | wt_users_all_super_admin | ALL if is_super_admin() |
| **wt_business_units** | wt_business_units_select_super_admin | SELECT if is_super_admin() |
| | wt_business_units_all_super_admin | ALL if is_super_admin() |
| **wt_app_registry** | wt_app_registry_select_super_admin | SELECT if is_super_admin() |
| | wt_app_registry_all_super_admin | ALL if is_super_admin() |
| | **wt_app_registry_anon_select** | **SELECT USING (true) -- wide open** |
| | **wt_app_registry_anon_update** | **UPDATE USING (true) -- wide open** |
| **wt_invitations** | wt_invitations_select_super_admin | SELECT if is_super_admin() |
| | wt_invitations_all_super_admin | ALL if is_super_admin() |
| **wt_tasks** | wt_tasks_select_super_admin | SELECT if is_super_admin() |
| | wt_tasks_all_super_admin | ALL if is_super_admin() |
| **wt_graduation_queue** | wt_graduation_queue_select_super_admin | SELECT if is_super_admin() |
| | wt_graduation_queue_all_super_admin | ALL if is_super_admin() |
| **wt_activity_log** | wt_activity_log_select_super_admin | SELECT if is_super_admin() |
| | wt_activity_log_all_super_admin | ALL if is_super_admin() |
| **wt_daily_stats** | wt_daily_stats_select_super_admin | SELECT if is_super_admin() |
| | wt_daily_stats_all_super_admin | ALL if is_super_admin() |
| **wt_mfa_codes** | wt_mfa_codes_select_own | SELECT where user_id = auth.uid() |
| **wt_app_activity** | Service role full access | ALL USING (true) -- wide open |
| **bitw_build_logs** | bitw_build_logs_public_select | SELECT USING (true) |
| | bitw_build_logs_admin_all | ALL if is_super_admin() |
| **bitw_changelogs** | bitw_changelogs_public_select | SELECT USING (true) |
| | bitw_changelogs_admin_all | ALL if is_super_admin() |
| **bitw_subscribers** | bitw_subscribers_public_insert | INSERT WITH CHECK (true) |
| | bitw_subscribers_admin_all | ALL if is_super_admin() |
| **bitw_feedback** | bitw_feedback_public_select | SELECT USING (true) |
| | bitw_feedback_public_insert | INSERT WITH CHECK (true) |
| | bitw_feedback_admin_all | ALL if is_super_admin() |
| **storage.objects (app-icons)** | Authenticated upload/update/delete | bucket_id = 'app-icons' |
| | Public read | bucket_id = 'app-icons' |

### Critical RLS Issues

1. **wt_app_registry is wide open for SELECT and UPDATE** (migration 003 added `anon_select` and `anon_update` with `USING (true)`). Any unauthenticated user can read all app data and update any row.
2. **wt_app_activity has `ALL USING (true)`** -- anyone (including anon) can read, insert, update, and delete activity records.
3. **wt_mfa_codes** has no INSERT policy, meaning inserts must go through service role (edge functions). This is correct but only if all OTP operations always use service role.

---

## 5. Gaps for "Watchtower Super Admin" Cross-App Feature

### 5.1 No Unified User Identity Across Projects
- Each Supabase project (BuybidHQ, SalesboardHQ, Demolight, Watchtower) has its own `auth.users` table. There is no shared user identity or SSO.
- The `all-users` edge function attempts cross-project user aggregation via REST API + per-project service keys, but references columns (`supabase_url`, `supabase_ref`, `users_table`) that **do not exist in any migration**. These were likely added ad-hoc and are not tracked in version control.

### 5.2 Missing Migration for Cross-Project Columns
The `all-users` edge function queries `wt_app_registry` for:
- `supabase_url` -- not in migrations
- `supabase_ref` -- not in migrations
- `users_table` -- not in migrations

Similarly, migration 007 seeds `overview`, `target_users`, `roadmap`, `screenshots` columns that are not created in any migration file.

### 5.3 No Frontend Role Check
- `App.tsx` checks for a valid Supabase session but never verifies the user is a `super_admin` in `wt_users`. Any user with a Watchtower auth account sees the full admin UI. Data is protected by RLS, but error states for non-admin users would be confusing.

### 5.4 No Cross-App Activity Ingestion is Incomplete
- `wt_app_activity` and the `log-activity` edge function exist, but there is no evidence that BuybidHQ, SalesboardHQ, or Demolight are actively calling this endpoint. The table may be empty or sparsely populated.

### 5.5 No Cross-App Permissions Model
- There is no table mapping which Watchtower admin can manage which apps. Currently it is all-or-nothing (`super_admin` sees everything).
- No concept of "app-level admin" (e.g., someone who manages only BuybidHQ users but not SalesboardHQ).

### 5.6 Service Key Distribution
- The `all-users` function requires `SERVICE_KEY_{ref}` env vars per external project. These must be manually set as Supabase secrets. There is no self-service or automated key rotation.

### 5.7 Hardcoded Admin Identity
- The header in `App.tsx` hardcodes "Adam Gallardo" and "Super Admin" -- it does not fetch the actual user profile or role from `wt_users`.

### 5.8 wt_app_registry RLS is Broken
- The `anon_select` and `anon_update` policies from migration 003 (added for dev convenience) are still in place. Any anonymous request can read all app metadata and update any app row. This is a security issue.

### 5.9 No Audit Trail for Admin Actions
- `wt_activity_log` tracks AI agent/system actions but has no support for tracking human admin actions (who changed what, when).

### 5.10 profiles Table is Referenced but Not Defined
- `wt_users.id` references `profiles(id)`, and `wt_invitations.invited_by` / `wt_tasks.assigned_to` also reference `profiles(id)`. The `profiles` table is not in any migration -- it was likely created before migration 002 or exists as a Supabase Auth trigger-created table.

---

## 6. Recommended Schema Changes

### 6.1 Fix wt_app_registry RLS (Critical)

Remove the open anon policies immediately:

```sql
DROP POLICY IF EXISTS "wt_app_registry_anon_select" ON wt_app_registry;
DROP POLICY IF EXISTS "wt_app_registry_anon_update" ON wt_app_registry;
```

### 6.2 Fix wt_app_activity RLS

Replace the wide-open policy with proper access control:

```sql
DROP POLICY IF EXISTS "Service role full access" ON wt_app_activity;

-- Super admins can read all activity
CREATE POLICY "wt_app_activity_select_admin" ON wt_app_activity
  FOR SELECT USING (is_super_admin());

-- Only service role can insert (edge functions)
-- No anon/authenticated insert policy needed if log-activity uses service role
CREATE POLICY "wt_app_activity_insert_service" ON wt_app_activity
  FOR INSERT WITH CHECK (false);
  -- Service role bypasses RLS, so this blocks anon/authenticated inserts
```

### 6.3 Add Missing Cross-Project Columns to Migration

```sql
ALTER TABLE wt_app_registry
  ADD COLUMN IF NOT EXISTS supabase_url text,
  ADD COLUMN IF NOT EXISTS supabase_ref text,
  ADD COLUMN IF NOT EXISTS users_table text DEFAULT 'users',
  ADD COLUMN IF NOT EXISTS overview text,
  ADD COLUMN IF NOT EXISTS target_users text[],
  ADD COLUMN IF NOT EXISTS roadmap jsonb,
  ADD COLUMN IF NOT EXISTS screenshots text[];
```

### 6.4 Add App-Level Admin Permissions Table

For granular cross-app access:

```sql
CREATE TABLE IF NOT EXISTS wt_app_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES wt_users(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES wt_app_registry(id) ON DELETE CASCADE,
  permission text NOT NULL DEFAULT 'viewer'
    CHECK (permission IN ('viewer', 'editor', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_id)
);

ALTER TABLE wt_app_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wt_app_permissions_admin" ON wt_app_permissions
  FOR ALL USING (is_super_admin());
```

### 6.5 Add Admin Audit Log

```sql
CREATE TABLE IF NOT EXISTS wt_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  target_table text,
  target_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wt_admin_audit_log_user ON wt_admin_audit_log(user_id, created_at DESC);
CREATE INDEX idx_wt_admin_audit_log_target ON wt_admin_audit_log(target_table, target_id);

ALTER TABLE wt_admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wt_admin_audit_log_admin" ON wt_admin_audit_log
  FOR SELECT USING (is_super_admin());
```

### 6.6 Frontend Role Verification

Add a role check after session is established in `App.tsx`:

```typescript
// After session is confirmed, verify the user is a super_admin
const { data: wtUser } = await supabase
  .from('wt_users')
  .select('role')
  .eq('id', session.user.id)
  .single();

if (!wtUser || wtUser.role !== 'super_admin') {
  // Show "Access Denied" page instead of the admin dashboard
}
```

### 6.7 Dynamic User Identity in Header

Replace hardcoded "Adam Gallardo" with actual profile data:

```typescript
const { data: profile } = await supabase
  .from('wt_users')
  .select('display_name, role, avatar_url')
  .eq('id', session.user.id)
  .single();
```

### 6.8 Cross-App User Sync Table (Future)

For a true unified user directory without SSO:

```sql
CREATE TABLE IF NOT EXISTS wt_user_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text,
  app_slug text NOT NULL,
  external_user_id text NOT NULL,
  external_project_ref text NOT NULL,
  role text,
  status text DEFAULT 'active',
  last_seen_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(app_slug, external_user_id)
);

CREATE INDEX idx_wt_user_directory_email ON wt_user_directory(email);
CREATE INDEX idx_wt_user_directory_app ON wt_user_directory(app_slug);

ALTER TABLE wt_user_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wt_user_directory_admin" ON wt_user_directory
  FOR ALL USING (is_super_admin());
```

This would be populated by the `all-users` edge function on a schedule, giving Watchtower a cached local view of all users across all projects without needing real-time cross-project queries.

---

## Summary of External Supabase Projects

| Project | Ref | Type | Connection Method |
|---------|-----|------|-------------------|
| Watchtower | txlbhwvlzbceegzkoimr | Multi-tenant host | Direct (local) |
| BuybidHQ | fdcfdbjputcitgxosnyk | Standalone | REST API via SERVICE_KEY env var |
| SalesboardHQ | suykcdomvqmkjwmbtyzk | Standalone | REST API via SERVICE_KEY env var |
| Demolight v2 | owjvzqtfiyfnrdtsumqa | Standalone | REST API via SERVICE_KEY env var |
