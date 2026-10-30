# Shower Tracker

A local-first PWA to log showers, review your history, and track personal goals. Data stays in your browser—no account or cloud sync.

[Open the app](https://d35p4c1t0.github.io/shower-tracker/)

![Home, Calendar, and Settings shown side by side with sample shower history](docs/app-overview.png)

*Home, Calendar, and Settings with sample data.*

- One-tap logging, calendar history, and shower frequency insights.
- Weekly and monthly goals, light and dark themes.
- Installable as a PWA with offline tracking. Reminders run only while the app is open.
- JSON backup and restore in Settings. Export a backup before clearing browser data.
- If IndexedDB is unavailable, fallback writes require browser Web Locks support. Older browsers can still read and export saved fallback history.

## Tech stack & engineering

- **React 19 + TypeScript:** shared hooks and a storage service layer keep UI and persistence separate.
- **Tailwind CSS + Radix UI:** responsive layouts, light/dark themes, and reusable UI primitives.
- **IndexedDB via Dexie:** on-device history and settings, a localStorage fallback, and JSON backup/restore. No backend means no automatic sync across devices.
- **Vite + Workbox:** production builds, an installable PWA, and service worker caching for offline use.
- **Vitest + Testing Library + Playwright:** unit, component, and browser tests. GitHub Actions requires lint, unit tests, and blocking Chromium checks before deploying to Pages.

Start with [the home page](src/pages/HomePage.tsx), [storage services](src/lib/database-services/), or [browser tests](e2e/).

## Development

Use Node.js 22 LTS (`nvm use`) and pnpm 10.

```bash
pnpm install
pnpm dev
```

```bash
pnpm test          # Unit tests
pnpm test:e2e      # Fast Chromium E2E suite (builds and serves the production app)
pnpm test:e2e:all  # Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari
pnpm lint
pnpm build        # Production build
pnpm preview      # Serve the build locally
```

Install browser binaries and Linux system libraries once with `pnpm exec playwright install --with-deps chromium` for the fast suite, or `pnpm exec playwright install --with-deps chromium firefox webkit` for all projects. Use Node 22 LTS; browser extraction stalled under Node 26 in our test environment.

E2E runs use two workers, no local retries, and assertion-based waits. Failures save screenshots and traces under `test-results/`; open the report with `pnpm exec playwright show-report`. The HTML report does not automatically start a server after failures. Use `pnpm test:e2e --grep @smoke` for a smaller check.

The full suite explicitly skips WebKit notification permissions and offline reloads: permission grants are unsupported, and offline service-worker navigations abort with an internal error in this harness. Offline writes and reconnecting remain tested on WebKit. Verify offline reloads on a real Safari device before relying on that behavior.

## Deployment

GitHub Actions deploys to GitHub Pages on pushes to `main`. Use `pnpm build:github` for a Pages build, or `pnpm build` for other hosts. Output goes to `dist/`.

## License

[MIT](LICENSE)
