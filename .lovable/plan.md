## Concept

A calm, cinematic dark UI inspired by Death Stranding's HUD: near-black background, hairline borders, thin uppercase type, soft cyan glow accents, monospaced numerics, subtle scanline/grain. Game-like but restrained — no neon dashboards or arcade chrome. All data stored locally in the browser (no login).

## Visual direction

- Background: near-black (#06080A range), layered with a faint horizontal hairline grid
- Accent: soft cyan (signal glow) + amber (warning) + red (critical)
- Type: Inter / thin uppercase for labels, JetBrains Mono for numbers and codes
- Components: thin 1px borders, sharp corners (radius ~2px), pill status chips, animated progress bars with a subtle pulse
- Motion: slow fade-ins, brief HUD "boot" sweep on page load, hover = quiet glow

## Pages (TanStack Start routes)

```
/                  → Dashboard (Readiness HUD)
/inventory         → All items, filter by category/location
/inventory/new     → Add/edit item
/quests            → Preparedness checklists
/caches            → Locations (Home, BOB, Cabin, etc.)
/settings          → Household size, reset data, export/import JSON
```

## Core features

1. **Inventory** — Food & water, Medical, Tools & gear. Each item: name, category, quantity, unit, location (cache), expiration date, notes.
2. **Expiration alerts** — Dashboard surfaces items expiring within 30 days; expired items flagged red.
3. **Readiness score** — 0–100 "OPERATIONAL READINESS" score driven by coverage targets (days of food per person, liters of water per person/day, medical kit completeness, tool checklist). Shown as a HUD ring with sub-scores per category.
4. **Quests / checklists** — Predefined prep missions (e.g., "72-Hour Kit", "Winter Readiness", "Medical Baseline"). Each has steps the user checks off; completion contributes to readiness.
5. **Multi-cache locations** — Manage stashes (Home, Bug-Out Bag, Vehicle, Cabin). Items belong to one cache; per-cache readiness view.

## Dashboard layout

- Top HUD bar: date, household size, overall readiness %, sync/status pill
- Left: large readiness ring + category sub-bars (Food / Water / Medical / Tools)
- Right: "ALERTS" panel — expiring soon, low stock, incomplete quests
- Bottom: recent activity log (terminal-style)

## Data model (localStorage, JSON)

```
caches:     [{ id, name, icon, notes }]
items:      [{ id, name, category, qty, unit, cacheId, expiresAt?, notes }]
quests:     [{ id, title, steps: [{ id, label, done }], category }]
settings:   { householdSize, waterTargetLPerDay, foodTargetDays }
```

Persistence via a small `useLocalStore` hook + Zod schema for validation on import.

## Technical notes

- TanStack Start file-based routes under `src/routes/`; each page gets its own `head()` for SEO.
- Shared `<HudShell>` layout in `src/routes/__root.tsx` outlet wrapper (top bar + container).
- Components: `ReadinessRing`, `StatBar`, `ItemRow`, `CacheCard`, `QuestCard`, `AlertChip`, `TerminalLog`.
- Design tokens added to `src/styles.css` (oklch): `--background`, `--surface`, `--border`, `--accent` (cyan), `--warning` (amber), `--danger` (red), plus `--glow-accent` shadow token and a `--font-mono` family.
- shadcn primitives reused: Button, Card, Dialog (add item), Input, Select, Calendar (datepicker with `pointer-events-auto`), Progress, Tabs, Badge, Sonner for toasts.
- Seed data on first load so the dashboard isn't empty.
- No backend, no auth — purely client-side.

## Out of scope (v1)

- Ammo/defense category
- Multi-user / sync / cloud backup
- Barcode scanning, recipe planner, calorie math
- Notifications outside the app
