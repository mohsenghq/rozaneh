# Pre-release audit — Rozaneh Tab 1.0.0

**Date:** 2026-10-23
**Scope:** `v1.0.0` (`dbca2dc`). The repository has a single commit and the tag points at `HEAD`, so the "last release diff" is the entire release tree.
**Targets:** `.output/chrome-mv3`, `.output/firefox-mv2`, preview harness at `http://localhost:4173`.
**Method:** web-quality-audit, accessibility, security-review, and supply-chain-risk-auditor skills; Lighthouse 13 via the browser harness; `pnpm audit`; source inspection.

## Gate status: **RESOLVED — ready for store submission**

The two original release blockers (privacy/store declaration mismatch and modal focus management) were fixed and verified on 2026-10-23. See "Post-fix verification" at the end of this document. The findings below are retained as the pre-fix record.

Builds and tests are green: `pnpm check` 0 errors / 0 warnings, `pnpm test` 45/45, `pnpm build` and `pnpm build:firefox` succeed, both store zips produced.

---

## 1. Web quality

### Evidence

| Signal | Conditions | Result |
|---|---|---|
| Lighthouse accessibility (new tab) | 1000×700, light, fa/RTL | **0.94** |
| Lighthouse accessibility (popup) | 1000×700 | **1.00** |
| Lighthouse best practices (new tab) | 1000×700 | **1.00** |
| Lighthouse SEO (new tab) | 1000×700 | 0.80 (meta description only; not applicable to an extension page) |
| DOMContentLoaded / load | cold reload | 224 ms / 365 ms |
| Transfer / requests | cold reload | 415 KB / 12 requests |
| Main-thread blocking | 1.5 s trace | 3 long tasks, 342 ms total, 237 ms max |
| Document scroll | 1000×700 | `scrollHeight === innerHeight` (700) |
| Console | preview | only Bing `ERR_FAILED` (CORS; real extension holds `host_permissions` for bing.com) |
| Source maps | Chrome/Firefox `.output` | none |
| Package size | unpacked / zip | 577.6 KB / 268 KB |

### Findings

**Medium — 237 ms long task on first paint.**
`trace.analyze` reports `RunMicrotasks` 137 ms and `Layout` 100 ms inside a 237 ms task. The CPU profile attributes 33 ms of self time to `get clientWidth`, consistent with repeated synchronous layout reads in `WidgetGrid`/`Shortcuts` (`bind:clientWidth`).
Impact: a new-tab page should be interactive almost immediately; a quarter-second freeze is perceptible.
Fix: move measurement to a single `ResizeObserver`, cache the width, and avoid reading `clientWidth`/`getBoundingClientRect` inside per-frame pointer or effect loops.

**Low — font payload is heavier than necessary.**
Five DanaFaNum weights (131 KB) plus two RooyinFree TTF files (107 KB). The TTF pair is not subset and is not preloaded.
Fix: subset RooyinFree to the Persian glyph set and convert to WOFF2; drop unused Dana weights.

**Not applicable — SEO.**
`meta-description` is the only SEO failure. The page is a `chrome_url_overrides.newtab` target, not an indexed site. `document-title` and `html-lang` pass.

---

## 2. Accessibility (WCAG 2.2 AA)

Lighthouse found one automated failure; manual inspection found four additional barriers.

### High — Modal dialogs do not manage focus
`src/lib/Modal.svelte:21-47` renders `role="dialog" aria-modal="true"` but performs no focus management: no initial focus, no focus trap, no restore. Verified with Settings open: `document.activeElement` is `BODY`, `dialog.contains(activeElement) === false`, and 86 page focusables remain tabbable behind the overlay (24 inside the dialog).
Affects Settings, Shortcut modal, Bookmark picker, and City picker (all use `Modal`).
Impact: keyboard and screen-reader users start outside the dialog and can tab into obscured background controls. `aria-modal="true"` asserts modality the component does not enforce.
Fix: on open, focus the dialog (or first control), trap Tab/Shift+Tab within it, restore the previous focus on close, and make the background inert (`inert` attribute on the app root or a native `<dialog>`).

### High — Shortcut action buttons are invisible when keyboard-focused
`src/lib/Shortcuts.svelte:211-234` gives edit/remove buttons `opacity-0` and reveals them only with `group-hover`. Verified: focusing the remove button leaves `opacity: 0`, no visible outline, 16×16 px.
Impact: WCAG 2.4.7 (focus visible) fails; the control exists in the tab order but cannot be seen.
Fix: add `group-focus-within:opacity-100` (or `focus-visible:opacity-100`) and size the targets to at least 24×24 px (WCAG 2.5.8).

### Medium — `role="listitem"` without a `role="list"` parent
`src/lib/Shortcuts.svelte:169` puts `role="listitem"` on each tile; the parent is a plain `div`. This is the Lighthouse `aria-required-parent` failure (0.94).
Fix: wrap the tiles in a `role="list"` container (keep the add button outside it), or use `<ul>/<li>`.

