export function normalizeUrl(input: string): string {
  const s = input.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

/**
 * Icons come from user input, uploaded files and imported config. Only allow
 * image data URLs and http(s) URLs; everything else is treated as "no icon".
 */
export function isSafeIconUrl(value: string): boolean {
  return (
    /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i.test(value) ||
    /^https?:\/\//i.test(value)
  );
}

export function directFaviconUrl(url: string): string {
  try {
    return new URL("/favicon.ico", normalizeUrl(url)).href;
  } catch {
    return "";
  }
}

export function browserFaviconUrl(url: string, size = 64): string {
  const chromeRuntime = (globalThis as { chrome?: { runtime?: { getURL?: (path: string) => string } } }).chrome
    ?.runtime;
  if (!chromeRuntime?.getURL) return "";
  try {
    const pageUrl = normalizeUrl(url);
    const iconUrl = new URL(chromeRuntime.getURL("/_favicon/"));
    iconUrl.searchParams.set("pageUrl", pageUrl);
    iconUrl.searchParams.set("size", String(size));
    return iconUrl.href;
  } catch {
    return "";
  }
}
