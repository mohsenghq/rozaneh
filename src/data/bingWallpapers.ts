import type { Wallpaper, WallpaperCategory } from "./wallpapers";

const BING_API = "https://www.bing.com/HPImageArchive.aspx";
const BING_BASE = "https://www.bing.com";

interface BingImage {
  url: string;
  copyright: string;
  title: string;
}

interface BingResponse {
  images: BingImage[];
}

let cache: Wallpaper[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000;

export async function fetchBingWallpapers(count = 8): Promise<Wallpaper[]> {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) return cache;

  try {
    const url = `${BING_API}?format=js&idx=0&n=${count}&mkt=fa-IR`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Bing API ${res.status}`);
    const data: BingResponse = await res.json();

    cache = data.images.map((img) => ({
      thumb: `${BING_BASE}${img.url}&w=400&h=240`,
      full: `${BING_BASE}${img.url}&w=1920&h=1080`,
    }));
    cacheTime = now;
    return cache;
  } catch {
    return cache ?? [];
  }
}

export async function getBingCategory(): Promise<WallpaperCategory> {
  const items = await fetchBingWallpapers(16);
  return {
    key: "bing",
    fa: "تصاویر روزانه",
    en: "Daily wallpapers",
    items,
  };
}