### Medium — Reordering is pointer-drag only
`src/lib/Shortcuts.svelte:116-149` implements reorder strictly through pointer events. There is no keyboard or button alternative.
Impact: WCAG 2.5.7 (dragging movements) — any drag interaction needs a single-pointer non-drag alternative, and keyboard users cannot reorder at all.
Fix: add "move left/right" actions in the edit modal, or make tiles reorderable with arrow keys while focused.

### Medium — Signalled price colour fails contrast in light theme
`src/lib/OccasionsStrip.svelte:51` uses `#16a34a` for positive changes. Measured **3.3:1** on white at 12 px (needs 4.5:1). Dark theme passes. The only automated contrast failure on the dashboard.
Fix: use a darker green (`#15803d` is 4.6:1) or apply the colour to a larger/bolder element.

### Low — No heading structure
The dashboard exposes `banner` and `main` landmarks but no `h1`–`h6`. Screen-reader heading navigation has nothing to land on.
Fix: add one visually hidden or visible `h1` naming the dashboard.

### Low — Additional sub-24 px targets
Prices refresh button 16×16 (`src/lib/OccasionsStrip.svelte:60-68`); city button 79×11 in the weather card. WCAG 2.5.8 minimum is 24×24 CSS px.

### Passed
`lang="fa"` + `dir="rtl"` correct; all inputs have programmatic labels (`aria-label` or `<label>`); icon-only buttons have accessible names; `role="switch"` + `aria-checked` correct; decorative favicons use `alt=""`; `prefers-reduced-motion` honoured (`src/assets/app.css:162`); no horizontal/document scroll; dialog has a title and Escape handling.

---

## 3. Security review (release tree)

### High — Privacy/store declaration does not match runtime data flows

The README and store guidance state that shortcut and location data are never sent anywhere. The code sends both to third parties:

| Data | Destination | Location |
|---|---|---|
| Selected coordinates (lat/lng) | `api.open-meteo.com` | `src/lib/weather.ts:70` |
| City search text | `geocoding-api.open-meteo.com` | `src/lib/weather.ts:91` |
| Every shortcut URL / hostname | `www.google.com/s2/favicons` | `src/lib/Favicon.svelte:65` |
| Every shortcut hostname | `icon.horse` | `src/lib/Favicon.svelte:69` |

Contradicted statements:
- `README.md:11-12` — "never sends your shortcut or location data anywhere".
- `CONTRIBUTING.md` store instructions — declare "no user data is collected" and use a policy saying "all data stays on your device".
- `wxt.config.ts:19-24` — `data_collection_permissions: { required: ["none"] }`.

Impact: Chrome Web Store / AMO policy misrepresentation. This is the most likely cause of rejection or later removal, and it is a user-trust issue because most-visited hostnames can reach Google and Icon Horse.
Fix (in order):
1. Make the browser-native `_favicon` path the primary source (already implemented in `faviconCache.ts`) so no shortcut hostnames leave the device; keep Google/Icon Horse as an explicit fallback or remove them.
2. Write a real privacy policy that discloses weather coordinates and city search to Open-Meteo (no identifiers) and the prices/wallpaper requests.
3. Correct README and CONTRIBUTING.
4. Re-evaluate the Firefox `data_collection_permissions` declaration against the actual flows (location / website activity may apply).

### Medium — Imported config is not scheme-validated
`src/lib/migrations.ts:82-102` accepts any string for shortcut `icon` and `settings.background.value`. They reach `<img src>` (`Favicon.svelte:57,108`) and a CSS `url()` (`Background.svelte:16`). No script execution was demonstrated (`javascript:` in `<img>` and modern CSS `url()` do not run), so this is defence-in-depth, not a confirmed exploit.
Fix: allowlist `https:` and `data:image/` when importing; reject everything else.

### Low — Firefox MV2 has no explicit CSP
`wxt.config.ts` declares no `content_security_policy`. Chrome MV3 gets a safe default; Firefox MV2 also applies a default, but an explicit `script-src 'self'; object-src 'self'` documents and enforces the intent.
Fix: add an explicit CSP for both manifests.

### Passed
- No `eval`, `new Function`, `innerHTML`, `document.write`, or dynamic script injection.
- No secrets, API keys, or tokens in source or build output.
- No source maps in either production build.
- No remote code; all chunks are bundled locally.
- No background service worker, content scripts, `web_accessible_resources`, or externally connectable surface.
- Permissions are minimal: `storage`, `favicon`; optional `bookmarks`, `topSites`; `host_permissions` limited to `https://www.bing.com/*`.
- `topSites` and `bookmarks` are requested only from user gestures and degrade safely.
- URLs opened from shortcuts pass through `normalizeUrl`, which forces `https://` (`src/lib/search.ts:1-5`).
- External endpoints used with `fetch` publish `Access-Control-Allow-Origin: *` (Open-Meteo, TGJU, Icon Horse verified); Bing is covered by host permission. Google favicons is loaded as an image, not fetched.

---

## 4. Supply chain

Two independent checks were run because the Trail of Bits collector does not parse `pnpm-lock.yaml`.

### Production dependencies — clean
`pnpm audit --prod`: **0** critical / high / moderate / low. The only runtime package is `adhan@4.4.4`.

