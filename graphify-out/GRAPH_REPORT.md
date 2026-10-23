# Graph Report - . (2026-07-28)

## Corpus Check

- 80 files · ~75,417 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 559 nodes · 881 edges · 34 communities (23 shown, 11 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.82)
- Token cost: 934,925 input · 0 output

## Community Hubs (Navigation)

- Occasions & Calendar Data
- Wallpaper & Settings Store
- Bookmarks & Search
- Build Tooling & Dependencies
- i18n & Prices
- Calendar Date Math
- Favicon Cache
- Bing Wallpapers
- Settings UI: Background Gallery
- Settings UI: Calendar & Events
- Bookmark Modal (Add Form)
- Settings UI: General/Clock Nav
- Settings UI: Theme & Color
- Config & Shortcuts
- Occasions Ticker UI
- Hero Overview Screenshot
- Bookmark Modal (Import/Add)
- Clock & Calendar Widgets Screenshot
- Settings UI: Clock Face Picker
- Settings UI: Weather
- Bookmarks API
- Calendar Selection Store
- Suggested Sites
- Mimo Plugin Dependency
- Claude Code Local Config
- pnpm Workspace Config
- Icon 128
- Icon 16
- Icon 32
- Icon 48
- Icon 96
- Weekday Name Helper
- VSCode Extensions Config

## God Nodes (most connected - your core abstractions)

1. `AppStore` - 24 edges
2. `./store.svelte` - 13 edges
3. `Locale` - 13 edges
4. `Suggested Sites Grid` - 13 edges
5. `./PrayerTimes.svelte` - 11 edges
6. `scripts` - 10 edges
7. `./Favicon.svelte` - 10 edges
8. `./ShortcutModal.svelte` - 10 edges
9. `partsOf()` - 10 edges
10. `Settings` - 10 edges

## Surprising Connections (you probably didn't know these)

- `prayerTimes()` --conceptually_related_to--> `localeNum()` [AMBIGUOUS]
  src/lib/prayer.ts → src/lib/calendar.ts
- `PricesStore` --semantically_similar_to--> `WeatherStore` [INFERRED] [semantically similar]
  src/lib/prices.svelte.ts → src/lib/weather.svelte.ts
- `Rozaneh Tab (this project)` --uses_as_design_reference--> `Settings Modal (تنظیمات)` [INFERRED]
  design/reference/04-settings1.png → design/reference/04-settings3.png
- `CachedPrices` --references--> `Locale` [EXTRACTED]
  src/lib/prices.svelte.ts → src/lib/calendar.ts
- `CachedWeather` --references--> `Locale` [EXTRACTED]
  src/lib/weather.svelte.ts → src/lib/calendar.ts

## Import Cycles

- 3-file cycle: `src/lib/BookmarkPicker.svelte -> src/lib/Shortcuts.svelte -> src/lib/ShortcutModal.svelte -> src/lib/BookmarkPicker.svelte`

## Hyperedges (group relationships)

- **New-tab extension entrypoint pipeline (WXT manifest -> HTML shell -> bootstrap -> root component)** — wxt_config, src_entrypoints_newtab_index, newtab_main, newtab_app [INFERRED 0.85]
- **Vitest test runner adoption for the project (plan -> config -> package script)** — docs_superpowers_plans_2026_07_04_random_wallpaper_rotation, vitest_config, package [EXTRACTED 0.95]
- **Wallpaper rotation feature design/plan/data triad** — docs_superpowers_specs_2026_07_04_random_wallpaper_rotation_design, docs_superpowers_plans_2026_07_04_random_wallpaper_rotation, data_wallpapers, docs_superpowers_plans_2026_07_04_random_wallpaper_rotation_wallpaper_rotation_mechanism [EXTRACTED 0.90]
- **Tri-calendar date and occasion display pattern** — src_lib_calendar_svelte_lib_calendar, lib_prayertimes, lib_occasionsstrip [INFERRED 0.75]
- **Widgets configured live from the Settings panel via shared app store** — src_lib_settings_svelte_lib_settings, lib_clock, src_lib_weather_svelte_lib_weather, src_lib_calendar_svelte_lib_calendar [INFERRED 0.75]
- **Svelte 5 rune-based persisted singleton stores** — lib_store_svelte_appstore, lib_shortcuts_svelte_shortcutsstore, lib_prices_svelte_pricesstore, lib_weather_svelte_weatherstore, lib_calendarselection_svelte_calendarselectionstore [INFERRED 0.85]
- **Multi-calendar (Jalali/Hijri/Gregorian) date resolution flow** — lib_calendar_partsof, lib_calendar_calparts, lib_occasions_occasionson [INFERRED 0.75]

