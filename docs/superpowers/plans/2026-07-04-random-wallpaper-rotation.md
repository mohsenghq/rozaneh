# Categorized Random Wallpaper Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user opt a wallpaper category into "Random" mode, where the background image automatically rotates to a new photo from that category once per day, with a much larger curated Picsum photo pool per category.

**Architecture:** Two new fields on the persisted `Background` settings object (`randomCategory`, `randomDate`) track which category (if any) is auto-rotating and when it last rotated. A new pure-function module (`wallpaperRotation.ts`) decides whether a rotation is due and performs it. The app store calls this check once on startup (`init()`) — no background service worker, no `alarms` permission, no timer. The Settings UI gets one new "Random" tile per category, and picking a specific thumbnail (or a solid color, or a custom upload) always turns random mode back off.

**Tech Stack:** Svelte 5 (runes), TypeScript, WXT, Vitest (new dev dependency, for testing the new pure functions — the project has no test runner today).

## Global Constraints

- No new extension permissions. No `alarms` permission, no background/service-worker entry point.
- No new image API/service. Stays on the existing keyless `picsum.photos` source.
- No user-facing rotation-period control. Rotation is a fixed once-per-day check, evaluated when the app loads (new tab opens) — not configurable.
- The "Random" option is an extra tile inside each category's existing thumbnail grid, not a separate toggle/section.
- Selecting a specific thumbnail, a solid color, or a custom-uploaded image always clears random mode (`randomCategory`/`randomDate` reset to `null`).

---

### Task 1: Add Vitest as the test runner

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `pnpm test` command that runs `vitest run`, used by every later task's test steps.

- [ ] **Step 1: Install vitest**

Run: `pnpm add -D vitest`
Expected: `vitest` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Add the test script**

Modify `package.json` — add a `"test"` entry to `"scripts"` (keep all existing scripts as-is, just add this one line among them):

```json
    "test": "vitest run",
```

- [ ] **Step 4: Verify the runner works with no test files yet**

Run: `pnpm test`
Expected: Vitest starts and reports `No test files found` (exit code may be non-zero — that's expected until Task 4 adds real tests; we're only confirming the command runs and Vitest itself is wired up correctly, not that it passes).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "Add vitest as the project's test runner"
```

---

### Task 2: Expand and re-curate the wallpaper categories

**Files:**
- Modify: `src/data/wallpapers.ts`

**Interfaces:**
- Produces: `WallpaperCategory.key: string` (stable identifier, e.g. `"landscape"`, `"city"`, `"dark"`) — consumed by Task 4's `pickRandomWallpaper` and Task 7's Settings UI.
- Produces: `wallpaperCategories: WallpaperCategory[]` (existing export, now with `key` field and larger `items` pools) — consumed by Task 4 and Task 7.

**Context:** The current pools are only 4 images each, and inspecting the actual photos shows some are miscategorized (e.g. the existing "City & architecture" IDs 42/48/60 are desk/laptop interior shots, not city or architecture — only 164 fits). This task replaces the pools with ones verified by inspecting each image.

- [ ] **Step 1: Replace the file contents**

Replace the full contents of `src/data/wallpapers.ts`:

```ts
export interface Wallpaper {
  thumb: string;
  full: string;
}

export interface WallpaperCategory {
  key: string;
  fa: string;
  en: string;
  items: Wallpaper[];
}

const pic = (id: number): Wallpaper => ({
  thumb: `https://picsum.photos/id/${id}/320/200`,
  full: `https://picsum.photos/id/${id}/1920/1080`,
});

