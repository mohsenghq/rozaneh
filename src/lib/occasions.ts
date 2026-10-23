import { calParts, type CalendarType, type Locale } from "./calendar";
import { occasionsData } from "../data/occasions";
import { lunarOccasionsByYear } from "../data/occasions-lunar";

export type OccasionCategory = "national" | "international" | "religious" | "cultural";

export type OccasionFilters = Record<OccasionCategory, boolean>;

export interface Occasion {
  calendar: CalendarType;
  month: number;
  day: number;
  title: string;
  titleEn?: string;
  category: OccasionCategory;
  holiday: boolean;
}

const categoryMeta: Record<OccasionCategory, { fa: string; en: string; color: string }> = {
  national: { fa: "ملی", en: "National", color: "#e11d48" },
  religious: { fa: "مذهبی", en: "Religious", color: "#16a34a" },
  international: { fa: "بین‌المللی", en: "International", color: "#f59e0b" },
  cultural: { fa: "فرهنگی", en: "Cultural", color: "#8b5cf6" },
};

export function categoryColor(category: OccasionCategory): string {
  return categoryMeta[category].color;
}

export function categoryLabel(category: OccasionCategory, locale: Locale): string {
  return categoryMeta[category][locale];
}

export function occasionTitle(occasion: Occasion, locale: Locale): string {
  return locale === "fa" ? occasion.title : (occasion.titleEn ?? occasion.title);
}

const CALENDARS: CalendarType[] = ["persian", "islamic-umalqura", "gregory"];

const index = new Map<string, Occasion[]>();
for (const o of occasionsData) {
  const key = `${o.calendar}|${o.month}|${o.day}`;
  const bucket = index.get(key);
  if (bucket) bucket.push(o);
  else index.set(key, [o]);
}

export function occasionsOn(date: Date, filters: OccasionFilters): Occasion[] {
  const out: Occasion[] = [];
  const persian = calParts(date, "persian");
  // Official Hijri-based holidays, pre-resolved to the exact Jalali date for this
  // year — more accurate for Iran than the islamic-umalqura arithmetic calendar.
  const lunarYear = lunarOccasionsByYear[persian.year];
  if (lunarYear && filters.religious) {
    for (const o of lunarYear) {
      if (o.month === persian.month && o.day === persian.day) {
        out.push({
          calendar: "persian",
          month: o.month,
          day: o.day,
          title: o.title,
          titleEn: o.titleEn,
          category: "religious",
          holiday: true,
        });
      }
    }
  }
  for (const cal of CALENDARS) {
    const { month, day } = calParts(date, cal);
    const hits = index.get(`${cal}|${month}|${day}`);
    if (hits) {
      for (const o of hits) {
        // The resolved lunar table supersedes the umalqura holiday fallbacks for covered years.
        if (lunarYear && cal === "islamic-umalqura" && o.holiday) continue;
        if (filters[o.category]) out.push(o);
      }
    }
  }
  return out;
}
