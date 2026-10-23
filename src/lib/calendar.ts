export type CalendarType = "persian" | "islamic-umalqura" | "gregory";
export type Locale = "fa" | "en";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function localeNum(value: number | string, locale: Locale): string {
  if (locale !== "fa") return String(value);
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

export interface DayCell {
  day: number;
  date: Date;
  inMonth: boolean;
  today: boolean;
  friday: boolean;
}

export interface MonthView {
  weekdays: string[];
  cells: DayCell[];
}

const WEEKDAYS: Record<Locale, string[]> = {
  fa: ["شنبه", "۱شنبه", "۲شنبه", "۳شنبه", "۴شنبه", "۵شنبه", "جمعه"],
  en: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function column(date: Date): number {
  return (date.getDay() + 1) % 7;
}

const partsFmtCache = new Map<CalendarType, Intl.DateTimeFormat>();

function partsFmt(cal: CalendarType): Intl.DateTimeFormat {
  let fmt = partsFmtCache.get(cal);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US-u-ca-" + cal, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    partsFmtCache.set(cal, fmt);
  }
  return fmt;
}

function partsOf(date: Date, cal: CalendarType) {
  const p = partsFmt(cal).formatToParts(date);
  const num = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { year: num("year"), month: num("month"), day: num("day") };
}

export function calParts(date: Date, cal: CalendarType) {
  return partsOf(date, cal);
}

function monthFirst(date: Date, cal: CalendarType): Date {
  return addDays(startOfDay(date), -(partsOf(date, cal).day - 1));
}

export function calYearMonth(date: Date, cal: CalendarType) {
  const p = partsOf(date, cal);
  return { year: p.year, month: p.month };
}

export function shiftMonth(anchor: Date, cal: CalendarType, delta: number): Date {
  let first = monthFirst(anchor, cal);
  for (let i = 0; i < Math.abs(delta); i++) {
    if (delta > 0) {
      const m = partsOf(first, cal).month;
      let d = first;
      while (partsOf(d, cal).month === m) d = addDays(d, 1);
      first = d;
    } else {
      first = monthFirst(addDays(first, -1), cal);
    }
  }
  return first;
}

export function buildMonth(anchor: Date, cal: CalendarType, locale: Locale): MonthView {
  const today = startOfDay(new Date());
  const a = partsOf(anchor, cal);
  const first = monthFirst(anchor, cal);

  let length = 0;
  let cursor = first;
  while (partsOf(cursor, cal).month === a.month) {
    length++;
    cursor = addDays(cursor, 1);
  }

  const lead = column(first);
  const gridStart = addDays(first, -lead);
  const rows = Math.ceil((lead + length) / 7);
  const cells: DayCell[] = [];
  for (let i = 0; i < rows * 7; i++) {
    const date = addDays(gridStart, i);
    const p = partsOf(date, cal);
    cells.push({
      day: p.day,
      date,
      inMonth: p.month === a.month && p.year === a.year,
      today: date.getTime() === today.getTime(),
      friday: date.getDay() === 5,
    });
  }

  return { weekdays: WEEKDAYS[locale], cells };
}

const nameCache = new Map<string, string[]>();

function intlLocale(locale: Locale): string {
  return locale === "fa" ? "fa-IR" : "en-US";
}

export function monthNames(cal: CalendarType, locale: Locale): string[] {
  const cacheKey = `${cal}:${locale}`;
  const cached = nameCache.get(cacheKey);
  if (cached) return cached;
  const fmt = new Intl.DateTimeFormat(intlLocale(locale) + "-u-ca-" + cal, { month: "long" });
  let d = shiftMonth(new Date(), cal, -(partsOf(new Date(), cal).month - 1));
  const names: string[] = [];
  for (let i = 0; i < 12; i++) {
    names.push(fmt.format(d));
    d = shiftMonth(d, cal, 1);
  }
  nameCache.set(cacheKey, names);
  return names;
}

export function monthYearLabel(date: Date, cal: CalendarType, locale: Locale): string {
  const month = new Intl.DateTimeFormat(intlLocale(locale) + "-u-ca-" + cal, { month: "long" }).format(date);
  return `${month} ${localeNum(partsOf(date, cal).year, locale)}`;
}

export function formatFullDate(date: Date, cal: CalendarType, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale) + "-u-ca-" + cal, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function dayMonthYear(date: Date, cal: CalendarType, locale: Locale): string {
  const p = partsOf(date, cal);
  const month = new Intl.DateTimeFormat(intlLocale(locale) + "-u-ca-" + cal, { month: "long" }).format(date);
  return `${localeNum(p.day, locale)} ${month} ${localeNum(p.year, locale)}`;
}

export function weekdayName(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: "long" }).format(date);
}

export function gregorianFullDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