export const wallpaperCategories: WallpaperCategory[] = [
  {
    key: "landscape",
    fa: "منظره",
    en: "Landscape",
    items: [10, 13, 14, 17, 28, 29, 37, 66, 110, 177, 190, 200, 1015, 1016, 1036, 1043].map(pic),
  },
  {
    key: "city",
    fa: "شهر و معماری",
    en: "City & architecture",
    items: [43, 49, 84, 88, 101, 122, 133, 146, 160, 164, 193, 1029, 1040].map(pic),
  },
  {
    key: "dark",
    fa: "تیره",
    en: "Dark",
    items: [44, 56, 67, 68, 70, 96, 111, 1019, 1021, 1022, 1028, 1042].map(pic),
  },
];

export const solidColors = ["#0b0b0d", "#111827", "#1e293b", "#3b0764", "#0f3d3e", "#7c2d12"];
```

- [ ] **Step 2: Type-check**

Run: `pnpm check`
Expected: `0 ERRORS 0 WARNINGS` (this step is a type-check, not a full guarantee — `Settings.svelte` still references `cat.fa` as its `{#each}` key, which still compiles fine since `fa` still exists on the type; Task 7 will switch that key to `cat.key`).

- [ ] **Step 3: Commit**

```bash
git add src/data/wallpapers.ts
git commit -m "Expand and re-curate wallpaper category image pools"
```

---

### Task 3: Add random-rotation fields to the Background settings type

**Files:**
- Modify: `src/lib/settings.ts:39-44` (the `Background` interface)
- Modify: `src/lib/settings.ts:73` (the `defaultSettings.background` default value)

**Interfaces:**
- Produces: `Background.randomCategory: string | null` and `Background.randomDate: string | null` — consumed by Task 4's `maybeRotateBackground`, Task 5's store wiring, and Task 7's Settings UI.

- [ ] **Step 1: Extend the `Background` interface**

In `src/lib/settings.ts`, replace:

```ts
export interface Background {
  type: BackgroundType;
  value: string;
  dim: number;
  blur: number;
}
```

with:

```ts
export interface Background {
  type: BackgroundType;
  value: string;
  dim: number;
  blur: number;
  randomCategory: string | null;
  randomDate: string | null;
}
```

- [ ] **Step 2: Update the default background value**

In the same file, replace:

```ts
  background: { type: "color", value: "", dim: 0, blur: 0 },
```

with:

```ts
  background: { type: "color", value: "", dim: 0, blur: 0, randomCategory: null, randomDate: null },
```

- [ ] **Step 3: Type-check**

Run: `pnpm check`
Expected: `0 ERRORS 0 WARNINGS`. (Existing callers that construct a full `Background` object literal, if any, would now fail to compile without the two new fields — this codebase only constructs `Background` via `defaultSettings.background` and spreads/patches of it, so no other call site needs changes.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/settings.ts
git commit -m "Add randomCategory/randomDate fields to Background settings"
```

---

### Task 4: Wallpaper rotation logic (TDD)

**Files:**
- Create: `src/lib/wallpaperRotation.ts`
- Create: `src/lib/wallpaperRotation.test.ts`

**Interfaces:**
- Consumes: `Background` type from `./settings` (Task 3); `wallpaperCategories` from `../data/wallpapers` (Task 2).
- Produces: `todayLocalDate(date?: Date): string`, `pickRandomWallpaper(categoryKey: string, excludeUrl?: string): string | null`, `maybeRotateBackground(background: Background, now?: Date): Background` — consumed by Task 5 (store init) and Task 7 (Settings UI's random-tile handler).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/wallpaperRotation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { todayLocalDate, pickRandomWallpaper, maybeRotateBackground } from "./wallpaperRotation";
import { wallpaperCategories } from "../data/wallpapers";
import type { Background } from "./settings";

describe("todayLocalDate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayLocalDate(new Date(2026, 6, 4))).toBe("2026-07-04");
  });

  it("zero-pads single-digit month and day", () => {
    expect(todayLocalDate(new Date(2026, 0, 9))).toBe("2026-01-09");
  });
});

describe("pickRandomWallpaper", () => {
  it("returns a URL that belongs to the requested category", () => {
    const key = wallpaperCategories[0].key;
    const url = pickRandomWallpaper(key);
    expect(url).not.toBeNull();
    expect(wallpaperCategories[0].items.some((w) => w.full === url)).toBe(true);
  });

  it("avoids the excluded URL when the category has more than one image", () => {
    const cat = wallpaperCategories[0];
    const exclude = cat.items[0].full;
    for (let i = 0; i < 20; i++) {
      expect(pickRandomWallpaper(cat.key, exclude)).not.toBe(exclude);
    }
  });

  it("returns null for an unknown category key", () => {
    expect(pickRandomWallpaper("does-not-exist")).toBeNull();
  });
});

describe("maybeRotateBackground", () => {
  const base: Background = {
    type: "color",
    value: "",
    dim: 0,
    blur: 0,
    randomCategory: null,
    randomDate: null,
  };

  it("is a no-op when randomCategory is null", () => {
    expect(maybeRotateBackground(base)).toBe(base);
  });

  it("is a no-op when randomDate is already today", () => {
    const today = todayLocalDate();
    const bg: Background = { ...base, randomCategory: wallpaperCategories[0].key, randomDate: today };
    expect(maybeRotateBackground(bg)).toBe(bg);
  });

  it("rotates to a new image and updates randomDate when due", () => {
    const bg: Background = { ...base, randomCategory: wallpaperCategories[0].key, randomDate: "2000-01-01" };
    const now = new Date(2026, 6, 4);
    const result = maybeRotateBackground(bg, now);
    expect(result).not.toBe(bg);
    expect(result.type).toBe("image");
    expect(result.randomDate).toBe("2026-07-04");
    expect(wallpaperCategories[0].items.some((w) => w.full === result.value)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './wallpaperRotation'` (the module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/wallpaperRotation.ts`:

```ts
import type { Background } from "./settings";
import { wallpaperCategories } from "../data/wallpapers";

export function todayLocalDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function pickRandomWallpaper(categoryKey: string, excludeUrl?: string): string | null {
  const category = wallpaperCategories.find((c) => c.key === categoryKey);
  if (!category || category.items.length === 0) return null;

  const pool =
    excludeUrl && category.items.length > 1
      ? category.items.filter((w) => w.full !== excludeUrl)
      : category.items;

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return chosen.full;
}

export function maybeRotateBackground(background: Background, now: Date = new Date()): Background {
  if (!background.randomCategory) return background;

  const today = todayLocalDate(now);
  if (background.randomDate === today) return background;

  const next = pickRandomWallpaper(background.randomCategory, background.value);
  if (!next) return background;

  return { ...background, type: "image", value: next, randomDate: today };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — all 8 tests green.

- [ ] **Step 5: Type-check**

Run: `pnpm check`
Expected: `0 ERRORS 0 WARNINGS`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/wallpaperRotation.ts src/lib/wallpaperRotation.test.ts
git commit -m "Add wallpaper rotation logic with tests"
```

---

### Task 5: Wire rotation check into app startup

**Files:**
- Modify: `src/lib/store.svelte.ts:1-15` (imports)
- Modify: `src/lib/store.svelte.ts:50-55` (the `init()` method)

**Interfaces:**
- Consumes: `maybeRotateBackground` from `./wallpaperRotation` (Task 4).

- [ ] **Step 1: Import the rotation helper**

In `src/lib/store.svelte.ts`, add this import alongside the existing ones at the top of the file:

```ts
import { maybeRotateBackground } from "./wallpaperRotation";
```

- [ ] **Step 2: Run rotation check after settings load**

Replace the current `init()` method:

```ts
  async init() {
    try {
      this.#apply(await settingsItem.getValue());
    } catch {}
    this.applyTheme();
  }
```

with:

```ts
  async init() {
    try {
      this.#apply(await settingsItem.getValue());
    } catch {}
    const rotated = maybeRotateBackground(this.background);
    if (rotated !== this.background) {
      this.background = rotated;
      this.save();
    }
    this.applyTheme();
  }
```

- [ ] **Step 3: Type-check**

Run: `pnpm check`
Expected: `0 ERRORS 0 WARNINGS`.

- [ ] **Step 4: Build the extension**

Run: `pnpm build`
Expected: build completes with no errors (last line `✔ Finished in ...`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/store.svelte.ts
git commit -m "Run wallpaper rotation check on app startup"
```

---

### Task 6: Add the "Random" label translation

**Files:**
- Modify: `src/lib/i18n.ts` (near the existing `"bg.*"` keys, around line 93)

**Interfaces:**
- Produces: `t("bg.random")` string — consumed by Task 7's Settings UI.

- [ ] **Step 1: Add the translation key**

In `src/lib/i18n.ts`, find this existing line:

```ts
  "bg.default": { fa: "پیش‌فرض", en: "Default" },
```

and add a new line immediately after it:

```ts
  "bg.random": { fa: "تصادفی", en: "Random" },
```

- [ ] **Step 2: Type-check**

Run: `pnpm check`
Expected: `0 ERRORS 0 WARNINGS`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/i18n.ts
git commit -m "Add translation key for the Random wallpaper option"
```

---

### Task 7: Settings UI — Random tile per category

**Files:**
- Modify: `src/lib/Settings.svelte:1-9` (imports)
- Modify: `src/lib/Settings.svelte:44-54` (`updateBg`, `onCustomFile`, plus new `pickRandomForCategory`)
- Modify: `src/lib/Settings.svelte:248-281` (background tab: color/default buttons and the category grid)

**Interfaces:**
- Consumes: `maybeRotateBackground` from `./wallpaperRotation` (Task 4); `Background.randomCategory`/`randomDate` (Task 3); `WallpaperCategory.key` (Task 2); `t("bg.random")` (Task 6).

- [ ] **Step 1: Import the rotation helper**

In `src/lib/Settings.svelte`, add this import alongside the existing ones:

```ts
  import { maybeRotateBackground } from "./wallpaperRotation";
```

- [ ] **Step 2: Add the random-pick handler and make manual selections clear random mode**

Replace the current `updateBg`/`onCustomFile` block:

```ts
  function updateBg(patch: Partial<Background>) {
    app.setBackground({ ...app.background, ...patch });
  }

  function onCustomFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateBg({ type: "image", value: reader.result as string });
    reader.readAsDataURL(file);
  }
```

with:

```ts
  function updateBg(patch: Partial<Background>) {
    app.setBackground({ ...app.background, ...patch });
  }

  function onCustomFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      updateBg({ type: "image", value: reader.result as string, randomCategory: null, randomDate: null });
    reader.readAsDataURL(file);
  }

  function pickRandomForCategory(key: string) {
    updateBg({ randomCategory: key, randomDate: null });
    const rotated = maybeRotateBackground(app.background);
    if (rotated !== app.background) app.setBackground(rotated);
  }
```

- [ ] **Step 3: Clear random mode on the color/default buttons**

In the same file's background tab markup, replace:

```svelte
            <button
              type="button"
              onclick={() => updateBg({ type: "color", value: "" })}
              class="rounded-xl border-2 px-4 py-2 text-sm transition
                {app.background.type === 'color' && !app.background.value ? 'border-accent text-text' : 'border-border text-muted hover:bg-surface-2'}"
            >
              {t("bg.default")}
            </button>
            {#each solidColors as c (c)}
              <button
                type="button"
                onclick={() => updateBg({ type: "color", value: c })}
                aria-label={c}
                class="size-9 rounded-xl transition {app.background.value === c ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}"
                style:background={c}
              ></button>
            {/each}
```

with:

```svelte
            <button
              type="button"
              onclick={() => updateBg({ type: "color", value: "", randomCategory: null, randomDate: null })}
              class="rounded-xl border-2 px-4 py-2 text-sm transition
                {app.background.type === 'color' && !app.background.value ? 'border-accent text-text' : 'border-border text-muted hover:bg-surface-2'}"
            >
              {t("bg.default")}
            </button>
            {#each solidColors as c (c)}
              <button
                type="button"
                onclick={() => updateBg({ type: "color", value: c, randomCategory: null, randomDate: null })}
                aria-label={c}
                class="size-9 rounded-xl transition {app.background.value === c ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}"
                style:background={c}
              ></button>
            {/each}
```

- [ ] **Step 4: Add the Random tile to each category's grid**

Replace:

```svelte
          {#each wallpaperCategories as cat (cat.fa)}
            <p class="mb-2 text-sm font-medium text-muted">{app.locale === "fa" ? cat.fa : cat.en}</p>
            <div class="mb-4 grid grid-cols-4 gap-2">
              {#each cat.items as w (w.full)}
                <button
                  type="button"
                  onclick={() => updateBg({ type: "image", value: w.full })}
                  class="group aspect-video overflow-hidden rounded-xl transition {app.background.value === w.full ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}"
                >
                  <img src={w.thumb} alt="" class="size-full object-cover transition duration-300 group-hover:scale-110" loading="lazy" />
                </button>
              {/each}
            </div>
          {/each}
```

with:

```svelte
          {#each wallpaperCategories as cat (cat.key)}
            <p class="mb-2 text-sm font-medium text-muted">{app.locale === "fa" ? cat.fa : cat.en}</p>
            <div class="mb-4 grid grid-cols-4 gap-2">
              <button
                type="button"
                onclick={() => pickRandomForCategory(cat.key)}
                class="flex aspect-video flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-border text-muted transition hover:bg-surface-2
                  {app.background.randomCategory === cat.key ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5">
                  <path d="M4 4h4l3 3M4 20h4l3-3M20 4h-4l-8 8M20 20h-4l-3-3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="text-xs">{t("bg.random")}</span>
              </button>
              {#each cat.items as w (w.full)}
                <button
                  type="button"
                  onclick={() => updateBg({ type: "image", value: w.full, randomCategory: null, randomDate: null })}
                  class="group aspect-video overflow-hidden rounded-xl transition {app.background.value === w.full && app.background.randomCategory !== cat.key ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}"
                >
                  <img src={w.thumb} alt="" class="size-full object-cover transition duration-300 group-hover:scale-110" loading="lazy" />
                </button>
              {/each}
            </div>
          {/each}
```

- [ ] **Step 5: Type-check**

Run: `pnpm check`
Expected: `0 ERRORS 0 WARNINGS`.

- [ ] **Step 6: Build the extension**

Run: `pnpm build`
Expected: build completes with no errors.

- [ ] **Step 7: Manual verification**

Load `.output/chrome-mv3` as an unpacked extension (or reload it if already loaded), open a new tab, open Settings → Background:
- Click the "Random" tile on any category → a real photo from that category should appear immediately as the background (not a blank/unchanged background).
- The clicked "Random" tile should show the accent ring.
- Click a specific thumbnail in the same category → the Random tile's ring should disappear, that thumbnail's ring should appear, and the background should switch to that exact image.
- Click "Default" → background clears to the default color; random mode is off (verify by reopening Settings and confirming no "Random" tile has a ring).

- [ ] **Step 8: Commit**

```bash
git add src/lib/Settings.svelte
git commit -m "Add per-category Random wallpaper option to Settings UI"
```

---

### Task 8: Final full-project verification

**Files:** None (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: PASS — all tests green.

- [ ] **Step 2: Type-check the whole project**

Run: `pnpm check`
Expected: `0 ERRORS 0 WARNINGS`.

- [ ] **Step 3: Build both targets**

Run: `pnpm build && pnpm build:firefox`
Expected: both builds complete with no errors.
