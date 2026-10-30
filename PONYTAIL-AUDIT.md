# Ponytail audit — 2026-10-30

Repository: D35P4C1T0/shower-tracker. Local checkout: `/root/repos/shower-tracker`.

## Findings fixed

1. **Medium — malformed backup imports could replace real history.** `new Date(null)` and `new Date(true)` produce valid dates, so a malformed backup could pass validation and replace the existing database with invented timestamps. Import now requires a string, number, or Date before date validation. Imported notes must be strings instead of silently converting objects to `[object Object]`. All validation still happens before replacement. Five regression cases verify rejection preserves existing history.
2. **Medium — valid JSON with malformed shower entries bypassed corruption protection.** Fallback reads accepted missing IDs, null or invalid timestamps, and non-string notes. Subsequent writes could rewrite that history. Reads now validate the list and each entry before returning it; malformed history follows the existing recovery-copy path and blocks writes. Five regression cases verify preservation. Historical reads intentionally do not reject future dates, since clock changes must not make existing history inaccessible.

## Approach and scope

Read storage services, backup import/export, shared validation, application state, shower editing, calendar utilities, settings hooks, notification service, and PWA service. Applied small changes to existing validation and recovery paths; no new dependencies or abstractions. This was a source review with automated checks, not an exhaustive security assessment.

## Verification

- Baseline: 258 tests passed across 36 files.
- After fixes: 268 tests passed across 36 files.
- `pnpm lint`: passed.
- `pnpm build`: passed, including TypeScript and PWA generation.
- `git diff --check`: passed.
- Dependencies installed using the frozen lockfile; lockfile unchanged.

## Limits

Browser E2E, live deployment, actual device notifications, and dependency vulnerability scanning were not run. The build reports stale Browserslist data. Fixes and regression tests are included in this commit. No deployment or browser verification was performed. Malformed backups previously accepted by coercion now require corrected timestamp/note types before import.
