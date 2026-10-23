# Rozaneh UX Overhaul — Implementation Plan

> **For agentic workers:** implement task-by-task, in order. Run the verification commands after each task. Do not start a task until the previous task's acceptance criteria pass.

**Goal:** Remove the new-tab search field, keep two rows of shortcuts, add opt-in most-visited shortcuts, make the dashboard fit desktop screens without scrolling, fix widget dragging, produce unambiguous city results with autofocus, show the correct time instantly after tab return, redesign the classic clock face, and add a first-run welcome flow.

**Architecture:** Keep the existing WXT + Svelte 5 + TypeScript + Tailwind structure. Add small pure modules for geometry, drag resolution, city ranking, clock angles, and auto-shortcut merging so they can be unit-tested without a browser. The app store owns persisted settings; the shortcuts store owns the shortcut list and dismissal list. The new-tab page remains a single entrypoint with no service worker.

**Tech stack:** WXT 0.20, Svelte 5 runes, TypeScript 5.9, Tailwind CSS v4, Vitest 4, Chrome MV3 and Firefox builds.

**Design spec:** `docs/superpowers/specs/2026-10-22-rozaneh-ux-overhaul-design.md`

## Global constraints

- Do not request the `history` permission. `topSites` must stay in `optional_permissions` and may only be requested from a user gesture.
- Do not add a background/service worker or an `alarms` permission.
- Do not add new network services. Weather remains Open-Meteo; wallpapers remain Bing/Picsum; prices remain tgju.
- Desktop target: no vertical scrolling at 100% zoom from 1280×720 through 3840×2160. Mobile/narrow screens (<640px) may scroll.
- Keep the app usable with no permissions beyond `storage` and `favicon`.
- Keep all new copies in both Persian and English in `src/lib/i18n.ts`.
- Respect `prefers-reduced-motion`.
- The working directory is not a git repository. Do not run `git add`/`git commit`; save files and report verification instead.
- After each task run at least `pnpm check` and the task's focused tests. Run `pnpm test` after tasks that add tests.

---

### Task 1: Settings schema, migrations, and pure helpers

**Files:**
- Modify: `src/lib/settings.ts`
- Modify: `src/lib/store.svelte.ts`
- Modify: `src/lib/config.ts`
- Create: `src/lib/migrations.ts`
- Create: `src/lib/migrations.test.ts`

**Interfaces:**
- Produces: `Settings.schemaVersion: number` (current `2`).
- Produces: `Settings.autoShortcutsEnabled: boolean` (default `false`).
- Produces: `migrateSettings(raw: Partial<Settings> | undefined): Settings`.
- Produces: `migrateConfig(raw: unknown): { settings: Partial<Settings>; shortcuts: Shortcut[] } | null`.

**Steps:**

- [ ] Add `schemaVersion` and `autoShortcutsEnabled` to the `Settings` interface and `defaultSettings` in `src/lib/settings.ts`.

```ts
export interface Settings {
  schemaVersion: number;
  autoShortcutsEnabled: boolean;
  // ...existing fields
}

export const defaultSettings: Settings = {
  schemaVersion: 2,
  autoShortcutsEnabled: false,
  // ...existing defaults
};
```

- [ ] Add `admin1?: string` to `GeoLocation` and set the default Tehran location to `admin1: "استان تهران"`. This is used by the city picker and weather label.

- [ ] Create `src/lib/migrations.ts`:

```ts
import type { Shortcut } from "./shortcuts";
import type { Settings } from "./settings";

export function migrateSettings(raw: Partial<Settings> | undefined): Settings;
export function migrateConfig(raw: unknown): {
  settings: Partial<Settings>;
  shortcuts: Shortcut[];
} | null;
```

Rules:
- Merge stored settings over `defaultSettings`.
- Preserve unknown future fields when returning the settings object.
- A v1 config (`version: 1`) is accepted; `version: 2` is the output.
- Widget-id migration is added in Task 2 after the `WidgetId` rename.

- [ ] Update `AppStore.#apply()` to use `migrateSettings()` and never write `undefined`.
- [ ] Update `AppStore.getSettings()` to include the two new fields.
- [ ] Add `setAutoShortcutsEnabled(enabled: boolean)` to the store.
- [ ] Update `config.ts`: export `version: 2`; import through `migrateConfig()`.

- [ ] Add tests in `migrations.test.ts`:
  - Missing `schemaVersion` becomes 2.
  - Missing `autoShortcutsEnabled` becomes false.
  - v1 config import works.
  - Partial settings preserve defaults for missing fields.

- [ ] Run:

```sh
pnpm test -- migrations
pnpm check
```

**Acceptance:** Existing settings still load; new fields have defaults; type-check passes.

---

