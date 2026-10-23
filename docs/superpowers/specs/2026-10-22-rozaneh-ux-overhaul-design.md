# Rozaneh UX Overhaul — Design

**Date:** 2026-10-22  
**Status:** Draft for review  
**Scope:** New-tab experience, shortcuts, layout, city picker, clock, first-run onboarding  
**Targets:** Chrome MV3 and Firefox (WXT build)

## 1. Context

Rozaneh is a private new-tab extension built with WXT, Svelte 5, TypeScript, and Tailwind CSS v4. The current new tab contains five fixed widgets: a search/bookmarks card, analog/digital clock, weather, tri-calendar, and an occasions/prices strip. The user reported nine UX and correctness problems:

1. The search input must be removed; the two rows of bookmarks must remain.
2. Frequently/recently visited sites should be added automatically, but remain editable and removable.
3. The layout must fit different monitors without scrolling and must not use fixed sizes.
4. City selection returns many indistinguishable results, including neighbourhoods; it must only offer real cities and autofocus when opened from the weather card.
5. Dragging a widget downward pushes lower widgets down indefinitely instead of swapping.
6. When returning to a backgrounded tab, the clock animates rapidly to catch up instead of showing the current time immediately.
7. The classic clock face is poorly proportioned and must be redesigned to a standard.
8. First-time users need an attractive, animated welcome/onboarding flow.
9. Additional improvement suggestions are welcome.

This document records the research findings, decisions, data model, component changes, algorithms, and acceptance criteria. It intentionally stays implementation-agnostic until the “Implementation plan” step.

## 2. Research findings

### 2.1 Most-visited sites

- Chrome and Firefox expose `topSites`; the API returns the pages the browser shows on its own new-tab page, combining frequency and recency.
- Chrome requires the `topSites` API permission. The runtime permission string is: “Read a list of your most frequently visited websites.”
- The permission is allowed as an optional permission. Requesting it at runtime requires a user gesture.
- The API does **not** expose full history, and it does not include shortcuts customised by the user.
- The list can be empty on fresh profiles, in guest/incognito contexts, or when the user removed sites from the browser’s new-tab page. A fallback is required.
- References: MDN `topSites` (`https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/topSites`), Chromium permission source (`chrome/common/extensions/permissions/chrome_api_permissions.cc`), Chromium permission string (`chrome/app/generated_resources.grd`).

**Decision:** add `topSites` to `optional_permissions`, never request `history`, and sync only after an explicit opt-in.

### 2.2 City search

A live request to Open-Meteo for `name=تهران&count=20&language=fa` returned 16 records:

- four “تهران” records at different coordinates;
- neighbourhoods such as “تهرانسر”, “تهرانپارس”, “تهراننو”, “تهرانویلا” (`PPLX`);
- “تهرانی” (`PPLL`) in Fars;
- “تهران کوه” (`MT`), a mountain.

Open-Meteo’s response includes `feature_code`, `population`, `admin1`–`admin4`, `country`, and `country_code`. The current client maps only name/admin1/country/lat/lng/timezone and displays the raw first eight results. It does not filter feature types, rank exact matches, deduplicate, or show the province clearly.

**Decision:** request more results, keep only city feature codes, prefer exact-name matches, deduplicate by name + first-level administrative area, rank by feature code and population, and show province/country. No street/address suggestions.

References: Open-Meteo Geocoding API (`https://open-meteo.com/en/docs/geocoding-api`).

### 2.3 Clock while backgrounded

- Browsers throttle timers in hidden tabs and stop `requestAnimationFrame` callbacks. MDN documents this in the Page Visibility API.
- The current clock derives angles from a fixed `mountTime`/`baseSec` plus a one-second interval and uses a CSS `transform` transition.
- When the tab is hidden, the interval is throttled. On return, the stale angle is committed to the DOM and the CSS transition animates through the backlog. The existing `visibilitychange` resync attempts to compensate but races the style flush.
- The reliable fix is to compute angles directly from `Date` on every tick and to remove the second-hand CSS transition. A visibility/focus/pageshow resync then guarantees the first visible frame is current.

