# Watchtower Admin Dashboard — Audit

Run `/audit` on this codebase. After the standard audit, also answer these specific questions:

## Standard Audit
1. What percentage of the app is wired to Supabase vs mock/static data?
2. List every page and its status (wired, partially wired, UI-only)
3. Dead code, unused imports, files that do nothing
4. TypeScript issues (any types, missing types)
5. What Supabase tables/RPCs does it currently reference?
6. What edge functions exist?

## Feedback + Ticket System Assessment
We want to add a cross-app feedback and AI ticket system to Watchtower. The plan:
- `wt_feedback` table: receives feedback from ALL apps (SalesLogHQ, SalesboardHQ, BuybidHQ, BITW, Demolight, etc.)
- `wt_tickets` table: AI-triaged tickets generated from feedback (category, priority, status, tags)
- New Watchtower page: "Tickets" — shows all tickets across all apps with filters (app, priority, status, category)
- Edge function: `triage-feedback` — takes feedback text, calls AI to categorize/prioritize, creates ticket

**Answer:**
1. Does the current schema/migration have any feedback or ticket tables already?
2. Which existing page would the Tickets page pattern most closely follow? (for consistent UI)
3. What's the current Supabase connection setup? (client file, env vars, etc.)
4. Any blockers to adding new pages to the sidebar nav?
5. Recommended file structure for the new Tickets page + components

Save your audit to `AUDIT.md` in the repo root.