### Task 2: Remove the search field and rebuild the shortcuts card

**Files:**
- Rename: `src/lib/SearchCard.svelte` → `src/lib/ShortcutsCard.svelte`
- Modify: `src/entrypoints/newtab/App.svelte`
- Modify: `src/lib/settings.ts`
- Modify: `src/lib/store.svelte.ts`
- Modify: `src/lib/WidgetGrid.svelte`
- Modify: `src/lib/Shortcuts.svelte`
- Modify: `src/lib/shortcuts.svelte.ts`
- Modify: `src/lib/search.ts`
- Modify: `src/lib/i18n.ts`
- Modify: `src/lib/migrations.ts`
- Modify: `src/lib/migrations.test.ts`
- Create: `src/lib/shortcutGrid.ts`
- Create: `src/lib/shortcutGrid.test.ts`

**Interfaces:**
- Produces: `WidgetId = "shortcuts" | "clock" | "weather" | "calendar" | "occasions"`.
- Produces: `widgetSizes.shortcuts = { w: 11, h: 2 }`.
- Produces: `fitShortcutGrid(width, height, count): { tile: number; cols: number; rows: 2 }`.
- Produces: `Shortcuts.move(id: string, targetId: string)` (id-based reorder).
- Produces: `migrateWidgetLayout(layout: unknown): WidgetPos[]`.

**Steps:**

- [ ] Move `SearchCard.svelte` to `ShortcutsCard.svelte`.
- [ ] Remove the `<form>`, `<input>`, search button, `resolveQuery` import, and `query` state from the card. Keep the card chrome:

```svelte
<script lang="ts">
  import Shortcuts from "./Shortcuts.svelte";
</script>

<div class="flex h-full w-full flex-col rounded-[20px] bg-surface p-4 shadow-sm">
  <Shortcuts />
</div>
```

- [ ] Update `shortcuts.ts`: add `source?: "user" | "auto"` to `Shortcut`; add `source: "user"` to the seed shortcuts.
- [ ] Update `shortcuts.svelte.ts`:
  - Missing `source` is normalised to `"user"` in `init()`.
  - `add()` sets `source: "user"`.
  - `update()` sets `source: "user"`.
  - Change `move` to an id-based API. Keep the old signature only if needed by tests, marked deprecated.
- [ ] Update `settings.ts`: replace `"search"` with `"shortcuts"` in `WidgetId`, `widgetSizes`, and `defaultWidgetLayout`.
- [ ] Extend `migrations.ts` with `migrateWidgetLayout()`:
  - map `search` → `shortcuts`;
  - drop unknown ids;
  - restore missing widgets from the default layout;
  - clamp x/y to the 11-column grid.
- [ ] Use `migrateWidgetLayout()` inside `migrateSettings()` and `sanitizeLayout()`.
- [ ] Update `shortcuts.svelte.ts` so legacy items without `source` become `source: "user"` on load.
- [ ] Add migration tests:
  - old `search` layout maps to `shortcuts`;
  - unknown/missing ids fall back to defaults;
  - x/y clamp;
  - missing shortcut `source` becomes `user`.
- [ ] Update `WidgetGrid.svelte`:
  - Remove `searchH`, `searchRows`, and the `ready` fade workaround.
  - Remove the special `it.i === "search"` branch; render every widget inside a normal `h-full` wrapper.
  - Update the widget size import and layout logic.
- [ ] Update `App.svelte`: import `ShortcutsCard`, and use `id === "shortcuts"`.

- [ ] Create `shortcutGrid.ts`:

```ts
export const SHORTCUT_GAP = 16;
export const SHORTCUT_MIN_TILE = 32;
export const SHORTCUT_MAX_TILE = 56;
export const SHORTCUT_ROWS = 2;

export interface ShortcutGrid {
  tile: number;
  cols: number;
  rows: 2;
  capacity: number;
}

export function fitShortcutGrid(width: number, height: number, count: number): ShortcutGrid;
```

Implementation: iterate `tile` from 56 down to 32; compute `cols = floor((width + GAP) / (tile + GAP))`; accept when `cols * 2 >= count` and `2 * tile + GAP <= height`. If nothing fits, return the best effort at 32px.

- [ ] Refactor `Shortcuts.svelte`:
  - Change the root from `mt-4 w-full` to `h-full w-full` so it fills the card.
  - Measure the component's own width and height (`bind:clientWidth`, `bind:clientHeight`).
  - Use `fitShortcutGrid(width, height, items.length + 1)`.
  - Always use two rows; remove the `avail`/`twoRows`/`oneRowTile` logic.
  - `visibleItems = shortcuts.items.slice(0, canAdd ? capacity - 1 : capacity)`.
  - `canAdd` is true only when there is room for another slot.
  - Add button is placed after the last visible item.
  - Drag target is clamped to `visibleItems.length - 1`.
  - Use `shortcuts.move(s.id, target.id)` rather than numeric indices.
  - Keep RTL positioning and the existing hover edit/remove buttons.
  - Add a subtle auto badge only when `s.source === "auto"`:

