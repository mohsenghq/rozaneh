# Categorized Random Wallpaper Rotation

## Problem

Background images currently come from a small, fixed set of 4 hand-picked
Picsum photo IDs per category (Landscape, City & architecture, Dark). There
is no way to get a fresh image automatically — the user must manually revisit
Settings and pick a different thumbnail each time they want variety.

## Goals

1. Give each wallpaper category a much larger pool of good-quality images so
   there's real variety to draw from.
2. Let the user opt a category into "Random" mode, where the wallpaper
   automatically rotates to a new image from that category once per day —
   similar to Bing/Edge's daily wallpaper, but without adding any new
   extension permission or a background service worker.

## Non-goals

- No new image API/service integration (Unsplash, Pexels). Staying on the
  existing keyless Picsum source, per explicit decision — avoids an API key
  embedded in the shipped extension and avoids Unsplash's restrictive demo
  rate limit.
- No user-facing rotation-period control. Rotation is a fixed once-per-day
  check; there is no hourly/every-new-tab option.
- No `alarms` permission or background service worker. Rotation is evaluated
  opportunistically when a new tab opens.

## Data model changes

### `src/data/wallpapers.ts`

`WallpaperCategory` gains a stable `key` field, independent of the `fa`/`en`
display labels (which are locale-dependent and unsuitable as an identifier):

```ts
export interface WallpaperCategory {
  key: string; // e.g. "landscape", "city", "dark"
  fa: string;
  en: string;
  items: Wallpaper[];
}
```

Each category's `items` pool is expanded from 4 to roughly 12+ curated Picsum
IDs (hand-picked by category, same `pic(id)` thumb/full URL helper as today).

### `src/lib/settings.ts`

`Background` gains two new optional fields:

```ts
export interface Background {
  type: BackgroundType;
  value: string;
  dim: number;
  blur: number;
  randomCategory: string | null; // WallpaperCategory.key, or null if not in random mode
  randomDate: string | null;     // ISO date (YYYY-MM-DD, local) of the last rotation
}
```

Default background settings set both new fields to `null`.

`value` continues to hold the actual current image URL in both manual and
random mode — random mode only changes how/when `value` gets recomputed.

## Rotation logic

New helper module `src/lib/wallpaperRotation.ts`:

- `todayLocalDate(): string` — returns local date as `YYYY-MM-DD`.
- `pickRandomWallpaper(categoryKey: string, excludeUrl?: string): string | null` —
  picks a random item from the category's pool, avoiding `excludeUrl` when
  the pool has more than one item (so it doesn't "randomly" repeat the same
  image two days in a row).
- `maybeRotateBackground(background: Background): Background` — pure
  function: if `background.randomCategory` is set and
  `background.randomDate !== todayLocalDate()`, returns a new `Background`
  with `value` set to a freshly picked wallpaper and `randomDate` set to
  today. Otherwise returns `background` unchanged (same reference, so callers
  can cheaply check `result === input` to know if anything changed).

### Call site: app init

In `store.svelte.ts`, after background is loaded from storage (both on
initial load and after `applyTheme`/hydration), run it through
`maybeRotateBackground` and persist if it changed. This covers "new tab
opens, rotation is due" without any timer — the check is just a cheap date
string comparison that runs once per page load.

### Manual selection still works as today

Clicking a specific thumbnail in Settings calls
`updateBg({ type: "image", value: w.full, randomCategory: null, randomDate: null })` —
selecting a specific image always turns random mode off for that background.

## UI changes (`Settings.svelte`)

Each category's thumbnail grid gets one extra leading tile: a "Random" card,
same `aspect-video` shape as the photo thumbnails, showing a shuffle icon
instead of a photo (and a "Random"/"تصادفی" label to match the wallpaper
category labels' bilingual pattern).

- Clicking it calls a new `pickRandomForCategory(key)` handler that sets
  `randomCategory: key, randomDate: null` and then immediately calls
  `maybeRotateBackground` (since `randomDate` is now `null`, this immediately
  fires and picks a real image instead of leaving the background blank until
  the next reload).
- It is highlighted (ring, same treatment as a selected thumbnail) when
  `app.background.randomCategory === cat.key`, regardless of which specific
  image is currently showing as a result of rotation.

## Testing

- Unit-test `pickRandomWallpaper` (returns an item from the right category,
  avoids the excluded URL when pool size > 1, doesn't crash on an unknown
  category key or empty pool).
- Unit-test `maybeRotateBackground` (no-op when `randomCategory` is `null`;
  no-op when `randomDate` is already today; rotates and updates `randomDate`
  when due).
- Manual verification in the built extension: selecting "Random" on a
  category shows an image immediately; reloading the same day keeps the same
  image; simulating a date change (or clearing `randomDate`) picks a new one.
