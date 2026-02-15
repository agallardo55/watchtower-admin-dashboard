# CLAUDE.md — Agent Autonomy Rules

You are an autonomous coding agent working on CMIG Partners apps. Follow these rules without asking for permission.

## Tool Autonomy

### Supabase CLI ✅ Autonomous
You have full access to the Supabase CLI. Do these freely:
- `supabase functions deploy` — deploy edge functions
- `supabase secrets set` — set environment secrets
- `supabase db push` — apply migrations
- `supabase functions list` — check deployed functions
- `supabase migration new` — create migration files
- Query tables via CLI or REST API for debugging
- Create new edge functions in `supabase/functions/`

**NEVER do without explicit human approval:**
- `DROP TABLE`, `TRUNCATE`, `DELETE FROM` without WHERE
- Schema migrations that replace or remove existing tables
- Changing RLS policies that could expose data

### Stripe CLI ✅ Autonomous (Test Mode)
You have full access to Stripe CLI in **test mode**:
- `stripe products create` — create products
- `stripe prices create` — create prices
- `stripe listen --forward-to` — webhook listener
- `stripe trigger` — trigger test events
- `stripe customers create/list` — manage test customers
- Create webhook endpoints
- Test checkout flows end-to-end

**NEVER do without explicit human approval:**
- Any operation in **live mode** (`--live` flag or live keys)
- Deleting products or prices
- Modifying existing live webhook endpoints

### Git ✅ Autonomous
- `git add`, `git commit`, `git push origin staging` — do freely
- `git checkout -b` — create feature branches freely
- `git merge staging` into feature branches — do freely

**NEVER do without explicit human approval:**
- `git push origin main` — main branch is protected
- `git push --force` — never force push
- Merging into main

### npm / Package Management ✅ Autonomous
- `npm install <package>` — install dependencies freely
- `npm run build` — build freely
- `npm run dev` — start dev servers freely

**NEVER do:**
- `npm audit fix --force` — React downgrade breaks apps
- Remove packages without understanding downstream impact

## Project Conventions

### Money
- All money stored as `_cents` in DB, dollars in UI — **EXCEPT BuybidHQ which uses whole dollars**
- Use `formatCents()` / `dollarsToCents()` utilities

### Supabase Projects
| App | Project Ref | Type |
|-----|------------|------|
| Watchtower (SalesLogHQ, BITW, Dealerment) | `txlbhwvlzbceegzkoimr` | Multi-tenant |
| BuybidHQ | `fdcfdbjputcitgxosnyk` | Standalone |
| SalesboardHQ | `suykcdomvqmkjwmbtyzk` | Standalone |
| Demolight v2 | `owjvzqtfiyfnrdtsumqa` | Standalone |

### Edge Functions
- Use Deno + `https://esm.sh/@supabase/supabase-js@2`
- Always include CORS headers
- Always handle OPTIONS preflight
- Use `SUPABASE_SERVICE_ROLE_KEY` from env for DB access

### Demo Mode
Every app gets a "Try Demo" button. Pattern: mock data file + demo context + banner + login bypass.

### Formatting
- Phone: `(###) ###-####` auto-format
- Email: validate on blur, lowercase on save
- Password: eye/eye-off toggle

## When Stuck
- Check `supabase/migrations/` for schema reference
- Check existing edge functions for patterns
- Check `package.json` for available scripts
- If truly blocked, commit what you have with a clear message about what's left
