import { browser } from "wxt/browser";

export interface TopSite {
  url: string;
  title: string;
}

interface TopSitesApi {
  topSites?: {
    get(options?: unknown): Promise<Array<{ url: string; title?: string }>>;
  };
}

const PERMISSION = "topSites" as const;

export async function hasTopSitesPermission(): Promise<boolean> {
  try {
    return await browser.permissions.contains({ permissions: [PERMISSION] });
  } catch {
    return false;
  }
}

/**
 * Must be called from a user gesture (a click handler). Chrome rejects the
 * request silently or with an error otherwise.
 */
export async function requestTopSitesPermission(): Promise<boolean> {
  try {
    return await browser.permissions.request({ permissions: [PERMISSION] });
  } catch {
    return false;
  }
}

export async function removeTopSitesPermission(): Promise<void> {
  try {
    await browser.permissions.remove({ permissions: [PERMISSION] });
  } catch {
    // The permission may not have been granted; nothing to do.
  }
}

export async function getTopSites(): Promise<TopSite[]> {
  try {
    const api = browser as unknown as TopSitesApi;
    if (!api.topSites?.get) return [];
    const sites = await api.topSites.get();
    return sites
      .filter((site) => typeof site.url === "string" && site.url.length > 0)
      .map((site) => ({ url: site.url, title: site.title?.trim() ?? "" }));
  } catch {
    return [];
  }
}