**Decision:** make time computation pure and date-driven, remove the second-hand transition, and resync on `visibilitychange`, `pageshow`, and `focus`.

### 2.4 Drag-and-drop reorder

The current `moveItem()` mutates the previous preview and calls `compact()` with the dragged item pinned. `compact()` floats every other item upward around the pin and pushes colliders downward. A simulation of dragging the full-width top card down showed:

- clock and weather jump above the dragged card;
- calendar and occasions are pushed to the bottom;
- the result depends on the previous preview, not the drag origin.

This is a global reflow, not a stable swap. The fix is to compute every drag preview from a snapshot taken at pointer-down, move only colliding items, and compact once on drop.

**Decision:** stable snapshot + swap when sizes match + bounded downward placement when sizes differ + hysteresis + one final compaction.

### 2.5 Responsive layout

The current grid is fixed: 11 columns, 69px rows, 20px gaps, `max-w-5xl` (1024px). The natural height is about 603px plus top bar and padding. On short viewports or 125–150% zoom this scrolls; on 4K it is unnecessarily small.

**Decision:** measure the available grid area, derive gap/row height from it, widen the desktop container, and apply a bounded fit scale as a fallback. Widgets use container queries and `h-full`/`min-h-0` so their contents adapt.

### 2.6 Clock face design

A standard clock face uses:

- 60 minute marks and 12 emphasised hour marks;
- 12 hour numerals;
- an hour hand about half the dial radius, a minute hand about 70%, and a second hand about 80% with a short tail;
- a centre cap and a clean minute track.

The redesign follows Swiss railway/Bauhaus restraint: high contrast, no decorative noise, Persian numerals, one accent colour for the second hand.

Reference: Wikipedia “Clock face” and “Swiss railway clock”.

## 3. Goals and non-goals

### Goals

- Remove the new-tab search field while preserving two rows of shortcuts.
- Add most-visited sites only after explicit opt-in, with full edit/remove/reorder support.
- Fit the full dashboard on common desktop monitors and zoom levels without vertical scrolling.
- Make widget drag predictable: a dragged widget swaps with the target, and lower widgets do not cascade.
- Return a short, unambiguous list of real cities, with province/country labels.
- Focus the city input immediately when the weather-card city is clicked.
- Show the correct time instantly on tab return.
- Ship a beautiful, accessible first-run onboarding flow.
- Keep the extension private and local-first.

### Non-goals

- Requesting full history or any new required permission.
- Adding/removing widget types, or resizing widgets in this phase.
- Cloud sync or accounts.
- Replacing the calendar, weather, or prices providers.
- A full command palette or address-bar search.
- Mobile-first layout; narrow screens keep the existing stacked, scrollable layout.

## 4. Decisions

### D1 — Remove the search field; keep two shortcut rows

- Delete the `<form>` and search input from the old `SearchCard`.
- Rename the component and widget id from `search` to `shortcuts`.
- Keep add/edit/remove/drag behaviour.
- Render exactly two rows of tiles on desktop; tiles shrink to a 32px minimum before any overflow handling.
- Remove the dynamic `searchH` measurement and the `ready` fade workaround from `WidgetGrid`; the shortcuts cell has a fixed grid height (`h: 2`).

### D2 — Most-visited shortcuts are optional and opt-in

- Manifest: `optional_permissions: ["bookmarks", "topSites"]`.
- Default setting `autoShortcutsEnabled = false`.
- Onboarding and Settings explain the permission; the request happens on click.
- If granted, sync once per new-tab load. Never poll.
- Auto items are normal `Shortcut` records with `source: "auto"`, appended after manual items.
- Editing an auto item promotes it to `source: "user"`.
- Removing any shortcut records its hostname in `autoShortcutsDismissed`; auto sync skips dismissed hostnames.
- Manual re-add clears the dismissal for that hostname.
- Provide “Reset dismissed suggestions” in Settings.
- If the API or permission is unavailable, the feature silently does nothing.

### D3 — Fluid desktop layout with a no-scroll target

