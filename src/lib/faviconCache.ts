import { storage } from "wxt/utils/storage";
import { browserFaviconUrl, normalizeUrl } from "./search";

type CacheMap = Record<string, string>;

const cacheItem = storage.defineItem<CacheMap>("local:faviconCache", {
  fallback: {},
});

const MAX_ENTRIES = 200;
const memory = new Map<string, string>();
const defaultBySize = new Map<number, string>();

let loadPromise: Promise<void> | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;

function sizeBucket(px: number): number {
  return px >= 40 ? 128 : 64;
}

function cacheKey(url: string, px: number): string {
  try {
    return `${new URL(normalizeUrl(url)).hostname}|${sizeBucket(px)}`;
  } catch {
    return "";
  }
}

function ensureLoaded(): Promise<void> {
  if (!loadPromise) {
    loadPromise = cacheItem
      .getValue()
      .then((map) => {
        for (const [k, v] of Object.entries(map)) memory.set(k, v);
      })
      .catch(() => {});
  }
  return loadPromise;
}

/** Warm the in-memory map from storage (call once at startup). */
export function initFaviconCache(): Promise<void> {
  return ensureLoaded();
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  if (!res.ok) return "";
  const blob = await res.blob();
  if (blob.size < 50) return "";
  return blobToDataUrl(blob);
}

async function defaultIconDataUrl(px: number): Promise<string> {
  const size = sizeBucket(px);
  const cached = defaultBySize.get(size);
  if (cached) return cached;
  const src = browserFaviconUrl("https://invalid.invalid/", size);
  if (!src) return "";
  const dataUrl = await fetchDataUrl(src);
  if (dataUrl) defaultBySize.set(size, dataUrl);
  return dataUrl;
}

function schedulePersist() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    while (memory.size > MAX_ENTRIES) {
      const oldest = memory.keys().next().value;
      if (oldest === undefined) break;
      memory.delete(oldest);
    }
    const map: CacheMap = {};
    for (const [k, v] of memory) map[k] = v;
    cacheItem.setValue(map).catch(() => {});
  }, 300);
}

function put(key: string, dataUrl: string) {
  memory.delete(key);
  memory.set(key, dataUrl);
  schedulePersist();
}

/** Sync hit from in-memory map (after storage has been loaded once). */
export function getCachedFaviconSync(url: string, px: number): string {
  const key = cacheKey(url, px);
  if (!key) return "";
  return memory.get(key) ?? "";
}

/** Load from storage if needed, then return cached data URL. */
export async function getCachedFavicon(url: string, px: number): Promise<string> {
  const key = cacheKey(url, px);
  if (!key) return "";
  await ensureLoaded();
  return memory.get(key) ?? "";
}

/**
 * Fetch Chrome's extension-origin favicon, skip the default globe, and persist.
 * Uses only the existing `favicon` + `storage` permissions.
 */
export async function resolveAndCacheBrowserFavicon(url: string, px: number): Promise<string> {
  const key = cacheKey(url, px);
  if (!key) return "";
  await ensureLoaded();

  const existing = memory.get(key);
  if (existing) return existing;

  const size = sizeBucket(px);
  const src = browserFaviconUrl(url, size);
  if (!src) return "";

  try {
    const dataUrl = await fetchDataUrl(src);
    if (!dataUrl) return "";
    const fallback = await defaultIconDataUrl(px);
    if (fallback && dataUrl === fallback) return "";
    put(key, dataUrl);
    return dataUrl;
  } catch {
    return "";
  }
}