## Communities (34 total, 11 thin omitted)

### Community 0 - "Occasions & Calendar Data"

Cohesion: 0.07
Nodes (35): CLAUDE.md (Rozaneh Tab / Rozaneh project brief), LunarOccasion, lunarOccasionsByYear, occasionsData, CalendarType, Locale, collides(), compact() (+27 more)

### Community 1 - "Wallpaper & Settings Store"

Cohesion: 0.07
Nodes (32): ../data/bingWallpapers, ../data/wallpapers, ./calendar, ./calendarSelection.svelte, ./config, ./grid, ./occasions, ./portal (+24 more)

### Community 2 - "Bookmarks & Search"

Cohesion: 0.06
Nodes (38): ./bookmarks, ./faviconCache, ./i18n, ./search, ./shortcuts, ./suggested, ./BookmarkPicker.svelte, ./Favicon.svelte (+30 more)

### Community 3 - "Build Tooling & Dependencies"

Cohesion: 0.06
Nodes (30): Plan: Categorized Random Wallpaper Rotation Implementation, dependencies, adhan, description, devDependencies, svelte, svelte-check, tailwindcss (+22 more)

### Community 4 - "i18n & Prices"

Cohesion: 0.09
Nodes (23): dict, MessageKey, t(), fetchOne(), fetchPrices(), PriceItem, CachedPrices, prices (+15 more)

### Community 5 - "Calendar Date Math"

Cohesion: 0.12
Nodes (28): addDays(), buildMonth(), calParts(), calYearMonth(), column(), DayCell, dayMonthYear(), formatFullDate() (+20 more)

### Community 6 - "Favicon Cache"

Cohesion: 0.15
Nodes (24): blobToDataUrl(), cacheItem, cacheKey(), CacheMap, defaultBySize, defaultIconDataUrl(), ensureLoaded(), fetchDataUrl() (+16 more)

### Community 7 - "Bing Wallpapers"

Cohesion: 0.11
Nodes (20): CHANGELOG.md (v1.0.0 release notes), BingImage, BingResponse, fetchBingWallpapers(), getBingCategory(), solidColors, Wallpaper, WallpaperCategory (+12 more)

### Community 8 - "Settings UI: Background Gallery"

Cohesion: 0.11
Nodes (25): Background Image Gallery Content Area, Blurred New-Tab Background Behind Modal, انتزاعی (Abstract) Category - 2 images, هنر (Art) Category - 10 images, ایران جان (Iran Jaan) Category - 23 images, طبیعت مینی‌مال (Minimal Nature) Category - 15 images, Close Button (X), عمومی (General) Nav Group (+17 more)

### Community 9 - "Settings UI: Calendar & Events"

Cohesion: 0.08
Nodes (24): Blurred Background Widgets (bookmarks, weather, clock), نوع تقویم (Calendar Type) Selector - 3 pill options, عمومی (General) Section Group, درباره روزا (About Rooza) Nav Item, تصویر زمینه (Background Image) Nav Item, تقویم و رویدادها (Calendar & Events) Nav Item (Active), تغییرات اخیر (Recent Changes) Nav Item, ساعت (Clock) Nav Item (+16 more)

### Community 10 - "Bookmark Modal (Add Form)"

Cohesion: 0.10
Nodes (23): Address (URL) Input Field, Blurred Background Dashboard (Bookmarks Row, Calendar, Reminder), Close (X) Button, Confirm and Add Bookmark Button, Bookmark Icon Preview Box, Import from Browser Button, Persian RTL UI Language, Add Bookmark Modal (+15 more)

### Community 11 - "Settings UI: General/Clock Nav"

Cohesion: 0.10
Nodes (22): About Rooza Nav Item (درباره روزا), Background Image Nav Item (تصویر زمینه), Calendar and Events Nav Item (تقویم و رویدادها), Calendar Type Selector (partially visible), Recent Changes Nav Item (تغییرات اخیر), City Selection (انتخاب شهر) with Auto-detect, Clock Nav Item (ساعت), Modal Close Button (+14 more)

### Community 12 - "Settings UI: Theme & Color"

Cohesion: 0.11
Nodes (22): About Rooza Nav Item (درباره روزا), Auto/System Theme Swatch (خودکار - وابسته به سیستم), Background Image Nav Item (تصویر زمینه), Calendar & Events Nav Item (تقویم و رویدادها), Centered Layout Option (در مرکز), Recent Changes Nav Item (تغییرات اخیر), Clock Nav Item (ساعت), Modal Close Button (X) (+14 more)

### Community 13 - "Config & Shortcuts"

