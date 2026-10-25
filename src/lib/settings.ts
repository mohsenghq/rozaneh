import { storage } from "wxt/utils/storage";
import type { CalendarType, Locale } from "./calendar";
import type { OccasionFilters } from "./occasions";

export type ThemeMode = "light" | "dark" | "auto";
export type BackgroundType = "color" | "image";
export type ClockFace = "digital" | "classic" | "modern";
export type TempUnit = "celsius" | "fahrenheit";
export type WidgetAlign = "top" | "center";
export type LayoutType = "balanced" | "minimal";
export type WidgetId = "shortcuts" | "clock" | "weather" | "calendar" | "occasions";

export interface WidgetPos {
  i: WidgetId;
  x: number;
  y: number;
}

// Grid geometry mirrors Rooza's desktop grid (11 cols, 69px rows, 20px gap).
export const GRID_COLS = 11;
export const GRID_ROW_H = 69;
export const GRID_GAP = 20;

export const widgetSizes: Record<WidgetId, { w: number; h: number }> = {
  shortcuts: { w: 11, h: 1 },
  clock: { w: 2, h: 2 },
  weather: { w: 4, h: 2 },
  calendar: { w: 5, h: 5 },
  occasions: { w: 6, h: 3 },
};

export const defaultWidgetLayout: WidgetPos[] = [
  { i: "shortcuts", x: 0, y: 0 },
  { i: "clock", x: 0, y: 2 },
  { i: "weather", x: 2, y: 2 },
  { i: "calendar", x: 6, y: 2 },
  { i: "occasions", x: 0, y: 4 },
];

export interface Background {
  type: BackgroundType;
  value: string;
  dim: number;
  blur: number;
  randomCategory: string | null;
  randomDate: string | null;
}

export interface GeoLocation {
  name: string;
  admin1?: string;
  countryCode: string;
  lat: number;
  lng: number;
  timezone: string;
}

export interface Settings {
  schemaVersion: number;
  enabled: boolean;
  themeMode: ThemeMode;
  background: Background;
  clockFace: ClockFace;
  calendarType: CalendarType;
  occasions: OccasionFilters;
  location: GeoLocation;
  tempUnit: TempUnit;
  widgetAlign: WidgetAlign;
  locale: Locale;
  showPrayerTimes: boolean;
  layoutType: LayoutType;
  widgetLayout: WidgetPos[];
  autoShortcutsEnabled: boolean;
}

export const defaultSettings: Settings = {
  schemaVersion: 3,
  enabled: true,
  themeMode: "auto",
  background: { type: "color", value: "", dim: 0, blur: 0, randomCategory: null, randomDate: null },
  clockFace: "modern",
  calendarType: "persian",
  occasions: { national: true, international: true, religious: true, cultural: true },
  location: {
    name: "تهران",
    admin1: "استان تهران",
    countryCode: "IR",
    lat: 35.6892,
    lng: 51.389,
    timezone: "Asia/Tehran",
  },
  tempUnit: "celsius",
  widgetAlign: "top",
  locale: "fa",
  showPrayerTimes: false,
  layoutType: "balanced",
  widgetLayout: [...defaultWidgetLayout],
  autoShortcutsEnabled: false,
};

export const settingsItem = storage.defineItem<Settings>("local:settings", {
  fallback: defaultSettings,
});
