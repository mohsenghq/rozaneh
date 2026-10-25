---
name: Rozaneh New Tab
description: Work on the Rozaneh WXT/Svelte new-tab extension. Use for any change to the dashboard, widget layout, shortcut bar, clock, city picker, optional topSites suggestions, onboarding, toolbar popup, i18n/RTL, storage migrations, tests, or visual verification in this repository.
---

# Rozaneh New Tab

Rozaneh is a private new-tab extension for Chrome and Firefox. It is a WXT
project with Svelte 5 (runes), TypeScript, Tailwind CSS v4, and Vitest. The UI is
Persian-first and RTL by default, with an English toggle.

Read this skill before editing. It records the architecture and the decisions
that are easy to regress.

## Commands

Run from the repository root (Windows + pnpm):

```sh
pnpm install
pnpm dev                 # WXT dev mode
pnpm check               # svelte-check; must stay at 0 errors / 0 warnings
pnpm test                # Vitest
pnpm build               # .output/chrome-mv3
pnpm build:firefox       # .output/firefox-mv2
pnpm zip                 # store zip
pnpm zip:firefox         # store zip + sources
```

After any non-trivial change run at least `pnpm check` and `pnpm test`; before
handing off also run both builds.

## Architecture map

| Area | Files |
| --- | --- |
| New-tab entry | `src/entrypoints/newtab/{index.html,main.ts,App.svelte}` |
| Toolbar popup | `src/entrypoints/popup/{index.html,main.ts,Popup.svelte,popup.css}` |
| Dashboard grid | `src/lib/WidgetGrid.svelte`, `src/lib/grid.ts`, `src/lib/gridGeometry.ts` |
| Fixed widget layout | `src/lib/settings.ts`, `src/lib/migrations.ts` |
| Shortcut bar | `src/lib/ShortcutsCard.svelte`, `Shortcuts.svelte`, `shortcutLayout.ts`, `shortcuts.ts`, `shortcuts.svelte.ts` |
| Auto suggestions | `src/lib/topSites.ts`, `autoShortcuts.ts` |
| Clock | `src/lib/Clock.svelte`, `ClockFace.svelte`, `clock.ts`, `clockDial.ts` |
| City picker | `src/lib/CityPicker.svelte`, `city.ts`, `weather.ts` |
| Onboarding | `src/lib/Welcome.svelte`, `onboarding.ts` |
| Settings | `src/lib/Settings.svelte` |
| Storage/config | `src/lib/store.svelte.ts`, `settings.ts`, `migrations.ts`, `config.ts` |
| i18n/RTL | `src/lib/i18n.ts`, `src/assets/app.css` |
| Tests | `src/lib/*.test.ts`, `src/test/*` mocks |
| Design/plan docs | `docs/superpowers/specs/`, `docs/superpowers/plans/` |

## Hard rules

1. **Permissions stay minimal.** Required: `storage`, `favicon`. Optional:
   `bookmarks`, `topSites`. Do not request `history`, host permissions, or new
   sensitive permissions without explicit user approval.
2. **`topSites` is opt-in.** Never request it on load. It must be requested from
   a user gesture (Settings toggle, onboarding button, popup toggle). If it is
   unavailable or denied, the UI must keep working.
3. **No search field.** The top card is the shortcut bar, not a web search box.
   The widget id is `shortcuts`; `search` is a legacy id handled by migration.
4. **The dashboard layout is fixed.** Widget drag/reorder was intentionally
   removed from the product. Do not reintroduce free positioning or the old
   drag toggle unless the user asks. `widgetLayout` is persisted for
   compatibility, but `schemaVersion: 3` resets old draggable layouts to
   `defaultWidgetLayout`.
5. **Never send user data anywhere.** Everything except weather, prices,
   wallpapers, and city geocoding stays local. `topSites` is read locally and
   is never transmitted.
6. **Keep both languages.** Every user-visible string goes in
   `src/lib/i18n.ts` under `fa` and `en`. Use `t("key")` and `localeNum()` for
   numbers. Do not hardcode UI copy in components.
7. **Respect RTL.** Prefer logical properties (`start`/`end`, `ms`/`me`) for
   directional layout. Use physical `left`/`right` only when deliberately
   centering something independent of direction (see the bookmark label note).
8. **The manifest description must stay ASCII.** Persian text in
   `wxt.config.ts` was mangled on Windows builds. Keep manifest metadata ASCII.

## Desktop layout: reference stage

The dashboard is designed at a fixed reference size and scaled as one unit:

- `REF_GRID_W = 976`, `REF_ROW_H = 69`, `REF_GAP = 20`, 11 columns.
- `WidgetGrid` renders a 976px stage and applies
  `scale = min(1, availableWidth / 976, availableHeight / naturalHeight)`.
  It never upscales.
