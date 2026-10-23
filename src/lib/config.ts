import { app } from "./store.svelte";
import { shortcuts } from "./shortcuts.svelte.js";
import type { Shortcut } from "./shortcuts";
import type { Settings } from "./settings";
import { migrateConfig, migrateSettings } from "./migrations";

interface Config {
  app: "Rozaneh-tab";
  version: 2;
  settings: Settings;
  shortcuts: Shortcut[];
}

export function exportConfig() {
  const config: Config = {
    app: "Rozaneh-tab",
    version: 2,
    settings: app.getSettings(),
    shortcuts: shortcuts.items.map((s) => ({ ...s })),
  };
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Rozaneh-tab-config.json";
  a.click();
  URL.revokeObjectURL(url);
}

export async function importConfig(file: File): Promise<boolean> {
  try {
    const config = migrateConfig(JSON.parse(await file.text()));
    if (!config) return false;
    const settings = migrateSettings(config.settings);
    if (config.settings && Object.keys(config.settings).length > 0) {
      app.applySettings(settings);
    }
    if (config.shortcuts.length > 0) shortcuts.replaceAll(config.shortcuts);
    return true;
  } catch {
    return false;
  }
}
