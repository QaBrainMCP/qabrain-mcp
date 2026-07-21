# Application Discovery Adapter

Overview
- The Discovery Adapter implements an automated pipeline to launch a browser, authenticate, explore pages, discover components and locators, capture snapshots, and persist knowledge into the QaBrain knowledge repository.

Pipeline
- Browser launcher: starts Playwright Chromium with retries and headless support.
- Login engine: responsible for signing in (pluggable via application adapters).
- Page & Component discovery: uses existing discovery services to enumerate pages and UI components.
- Locator discovery: generates primary and fallback selectors.
- Snapshot engine: stores screenshots and DOM snapshots under `.qabrain/snapshots`.
- Knowledge builder: converts discoveries into repository records.

Extension Points
- Add application adapters under `src/application/adapters` to support site-specific login/verification flows.
- Replace or extend discovery submodules in `src/discovery` for more advanced heuristics.

Files
- `src/discovery` – discovery pipeline implementation and helpers.
- `docs/application-discovery.md` – this file.
