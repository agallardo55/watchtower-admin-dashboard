# Watchtower — PRODUCT-SPEC.md

*Last updated: 2026-03-17*
*Source of truth for all Watchtower development. Read this before modifying any code.*

---

## Overview

**Watchtower** is a centralized admin command center for managing the entire CMIG Partners app portfolio. One dashboard to monitor users, apps, activity, development tasks, and operational health across all business units.

**URL:** https://watchtower.buildinthewild.app
**Supabase Project:** `txlbhwvlzbceegzkoimr`
**Supabase URL:** https://txlbhwvlzbceegzkoimr.supabase.co
**Repo:** `agallardo55/watchtower-admin-dashboard`
**Branch:** `master`
**Hosting:** Netlify (auto-deploy from master)
**Netlify Site ID:** `891d4916-a56d-4cd6-9858-7760fb103d93`

---

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind
- **Charts:** Recharts
- **Backend:** Supabase (PostgreSQL + RLS + Edge Functions)
- **Auth:** Supabase Auth (email/password)
- **Hosting:** Netlify
- **Design:** Terminal command center aesthetic (true black #0a0a0a, neon green #4ADE80, JetBrains Mono)

---

## Pages & Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Overview stats, charts, recent activity |
| `/bitw` | BITW Manager | Build In The Wild content/app management |
| `/development` | Development | All registered apps with status |
| `/development/overview` | Dev Overview | Development pipeline and progress |
| `/development/:appId` | App Detail | Per-app detail (dynamic from wt_app_registry) |
| `/users` | All Users | Cross-app user management |
| `/activity` | Activity Overview | Cross-app activity feed |
| `/activity/:appId` | App Activity | Per-app activity detail |
| `/daily-tasks` | Daily Tasks | Task management |
| `/feature-requests` | Feature Requests | Feature request tracking |
| `/tickets` | Tickets | Support ticket management |
| `/settings` | Settings | App settings |
| `/schema` | Schema Browser | Database schema explorer (RPC-powered) |
| `/graduation` | Graduation Queue | Apps ready to promote from dev to production |
| `/login` | Login | Auth |
| `/forgot-password` | Forgot Password | Password reset |

---

## Database Schema

### Table Prefix Convention
- `wt_` = Watchtower core tables
- `bitw_` = Build In The Wild tables
- `profiles` = Supabase Auth profiles (shared)

### Core Tables

#### `wt_users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | References profiles(id) |
| role | TEXT | super_admin, admin, member |
| display_name | TEXT | |
| avatar_url | TEXT | |
| last_login_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |

#### `wt_business_units`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT | e.g. "Automotive", "Software" |
| description | TEXT | |
| icon | TEXT | |
| color | TEXT | |

#### `wt_app_registry`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT | App name (Demolight, DealerScore, etc.) |
| slug | TEXT | URL-safe identifier |
| business_unit_id | UUID FK | |
| status | TEXT | active, development, archived |
| supabase_project_ref | TEXT | |
| domain | TEXT | |
| repo_url | TEXT | |
| icon_url | TEXT | |
| description | TEXT | |

#### `wt_app_users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| app_id | UUID FK | References wt_app_registry |
| email | TEXT | |
| role | TEXT | |
| status | TEXT | active, invited, suspended |
| plan | TEXT | |

#### `wt_invitations`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| app_id | UUID FK | |
| email | TEXT | |
| role | TEXT | |
| status | TEXT | sent, pending, accepted, expired |
| invited_by | UUID FK | |
| expires_at | TIMESTAMPTZ | |

#### `wt_activity_log`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| app_id | UUID FK | |
| user_id | UUID | |
| action | TEXT | |
| details | JSONB | |
| created_at | TIMESTAMPTZ | |

### BITW Tables

#### `bitw_apps`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT | |
| slug | TEXT | |
| tagline | TEXT | |
| description | TEXT | |
| status | TEXT | |
| domain | TEXT | |
| repo_url | TEXT | |

#### `bitw_content`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| app_id | UUID FK | |
| title | TEXT | |
| body | TEXT | |
| type | TEXT | article, video, tutorial |
| published_at | TIMESTAMPTZ | |

---

## Edge Functions

| Function | Purpose |
|----------|---------|
| `manage-demolight-user` | CRUD operations for Demolight users from Watchtower |
| `create-demolight-user` | Create new users in Demolight's Supabase from Watchtower |

---

## Migrations

| File | Purpose |
|------|---------|
| `002_watchtower_comprehensive.sql` | Core schema: wt_users, wt_business_units, wt_app_registry, wt_invitations, bitw tables |
| `003_dashboard_wiring.sql` | Dashboard RPCs and views |
| `004_mfa_codes.sql` | MFA support |
| `005_fix_rls_recursion.sql` | RLS policy fix |
| `006_schema_browser_rpc.sql` | Schema browser RPCs |
| `007_seed_bitw_data.sql` | Seed data for BITW apps |
| `008_schema_browser_rpcs.sql` | Additional schema RPCs |
| `009_app_icons_storage.sql` | App icon storage bucket |
| `010_app_activity.sql` | Activity tracking tables |

---

## Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Layout/Sidebar | `App.tsx` | Terminal-themed sidebar with dynamic app children |
| Dashboard | `pages/Dashboard.tsx` | Stats cards, charts, recent activity |
| All Users | `pages/AllUsers.tsx` | Cross-app user table with filters |
| BITW Manager | `pages/BITWManager.tsx` | Content/app management for BITW |
| Schema Browser | `pages/SchemaBrowser.tsx` | Live database schema explorer |
| App Activity | `pages/AppActivity.tsx` | Per-app activity feed |

---

## Design System

**Current aesthetic: Terminal Command Center** (redesigned March 14, 2026)

| Token | Value |
|-------|-------|
| Background | #0a0a0a (true black) |
| Surface | #111111 |
| Accent | #4ADE80 (neon green) |
| Brand | #325AE7 (blue) |
| Text | #FFFFFF |
| Muted | #6B7280 |
| Font (data) | JetBrains Mono |
| Font (headings) | Inter |

---

## Apps Managed

| App | Supabase Ref | Status |
|-----|:--:|---|
| Demolight | owjvzqtfiyfnrdtsumqa | ✅ Active |
| DealerScore | dbkohxauhmrpogmzsxsd | ✅ Active |
| BuybidHQ | — | 🟡 Beta |
| SalesboardHQ | — | ✅ Live |
| SaleslogHQ | — | 🟡 Dev |
| adamgallardo.me | — | ✅ Live |

---

## Auth

- Email/password via Supabase Auth
- `wt_users` table controls role-based access
- Only `super_admin` can access Watchtower
- Login page with forgot password flow

---

## Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useApps` | `hooks/useApps.ts` | Fetch registered apps from wt_app_registry |
| `useStats` | `hooks/useStats.ts` | Dashboard statistics |

---

## Known Issues

- Blank screen on deploy if Netlify branch is wrong (must be `master`, not `main`)
- Supabase env vars must be set in Netlify for production build
- Terminal redesign completed March 14 — all pages updated

---

## Rules for Agents

- Read this PRODUCT-SPEC.md before modifying any code
- Never conditionally hide data fields — show "—" for missing values
- Keep the terminal command center aesthetic (dark theme, green accent, mono font)
- Commit with clear conventional messages
- Do not modify RLS policies without explicit approval
- Soft-delete only — never hard delete user records
- Update this spec when changing routes, tables, or architecture
