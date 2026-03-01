# AGENTS.md

## Build Standards (MANDATORY)

Before every commit, you MUST:
1. Run `npx tsc --noEmit` — fix ALL type errors before committing
2. Run `npm run build` — must succeed with zero errors
3. Test the specific flow you changed (do not assume it works)
4. Remove all console.log (unless tagged `// debug`)
5. No hardcoded secrets, URLs, or keys

If ANY gate fails, fix it before committing. Do NOT commit broken code
and "fix it later." There is no later.