```svelte
{#if s.source === "auto"}
  <span class="absolute end-0 top-0 size-1.5 rounded-full bg-accent/60" title={t("shortcuts.autoHint")}></span>
{/if}
```

- [ ] Update `search.ts`: keep `normalizeUrl`, `faviconUrl`, `faviconUrlByPage`, `directFaviconUrl`, `browserFaviconUrl`; remove `resolveQuery`, `isUrlLike`, and `SEARCH_URL` if no other file uses them.
- [ ] Update `i18n.ts`:
  - Remove `search.placeholder` and `search.label`.
  - Add `shortcuts.autoHint`, `shortcuts.full`, and empty-state copy.
- [ ] Add `shortcutGrid.test.ts`:
  - 1024×160, 6 items → 2 rows, tile ≤ 56.
  - 500×120, 12 items → tile ≥ 32, capacity ≥ 12 or best effort.
  - 300×90, 20 items → no crash; capacity reported.

- [ ] Run:

```sh
pnpm test -- shortcutGrid
pnpm check
pnpm build
```

**Acceptance:** No text input exists on the new tab; the card shows two rows of tile shortcuts with a 32px minimum tile; add/edit/remove work; old saved layouts open without errors.

---

### Task 3: Responsive shell and fit-to-height grid

**Files:**
- Modify: `src/entrypoints/newtab/App.svelte`
- Modify: `src/lib/WidgetGrid.svelte`
- Modify: `src/assets/app.css`
- Modify: `src/lib/Calendar.svelte`
- Modify: `src/lib/Clock.svelte`
- Create: `src/lib/gridGeometry.ts`
- Create: `src/lib/gridGeometry.test.ts`

**Interfaces:**
- Produces: `computeGridGeometry(input): { gap; colW; rowH; scale; naturalH; renderH }`.
- Produces: `WidgetGrid` props unchanged (`widget` snippet), but its root fills the available height.

**Steps:**

- [ ] Change the app shell in `App.svelte`:

```svelte
<div class="flex h-dvh flex-col overflow-hidden">
  <TopBar onsettings={() => (settingsOpen = true)} />

  <main
    class="animate-rise mx-auto flex w-full max-w-[min(1560px,90vw)] flex-1 min-h-0 flex-col px-4 pb-4 sm:px-6
      {app.widgetAlign === 'center' ? 'justify-center' : 'pt-[3vh]'}"
  >
    <WidgetGrid {widget} />
  </main>
</div>
```

- [ ] Remove the `.loaded` overflow switch from `app.css`; keep `html, body { overflow: hidden; }` for desktop. The stacked layout scrolls inside `WidgetGrid`.

- [ ] Create `gridGeometry.ts`:

```ts
export const GRID_COLS = 11;
export const GRID_MIN_ROW_H = 44;
export const GRID_MAX_ROW_H = 92;
export const GRID_MIN_SCALE = 0.8;

export interface GridGeometryInput {
  width: number;
  height: number;
  rows: number;
}

export interface GridGeometry {
  gap: number;
  colW: number;
  rowH: number;
  scale: number;
  naturalH: number;
  renderH: number;
}

export function computeGridGeometry(input: GridGeometryInput): GridGeometry;
```

Implementation:
- `gap = clamp(8, width * 0.015, 20)`.
- `colW = (width - gap * 10) / 11`.
- `rowH = clamp(44, (height - gap * (rows - 1)) / rows, 92)`.
- `naturalH = rows * rowH + (rows - 1) * gap`.
- `scale = naturalH <= height ? 1 : max(0.8, height / naturalH)`.
- `renderH = naturalH * scale`.

- [ ] In `WidgetGrid.svelte`:
  - Add `let height = $state(0)` and `bind:clientHeight` on the **outer full-height root**, not on the scaled inner grid (otherwise the measurement is circular). Change the root class to `h-full w-full`.
  - Remove `GRID_ROW_H`/`GRID_GAP` imports; use `computeGridGeometry({ width, height, rows: rowCount(items) })`.
  - Render the grid inside a wrapper with `height: renderH` and `transform: scale(scale)` with `transform-origin: top center`.
  - Compute all item transforms with `colW`, `gap`, `rowH`.
  - Hide the grid until `width > 0 && height > 0` to avoid a first-paint jump; replace the old `ready` logic with `opacity-0` until measured.
  - If `scale < 1`, divide pointer deltas by `scale` in `move()`.
  - Add `overflow-y-auto` only to the stacked branch (`width < 640`); desktop grid keeps `overflow: hidden`.
  - On window resize while dragging, cancel the drag and restore the snapshot (implemented in Task 4).

