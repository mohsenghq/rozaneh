import type { Shortcut } from "./shortcuts";

export interface TopSiteCandidate {
  url: string;
  title: string;
}

export function hostnameOf(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (!host) return "";
    return host;
  } catch {
    return "";
  }
}

function isHttpUrl(url: string): boolean {
  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function autoId(host: string): string {
  return `auto-${host.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

/**
 * Append the browser's most-visited sites to the shortcut list.
 *
 * Manual order is preserved, auto items are appended, duplicates are matched
 * by hostname, dismissed hosts never return, and the result never exceeds the
 * grid capacity.
 */
export function mergeAutoShortcuts(
  existing: Shortcut[],
  candidates: TopSiteCandidate[],
  dismissed: string[],
  capacity: number,
): Shortcut[] {
  const result = existing.map((item) => ({ ...item }));
  const known = new Set(result.map((item) => hostnameOf(item.url)).filter(Boolean));
  const blocked = new Set(dismissed.map((host) => host.toLowerCase().replace(/^www\./, "")));

  for (const candidate of candidates) {
    if (result.length >= capacity) break;
    if (!isHttpUrl(candidate.url)) continue;

    const host = hostnameOf(candidate.url);
    if (!host || known.has(host) || blocked.has(host)) continue;

    result.push({
      id: autoId(host),
      title: candidate.title.trim() || host,
      url: candidate.url,
      icon: "",
      source: "auto",
    });
    known.add(host);
  }

  return result;
}
