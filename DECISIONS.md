# DECISIONS.md — Autonomous Build Rules
**This file pre-answers questions so builds run without stopping.**
**Every repo gets a copy. Update as new patterns emerge.**

*Last updated: 2026-02-16*

---

## How This Works

When building autonomously (overnight, sub-agent, or unattended):
1. **Before asking the user** → check this file for a matching pattern
2. **If found** → follow the rule, log what you auto-resolved in DECISIONS-LOG.md
3. **If not found** → make the best judgment call, log it, and continue. Do NOT stop.

**The goal: zero interruptions. Build all night, Adam reviews in the morning.**

---

## Package Management

| Situation | Decision |
|-----------|----------|
| Need to install a well-known package (react-router, zustand, date-fns, etc.) | **Yes, install it** |
| Need to install an obscure/unknown package | **Find an alternative using existing deps first. If none, install and log it.** |
| Package version conflict | **Use the latest compatible version. Don't downgrade React.** |
| `npm audit` shows vulnerabilities | **Never run `npm audit fix --force`. Log the vulnerabilities, move on.** |
| Missing peer dependency warning | **Install the peer dep. Don't ignore it.** |
| Lock file conflict | **Delete lock file, reinstall. Log it.** |

---

## File & Code Decisions

| Situation | Decision |
|-----------|----------|
| Should I modify this file? | **Yes, if it's in `src/`, `components/`, `pages/`, `services/`, `hooks/`, `lib/`, `utils/`, or `styles/`.** |
| Should I create a new file? | **Yes. Prefer small focused files over stuffing everything in one.** |
| New component: separate file or inline? | **Separate file if >30 lines. Inline if trivial.** |
| Modal or new page? | **Modal for create/edit/quick actions. New page for detail views or complex flows.** |
| Inline styles or Tailwind classes? | **Tailwind. Never inline styles.** |
| Where to put shared types? | **`types/` or `types.ts` at project root. Never duplicate types across files.** |
| Import path style? | **Use `@/` alias if configured. Otherwise relative paths.** |

---

## Architecture & Patterns

| Situation | Decision |
|-----------|----------|
| REST endpoint or Supabase RPC? | **RPC for complex queries. Direct table access for simple CRUD.** |
| Client-side or server-side validation? | **Both. Always. Client for UX, server for security.** |
| State management approach? | **Follow existing pattern in the repo. Don't introduce a new state lib.** |
| Existing pattern in codebase vs "better" way? | **Follow existing pattern. Consistency > perfection.** |
| Edge function or client-side logic? | **Edge function for: auth-gated ops, Stripe, email, SMS. Client for: UI logic, filtering, sorting.** |
| Flat component or extract sub-components? | **Extract if the component exceeds 200 lines.** |
| Optimistic UI or wait for server? | **Optimistic for toggles, votes, quick actions. Wait for server on creates/deletes/payments.** |

---

## Error Recovery

| Situation | Decision |
|-----------|----------|
| Build fails | **Read the error. Fix it. Don't ask.** |
| Type error | **Fix the type. Never use `any` or `as any`. Create a proper interface.** |
| Missing import | **Add it.** |
| Linting error | **Fix it.** |
| Test fails | **Fix the test if the code is correct. Fix the code if the test is correct.** |
| API call fails during dev | **Add proper error handling, use mock/demo data to continue, log the issue.** |
| Merge conflict | **Follow upstream (main branch) for logic. Keep local changes for new features. Log conflicts resolved.** |
| File not found at expected path | **Search for it. If moved, update the import. If deleted, skip that task and log it.** |
| Environment variable missing | **Use a sensible default or check `.env.example`. Never hardcode secrets.** |

---

## Styling & UI

| Situation | Decision |
|-----------|----------|
| Color choice | **Use existing theme colors. Primary blue: #325AE7. Follow what's in tailwind config.** |
| Icon needed | **Use Lucide icons if available. Inline SVG if not. Never add a new icon library.** |
| Spacing/sizing | **Follow existing patterns in the codebase. When in doubt: p-4, gap-4, rounded-lg.** |
| Dark mode | **Only if the app already has it. Don't add dark mode unless spec'd.** |
| Animation | **Subtle transitions only (150-200ms). No bouncy/spring animations unless spec'd.** |
| Table on mobile | **Cards. Always cards. Never horizontal scroll.** |
| Empty state design | **Icon + heading + description + CTA button. Centered. Muted colors.** |

---

## Database & Supabase

| Situation | Decision |
|-----------|----------|
| Need a new table? | **Create a migration file. Never modify the DB directly.** |
| Column naming | **snake_case. Always.** |
| Money fields | **_cents suffix and store as integers. EXCEPT BuybidHQ = whole dollars.** |
| Need RLS policy? | **Yes, always. Every table gets RLS enabled.** |
| Soft delete or hard delete? | **Soft delete (deleted_at timestamp) for user data. Hard delete OK for system/temp data.** |
| Schema change on existing table? | **Additive only (ADD COLUMN, CREATE INDEX). Never DROP without explicit instruction.** |
| Foreign key? | **Yes, always reference parent tables. ON DELETE CASCADE for child records, RESTRICT for important refs.** |

---

## Git & Commits

| Situation | Decision |
|-----------|----------|
| Commit message format | **`type: description` — feat, fix, refactor, chore, docs** |
| Commit frequency | **After each logical unit of work. Not after every file.** |
| Branch strategy | **Work on current branch. Don't create new branches unless spec'd.** |
| Push after commit? | **Yes, push to origin after committing.** |
| Uncommitted changes exist? | **Stash them, do your work, pop stash after. Don't blow away existing changes.** |

---

## When Genuinely Stuck

If none of the above patterns match and you truly can't decide:

1. **Pick the simpler option**
2. **Log your decision and reasoning in DECISIONS-LOG.md**
3. **Continue building**
4. **Never stop and wait**

Adam reviews in the morning. A wrong decision that ships is better than a right decision that blocks the build.

---

## App-Specific Overrides

### BuybidHQ
- Money = whole dollars, NOT cents
- Bid forms are the critical path — extra validation care

### SaleslogHQ  
- Launching soon — stability over features
- 4 user accounts exist with password `demo1234`

### Watchtower
- Internal tool — skip demo mode
- localStorage OK for new features (wire to Supabase later)

### BITW
- Marketing site — design matters more than usual
- Dark jungle theme

### SalesboardHQ
- Repo lives on MacBook Air only
- Has its own Supabase instance