- [ ] Remove fixed minimum heights that prevent shrinking:
  - `Calendar.svelte`: replace `min-h-[17rem]` with `min-h-0 flex-1` on the grid area.
  - `Clock.svelte`: replace `max-w-40` with `w-full max-w-[min(100%,11rem)]`.
  - Review `Weather.svelte` and `OccasionsStrip.svelte` for hard-coded heights and replace with `h-full min-h-0` where appropriate.

- [ ] Add `gridGeometry.test.ts`:
  - 1024×664, 7 rows → scale 1, rowH ≥ 44.
  - 800×500, 7 rows → scale < 1 but ≥ 0.8.
  - 400×300, 7 rows → scale = 0.8.
  - gap clamps.

- [ ] Manual matrix before leaving this task:
  - 1280×720, 1366×768, 1440×900, 1920×1080, 2560×1440, 3840×2160.
  - Chrome zoom 100/125/150%.
  - No vertical scrollbar on desktop.

- [ ] Run:

```sh
pnpm test -- gridGeometry
pnpm check
pnpm build
```

**Acceptance:** The dashboard fits the viewport on the matrix above; the widgets remain legible; narrow screens stack and scroll internally.

---

### Task 4: Stable drag reorder

**Files:**
- Modify: `src/lib/reorder.ts` (create)
- Modify: `src/lib/grid.ts`
- Modify: `src/lib/WidgetGrid.svelte`
- Create: `src/lib/reorder.test.ts`

**Interfaces:**
- Produces: `resolveDrag(base: GridItem[], id: WidgetId, targetX: number, targetY: number): GridItem[]`.
- Produces: `resolveDown(item: GridItem, placed: GridItem[], limit: number): void`.
- Keeps: `compact(items, pinned?)` and `rowCount(items)`.

**Steps:**

- [ ] Create `reorder.ts` with the algorithm from the spec:
  - Clone the base snapshot.
  - Clamp the dragged item.
  - Find colliders.
  - If one collider has the same `w`/`h`, swap anchors.
  - Otherwise place colliders below the dragged item and call `resolveDown` in reading order.
  - Never move a non-dragged item upward during the drag.
  - Bound `resolveDown` to `maxY + totalHeights + 8`.

- [ ] Update `WidgetGrid.svelte`:
  - Add `let dragBase: GridItem[] | null = null`.
  - On pointer-down: `dragBase = items.map(o => ({...o}))`; set `preview = dragBase`.
  - On pointer-move: compute `gx`/`gy` from the current preview via `snap()`, then `preview = resolveDrag(dragBase, dragId, gx, gy)`.
  - Do not call `compact()` on every move.
  - On pointer-up: `app.setWidgetLayout(compact(preview, dragId).map(({i,x,y}) => ({i,x,y})))`.
  - On `Escape`, `pointercancel`, or window resize: restore `dragBase` and clear drag state without saving.
  - Add `svelte:window onkeydown` while dragging.
  - Keep the 4px movement threshold and pointer capture logic.
  - When `app.widgetDrag` is off, do nothing.

- [ ] Add `reorder.test.ts`:
  - Same-size swap: clock at (0,2) and weather at (2,2) swap.
  - Dragging search down does not place clock/weather above search.
  - Dragging back to the origin returns the exact base positions.
  - Repeated down/up moves never increase the maximum y beyond the bounded value.
  - Cancel returns the base.

- [ ] Manual QA:
  - Drag each widget to each corner and back.
  - Drag the full-width shortcuts card down one row; clock/weather must not jump above it.
  - Drop, reload, verify the saved layout.
  - Press Escape mid-drag.
  - Resize the window mid-drag.

- [ ] Run:

```sh
pnpm test -- reorder
pnpm check
```

**Acceptance:** Dragging is predictable; no cascade; returning to the original position restores the original layout; the persisted layout is compact and valid.

---

### Task 5: City picker normalization and autofocus

**Files:**
- Modify: `src/lib/weather.ts`
- Create: `src/lib/city.ts`
- Create: `src/lib/city.test.ts`
- Modify: `src/lib/CityPicker.svelte`
- Modify: `src/lib/Weather.svelte`
- Modify: `src/lib/i18n.ts`

**Interfaces:**
- Extends `City` with `featureCode?: string`, `population?: number`, `admin1?: string`.
- Produces: `normalizeCityResults(raw: City[], query: string, locale: Locale): City[]`.
- Changes: `searchCities(query, locale, signal?)`.

**Steps:**

