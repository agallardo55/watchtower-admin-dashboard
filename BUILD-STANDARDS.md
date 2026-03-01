# BUILD-STANDARDS.md — Engineering Quality Gates

## Branch Strategy

- **`staging`** — all work happens here. CC, Codex, Kitt all commit to staging.
- **`main`** — production. Only receives merges from staging after testing.
- **Never commit directly to main.** Always staging first.

```
Agent commits → staging → CI runs → Adam tests → merge to main → deploy
```

*"No code ships without passing inspection."*
*Created: 2026-03-01. Applies to ALL CMIG/F&G Holdings projects.*

## Why This Exists

CC and Codex build fast but don't verify. We've had:
- TypeScript errors committed and deployed (SaleslogHQ, Demolight RN)
- Auth race conditions from redundant gates nobody tested
- Data not loading because user rows were missing fields
- MFA code left behind after "removal" (required second CC session)

This document is the building code. Every commit, every deploy, every agent session follows it.

---

## Database Change Checklist

When any schema change is needed (new table, new column, RLS policy, index, etc.):

1. **Write a numbered migration file** in `demolight-web/supabase/migrations/` (e.g. `012_add_mfa_codes.sql`)
2. **Never change schema in the Supabase dashboard without a migration file** — dashboard changes get wiped on next deploy
3. **Run the migration** via SQL editor or `supabase db push`
4. **Update TypeScript types in BOTH repos** — `demolight-web` and `demolight-rn`
5. **Test both apps** after any schema change — what works on web may break mobile and vice versa

**Migration file ownership:**
- `demolight-web/supabase/migrations/` is the single source of truth
- Mobile repo (`demolight-rn`) does NOT store migrations — it's a consumer
- Edge functions live in `demolight-web/supabase/functions/`

**RLS policy changes:**
- Always test from both web AND mobile after changing RLS
- Log the change in `memory/YYYY-MM-DD.md`
- Include rollback SQL in comments

**Multi-app projects (Demolight, Carsured):**
- Same rules apply — one repo owns migrations, other repos consume
- `demolight-web` owns Demolight schema (`dl_` prefix)
- `carsured-dashboard` owns Carsured schema (`cs_` prefix)
- Shared tables (`ins_lookups`) — owned by whichever repo created them

---

## The Three Gates

Every code change must pass all three gates **before commit**. No exceptions.

### Gate 1: Does It Compile?
```bash
npx tsc --noEmit          # Zero errors required
npm run build             # Must succeed
```
**Who checks:** The agent (CC/Codex) before committing. CI as backstop.

### Gate 2: Does It Work?
After making changes, manually verify the flow you touched:
- **Auth changes** → Login, verify session persists, verify data loads
- **UI changes** → Navigate to the page, check rendering, check responsive
- **API/Edge function changes** → Call the endpoint, verify response
- **Database changes** → Query the affected tables, verify data integrity

**Who checks:** The agent runs the app and tests. For mobile: `npx expo start` and verify. For web: `npm run dev` and verify.

### Gate 3: Did It Break Anything Else?
```bash
npm test                  # If tests exist, all must pass
npx playwright test       # If E2E exists, all must pass
```
**Who checks:** CI runs automatically on push. Agent should run locally first.

---

## Pre-Commit Checklist

Copy this into every CC/Codex prompt:

```
BEFORE COMMITTING — MANDATORY:
1. [ ] `npx tsc --noEmit` — zero errors
2. [ ] `npm run build` — succeeds
3. [ ] Tested the specific flow I changed
4. [ ] No console.log left (except // debug tagged)
5. [ ] No hardcoded secrets, URLs, or API keys
6. [ ] No TODO/FIXME without a tracking comment
7. [ ] Commit message describes WHAT changed and WHY
```

---

## CI Pipeline (GitHub Actions)

Every repo gets this workflow. CI is the **final backstop** — not the first check.

### Standard CI Workflow
```yaml
name: CI
on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      # Gate 1: Compile
      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build

      # Gate 3: Tests (if they exist)
      - name: Unit tests
        run: npm test --if-present
        continue-on-error: false

      # Security scans
      - name: No secrets in code
        run: |
          if grep -rn "sk_live\|sk_test\|service_role\|SUPABASE_SERVICE_ROLE" \
            --include="*.ts" --include="*.tsx" \
            --exclude-dir=node_modules --exclude-dir=supabase \
            --exclude-dir=.next .; then
            echo "❌ Possible secret in source!"
            exit 1
          fi

      - name: No .env committed
        run: |
          if [ -f .env ] || [ -f .env.local ]; then
            echo "❌ .env file tracked in git!"
            exit 1
          fi

      - name: Console.log audit
        run: |
          COUNT=$(grep -rn "console\.log" \
            --include="*.ts" --include="*.tsx" \
            --exclude-dir=node_modules --exclude-dir=supabase \
            . | grep -v "// debug" | wc -l | tr -d ' ')
          echo "⚠️ $COUNT console.log statements found"

      - name: npm audit
        run: npm audit --audit-level=high
        continue-on-error: true
```