- At widths below `STACK_BREAKPOINT = 768`, it renders a stacked layout instead.
  Clock and weather get explicit heights (`h-40`); the shortcut card sizes
  itself from its rows.
- The scale must be applied to pointer coordinates when the shortcut bar is
  dragged inside the scaled stage (`displayScale()` in `Shortcuts.svelte`).

Why: earlier attempts to resize each widget independently caused text wrapping
in the calendar/occasions cards around ~960px. Uniform scaling preserves the
designed proportions and keeps the one-screen, no-scroll target.

The App shell is `h-dvh overflow-hidden`; the main area is `flex-1 min-h-0`.
Desktop must not produce a document scrollbar. Verify `scrollHeight ===
innerHeight` at 1280×600, 1366×768, 1440×900, 1920×1080, and 961×772.

## Shortcut bar

- Desktop: exactly **12 columns**, 54px tiles, one row only, labels under tiles.
  Capacity is 12 slots (11 shortcuts + the add button). The card is a fixed
  86px tall (`SHORTCUT_CARD_H`), taller than its one-row grid slot; rows below
  are pushed down by `SHORTCUT_ROW_EXTRA` (`rowExtra(y)` in `gridGeometry.ts`)
  so the normal 20px gap is preserved.
- Edit/remove controls are 24px circles with a 12px glyph; keep them at least
  24px and fully inside the card's rounded corner on hover.
- Narrow/stacked: `flowLayout()` computes columns from width. Rows grow with
  content; do not leave a fake empty row.
- Tiles never shrink when a new item is added. If capacity is exceeded, older
  items stay and the add button disappears; do not auto-shrink.
- Labels are **one word**, 10px, muted, single-line, ellipsized. Use
  `shortLabel(title, url)` from `shortcuts.ts`: it keeps one-word brands,
  takes the first meaningful word of multi-word titles, skips stopwords
  (`the`, `my`, …), and falls back to the hostname. The full title is available
  as the native `title` attribute.
- Label centering uses physical `left-1/2 -translate-x-1/2`, not `start-1/2`.
  In RTL, `start-1/2` resolves to the right edge and offsets the label by one
  slot.
- Tooltips open **above** the tile; the first row needs extra margin so they do
  not collide with the edit/remove buttons.
- The shortcut bar has its own pointer drag reorder. Keep it independent from
  the removed widget drag. It is RTL-aware and must divide pointer deltas by
  the desktop stage scale.
- Auto shortcuts are appended after manual ones, deduplicated by hostname, and
  skipped if the user dismissed them. Removing any shortcut records its
  hostname in `local:autoShortcutsDismissed`; re-adding clears it. Editing an
  auto item promotes it to `source: "user"`.

## Clock

- Angles come from `clockAngles(date)` in `clock.ts`; never accumulate elapsed
  time from mount.
- Update once per second from `Date.now()`. On `visibilitychange` (visible),
  `pageshow`, and `focus`, resync immediately. Do not put a CSS transition on
  the second hand; background throttling plus transitions is what caused the
  old fast-forward bug.
- The classic dial is rendered from geometry in `clockDial.ts`:
  - 60 minute ticks, 12 major hour marks
  - tick outer edge `r=46.5`; minute inner `r=45`; hour inner `r=42`
  - numerals at `r=36.5`, inside the markers and outside the hands
  - hands: hour 19, minute 29, second 32; numerals start around 32.25
- Ticks are intentionally short and faint (`stroke-width 1.4/0.55`, opacity
  `0.75/0.45`). Numerals should be readable without competing with the ticks.
- Do not add a second ring inside the dial. `ClockFace` must remain one SVG.

## City picker

- `weather.ts` requests `count=50`; `city.ts` filters to city feature codes
  (`PPLC`, `PPLA`, `PPLA2-4`, `PPL`) and removes `PPLX` neighbourhoods,
  `PPLL` localities, and `MT` mountains.
- Exact-name match wins; if there is one, return only exact-name records.
  Deduplicate by `name + admin1 + countryCode`, rank by feature code/population.
  Show province and country in the secondary line.
- `CityPicker` aborts stale requests and autofocuses when opened from the
  weather card. The Settings instance must not steal focus on mount.
- The city selection stores `admin1` alongside lat/lng/timezone.

## Onboarding and popup

- `local:onboarded` is separate from Settings, so config import/export does not
  skip the welcome flow. Replaying from Settings/popup opens the newtab with
  `?welcome=1`.
- Popup "Settings" opens `newtab.html?settings=1`. App handles both query flags,
  then strips the query with `history.replaceState`.