- [ ] Extend the `City` interface and `searchCities()` mapping in `weather.ts`:
  - `count=50`.
  - Keep `language`.
  - Map `feature_code`, `population`, `admin1`–`admin4`.
  - Accept an `AbortSignal` and pass it to `fetch`.
  - Return `[]` on abort/HTTP error.

- [ ] Create `city.ts`:
  - `CITY_FEATURE_CODES = new Set(["PPLC","PPLA","PPLA2","PPLA3","PPLA4","PPL"])`.
  - `normalizeCityName()` folds Persian/Arabic yeh and kaf, collapses spaces, lowercases.
  - `normalizeCityResults()`:
    - filter feature codes;
    - exact-name preference;
    - dedupe by name + admin1 + countryCode;
    - rank PPLC/PPLA/population;
    - Iran-first for `fa`;
    - limit 12.
  - `cityLabel(city)` returns `name · admin1 · country` (omit empty parts).

- [ ] Rewrite `CityPicker.svelte`:
  - Add `autofocus?: boolean` prop.
  - Add `input` binding and `tick()`-based focus when `autofocus` is true.
  - Add `AbortController`; abort the previous request on each input.
  - Keep the 300ms debounce and minimum 2 characters.
  - Add `highlight = $state(0)` and keyboard handling:
    - ArrowDown/ArrowUp move highlight;
    - Enter chooses the highlighted result;
    - Escape is handled by `Modal`.
  - Add `role="listbox"` / `role="option"` and `aria-activedescendant`.
  - Show `cityLabel(c)` in the secondary line.
  - Show suggestions (تهران، مشهد، اصفهان، شیراز، تبریز، کرج) when the query is empty.
  - Keep the “not found” state for empty results after a search.

- [ ] Update `Weather.svelte`:
  - Pass `autofocus` to `CityPicker` in the modal.
  - Show `app.location.name`; optionally use `admin1` in the title.
  - In `choose()`, persist `admin1` with the location.

- [ ] Update `i18n.ts`: add `city.suggestions`, `city.current`, and any new labels.

- [ ] Add `city.test.ts` with a fixture copied from the live Open-Meteo response:
  - “تهران” returns exactly one city (the PPLC record).
  - The PPLX neighbourhoods, PPLL, and MT records are excluded.
  - A query for “تهر” returns the city, not a neighbourhood.
  - Two same-name cities in different provinces both survive dedupe.
  - Province labels are present.

- [ ] Manual QA:
  - Open the weather card, click the city name, type immediately.
  - Search تهران، مشهد، اصفهان، شیراز، تبریز، New York، London.
  - Verify Enter/Arrow/Escape.
  - Verify the Settings city picker does not steal focus on page load.

- [ ] Run:

```sh
pnpm test -- city
pnpm check
```

**Acceptance:** The picker only returns cities; Tehran appears once; the input is focused and ready to type when opened from the weather card.

---

### Task 6: Date-driven clock and classic face redesign

**Files:**
- Create: `src/lib/clock.ts`
- Create: `src/lib/clock.test.ts`
- Modify: `src/lib/ClockFace.svelte`
- Modify: `src/lib/Clock.svelte`

**Interfaces:**
- Produces: `clockAngles(date: Date): { hour: number; minute: number; second: number }`.

**Steps:**

- [ ] Create `clock.ts`:

```ts
export interface ClockAngles {
  hour: number;
  minute: number;
  second: number;
}

export function clockAngles(date: Date): ClockAngles;
```

Use milliseconds for fractional seconds; return degrees.

- [ ] Rewrite the time loop in `ClockFace.svelte`:
  - Remove `mountTime`, `baseSec`, `elapsedSec`, `daySec`, and the old `snap` logic.
  - `let now = $state(Date.now())`.
  - `setInterval(() => (now = Date.now()), 1000)`.
  - `resync()` sets `now = Date.now()`; attach it to `visibilitychange` (when visible), `pageshow`, and `window.focus`.
  - Remove the CSS transition from the second hand. Use no transition, or a very short transition on hour/minute only.
  - Compute `const angles = $derived(clockAngles(new Date(now)))`.

- [ ] Redesign the classic face:
  - 60 minute ticks at `r=44..47`; major ticks at `r=42..47`.
  - 12 numerals at `r=35`, font-size 8.5, Persian digits via `localeNum`.
  - Hour hand: length 24, width 3.4, rounded cap.
  - Minute hand: length 34, width 2.2, rounded cap.
  - Second hand: length 38, tail 6, width 1.1, `#e5484d`.
  - Centre cap radius 3; inner ring at r=41 with `var(--border)`.
  - Use SVG `transform={`rotate(${deg} 50 50)`}` attributes, not CSS transitions.
  - Add `role="img"` and `aria-label` with the current time.

