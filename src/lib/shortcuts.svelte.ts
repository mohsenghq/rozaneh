import {
  defaultShortcuts,
  dismissedAutoSitesItem,
  shortcutsItem,
  type Shortcut,
  type ShortcutInput,
} from "./shortcuts";
import { hostnameOf, mergeAutoShortcuts } from "./autoShortcuts";
import { getTopSites, hasTopSitesPermission } from "./topSites";
import { app } from "./store.svelte";

class ShortcutsStore {
  items = $state<Shortcut[]>([]);
  dismissed = $state<string[]>([]);
  syncing = $state(false);

  async init() {
    try {
      const [stored, dismissed] = await Promise.all([
        shortcutsItem.getValue(),
        dismissedAutoSitesItem.getValue(),
      ]);
      this.items = stored.map((s) => ({ ...s, source: s.source ?? "user" }));
      this.dismissed = dismissed.map((host) => host.toLowerCase().replace(/^www\./, ""));
    } catch {
      this.items = defaultShortcuts.map((s) => ({ ...s, source: "user" }));
    }
  }

  add(data: ShortcutInput) {
    this.undismiss(data.url);
    this.items = [...this.items, { ...data, id: crypto.randomUUID(), source: "user" }];
    this.save();
  }

  update(id: string, data: ShortcutInput) {
    this.undismiss(data.url);
    this.items = this.items.map((s) => (s.id === id ? { ...s, ...data, source: "user" } : s));
    this.save();
  }

  remove(id: string) {
    const item = this.items.find((s) => s.id === id);
    if (item) this.dismiss(item.url);
    this.items = this.items.filter((s) => s.id !== id);
    this.save();
  }

  replaceAll(items: Shortcut[]) {
    this.items = items.map((s) => ({ ...s, source: s.source ?? "user" }));
    this.save();
  }

  /** Move `id` to the position currently occupied by `targetId` (id-based, stable). */
  move(id: string, targetId: string) {
    if (id === targetId) return;
    const from = this.items.findIndex((s) => s.id === id);
    const to = this.items.findIndex((s) => s.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...this.items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    this.items = next;
    this.save();
  }

  /**
   * Append the browser's most-visited sites, once per new-tab mount. This is a
   * no-op unless the user opted in and granted the optional permission.
   */
  async syncAuto(capacity: number) {
    if (!app.autoShortcutsEnabled || this.syncing || capacity <= 0) return;
    this.syncing = true;
    try {
      if (!(await hasTopSitesPermission())) return;
      const sites = await getTopSites();
      const merged = mergeAutoShortcuts(this.items, sites, this.dismissed, capacity);
      if (merged.length !== this.items.length) {
        this.items = merged;
        this.save();
      }
    } finally {
      this.syncing = false;
    }
  }

  resetDismissed() {
    this.dismissed = [];
    dismissedAutoSitesItem.setValue([]).catch(() => {});
  }

  private dismiss(url: string) {
    const host = hostnameOf(url);
    if (!host || this.dismissed.includes(host)) return;
    this.dismissed = [...this.dismissed, host];
    dismissedAutoSitesItem.setValue($state.snapshot(this.dismissed)).catch(() => {});
  }

  private undismiss(url: string) {
    const host = hostnameOf(url);
    if (!host || !this.dismissed.includes(host)) return;
    this.dismissed = this.dismissed.filter((item) => item !== host);
    dismissedAutoSitesItem.setValue($state.snapshot(this.dismissed)).catch(() => {});
  }

  private save() {
    shortcutsItem.setValue($state.snapshot(this.items)).catch(() => {});
  }
}

export const shortcuts = new ShortcutsStore();