Cohesion: 0.22
Nodes (9): Config, exportConfig(), importConfig(), defaultShortcuts, Shortcut, ShortcutInput, shortcutsItem, shortcuts (+1 more)

### Community 14 - "Occasions Ticker UI"

Cohesion: 0.15
Nodes (17): Tri-Calendar Date Bar (Jalali / Hijri / Gregorian), Dot Color Code (red = national/official, green = religious), Gold Price (10,560,400 Toman), Gregorian Date (April 2025), Section Header (rooydadha va gheymat-ha / Events and Prices), Hijri Date (9 Rajab 1454), Jalali Date (2 Ordibehesht 1404), Occasion: Birth of Imam Reza (green dot) (+9 more)

### Community 15 - "Hero Overview Screenshot"

Cohesion: 0.17
Nodes (15): Agenda / Occasions List Widget (holidays, events), Air Quality Widget (نیمه ابری), Analog Clock Widget, Background Photo (Tehran landmark, monochrome/duotone), Quick-Access Bookmark Icon Row, Browser Window Chrome (macOS style), Tri-Calendar Date Display (Gregorian/Jalali/Hijri text row), Glassmorphic Semi-Transparent Card Layout Style (+7 more)

### Community 16 - "Bookmark Modal (Import/Add)"

Cohesion: 0.21
Nodes (14): Add Bookmark Button (Plus Icon), Add Bookmark Manually Panel, Modal Close (X) Buttons, Confirm Import Button (تایید و اضافه کردن لیست), Favicon/Icon Upload Placeholder, Bookmark Feature Hero Heading (Persian, RTL), Import from Browser Panel, Bookmark Folder Tree (Bookmark bar, My List, Other Bookmark) (+6 more)

### Community 17 - "Clock & Calendar Widgets Screenshot"

Cohesion: 0.23
Nodes (12): Analog Clock Widget, Dark Page Background, Widgets & Tools Reference Screenshot, Jalali Calendar Widget (10 Ordibehesht 1403), Red Accent Color (clock hand, holidays/Friday dates), RTL Persian Layout Pattern, Section Heading: ویجت‌ها و ابزارهای کاربردی (Widgets and Useful Tools), Subheading: attention given to design for widgets (+4 more)

### Community 18 - "Settings UI: Clock Face Picker"

Cohesion: 0.22
Nodes (11): Classic (Analog) Clock Face Option, Clock Face Style Picker, Clock Nav Item (ساعت, active), Show Date on Clock Toggle, Digital Clock Face Option, General Settings Group (عمومی), Modern Clock Face Option (Selected), Rooza (Product) Settings Group (روزا) (+3 more)

### Community 19 - "Settings UI: Weather"

Cohesion: 0.32
Nodes (8): City Selection Field (with Auto-detect), General Settings Group (Sidebar), Rooza (Product) Settings Group (Sidebar), Settings Modal - Weather Section, Settings Sidebar Navigation, Tools Settings Group (Sidebar), Temperature Unit Toggle (Celsius/Fahrenheit), Weather Nav Item (Active)

### Community 20 - "Bookmarks API"

Cohesion: 0.33
Nodes (3): BookmarkNode, getBookmarkTree(), toNode()

### Community 21 - "Calendar Selection Store"

Cohesion: 0.53
Nodes (3): calendarSelection, CalendarSelectionStore, startOfDay()

## Ambiguous Edges - Review These

- `wallpapers.ts` → `Wallpaper Rotation Mechanism (concept: once-per-day auto rotate background per category)` [AMBIGUOUS]
  src/data/wallpapers.ts · relation: conceptually_related_to
- `localeNum()` → `prayerTimes()` [AMBIGUOUS]
  src/lib/prayer.ts · relation: conceptually_related_to

## Knowledge Gaps

- **191 isolated node(s):** `@mimo-ai/plugin`, `name`, `description`, `private`, `version` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `wallpapers.ts` and `Wallpaper Rotation Mechanism (concept: once-per-day auto rotate background per category)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `localeNum()` and `prayerTimes()`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `svelte` connect `Build Tooling & Dependencies` to `Bookmarks & Search`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `Locale` connect `Occasions & Calendar Data` to `i18n & Prices`, `Calendar Date Math`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `@mimo-ai/plugin`, `name`, `description` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Occasions & Calendar Data` be split into smaller, more focused modules?**
  _Cohesion score 0.06716417910447761 - nodes in this community are weakly interconnected._
- **Should `Wallpaper & Settings Store` be split into smaller, more focused modules?**
  _Cohesion score 0.06509803921568627 - nodes in this community are weakly interconnected._