- The popup is a WXT entrypoint at `src/entrypoints/popup/`. WXT generates
  `action.default_popup` (Chrome MV3) / `browser_action` (Firefox MV2). Popup
  options: on/off switch for the dashboard, theme (auto/light/dark), optional
  most-visited toggle, Settings, Guide, privacy/version. The switch controls
  the Rozaneh dashboard, not Chrome's installed-extension state; when off, the
  new-tab page shows a minimal screen with a re-enable button.
- `popup.css` overrides the shared `body { min-height: 100dvh }` to
  `min-height: 0` and a 340px width. Keep popup assets lightweight; do not
  import the whole new-tab UI.

## Storage and migrations

WXT storage keys:

- `local:settings` — `Settings`, including `schemaVersion: 3`
- `local:shortcuts` — `Shortcut[]` (`source: "user" | "auto"`)
- `local:autoShortcutsDismissed` — normalized hostnames
- `local:onboarded` — boolean
- `local:weather`, `local:faviconCache`, `local:prices` — caches

`migrations.ts` handles:

- legacy widget id `search` → `shortcuts`
- unknown/missing widget ids
- clamping to the 11-column grid
- resetting pre-v3 draggable layouts to `defaultWidgetLayout`
- validation of imported shortcuts/config

When changing persisted shapes, bump `schemaVersion`, update
`migrations.test.ts`, and update `config.ts` import/export. Never assume old
storage is valid.

## Testing and visual verification

Unit tests use Vitest. `vitest.config.ts` aliases `wxt/utils/storage` and
`wxt/browser` to in-memory mocks under `src/test/`; add pure logic tests for
geometry, labels, city filtering, clock angles, and auto-shortcut merging.

Visual verification in this environment:

1. `pnpm build`
2. `node .opencode/skills/rozaneh/scripts/preview-server.mjs .output/chrome-mv3`
3. Open `http://localhost:4173/` (new tab) or `/popup.html` (popup).
4. The script injects a mock `chrome` API. Seed state via browser devtools:

```js
localStorage.setItem("__rozaneh_preview_storage__", JSON.stringify({
  onboarded: true,
  settings: { clockFace: "classic", autoShortcutsEnabled: false },
  shortcuts: [{ id: "a", title: "Stack Overflow", url: "https://stackoverflow.com", icon: "" }]
}));
localStorage.setItem("__rozaneh_permissions__", JSON.stringify(["topSites"]));
```

Then reload. The mock supports `storage`, `permissions`, `topSites`,
`bookmarks`, `tabs.create`, and `runtime.getManifest`.

This preview is for UI/logic. For the real optional-permission prompt, load
`.output/chrome-mv3` at `chrome://extensions` → Load unpacked and test the
toggle once.

Recommended viewport checks: 390×844, 768×600, 961×772, 1366×768, 1280×600,
1920×1080. Check dark and light, Persian and English, and no document scroll.

## Common pitfalls

- **Windows case-insensitive modules:** `shortcuts.svelte.ts` and
  `Shortcuts.svelte` collide. Import rune modules with an explicit
  `.svelte.js` suffix in application code (`./shortcuts.svelte.js`) so Windows
  resolution cannot pick the component. Do not import `.ts` extensions in app
  code (the TS config disallows it).
- **Vitest + WXT:** importing anything that defines a storage item triggers
  `browser` access at module load. Use the aliases in `vitest.config.ts`; do
  not add a real `wxt/browser` import to a node test without mocking it.
- **Svelte 5 props:** use `$props()` destructuring; capture initial props with
  `untrack` when assigning to `$state` (otherwise svelte-check warns).
- **Storing runes:** pass `$state.snapshot(...)` to WXT storage, not a proxy.
- **RTL:** `start`/`end` are logical; for centering use physical `left` or
  `left-1/2`. Test both `fa` and `en`.
- **Layout changes:** update `gridGeometry.test.ts`/`shortcutLayout.test.ts`
  and re-run the viewport matrix. Do not fix one width by resizing individual
  widgets; use the stage scale.
- **Favicons:** `Favicon.svelte` probes a 256px Google favicon, then asks
  `icon.horse` only when that bitmap is smaller than 64px, and falls back to the
  browser favicon/cache and `/favicon.ico`. It picks by `naturalWidth`; do not
  replace it with a fixed-size `sz=64` request. Any new favicon service needs a
  privacy-policy/README update.
- **No network in popup:** the popup only reads settings/permissions; keep it
  fast and local.
- **Git:** the repository is initialized locally and work is committed per
  feature. Do not commit `node_modules`, `.output`, or `.wxt`.

## Definition of done

- `pnpm check` passes with no warnings.
- `pnpm test` passes; add tests for new pure logic.
- Both Chrome and Firefox builds succeed.
- New strings exist in `fa` and `en`.
- Desktop has no page scroll; the stage and stacked modes were checked.
- Optional permissions are still requested only from a user gesture.
- Changes are committed with a focused message, and the README/CHANGELOG are
  updated when user-visible behavior changes.
