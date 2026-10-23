# Contributing to Rozaneh

Thanks for helping improve Rozaneh. This guide covers local development,
building, agent tooling, and the release process.

## Development

Requires Node 20+ and pnpm.

```sh
pnpm install
pnpm dev              # Chrome dev mode with HMR
pnpm dev:firefox      # Firefox dev mode
```

## Agent skill

Project-specific instructions for coding agents live in
`.opencode/skills/rozaneh/SKILL.md` (auto-discovered by OpenCode). It covers the
architecture, fixed layout, shortcut bar, clock dial, city picker, permissions,
migrations, tests, and visual preview workflow. The preview server lives at
`.opencode/skills/rozaneh/scripts/preview-server.mjs`.

## Build

```sh
pnpm build            # → .output/chrome-mv3
pnpm build:firefox    # → .output/firefox-mv2
```

Load the built folder unpacked via `chrome://extensions` (Developer mode →
"Load unpacked") or `about:debugging#/runtime/this-firefox` ("Load Temporary
Add-on") to test locally.

## Publishing

### Create the store packages

```sh
pnpm zip              # → .output/rozaneh-<version>-chrome.zip
pnpm zip:firefox      # → .output/rozaneh-<version>-firefox.zip (+ a -sources.zip)
```

Bump `version` in `package.json` before zipping — both stores reject uploads
that reuse an existing version number.

### Chrome Web Store

1. Register a developer account at
   https://chrome.google.com/webstore/devconsole (one-time $5 fee, needs a
   Google account).
2. Click **New item** and upload the chrome zip.
3. Fill in the **Store listing** tab:
   - Title, short description, and detailed description (Persian and/or
     English).
   - At least one 1280×800 or 640×400 screenshot of the new tab page.
   - A 128×128 store icon (`public/icon/128.png` works).
   - Category: Productivity → Tools; language: فارسی.
4. Fill in the **Privacy** tab — this is what usually blocks approval:
   - Single purpose: "Replaces the new tab page with a clock, calendar and
     weather dashboard."
   - Justify the `storage` permission (saving user settings locally), the
     optional `bookmarks` permission (user-initiated bookmark import), and the
     optional `topSites` permission (local most-visited shortcut suggestions).
   - Declare that there is no analytics, account, advertising, or data sale.
     The only data that leaves the device is the selected coordinates and the
     typed city name sent to Open-Meteo for weather and geocoding, with no
     identifiers. Shortcut, bookmark, and most-visited lists stay local.
   - Link the published copy of `PRIVACY.md` (GitHub Pages or a raw gist is
     fine).
5. Submit for review. New-tab-override extensions get manual review; expect a
   few days to two weeks. You'll get an email on approval or rejection.

### Firefox Add-ons (AMO)

1. Create a free account at https://addons.mozilla.org and open
   https://addons.mozilla.org/developers/.
2. Click **Submit a New Add-on** → "On this site" (listed).
3. Upload the firefox zip. AMO validates it automatically; the
   `browser_specific_settings.gecko.id` in the manifest identifies the add-on
   permanently — never change it after first submission.
4. When asked whether source code is needed: this project bundles/minifies with
   Vite, so upload the `-sources.zip` that `pnpm zip:firefox` produced and note
   the build steps (`pnpm install && pnpm zip:firefox`, Node 20+).
5. Fill in the listing (name, summary, description, screenshots, icon,
   category) and a privacy policy (same text as Chrome's).
6. Submit. Firefox review is usually faster (hours to a few days). Updates are
   uploaded from the add-on's **Manage Status & Versions** page.

### Release checklist

- [ ] Bump `version` in `package.json`
- [ ] `pnpm build && pnpm build:firefox` — both build clean
- [ ] Smoke-test both builds loaded unpacked (new tab opens, settings persist)
- [ ] `pnpm zip && pnpm zip:firefox`
- [ ] Upload to both dashboards, reusing the same screenshots
