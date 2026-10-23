import type { Background } from "./settings";
import { fetchBingWallpapers } from "../data/bingWallpapers";

export function todayLocalDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

let cachedItems: { full: string }[] | null = null;

async function getItems(): Promise<{ full: string }[]> {
  if (cachedItems && cachedItems.length > 0) return cachedItems;
  const items = await fetchBingWallpapers(16);
  if (items.length > 0) cachedItems = items;
  return cachedItems ?? [];
}

export async function pickRandomWallpaper(excludeUrl?: string): Promise<string | null> {
  const items = await getItems();
  if (items.length === 0) return null;

  const pool =
    excludeUrl && items.length > 1
      ? items.filter((w) => w.full !== excludeUrl)
      : items;

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return chosen.full;
}

export async function maybeRotateBackground(background: Background, now: Date = new Date()): Promise<Background> {
  if (!background.randomCategory) return background;

  const today = todayLocalDate(now);
  if (background.randomDate === today) return background;

  const next = await pickRandomWallpaper(background.value);
  if (!next) return background;

  return { ...background, type: "image", value: next, randomDate: today };
}
