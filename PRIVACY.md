# Privacy Policy — Rozaneh Tab

**Last updated: 2026-10-23**

Rozaneh Tab is a new-tab extension for Chrome and Firefox. It has no accounts, no
analytics, no advertising, and no data sale. This page describes exactly what is
stored locally and what leaves the device.

## Data kept on your device

The extension stores the following in the browser's extension storage
(`storage` permission):

- settings (theme, language, layout, clock face, selected city);
- your shortcuts and any custom icon or background image you add;
- the onboarding flag;
- local caches for weather, prices, and favicons.

Bookmarks and most-visited sites are read only after you grant the optional
`bookmarks` or `topSites` permission. Their contents are used locally to build
shortcuts and are never transmitted. You can revoke either permission at any
time from the extension settings or the browser's extension page.

Removing the extension deletes this local data. Settings and shortcuts can also
be exported and re-imported by you.

## Network requests

| Purpose | Destination | Data sent |
|---|---|---|
| Weather | `api.open-meteo.com` | The latitude and longitude of the city you selected |
| City search | `geocoding-api.open-meteo.com` | The place name you type in the city picker |
| Wallpaper list | `www.bing.com` | None (a public image feed request) |
| Prices | `api.tgju.org` | None (fixed public symbol names) |
| Shortcut icons | The shortcut's own site (`/favicon.ico`) | None beyond the request itself |

Shortcut icons are resolved from the browser's local favicon store first. No
shortcut, bookmark, or most-visited list is sent to a third-party favicon
service.

Like any HTTP request, these requests expose standard technical information
(IP address, user agent) to the destination. Open-Meteo and TGJU publish their
own privacy policies. Rozaneh Tab does not add identifiers, cookies, or
tracking parameters to any request.

## What the extension does not do

- No analytics, telemetry, crash reporting, or advertising SDKs.
- No accounts, sign-in, or cloud sync.
- No sale or sharing of personal data.
- No access to full browsing history.
- No remote code; all scripts ship inside the extension package.

## Permissions

- `storage` — save settings, shortcuts, and local caches.
- `favicon` — read the browser's local favicon store (Chrome).
- `bookmarks` (optional) — import bookmarks you choose.
- `topSites` (optional) — suggest sites you visit often.
- `https://www.bing.com/*` host permission — fetch the public wallpaper feed.

Optional permissions are requested only after a user action and can be revoked.

## Changes and contact

Material changes to this policy will be published with a new "last updated"
date. Questions or requests can be raised through the project's issue tracker.