- [ ] Clean up the modern face:
  - Same date-driven angles.
  - 12 subtle hour dots; hour/minute hands with rounded caps; a small second dot.
  - Keep the existing surface/background tokens.

- [ ] Keep `digital` and `digitalClass` working; the Settings previews use both.

- [ ] Add `clock.test.ts`:
  - 12:00:00 → 0/0/0.
  - 03:15:30 → 97.75° hour, 93° minute, 180° second.
  - 23:59:59 → hour 359.9917°, minute 359.9°, second 354°.
  - No negative values.

- [ ] Manual QA:
  - Hide the tab for 5–10 minutes; return; compare with the OS clock.
  - Sleep/resume the machine if possible.
  - Verify the classic face at 12:00, 3:15, 9:45 in fa and en.
  - Verify the Settings preview.

- [ ] Run:

```sh
pnpm test -- clock
pnpm check
```

**Acceptance:** The first visible frame after tab return is current; no fast spin; the classic face is proportional and readable at 40–160px.

---

### Task 7: Optional topSites permission and auto-shortcut merge

**Files:**
- Modify: `wxt.config.ts`
- Create: `src/lib/topSites.ts`
- Create: `src/lib/autoShortcuts.ts`
- Create: `src/lib/autoShortcuts.test.ts`
- Modify: `src/lib/shortcuts.ts`
- Modify: `src/lib/shortcuts.svelte.ts`
- Modify: `src/lib/store.svelte.ts`

**Interfaces:**
- Produces: `hasTopSitesPermission()`, `requestTopSitesPermission()`, `getTopSites()`.
- Produces: `mergeAutoShortcuts(existing, candidates, dismissed, capacity)`.
- Produces: `dismissedAutoSitesItem` storage.
- Produces: `ShortcutsStore.syncAuto(capacity: number)`.

**Steps:**

- [ ] Add `"topSites"` to `optional_permissions` in `wxt.config.ts`:

```ts
optional_permissions: ["bookmarks", "topSites"],
```

- [ ] Create `topSites.ts`:

```ts
import { browser } from "wxt/browser";

export interface TopSite {
  url: string;
  title: string;
}

export async function hasTopSitesPermission(): Promise<boolean>;
export async function requestTopSitesPermission(): Promise<boolean>;
export async function getTopSites(): Promise<TopSite[]>;
```

- Use `browser.permissions.contains/request({ permissions: ["topSites"] })`.
- Use `browser.topSites?.get()` if available; catch and return `[]`.
- Do not throw from `getTopSites()`.

- [ ] **Permission spike before UI work:** load the unpacked extension and open the new-tab DevTools console. If the console call is not treated as a user gesture, temporarily wire a Settings button (this is also the Task 8 path). Run:

```js
chrome.permissions.request({ permissions: ["topSites"] }).then(console.log)
```

Expected: `true` after the prompt. If Chrome rejects `topSites` as optional, stop and report; do not ship a broken toggle. Fallback options: keep the feature disabled with an explanatory note, or move to a required permission only after explicit approval.

- Note: WXT's `Browser` type may not declare `topSites`; use a narrow local type/cast rather than `any` leaking through the app.

- [ ] Create `autoShortcuts.ts`:
  - `isHttpUrl()`, `hostnameOf()`.
  - `mergeAutoShortcuts(existing, candidates, dismissed, capacity)`.
  - Preserve existing order; append new auto items; dedupe by hostname; skip dismissed; respect capacity.
  - Title: candidate title, else hostname.
  - Icon: empty string (Favicon resolves it).

- [ ] Update `shortcuts.ts`:
  - Add `dismissedAutoSitesItem = storage.defineItem<string[]>("local:autoShortcutsDismissed", { fallback: [] })`.
  - Keep the existing `shortcutsItem`.

- [ ] Update `shortcuts.svelte.ts`:
  - `dismissed = $state<string[]>([])`.
  - `init()` loads shortcuts and dismissed in parallel; normalize missing source to `"user"`.
  - `remove(id)` adds the hostname to dismissed, persists, and removes the item.
  - `update(id, data)` sets `source: "user"`; if the URL host was dismissed, remove it from dismissed.
  - `add(data)` clears the hostname from dismissed.
  - `syncAuto(capacity)`:
    - return if `!app.autoShortcutsEnabled`;
    - check permission;
    - fetch top sites;
    - `items = mergeAutoShortcuts(items, candidates, dismissed, capacity)`;
    - save only if changed.
  - `resetDismissed()` clears the list.
  - Add a `syncing` flag to avoid concurrent syncs.

- [ ] Update `store.svelte.ts`: implement `setAutoShortcutsEnabled` and include it in `migrateSettings`/`getSettings`.

