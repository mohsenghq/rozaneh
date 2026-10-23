import {
  defaultSettings,
  settingsItem,
  type Background,
  type ClockFace,
  type GeoLocation,
  type Settings,
  type TempUnit,
  type ThemeMode,
  type WidgetAlign,
  type LayoutType,
  type WidgetPos,
} from "./settings";
import type { CalendarType, Locale } from "./calendar";
import type { OccasionFilters } from "./occasions";
import { maybeRotateBackground } from "./wallpaperRotation";
import { migrateSettings, migrateWidgetLayout } from "./migrations";

class AppStore {
  enabled = $state(defaultSettings.enabled);
  themeMode = $state<ThemeMode>(defaultSettings.themeMode);
  background = $state<Background>({ ...defaultSettings.background });
  clockFace = $state<ClockFace>(defaultSettings.clockFace);
  calendarType = $state<CalendarType>(defaultSettings.calendarType);
  occasions = $state<OccasionFilters>({ ...defaultSettings.occasions });
  location = $state<GeoLocation>({ ...defaultSettings.location });
  tempUnit = $state<TempUnit>(defaultSettings.tempUnit);
  widgetAlign = $state<WidgetAlign>(defaultSettings.widgetAlign);
  locale = $state<Locale>(defaultSettings.locale);
  showPrayerTimes = $state(defaultSettings.showPrayerTimes);
  layoutType = $state<LayoutType>(defaultSettings.layoutType);
  widgetLayout = $state<WidgetPos[]>(defaultSettings.widgetLayout.map((p) => ({ ...p })));
  autoShortcutsEnabled = $state(defaultSettings.autoShortcutsEnabled);
  welcomeOpen = $state(false);

  openWelcome() {
    this.welcomeOpen = true;
  }

  closeWelcome() {
    this.welcomeOpen = false;
  }

  #apply(s: Settings) {
    const migrated = migrateSettings(s);
    this.enabled = migrated.enabled;
    this.themeMode = migrated.themeMode;
    this.background = migrated.background;
    this.clockFace = migrated.clockFace;
    this.calendarType = migrated.calendarType;
    this.occasions = { ...migrated.occasions };
    this.location = { ...migrated.location };
    this.tempUnit = migrated.tempUnit;
    this.widgetAlign = migrated.widgetAlign;
    this.locale = migrated.locale;
    this.showPrayerTimes = migrated.showPrayerTimes;
    this.layoutType = migrated.layoutType;
    this.autoShortcutsEnabled = migrated.autoShortcutsEnabled;
    this.widgetLayout = sanitizeLayout(migrated.widgetLayout);
  }

  async init() {
    try {
      this.#apply(await settingsItem.getValue());
    } catch {}
    this.applyTheme();
    // Don't block first paint on a network round-trip to Bing.
    void this.#rotateBackground();
  }

  async #rotateBackground() {
    const rotated = await maybeRotateBackground(this.background);
    if (rotated !== this.background) {
      this.background = rotated;
      this.save();
    }
  }

  applyTheme() {
    const el = document.documentElement;
    el.dataset.theme = this.themeMode;
    el.lang = this.locale;
    el.dir = this.locale === "fa" ? "rtl" : "ltr";
  }

  getSettings(): Settings {
    return {
      schemaVersion: defaultSettings.schemaVersion,
      enabled: this.enabled,
      themeMode: this.themeMode,
      background: $state.snapshot(this.background),
      clockFace: this.clockFace,
      calendarType: this.calendarType,
      occasions: $state.snapshot(this.occasions),
      location: $state.snapshot(this.location),
      tempUnit: this.tempUnit,
      widgetAlign: this.widgetAlign,
      locale: this.locale,
      showPrayerTimes: this.showPrayerTimes,
      layoutType: this.layoutType,
      widgetLayout: $state.snapshot(this.widgetLayout),
      autoShortcutsEnabled: this.autoShortcutsEnabled,
    };
  }

  setThemeMode(mode: ThemeMode) {
    this.themeMode = mode;
    this.save();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.save();
  }

  setBackground(background: Background) {
    this.background = background;
    this.save();
  }

  setClockFace(clockFace: ClockFace) {
    this.clockFace = clockFace;
    this.save();
  }

  setCalendarType(calendarType: CalendarType) {
    this.calendarType = calendarType;
    this.save();
  }

  setOccasions(occasions: OccasionFilters) {
    this.occasions = occasions;
    this.save();
  }

  setLocation(location: GeoLocation) {
    this.location = location;
    this.save();
  }

  setTempUnit(tempUnit: TempUnit) {
    this.tempUnit = tempUnit;
    this.save();
  }

  setWidgetAlign(widgetAlign: WidgetAlign) {
    this.widgetAlign = widgetAlign;
    this.save();
  }

  setLocale(locale: Locale) {
    this.locale = locale;
    this.applyTheme();
    this.save();
  }

  setShowPrayerTimes(showPrayerTimes: boolean) {
    this.showPrayerTimes = showPrayerTimes;
    this.save();
  }

  setLayoutType(layoutType: LayoutType) {
    this.layoutType = layoutType;
    this.save();
  }

  setAutoShortcutsEnabled(autoShortcutsEnabled: boolean) {
    this.autoShortcutsEnabled = autoShortcutsEnabled;
    this.save();
  }

  applySettings(s: Partial<Settings>) {
    this.#apply({ ...this.getSettings(), ...s });
    this.applyTheme();
    this.save();
  }

  reset() {
    this.#apply(defaultSettings);
    this.applyTheme();
    this.save();
  }

  private save() {
    settingsItem.setValue(this.getSettings()).catch(() => {});
  }
}

function sanitizeLayout(layout: WidgetPos[] | undefined): WidgetPos[] {
  return migrateWidgetLayout(layout);
}

export const app = new AppStore();
