import type { Shortcut } from "./shortcuts";
import { isSafeIconUrl } from "./search";
import {
  defaultSettings,
  defaultWidgetLayout,
  GRID_COLS,
  widgetSizes,
  type Background,
  type Settings,
  type WidgetId,
  type WidgetPos,
} from "./settings";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWidgetId(value: string): value is WidgetId {
  return value in widgetSizes;
}

/**
 * Migrate a persisted widget layout to the current widget ids and grid bounds.
 * Old versions used `search`; it is now `shortcuts`.
 */
export function migrateWidgetLayout(layout: unknown): WidgetPos[] {
  const saved = new Map<WidgetId, { x: number; y: number }>();

  if (Array.isArray(layout)) {
    for (const entry of layout) {
      if (!isRecord(entry) || typeof entry.i !== "string") continue;
      const id = entry.i === "search" ? "shortcuts" : entry.i;
      if (!isWidgetId(id)) continue;
      if (!Number.isFinite(entry.x) || !Number.isFinite(entry.y)) continue;
      saved.set(id, { x: entry.x as number, y: entry.y as number });
    }
  }

  return defaultWidgetLayout.map((fallback) => {
    const position = saved.get(fallback.i) ?? fallback;
    return {
      i: fallback.i,
      x: Math.max(0, Math.min(GRID_COLS - widgetSizes[fallback.i].w, Math.round(position.x))),
      y: Math.max(0, Math.round(position.y)),
    };
  });
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

/**
 * Imported or stored backgrounds are untrusted strings. Colors must be hex
 * (the app only offers curated hex swatches); images must be image data URLs,
 * https URLs, or bundled root-relative assets. Anything else is dropped so a
 * crafted config cannot inject arbitrary CSS.
 */
function sanitizeBackground(raw: unknown): Background {
  const source = isRecord(raw) ? raw : {};
  const type: Background["type"] = source.type === "image" ? "image" : "color";
  const rawValue = typeof source.value === "string" ? source.value : "";
  const valid =
    rawValue === "" ||
    (type === "image"
      ? /^(data:image\/|https:\/\/|\/)/i.test(rawValue)
      : /^#[0-9a-f]{3,8}$/i.test(rawValue));

  return {
    type,
    value: valid ? rawValue : "",
    dim: clampNumber(source.dim, 0, 0.8, defaultSettings.background.dim),
    blur: clampNumber(source.blur, 0, 20, defaultSettings.background.blur),
    randomCategory: typeof source.randomCategory === "string" ? source.randomCategory : null,
    randomDate: typeof source.randomDate === "string" ? source.randomDate : null,
  };
}

export function migrateSettings(raw: Partial<Settings> | undefined): Settings {
  const source = isRecord(raw) ? raw : {};
  const sourceVersion =
    typeof source.schemaVersion === "number" && Number.isFinite(source.schemaVersion)
      ? source.schemaVersion
      : 1;
  const merged = {
    ...defaultSettings,
    ...source,
    schemaVersion: defaultSettings.schemaVersion,
    autoShortcutsEnabled:
      typeof source.autoShortcutsEnabled === "boolean"
        ? source.autoShortcutsEnabled
        : defaultSettings.autoShortcutsEnabled,
    background: sanitizeBackground(source.background),
    occasions: {
      ...defaultSettings.occasions,
      ...(isRecord(source.occasions) ? source.occasions : {}),
    },
    location: {
      ...defaultSettings.location,
      ...(isRecord(source.location) ? source.location : {}),
    },
    widgetLayout:
      sourceVersion >= 3 && Array.isArray(source.widgetLayout)
        ? migrateWidgetLayout(source.widgetLayout)
        : defaultWidgetLayout.map((position) => ({ ...position })),
  } as Settings;

  return merged;
}

function isShortcut(value: unknown): value is Shortcut {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.url === "string" &&
    typeof value.icon === "string"
  );
}

export function migrateConfig(raw: unknown): {
  settings: Partial<Settings>;
  shortcuts: Shortcut[];
} | null {
  if (!isRecord(raw)) return null;
  const settings = isRecord(raw.settings) ? (raw.settings as Partial<Settings>) : {};
  const shortcuts = Array.isArray(raw.shortcuts)
    ? raw.shortcuts.filter(isShortcut).map((shortcut) => ({
        ...shortcut,
        icon: isSafeIconUrl(shortcut.icon) ? shortcut.icon : "",
      }))
    : [];

  return { settings, shortcuts };
}