- Shell is `100dvh`, `overflow: hidden` on desktop.
- Main uses a wider max width: `min(1560px, 90vw)`.
- Grid gap and row height are derived from measured width/height; row height is clamped to 44–92px.
- If the natural grid height still exceeds the available height, apply a uniform `fitScale` between 0.8 and 1. If it still does not fit at 0.8, allow vertical scrolling as a last resort.
- Below 640px width, keep the stacked layout with scrolling.
- Drag coordinates account for `fitScale`.

### D4 — Stable drag semantics

- Snapshot the layout on pointer-down.
- The dragged item follows the pointer; the preview is always computed from the snapshot plus the current target cell.
- Same-size widgets swap positions.
- Different-size widgets: the dragged widget takes the target cell; colliding widgets are placed below it in reading order and never float above the dragged widget during the drag.
- Hysteresis prevents flicker: the target only changes after the pointer crosses a margin past the current cell boundary.
- On drop, run `compact()` once and persist.
- On cancel/Escape/pointercancel, restore the snapshot.

### D5 — City results are cities, not places

- Fetch up to 50 results with `language`.
- Keep `feature_code` in `PPLC`, `PPLA`, `PPLA2`, `PPLA3`, `PPLA4`, `PPL`.
- If there is at least one exact normalized name match, return only exact-name city records (deduplicated).
- Otherwise return prefix matches, ranked.
- Deduplicate by normalized name + `admin1` + country code; keep the highest-ranked record.
- Sort exact matches first, then Iran-first for Persian, then population descending, then name.
- Show name plus province/country; never show neighbourhood/street-like results.
- Limit to 12 visible results.
- Cache results in memory for the session; abort stale requests.

### D6 — City input autofocus

- `CityPicker` gets an `autofocus` prop (default `false`).
- Weather-card modal passes `autofocus`; Settings does not.
- On mount, focus the input and leave it empty with quick city suggestions.
- Arrow keys move the highlight; Enter selects; Escape closes the modal.

### D7 — Date-driven clock

- A pure `clockAngles(date)` returns hour/minute/second angles.
- The component updates a timestamp every second from `Date.now()`.
- No CSS transition on the second hand.
- On `visibilitychange` to visible, `pageshow`, and `focus`, update the timestamp immediately.
- Optionally allow a short transition on hour/minute hands only, with a snap class on resync.

### D8 — Classic face redesign

- 60 minute ticks; 12 major hour ticks.
- 12 Persian numerals at a consistent radius.
- Hour hand ≈ 48% of radius, minute ≈ 68%, second ≈ 80% with a 12% tail.
- Rounded caps, centre cap, subtle inner ring, one red accent for the second hand.
- No fake shadows or rotated numerals.
- Modern face remains minimal but uses the same hand geometry and date-driven engine.

### D9 — First-run onboarding

- Stored separately as `local:onboarded` so config export/import does not skip it.
- Three steps:
  1. Welcome and brand.
  2. What the new tab contains (clock, calendar, weather, shortcuts).
  3. Personalisation: city and optional most-visited opt-in.
- Full-screen overlay with blur, staggered entrance, progress dots, skip, and keyboard support.
- Respect `prefers-reduced-motion`.
- Replay from Settings (“نمایش دوباره راهنما”).
- Mark seen on finish or skip; never block first paint.

## 5. Data model and storage

### 5.1 Shortcut

```ts
export type ShortcutSource = "user" | "auto";

export interface Shortcut {
  id: string;
  title: string;
  url: string;
  icon: string;
  source?: ShortcutSource; // missing means "user" for existing data
}
```

Default seed shortcuts remain `source: "user"`.

### 5.2 Settings

Add:

```ts
autoShortcutsEnabled: boolean; // default false until opt-in
schemaVersion: number;         // current 2
```

Keep `autoShortcutsEnabled` false by default. The onboarding permission step sets it true only after a successful permission request. If permission is later revoked, the toggle shows an explanatory state and sync becomes a no-op.

### 5.3 Storage items