- [ ] Add `autoShortcuts.test.ts`:
  - Dedupes `https://example.com/a` and `https://example.com/b`.
  - Skips dismissed hosts.
  - Preserves manual order.
  - Respects capacity.
  - Ignores `chrome://`, `about:`, and invalid URLs.

- [ ] Run:

```sh
pnpm test -- autoShortcuts
pnpm check
pnpm build
```

**Acceptance:** The permission is optional and only requested on demand; auto sync never throws; manual order is stable; dismissed hosts do not return.

---

### Task 8: Auto-shortcut UI and settings

**Files:**
- Modify: `src/lib/Shortcuts.svelte`
- Modify: `src/lib/ShortcutModal.svelte`
- Modify: `src/lib/Settings.svelte`
- Modify: `src/lib/i18n.ts`

**Interfaces:**
- Consumes: `shortcuts.syncAuto(capacity)`, `app.autoShortcutsEnabled`, `hasTopSitesPermission()`.
- Produces: Settings toggle + reset action.

**Steps:**

- [ ] In `Shortcuts.svelte`, after the grid is measured:
  - On first mount, call `shortcuts.syncAuto(capacity)` once if `app.autoShortcutsEnabled` and permission is present.
  - Guard with a local `autoSynced` flag to avoid loops.
  - Do not block rendering on the network.

- [ ] Add the auto badge/tooltip and ensure auto items use the same edit/remove buttons.
- [ ] `ShortcutModal` already calls `shortcuts.update()` for edits; verify the item becomes manual after saving.
- [ ] Add Settings controls in the General tab:
  - Toggle `افزودن خودکار سایت‌های پرتکرار`.
  - When enabling:
    1. If permission is already granted, enable.
    2. Otherwise call `requestTopSitesPermission()` from the click handler.
    3. On success: `app.setAutoShortcutsEnabled(true)` and `shortcuts.syncAuto(32)`.
    4. On failure/denial: keep the toggle off and show `t("shortcuts.permissionDenied")`.
  - When disabling: set false and optionally call `browser.permissions.remove({ permissions: ["topSites"] })`.
  - Add a “پاک‌کردن فهرست نادیده‌گرفته‌شده‌ها” button calling `shortcuts.resetDismissed()`.
  - Show the permission explanation text.

- [ ] Add i18n keys:
  - `shortcuts.autoHint`
  - `shortcuts.autoLabel`
  - `shortcuts.autoDesc`
  - `shortcuts.permissionExplain`
  - `shortcuts.permissionGrant`
  - `shortcuts.permissionDenied`
  - `shortcuts.resetDismissed`
  - `shortcuts.resetDone`

- [ ] Manual QA:
  - Fresh profile, enable in Settings, grant, open a new tab: top sites appear after manual items.
  - Remove an auto item, open a new tab: it does not return.
  - Edit an auto item: it stays after reload.
  - Deny the permission: no prompt loop; manual shortcuts still work.
  - Revoke the permission in Chrome and reopen Settings: the toggle explains the state.

- [ ] Run:

```sh
pnpm check
pnpm build
```

**Acceptance:** Auto items are indistinguishable in edit/remove behaviour from manual items; permission denial is graceful; no repeated prompts.

---

### Task 9: First-run onboarding

**Files:**
- Create: `src/lib/onboarding.ts`
- Create: `src/lib/Welcome.svelte`
- Modify: `src/entrypoints/newtab/App.svelte`
- Modify: `src/entrypoints/newtab/main.ts`
- Modify: `src/lib/store.svelte.ts`
- Modify: `src/lib/Settings.svelte`
- Modify: `src/lib/i18n.ts`
- Modify: `src/assets/app.css` (if new keyframes are needed)

**Interfaces:**
- Produces: `onboardedItem = storage.defineItem<boolean>("local:onboarded", { fallback: false })`.
- Produces: `app.welcomeOpen` transient state and `app.openWelcome()`.

**Steps:**

- [ ] Create `onboarding.ts` with:
  - `hasOnboarded(): Promise<boolean>`
  - `setOnboarded(value: boolean): Promise<void>`
  - The storage item above.

- [ ] Update `main.ts`:

```ts
const onboarded = await hasOnboarded().catch(() => false);
mount(App, {
  target: document.getElementById("app")!,
  props: { onboarded },
});
```

- [ ] Update `App.svelte`:
  - Accept `onboarded: boolean`.
  - Add `let seen = $state(onboarded)` and `const welcomeOpen = $derived(app.welcomeOpen || !seen)`.
  - Render `<Welcome />` when `welcomeOpen` is true.
  - On finish/skip: `setOnboarded(true)`, set `seen = true`, `app.welcomeOpen = false`.
  - Replay: Settings calls `app.openWelcome()`; the derived flag opens the overlay without reloading.

