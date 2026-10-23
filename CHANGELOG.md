# Changelog

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Three-step first-run welcome flow with an animated introduction, city picker and optional most-visited suggestions.
- Optional `topSites` shortcuts: sites you visit often are appended to the shortcut bar, stay editable/removable, and dismissed suggestions are remembered.
- Fluid desktop grid that fits the dashboard on one screen across monitor sizes and zoom levels.
- Toolbar action popup with an on/off switch for the dashboard, theme, most-visited toggle, settings and guide actions.
- High-resolution bookmark icons resolved from the browser's local favicon store, with the site's own `/favicon.ico` as a fallback.

### Changed
- Removed the new-tab search field; the top card is now a two-row shortcut bar.
- City search now returns real cities only (no neighbourhoods, localities or mountains), deduplicates Tehran and shows the province/country.
- The city input autofocuses when opened from the weather card.
- The classic clock face now uses standard 60-minute ticks, 12 numerals and proportional hands.
- Widget dragging is snapshot-based and swaps/pushes predictably instead of cascading.
- Shortcut icons no longer contact third-party favicon services; hostnames stay on the device.
- The privacy policy and Firefox data-collection declaration now match the actual network requests (`locationInfo` for Open-Meteo weather).

### Fixed
- Clock no longer fast-forwards after returning to a backgrounded tab; angles are derived directly from the current date.
- Dialogs move focus inside on open, trap Tab, mark the page inert, and restore focus on close.
- Shortcut edit/remove controls are visible on keyboard focus and meet the 24px target minimum; shortcut tiles use proper list semantics.
- Improved contrast for out-of-month calendar days, muted text, and price-change indicators.

## [1.0.0] - 2026-07-08

Initial public release for the Chrome Web Store and Firefox Add-ons.

### Added
- New-tab replacement with clock, tri-calendar (Jalali / Hijri / Gregorian), weather, prayer times and shortcuts widgets.
- Per-category random wallpaper rotation, including a Bing "daily wallpaper" category.
- Curated set of eye-friendly solid background colors alongside custom color and image uploads.

### Fixed
- Bing daily wallpapers not appearing in Settings — the extension now declares `host_permissions` for `bing.com` so the fetch isn't blocked by CORS.
- Prayer-time hover tooltip getting clipped/mispositioned inside the draggable widget grid — it now renders through a portal so it isn't confined by the widget's transformed container.
- Prayer-time hover tooltip briefly flashing at the wrong position before snapping into place — its placement offset now uses the CSS `translate` property instead of `transform`, so it no longer conflicts with the entrance animation.