| Key | Type | Purpose |
| --- | --- | --- |
| `local:settings` | `Settings` | Existing settings, plus the new fields |
| `local:shortcuts` | `Shortcut[]` | Manual and auto items in display order |
| `local:autoShortcutsDismissed` | `string[]` | Normalised hostnames the user removed |
| `local:onboarded` | `boolean` | Whether the welcome flow was completed/skipped |
| `local:weather` | cached weather | Unchanged |
| `local:faviconCache` | map | Unchanged |

### 5.4 Migrations

- `schemaVersion` 1 → 2:
  - map widget id `search` to `shortcuts`;
  - add `source: "user"` to stored shortcuts missing it;
  - add default `autoShortcutsEnabled: false` and `schemaVersion: 2`.
- `sanitizeLayout` must accept either id and produce only the five current widgets, clamped to the 11-column grid.
- Config export uses `version: 2`; import accepts version 1 and applies the same migration.
- Unknown widget ids are dropped; missing widgets are restored from the default layout.

## 6. Component architecture

### 6.1 New/renamed components

| Component/module | Responsibility |
| --- | --- |
| `ShortcutsCard.svelte` (renamed from `SearchCard.svelte`) | Card chrome around the two-row shortcut grid; no input |
| `Shortcuts.svelte` | Tile layout, drag reorder, add/edit/remove, auto badge |
| `shortcutGrid.ts` | Pure tile-fitting math (tile size, columns, capacity) |
| `reorder.ts` | Pure drag-preview and compaction helpers |
| `city.ts` | Pure city result filtering, dedupe, ranking |
| `clock.ts` | Pure clock angle math |
| `autoShortcuts.ts` | Pure merge/filter logic for top sites |
| `topSites.ts` | Permission wrapper and `browser.topSites.get()` |
| `Welcome.svelte` | Three-step onboarding overlay |
| `onboarding.ts` | Onboarded storage helpers |

### 6.2 State flow

- `app` store owns settings, widget layout, and the transient welcome-open flag.
- `shortcuts` store owns the shortcut list, dismissed hostnames, and sync operations.
- `Weather.svelte` opens `CityPicker` in a modal and passes `autofocus`.
- `WidgetGrid` owns drag preview state only; persisted layout lives in `app`.
- `Welcome.svelte` reads/writes settings and calls `shortcuts.syncAuto()` after permission grant.

### 6.3 Manifest

```ts
manifest: {
  permissions: ["storage", "favicon"],
  optional_permissions: ["bookmarks", "topSites"],
  host_permissions: ["https://www.bing.com/*"],
  // unchanged browser_specific_settings
}
```

No `history` permission. No new host permission for top sites; the API is browser-local.

## 7. Algorithms

### 7.1 Responsive geometry

Given the measured grid width `W`, height `H`, and `rows = rowCount(items)`:

```text
gap    = clamp(8, W * 0.015, 20)
colW   = (W - gap * 10) / 11
rowH   = clamp(44, (H - gap * (rows - 1)) / rows, 92)
naturalH = rows * rowH + (rows - 1) * gap
scale  = naturalH <= H ? 1 : max(0.80, H / naturalH)
```

- Render the grid inside a wrapper of height `naturalH * scale`; apply `transform: scale(scale)` to the grid.
- All pointer deltas are divided by `scale` before converting to cell movement.
- If `scale` would be below 0.80, keep 0.80 and allow vertical scroll in the grid container.
- At width < 640px, use the stacked layout and skip the scale logic.

### 7.2 Stable drag preview

```text
resolveDrag(base, draggedId, targetX, targetY):
  next = clone(base)
  d = next[draggedId]
  origin = { x: d.x, y: d.y }
  d.x = clamp(targetX, 0, COLS - d.w)
  d.y = max(0, targetY)

  colliders = next.filter(i => i.id != d.id && intersects(i, d))

  if colliders.length == 1 and colliders[0] has same w/h:
      swap origin with collider origin
      return next

  for each collider in reading order (y, x):
      collider.y = d.y + d.h
      resolveDown(collider, next)   // move only downward until free
  return next
```

`resolveDown` is bounded by `maxY + sum(item heights) + 8`; it never moves an item upward. On drop:

