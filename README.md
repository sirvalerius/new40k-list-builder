# New40k List Builder

A mobile-first, installable **PWA** for building Warhammer 40,000 **11th edition
(#new40k)** army lists. Pick a battle size, choose one or more detachments
within your Detachment Points budget, build a roster, assign enhancements, add
allies, and get **live legality validation** — all offline-capable and saved
locally on your device.

> **Unofficial, fan-made tool.** Not affiliated with or endorsed by Games
> Workshop. Warhammer 40,000 and all associated names are trademarks of Games
> Workshop Ltd. **Powered by Wahapedia** (game data attribution).

## Features

- **Battle sizes** — Incursion (1000), Strike Force (2000), Onslaught (3000),
  each setting the points cap, Detachment Points budget, enhancement limit and
  Rule-of-Three unit limits (doubled for Battleline).
- **Multiple detachments** within the DP budget, with exclusivity-tag checks.
- **Roster builder** — browse datasheets with stat lines (M/T/Sv/W/Ld/OC),
  weapons, abilities, keywords and points tiers; add units; pick the points
  option; mark a **Warlord**; Rule-of-Three and Epic-Hero uniqueness surfaced
  in the UI.
- **Enhancements** — assign detachment enhancements to eligible CHARACTERs,
  with `(Upgrade)`-tag affordances; engine enforces the real limits.
- **Allies** — legal allied units filtered by faction with per-keyword point
  caps.
- **Live validation** — a continuous legality banner + sticky summary bar
  (points, Detachment Points, enhancements).
- **Persistence** — saved to **IndexedDB**, autosaved on edit.
- **Backup** — export/import a portable JSON of all lists; per-list text export.

The list-legality logic lives entirely in `src/lib/rules.ts` (the single source
of truth, shared by UI and tests). The UI never re-implements rules.

## Tech stack

Vite + React + TypeScript, `vite-plugin-pwa` (offline shell + runtime-cached
faction data), `idb` for IndexedDB, plain CSS (no UI framework) for a small,
fast bundle. Tests run on **vitest**.

## Data

Static JSON under `public/data/` (served from `/data/...`):

- `index.json` — faction index.
- `rules.json` — battle sizes, ally rules, attribution.
- `factions/<slug>.json` — per-faction datasheets + detachments, **lazy-loaded**
  on demand (never all 24 at once).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # type-checks (tsc -b) then builds to dist/
npm run preview  # serve the production build locally
```

## Test

```bash
npm run test     # vitest run
```

A placeholder test wires up the runner (`src/lib/rules.placeholder.test.ts`);
real rule-engine specs are added separately.

## Deploy (GitHub Pages + CI)

The live site testers use is published automatically by GitHub Actions
(`.github/workflows/deploy.yml`):

- **Every push and pull request** runs CI — `npm ci`, `npm test`, `npm run build`.
  Open feature branches with descriptive names and the build/tests are validated
  before merge.
- **Push to `main`** additionally builds with the Pages sub-path
  (`VITE_BASE=/new40k-list-builder/`) and deploys to GitHub Pages.

Live URL: `https://sirvalerius.github.io/new40k-list-builder/`

The pre-built game data is committed under `public/data/`, so CI needs only
Node (no Python). To regenerate the data after editing the source CSVs, run
`python ../tools/build_app_data.py` from this folder's parent.

### Suggested workflow
```bash
git switch -c feat/<descriptive-name>   # work on a branch
# …commit…
git push -u origin feat/<descriptive-name>
# open a PR → CI runs → merge to main → auto-deploy
```

## Docker

Multi-stage build (Node build → nginx static serve with SPA fallback + gzip):

```bash
docker compose up --build       # http://localhost:8080
# or
docker build -t new40k .
docker run -p 8080:80 new40k
```

## Free deployment

This is a static SPA, so the cheapest path is a static host. The Docker image
is provided for container hosts.

### Cloudflare Pages / Netlify (static SPA — free)

- **Build command:** `npm run build`
- **Output / publish directory:** `dist`
- **SPA routing:** both platforms need an unknown-route → `index.html` rewrite.
  - **Netlify:** add `public/_redirects` containing `/*  /index.html  200`
    (files in `public/` are copied verbatim into `dist/`).
  - **Cloudflare Pages:** SPA fallback is automatic for Pages projects; if
    needed add a `public/_redirects` with the same line.

### Fly.io / Render (Docker)

Both can build straight from the provided `Dockerfile` (nginx serves `dist/` on
port 80).

- **Render:** New → Web Service → "Deploy from a Dockerfile". No start command
  needed; the image runs nginx. Render injects `$PORT` — for a 1:1 match you can
  serve on 80 (Render maps it) or template the nginx `listen` directive.
- **Fly.io:** `fly launch` (it detects the Dockerfile) then `fly deploy`. Set
  the internal port to `80` in `fly.toml` (`[http_service] internal_port = 80`).

## Project layout

```
app/
├─ public/
│  ├─ data/                # faction JSON (index, rules, per-faction)
│  ├─ favicon.svg
│  └─ pwa-192.png / pwa-512.png
├─ src/
│  ├─ components/          # StatLine, DatasheetCard, Modal, Collapsible,
│  │                       # SummaryBar, ValidationBanner
│  ├─ screens/             # Home, NewListWizard, Builder, DetachmentPicker,
│  │                       # Roster, Enhancements, Allies
│  ├─ lib/
│  │  ├─ types.ts          # data-contract types (pre-existing)
│  │  ├─ rules.ts          # validation engine (pre-existing, source of truth)
│  │  ├─ data.ts           # lazy JSON loaders + caches
│  │  ├─ db.ts             # IndexedDB persistence (idb)
│  │  └─ helpers.ts        # ids, html-strip, list <-> unit, export
│  ├─ App.tsx              # view orchestration + autosave
│  └─ main.tsx
├─ Dockerfile, nginx.conf, docker-compose.yml, .dockerignore
└─ vite.config.ts, vitest.config.ts
```
