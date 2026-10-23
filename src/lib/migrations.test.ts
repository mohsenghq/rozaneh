import { describe, expect, it } from "vitest";
import { migrateConfig, migrateSettings, migrateWidgetLayout } from "./migrations";
import { defaultSettings, defaultWidgetLayout } from "./settings";

describe("migrateSettings", () => {
  it("returns defaults for missing settings", () => {
    const settings = migrateSettings(undefined);
    expect(settings.schemaVersion).toBe(3);
    expect(settings.enabled).toBe(true);
    expect(settings.autoShortcutsEnabled).toBe(false);
    expect(settings.location.name).toBe(defaultSettings.location.name);
    expect(settings.location.admin1).toBe("استان تهران");
  });

  it("resets the old draggable layout when upgrading to the fixed dashboard", () => {
    const settings = migrateSettings({
      schemaVersion: 2,
      widgetLayout: [{ i: "weather", x: 0, y: 0 }],
    });
    expect(settings.schemaVersion).toBe(3);
    expect(settings.widgetLayout).toEqual(defaultWidgetLayout);
  });

  it("preserves valid fields and fills missing ones", () => {
    const settings = migrateSettings({
      themeMode: "dark",
      autoShortcutsEnabled: true,
      location: {
        name: "شیراز",
        countryCode: "IR",
        lat: 29.59,
        lng: 52.58,
        timezone: "Asia/Tehran",
      },
    });

    expect(settings.themeMode).toBe("dark");
    expect(settings.autoShortcutsEnabled).toBe(true);
    expect(settings.location.name).toBe("شیراز");
    expect(settings.location.admin1).toBe("استان تهران");
    expect(settings.clockFace).toBe(defaultSettings.clockFace);
    expect(settings.occasions).toEqual(defaultSettings.occasions);
  });

  it("drops unsafe background values and clamps effects", () => {
    const settings = migrateSettings({
      background: {
        type: "image",
        value: '");background:red;/*',
        dim: 4,
        blur: -3,
        randomCategory: null,
        randomDate: null,
      },
    });

    expect(settings.background.value).toBe("");
    expect(settings.background.dim).toBe(0.8);
    expect(settings.background.blur).toBe(0);
  });

  it("keeps valid image backgrounds", () => {
    const settings = migrateSettings({
      background: {
        type: "image",
        value: "data:image/png;base64,AAAA",
        dim: 0.2,
        blur: 4,
        randomCategory: null,
        randomDate: null,
      },
    });

    expect(settings.background.value).toBe("data:image/png;base64,AAAA");
  });
});

describe("migrateWidgetLayout", () => {
  it("maps the legacy search widget to shortcuts", () => {
    const layout = defaultWidgetLayout.map((p) => ({ ...p, i: p.i === "shortcuts" ? "search" : p.i }));
    const migrated = migrateWidgetLayout(layout);
    expect(migrated.find((p) => p.i === "shortcuts")).toBeTruthy();
    expect(migrated.some((p) => (p.i as string) === "search")).toBe(false);
  });

  it("restores missing widgets and clamps positions", () => {
    const migrated = migrateWidgetLayout([{ i: "calendar", x: -5, y: 99 }]);
    expect(migrated).toHaveLength(defaultWidgetLayout.length);
    const calendar = migrated.find((p) => p.i === "calendar");
    expect(calendar?.x).toBe(0);
    expect(calendar?.y).toBe(99);
  });

  it("drops unknown ids", () => {
    const migrated = migrateWidgetLayout([{ i: "nope", x: 1, y: 1 }]);
    expect(migrated.map((p) => p.i)).toEqual(defaultWidgetLayout.map((p) => p.i));
  });
});

describe("migrateConfig", () => {
  it("accepts a version 1 config", () => {
    const config = migrateConfig({
      app: "Rozaneh-tab",
      version: 1,
      settings: { themeMode: "light" },
      shortcuts: [
        { id: "a", title: "Example", url: "https://example.com", icon: "" },
        { id: "bad" },
      ],
    });

    expect(config).not.toBeNull();
    expect(config?.settings.themeMode).toBe("light");
    expect(config?.shortcuts).toHaveLength(1);
    expect(config?.shortcuts[0].title).toBe("Example");
  });

  it("rejects invalid input", () => {
    expect(migrateConfig(null)).toBeNull();
    expect(migrateConfig("nope")).toBeNull();
  });

  it("strips unsafe shortcut icons", () => {
    const config = migrateConfig({
      settings: {},
      shortcuts: [
        { id: "a", title: "A", url: "https://a.example", icon: "javascript:alert(1)" },
        {
          id: "b",
          title: "B",
          url: "https://b.example",
          icon: "data:image/png;base64,AAAA",
        },
      ],
    });

    expect(config?.shortcuts[0].icon).toBe("");
    expect(config?.shortcuts[1].icon).toBe("data:image/png;base64,AAAA");
  });
});
