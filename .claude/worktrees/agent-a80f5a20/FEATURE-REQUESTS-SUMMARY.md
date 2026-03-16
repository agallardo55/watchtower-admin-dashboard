# Feature Requests Page — Summary

**Added:** 2026-02-16  
**Commit:** `feat: add Feature Requests page with import/export`

## What Was Built

New page at `/feature-requests` (`pages/FeatureRequests.tsx`) with full CRUD for tracking feature requests across all apps.

### Features
1. **Table/list view** — desktop table, mobile card layout (responsive at `md` breakpoint)
2. **Add Feature Request** — modal with app dropdown, title, description, priority, status, requested by, date (auto-fills today)
3. **Filter bar** — filter by app, status, priority with clear filters button
4. **Sort** — clickable column headers for date, priority, status, votes (toggle asc/desc)
5. **Edit** — click edit icon to open modal with all fields pre-populated
6. **Delete** — confirmation dialog ("Are you sure? This cannot be undone.")
7. **Status badges** — color-coded: new=blue, planned=purple, in-progress=yellow, shipped=green, declined=red
8. **Export CSV** — downloads all requests as `feature-requests-YYYY-MM-DD.csv`
9. **Import CSV** — file upload, parses and adds to list (handles quoted fields)
10. **Vote count** — upvote button per request (manual increment)
11. **localStorage persistence** — key: `watchtower_feature_requests`
12. **Empty state** — lightbulb icon + CTA when no requests exist
13. **Mobile responsive** — table → cards on mobile, 44px touch targets
14. **Stats row** — total, new, planned, in-progress, shipped, declined counts

### Files Changed
- `pages/FeatureRequests.tsx` — new page (712 lines)
- `App.tsx` — added import + route `/feature-requests`
- `constants.tsx` — added lightbulb icon + "Feature Requests" sidebar nav item

### Standards Compliance
- Form validation on blur (title, app required)
- Loading/empty/populated states
- Delete confirmation dialog
- Button states (disabled when invalid, loading spinner on save)
- No `any` types, no console.log, no TODO placeholders
- Mobile responsive with 44px touch targets

### Future: Wire to Supabase
Replace `loadRequests()`/`saveRequests()` with Supabase table. Schema suggestion:
```sql
CREATE TABLE feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'new',
  requested_by TEXT DEFAULT 'internal',
  date_submitted DATE DEFAULT CURRENT_DATE,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
