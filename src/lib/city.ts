import type { Locale } from "./calendar";
import type { City } from "./weather";

export const CITY_FEATURE_CODES = new Set([
  "PPLC",
  "PPLA",
  "PPLA2",
  "PPLA3",
  "PPLA4",
  "PPL",
]);

const FEATURE_RANK: Record<string, number> = {
  PPLC: 0,
  PPLA: 1,
  PPLA2: 2,
  PPLA3: 3,
  PPLA4: 4,
  PPL: 5,
};

function fold(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ");
}

function rank(city: City): number {
  return FEATURE_RANK[city.featureCode ?? ""] ?? 9;
}

function isCity(city: City): boolean {
  return !city.featureCode || CITY_FEATURE_CODES.has(city.featureCode);
}

/**
 * Turn the raw GeoNames geocoding response into a short list of real cities.
 *
 * Open-Meteo returns neighbourhoods (PPLX), localities (PPLL), mountains (MT)
 * and duplicate records for the same city. This function removes those, keeps
 * exact matches when the query is a complete city name, deduplicates by
 * name + province, and ranks the result.
 */
export function normalizeCityResults(raw: City[], query: string, locale: Locale): City[] {
  const needle = fold(query);
  if (!needle) return [];

  const cities = raw.filter(isCity);
  const exact = cities.filter((city) => fold(city.name) === needle);
  const candidates = exact.length > 0 ? exact : cities;

  const byKey = new Map<string, City>();
  for (const city of candidates) {
    const key = `${fold(city.name)}|${fold(city.admin1 ?? "")}|${city.countryCode}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, city);
      continue;
    }
    const better =
      rank(city) < rank(existing) ||
      (rank(city) === rank(existing) && (city.population ?? 0) > (existing.population ?? 0));
    if (better) byKey.set(key, city);
  }

  return [...byKey.values()]
    .sort((a, b) => {
      const aExact = fold(a.name) === needle ? 0 : 1;
      const bExact = fold(b.name) === needle ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      if (locale === "fa") {
        const aIran = a.countryCode === "IR" ? 0 : 1;
        const bIran = b.countryCode === "IR" ? 0 : 1;
        if (aIran !== bIran) return aIran - bIran;
      }
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      if ((b.population ?? 0) !== (a.population ?? 0)) {
        return (b.population ?? 0) - (a.population ?? 0);
      }
      return a.name.localeCompare(b.name, locale);
    })
    .slice(0, 12);
}

/** Secondary line for a picker row: province + country. */
export function cityMeta(city: City): string {
  return [city.admin1, city.country].filter(Boolean).join(" · ");
}

/** Full human-readable label, useful for tooltips and tests. */
export function cityLabel(city: City): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(" · ");
}
