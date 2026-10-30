# E2E audit — 2026-10-30

## Repairs

- Installed Playwright browsers and system libraries. Browser archive extraction stalled under Node 26; Node 22 completed installation. Added `.nvmrc` and aligned CI on Node 22.
- Replaced broad, ambiguous locators with roles or test IDs. Removed fixed sleeps, random request failures, caught assertions, and optional checks that allowed tests to pass without testing the feature.
- Wait for application initialization, service-worker control, saved changes, and toast removal rather than guessing delays.
- Use full Chromium headless: the default headless shell returned `Notification.permission === 'denied'` despite the Permissions API reporting `granted`. Verified permission grants work with full Chromium.
- Explicitly dispatch network-status events after toggling actual offline emulation; Firefox did not reliably emit those events in an already-open document.
- Bring the exporting tab to the foreground. The Firefox two-tab download flow then passed three repeated runs.
- Dismiss delayed iOS installation overlays during unrelated tests; test the overlay itself separately without that handler.
- Open theme menus through keyboard activation after Firefox intermittently missed pointer activation. The repaired settings case passed five repeated Firefox runs.
- Provide version-response fixtures at the fetch boundary before bootstrap; service-worker-controlled requests bypassed WebKit network-route mocks. The repaired update case passed two repeated WebKit runs, and the isolated iOS prompt case passed two Mobile Safari runs.
- Keep two workers, disable local retries, retain failure traces/screenshots, and stop HTML reports from automatically launching a server. Removed video recording overhead.
- `pnpm test:e2e` runs Chromium. `pnpm test:e2e:all` runs Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari. CI now runs meaningful blocking tests, with desktop and mobile Chromium sharing one production build in deployment checks.

## Coverage

Recording, calendar indicators, notes editing/deletion, future-time rejection, month-end calendar navigation, keyboard activation, onboarding completion, saved settings/themes, cross-tab themes, real service-worker activation, offline reloads, online/offline writes and reconnecting, install prompt handling, notification settings, storage-quota errors without history loss, fallback writes across tabs, blocked localStorage, theme migration/import, and app updates preserving another app's cache.

## Explicit limits

WebKit and Mobile Safari skip notification permission grants (unsupported by Playwright WebKit) and offline reloads (offline service-worker navigation aborts with an internal browser error in this harness). Offline writes/reconnecting remain covered on both projects. Offline reloads on real Safari devices remain unverified. Headless device emulation does not verify native installation or operating-system notification delivery.

## Verification

Node 22.23.4, Playwright 1.55.0; retries disabled for verification.

- Five-project sweep: 96 passed, 4 explicitly skipped, 5 failed. Fixed those five cases; `playwright test --last-failed --retries=0` then passed all 5 in 22.9 seconds. This verifies all 101 supported project/test combinations across the sweep and focused recheck, rather than claiming a single clean full-suite run after the final fixes.
- Clean-start default command, `pnpm test:e2e --reporter=line`: all 21 Chromium tests passed in 44.3 seconds, including production build and server startup.
- Repeated checks: Firefox settings/theme case 5/5, Firefox two-tab export 3/3, WebKit update fixture 2/2, Mobile Safari installation prompt 2/2.
- All 268 unit/component tests passed across 36 files.
- Lint, explicit TypeScript checking of E2E files/config, production build, and `git diff --check` passed.

No production application code or dependencies changed in this follow-up. Full cross-browser testing is intentionally an explicit command; the normal E2E command stays focused on Chromium.