```text
final = compact(resolveDrag(...))
```

`compact()` remains the existing stable upward-compaction helper, but it is called once, not on every pointer move.

### 7.3 Shortcut tile fitting

Given card content width `W`, content height `H`, and item count `N` (plus the add button when needed):

```text
for tile from 56 down to 32:
  cols = floor((W + GAP) / (tile + GAP))
  if cols * 2 >= N and tile * 2 + GAP <= H:
      return { tile, cols, rows: 2 }

return best effort with tile = 32, rows = 2
```

- `GAP = 16`.
- The add button occupies one slot.
- If `N > cols * 2`, render the first `cols * 2` items and omit the add button; expose the total count in the title/aria label.
- The grid is RTL-aware, as today.

### 7.4 City normalization

```text
normalizeCityResults(raw, query, locale):
  cities = raw.filter(feature_code in CITY_CODES)
  exact = cities.filter(normalizedName == normalizedQuery)
  candidates = exact.length > 0 ? exact : cities
  dedupe by name|admin1|countryCode, keeping best rank/population
  sort by exact, IR-first (fa), population desc, name
  return first 12
```

- Normalised name: trim, collapse whitespace, lowercase; Persian/Arabic yeh and kaf variants folded.
- `PPLX`, `PPLL`, `MT`, and other place types are excluded.
- The client never fabricates an address or street.

### 7.5 Clock angles

```text
ms = date.getMilliseconds()
s  = date.getSeconds() + ms / 1000
m  = date.getMinutes() + s / 60
h  = (date.getHours() % 12) + m / 60

secondAngle = s * 6
minuteAngle = m * 6
hourAngle   = h * 30
```

The component updates `now = Date.now()` on an interval, on visibility resume, on `pageshow`, and on window focus. The second hand has no CSS transition.

### 7.6 Auto-shortcut merge

```text
mergeAutoShortcuts(existing, candidates, dismissed, capacity):
  knownHosts = hostnames(existing)
  result = clone(existing)
  for candidate in candidates:
      host = hostname(candidate.url)
      if !isHttp(host) or host in knownHosts or host in dismissed: continue
      if result.length >= capacity: break
      result.push({ ...candidate, source: "auto" })
      knownHosts.add(host)
  return result
```

- Deduplication is by hostname, not full URL.
- Manual items come first; auto items are appended.
- No automatic reordering of existing items.
- Capacity is `cols * 2` from `shortcutGrid.ts`, minus one slot for the add button when applicable.

## 8. UX copy (Persian first)

- Shortcuts empty state: «هنوز میانبری نداری. با + شروع کن.»
- Auto badge tooltip: «از سایت‌های پرتکرار اضافه شده»
- Permission explanation: «سایت‌هایی که بیشتر بازدید می‌کنی، فقط روی همین دستگاه خوانده می‌شوند و جایی ارسال نمی‌شوند.»
- Permission button: «فعال‌کردن پیشنهادها»
- Permission denied note: «بدون این اجازه هم همه‌چیز کار می‌کند؛ فقط پیشنهادها اضافه نمی‌شوند.»
- Settings toggle: «افزودن خودکار سایت‌های پرتکرار»
- Settings reset: «پاک‌کردن فهرست نادیده‌گرفته‌شده‌ها»
- Welcome step 1: «به روزنه خوش آمدی» / «یک تب تازه، آرام و خصوصی برای شروع روز.»
- Welcome step 2: «همه‌چیز دم دست» / «ساعت، تقویم شمسی، قمری و میلادی، آب‌وهوا و میانبرهایت.»
- Welcome step 3: «مال خودت کن» / «شهرت را انتخاب کن و اگر خواستی، سایت‌های پرتکرارت خودکار اضافه شوند.»
- Buttons: «بعدی»، «شروع»، «رد کردن».
- Settings replay: «نمایش دوباره راهنما»

English equivalents must be added to `i18n.ts` for every new key.

## 9. Accessibility