### React Native Variant (Expo)
Replace the build step:
```yaml
      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Expo export check
        run: npx expo export --platform web --output-dir dist
        continue-on-error: true
```

### Chrome Extension Variant
Replace the build step:
```yaml
      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Build extension
        run: npm run build
```

---

## Post-Deploy Smoke Test

After every production deploy, verify core flows:

### Per-App Checklists

**SaleslogHQ:**
- [ ] Login with test user
- [ ] Dashboard loads with data
- [ ] Add a sale → appears in table
- [ ] Nightly report page renders (`/report?token=...`)
- [ ] Settings page loads

**Demolight Web:**
- [ ] Login with test user
- [ ] Dashboard loads
- [ ] Settings/ADF page renders
- [ ] Terms/signing page loads (`/terms/[token]`)
- [ ] Invite flow works (reset-password?invite=true)

**Demolight Mobile:**
- [ ] Login → lands on TestDriveList
- [ ] Test drives load (data visible)
- [ ] Start new test drive → scan → form → confirmation
- [ ] Account screen loads user info

**BuybidHQ:**
- [ ] Landing page renders
- [ ] Signup flow works
- [ ] Marketplace loads listings
- [ ] Bid placement works

**Carsured Extension:**
- [ ] Extension loads in Chrome
- [ ] Login works
- [ ] Customer lookup returns results

**Carsured Dashboard:**
- [ ] Landing page renders
- [ ] Signup flow works
- [ ] Dashboard loads after login

---

## Agent Instructions (for AGENTS.md)

Add this block to every repo's AGENTS.md:

```markdown
## Build Standards (MANDATORY)

Before every commit, you MUST:
1. Run `npx tsc --noEmit` — fix ALL type errors before committing
2. Run `npm run build` — must succeed with zero errors
3. Test the specific flow you changed (don't assume it works)
4. Remove all console.log (unless tagged `// debug`)
5. No hardcoded secrets, URLs, or keys

If ANY gate fails, fix it before committing. Do NOT commit broken code
and "fix it later." There is no later.

If you're unsure whether something works, say so in the commit message
and flag it for review.
```

---

## Bug Triage Process

When a bug is found:

### 1. Capture
Log to `memory/YYYY-MM-DD.md`:
```markdown
### Bug: [short description]
- **Found by:** [human/CI/agent/user]
- **Severity:** CRITICAL / HIGH / MEDIUM / LOW
- **Repo:** [which repo]
- **Steps to reproduce:** [exact steps]
- **Expected:** [what should happen]
- **Actual:** [what happens]
```

### 2. Classify
| Severity | Definition | Response Time |
|----------|-----------|---------------|
| CRITICAL | App won't load, data loss, security hole | Fix immediately |
| HIGH | Core flow broken (can't login, can't submit) | Fix same day |
| MEDIUM | Feature broken but workaround exists | Fix this week |
| LOW | Cosmetic, console warnings, minor UX | Fix when convenient |

### 3. Assign
- **Type errors, build failures** → Kitt fixes directly (mechanical)
- **Logic bugs, data issues** → CC prompt with reproduction steps
- **Architecture issues** → Adam + Kitt discuss, then CC implements
- **Mobile-specific** → CC prompt for demolight-rn repo

### 4. Verify
After fix:
- [ ] Original bug no longer reproduces
- [ ] Related flows still work (regression check)
- [ ] All three gates pass
- [ ] CI green

---

## Lessons Learned

| Date | Bug | Root Cause | Gate That Would Catch It |
|------|-----|-----------|------------------------|
| 2026-02-28 | Auth race condition (mobile) | Redundant ProtectedRoute + async SecureStore | Gate 2 (test login flow) |
| 2026-02-28 | Data not loading after login | Missing dealership_id on user row | Gate 2 (verify data loads) |
| 2026-03-01 | TS errors in CI | CC never ran tsc before committing | Gate 1 (tsc --noEmit) |
| 2026-02-27 | MFA remnants after "removal" | First CC session left dead imports | Gate 1 (tsc catches unused) |
| 2026-02-04 | Production data loss | No backup before destructive migration | AGENTS.md DB checklist |

---

*This is a living document. When a new failure mode appears, add it to Lessons Learned and update the gates.*
