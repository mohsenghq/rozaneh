import { storage } from "wxt/utils/storage";

export type ShortcutSource = "user" | "auto";

export interface Shortcut {
  id: string;
  title: string;
  url: string;
  icon: string;
  source?: ShortcutSource;
}

export type ShortcutInput = Omit<Shortcut, "id" | "source">;

const LABEL_STOP_WORDS = new Set(["the", "my", "new", "go", "to", "app", "web"]);

function hostLabel(url: string): string {
  try {
    const parsed = new URL(/^[a-z]+:\/\//i.test(url) ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "").split(".")[0] ?? "";
  } catch {
    return "";
  }
}

/**
 * The label under a bookmark tile is intentionally one word. Long titles like
 * "Stack Overflow" or "Cloudflare Dashboard" would otherwise truncate into an
 * ellipsis and look inconsistent. A useful single brand word is preferred; if
 * the first word is a stopword, fall back to the hostname.
 */
export function shortLabel(title: string, url: string): string {
  const first = title
    .trim()
    .split(/\s+/)
    .find((word) => word && !LABEL_STOP_WORDS.has(word.toLowerCase()));
  return first || hostLabel(url) || title.trim();
}

export const defaultShortcuts: Shortcut[] = [
  { id: "seed-youtube", title: "YouTube", url: "https://youtube.com", icon: "", source: "user" },
  { id: "seed-gmail", title: "Gmail", url: "https://mail.google.com", icon: "", source: "user" },
  { id: "seed-chatgpt", title: "ChatGPT", url: "https://chatgpt.com", icon: "", source: "user" },
];

export const shortcutsItem = storage.defineItem<Shortcut[]>("local:shortcuts", {
  fallback: defaultShortcuts,
});

export const dismissedAutoSitesItem = storage.defineItem<string[]>("local:autoShortcutsDismissed", {
  fallback: [],
});
