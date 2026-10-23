import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import type { Locale } from "./calendar";

export interface PrayerEntry {
  key: string;
  label: string;
  time: Date;
}

const LABELS: Record<string, { fa: string; en: string }> = {
  fajr: { fa: "اذان صبح", en: "Fajr" },
  sunrise: { fa: "طلوع آفتاب", en: "Sunrise" },
  dhuhr: { fa: "اذان ظهر", en: "Dhuhr" },
  asr: { fa: "اذان عصر", en: "Asr" },
  maghrib: { fa: "اذان مغرب", en: "Maghrib" },
  isha: { fa: "اذان عشا", en: "Isha" },
};

export function prayerTimes(lat: number, lng: number, locale: Locale, date = new Date()) {
  const pt = new PrayerTimes(new Coordinates(lat, lng), date, CalculationMethod.Tehran());
  const entries: PrayerEntry[] = [
    { key: "fajr", label: LABELS.fajr[locale], time: pt.fajr },
    { key: "sunrise", label: LABELS.sunrise[locale], time: pt.sunrise },
    { key: "dhuhr", label: LABELS.dhuhr[locale], time: pt.dhuhr },
    { key: "asr", label: LABELS.asr[locale], time: pt.asr },
    { key: "maghrib", label: LABELS.maghrib[locale], time: pt.maghrib },
    { key: "isha", label: LABELS.isha[locale], time: pt.isha },
  ];
  return { entries, next: pt.nextPrayer() as string };
}