### Full tree (mostly build tooling)
`pnpm audit`: 1 critical, 22 high, 15 moderate, 3 low. Every advisory is on a `dev` path and does not ship in the zip. Notable:
- `shell-quote@1.7.3` (critical, command injection) via `wxt → web-ext-run → fx-runner`. Fixed in `>=1.8.4`.
- `tmp@0.2.5` (high, path traversal) via the same chain. Fixed in `>=0.2.6`.
- `uuid@8.3.2` (moderate) via the same chain.

### Collector report
11 direct dependencies; none deprecated, archived, or running install scripts. Download volume established for 11/11. Advisory coverage was **0/11** because OSV returned HTTP 403, and the transitive tree was not examined because `pnpm-lock.yaml` is unsupported. This is a coverage gap, not a clean verdict; `pnpm audit` above closes it.

### Findings
**Medium — outdated build chain.**
`wxt 0.20.27 → 0.21.4` clears the `web-ext-run` advisories. `adhan 4.4.4 → 4.4.6` is a production patch. Also available: Tailwind 4.3.3, Svelte 5.57.2, Vitest 5.0.5 (major).
Fix: `pnpm update wxt adhan @tailwindcss/vite tailwindcss svelte svelte-check`, then re-run `pnpm check && pnpm test && pnpm build && pnpm build:firefox`. Re-audit before tagging.
Optional: `npm ci --ignore-scripts` / `pnpm install --ignore-scripts` is viable here — no dependency requires a postinstall beyond WXT's `wxt prepare`, which is the project's own script.

---

## Recommended fix order

1. **Privacy truth-up** (blocker): fix README, CONTRIBUTING, privacy policy, Firefox declaration; switch favicon resolution to local-first.
2. **Modal focus management** (blocker): initial focus, trap, restore, inert background.
3. **Invisible focus + 24 px targets** on shortcut edit/remove and prices refresh.
4. **`role="list"` wrapper** for shortcut tiles.
5. **Keyboard alternative for reorder** and a dark-enough green.
6. **Long-task reduction** and font subsetting.
7. **Dependency updates** (`wxt`, `adhan`) and CI `pnpm audit --prod`.

## Post-fix verification — 2026-10-23

### Applied

| Blocker | Change |
|---|---|
| Privacy/store mismatch | Shortcut icons now resolve from the browser's local `_favicon` store, then the site's own `/favicon.ico`; Google favicons and Icon Horse were removed from source and both builds. `README.md`, `CONTRIBUTING.md`, and a new `PRIVACY.md` now disclose the Open-Meteo requests. Firefox `data_collection_permissions` changed from `["none"]` to `["locationInfo"]`. |
| Modal focus | New `src/lib/modalFocus.ts` action used by `Modal.svelte` and `Settings.svelte` (now portaled). It focuses the panel on open, traps Tab/Shift+Tab, handles Escape, marks background siblings `inert`, and restores focus on close. |
| Focus visibility / targets / list semantics | Shortcut edit/remove and prices refresh are 28 px CSS (24.8 px rendered at the scaled stage); edit/remove reveal on `group-focus-within`; shortcut tiles sit in a `role="list"`. |
| Contrast | `--muted` light token darkened to `#5b6472`; price gain uses `--gain` (`#15803d` light / `#4ade80` dark); out-of-month calendar days use `text-muted`. |
| Config hardening | Imported `background.value` and shortcut `icon` are scheme-validated; unsafe values are dropped. |

### Results

| Check | Result |
|---|---|
| `pnpm check` | 0 errors, 0 warnings |
| `pnpm test` | 48/48 |
| Chrome + Firefox builds | pass (579.5 KB unpacked) |
| Store zips | Chrome/Firefox 269 KB, sources 1.65 MB |
| Lighthouse a11y — dashboard (3 consecutive runs) | **1.00** |
| Lighthouse a11y — Settings, welcome, popup | **1.00** |
| Lighthouse best practices — all surfaces | **1.00** |
| Lighthouse SEO | 0.75–0.80; only `meta-description`, not applicable to extension pages |
| Contrast failures | none on dashboard, Settings, welcome, popup |
| `role="listitem"` parent | `role="list"`; `aria-required-parent` gone |
| Keyboard-focused shortcut action | visible (`opacity: 1`) and 24.8×24.8 rendered |
| Settings dialog | initial focus on panel, `#app` inert, Tab/Shift+Tab wrap, Escape closes and removes `inert` |
| Generic `Modal` | same focus/inert behavior verified |
| Third-party favicon services in builds | none |
| Manifest permissions | unchanged: `storage`, `favicon`; optional `bookmarks`, `topSites`; Bing host only |

### Still open (non-blocking)

- 237 ms long task on first paint; font subsetting.
- `wxt 0.20.27 → 0.21.4` and `adhan 4.4.4 → 4.4.6` for dev-chain advisories / prod patch.
- Keyboard alternative for shortcut reordering (WCAG 2.5.7).
- Dashboard heading structure and an explicit Firefox MV2 CSP.
- Review the anchor copy and version bump in `package.json` before uploading.