- `Modal` and `Welcome` trap focus; Escape closes; focus returns to the trigger.
- City results use `role="listbox"`/`option` semantics and `aria-activedescendant`.
- Shortcut tiles have descriptive `aria-label`s; edit/remove buttons are keyboard reachable.
- Drag remains pointer-only in this phase, but a keyboard reorder path is listed as a follow-up.
- Clock has an `aria-label` with the current time; it does not use `aria-live`.
- `prefers-reduced-motion` disables onboarding and tile animations.
- Focus rings remain visible in both themes.
- Contrast of muted text is checked in light and dark modes.

## 10. Error handling and edge cases

- topSites unavailable/empty: no change; the UI remains usable.
- Permission denied/revoked: no repeated prompts; Settings explains how to re-enable.
- Duplicate top sites: deduplicated by hostname.
- More candidates than slots: only fill available slots; no infinite “+N” work in this phase.
- City request failure: keep previous results and show the existing “not found”/error state.
- Rapid typing: abort the previous request; ignore stale responses.
- Dragging outside the grid: clamp to grid bounds; pointerup always commits a valid layout.
- Escape during drag: restore snapshot.
- Window resize during drag: cancel the drag and restore the snapshot.
- Clock returning from sleep: first visible frame is current; no transition backlog.
- Corrupt/old storage: sanitize and fall back to defaults.
- Imported v1 config: migrate ids and fields.

## 11. Testing

### Unit (Vitest)

- `shortcutGrid`: tile choice for wide/narrow/short cards, capacity, add-button slot.
- `reorder`: same-size swap, different-size push, no item above the dragged item, return-to-origin identity, cancel identity, bounded y.
- `city`: Tehran fixture returns one city; neighbourhood/mountain records filtered; province label; exact-vs-prefix; dedupe.
- `clock`: angles at 12:00:00, 03:15:30, 23:59:59; no negative angles.
- `autoShortcuts`: dedupe by host, skip dismissed, respect capacity, preserve manual order.
- `migration`: search→shortcuts; missing source→user; v1 config import.

### Integration/manual

- Fresh profile: onboarding shows once; skip/reload/replay.
- Permission: grant, deny, revoke; empty topSites profile.
- City: تهران، تهر، مشهد، اصفهان، شیراز، تبریز، New York, London; autofocus; keyboard.
- Clock: hide 5–10 minutes, return; compare with system clock; sleep/resume if possible.
- Drag: each widget to each corner; back to origin; Escape; rapid repeated drags; no drift.
- Layout matrix: 1280×720, 1366×768, 1440×900, 1920×1080, 2560×1440, 3440×1440, 3840×2160; zoom 100/125/150%.
- Browsers: Chrome stable and Firefox.
- A11y: keyboard-only modal, focus trap, reduced motion, contrast.

### Build gates

```sh
pnpm check
pnpm test
pnpm build
pnpm build:firefox
```

## 12. Risks and open items

- **Optional `topSites` request:** verify in an unpacked Chrome build that `permissions.request({ permissions: ["topSites"] })` succeeds. If Chrome rejects it as optional, fall back to a required permission or keep the feature disabled; do not silently ship a broken toggle.
- **Store review:** update the privacy policy/store listing to explain local reading of most-visited sites. No data leaves the device.
- **Fit scale blur:** transform scaling can soften text. Prefer fluid geometry first; use scale only below the minimum row height. If blur is noticeable, switch to CSS `zoom` (Chrome/Firefox current) with pointer-coordinate compensation.
- **Two-row cap:** users with many shortcuts will not see all auto suggestions. This is intentional for this phase; a future “see all” sheet can remove the cap.
- **City data:** Open-Meteo is a third-party service; if it is unavailable, local suggestions/recent cities keep the picker usable. A local Iranian city dataset is a follow-up.
- **Calendar minimum height:** the current `min-h-[17rem]` must be removed or the fit-scale path will clip it.
- **No git repository:** the working directory is not a git repo, so design/plan files cannot be committed here. They are saved on disk for review.

## 13. Approval

The design is ready for review. Implementation must not start until the reviewer approves this document and the implementation plan. The implementation plan will be written after approval and will follow the task-by-task format used in `docs/superpowers/plans/`.