- [ ] Add transient UI state to `AppStore` (not persisted):

```ts
welcomeOpen = $state(false);
openWelcome() { this.welcomeOpen = true; }
```

- [ ] Create `Welcome.svelte`:
  - Full-screen fixed overlay with `backdrop-blur` and a centered card.
  - Three steps with a local `step` state.
  - Step 1: brand, title, one-line description, animated clock/calendar glyphs.
  - Step 2: four mini feature cards (clock, calendar, weather, shortcuts) with staggered entrance.
  - Step 3: `CityPicker` (autofocus), plus the optional most-visited opt-in:
    - If permission not granted, a button calls `requestTopSitesPermission()`.
    - On grant: `app.setAutoShortcutsEnabled(true)` and `shortcuts.syncAuto(32)`.
    - On denial: show the denial note.
  - Progress dots, “بعدی”, “شروع”, “رد کردن”.
  - Escape = skip; focus trap; return focus after close.
  - Respect `prefers-reduced-motion` via `window.matchMedia("(prefers-reduced-motion: reduce)")` and skip non-essential transitions.

- [ ] Add Settings button “نمایش دوباره راهنما” in the General tab, calling `app.openWelcome()`.
- [ ] Add all welcome i18n keys in fa/en.
- [ ] Manual QA:
  - Fresh profile / cleared storage: welcome shows once.
  - Skip: does not show on reload.
  - Finish: does not show on reload.
  - Replay from Settings works.
  - Keyboard-only navigation, Escape, focus trap.
  - Reduced motion.

- [ ] Run:

```sh
pnpm check
pnpm build
```

**Acceptance:** First-run users see a polished, animated, skippable welcome; it never blocks first paint; the permission is only requested from a click.

---

### Task 10: Full verification, documentation, and packaging

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Maybe modify: `docs/superpowers/specs/2026-10-22-rozaneh-ux-overhaul-design.md` (if implementation reveals a correction)

**Steps:**

- [ ] Run the full suite:

```sh
pnpm install
pnpm check
pnpm test
pnpm build
pnpm build:firefox
```

- [ ] Manual QA matrix:
  - Chrome: fresh profile, upgrade from existing storage, no topSites permission, granted permission, denied permission.
  - Firefox: build and load temporary add-on; verify optional `topSites` and clock.
  - Layout: 1280×720, 1366×768, 1440×900, 1920×1080, 2560×1440, 3440×1440, 3840×2160; zoom 100/125/150%.
  - City: تهران، تهر، مشهد، اصفهان، شیراز، تبریز، New York، London.
  - Clock: background 5–10 minutes, sleep/resume if possible.
  - Drag: every widget to each corner and back; Escape; resize mid-drag; reload persistence.
  - Onboarding: fresh, skip, finish, replay, reduced motion, keyboard.
  - A11y: focus rings, modal focus trap, listbox keyboard, contrast.

- [ ] Update `README.md`:
  - Remove references to the search input.
  - Document the two-row shortcuts.
  - Document optional most-visited sites and the privacy statement.
  - Mention the new onboarding and responsive layout.
  - Add a short “Permissions” section explaining `storage`, `favicon`, optional `bookmarks`, optional `topSites`.

- [ ] Update `CHANGELOG.md` with a 1.1.0 entry.
- [ ] Bump `package.json` version to `1.1.0` (only if the reviewer wants a release).
- [ ] Run `pnpm zip` and `pnpm zip:firefox` only if a store package is requested.

**Acceptance:** All checks pass; both browsers load; the QA matrix has no blocking issues; docs match the shipped behaviour.

---

## Rollback / fallback notes

- If optional `topSites` is rejected by Chrome, keep the code path but leave `autoShortcutsEnabled` false and hide the toggle; do not force a required permission without approval.
- If `fitScale` causes visible text blur, switch to fluid geometry only with a slightly smaller `GRID_MIN_ROW_H` and allow scroll below 640px height.
- If city normalization hides useful results, relax the exact-match rule to “exact first” while still filtering feature codes and deduplicating.
- If onboarding hurts first-paint performance, render it after the first animation frame and keep the dashboard interactive behind it.

## Definition of done

- [ ] No search field on the new tab; two rows of shortcuts with add/edit/remove/drag.
- [ ] Optional most-visited sites work, are editable/removable, and never return after removal.
- [ ] Desktop dashboard fits without scrolling across the QA matrix.
- [ ] Widget drag swaps/pushes predictably with no cascade or drift.
- [ ] City search returns real cities only; Tehran is unambiguous; input autofocuses.
- [ ] Clock shows current time instantly after tab return; classic face redesigned.
- [ ] First-run onboarding is animated, accessible, skippable, and replayable.
- [ ] `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm build:firefox` pass.
