import type { Locale } from "./calendar";

export type Condition =
  | "clear"
  | "partly"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "thunder";

export interface WeatherData {
  temp: number;
  high: number;
  low: number;
  condition: Condition;
  label: string;
  message: string;
  isDay: boolean;
}

export interface City {
  name: string;
  admin1?: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  timezone: string;
  featureCode?: string;
  population?: number;
}

const LABELS: Record<Condition, { fa: string; en: string }> = {
  clear: { fa: "آفتابی", en: "Clear" },
  partly: { fa: "نیمه‌ابری", en: "Partly cloudy" },
  cloudy: { fa: "ابری", en: "Cloudy" },
  fog: { fa: "مه", en: "Foggy" },
  rain: { fa: "بارانی", en: "Rainy" },
  snow: { fa: "برفی", en: "Snowy" },
  thunder: { fa: "رعد و برق", en: "Thunderstorm" },
};

const MESSAGES: Record<Condition, { fa: string; en: string }> = {
  clear: { fa: "آسمون صافه، بیرون برو", en: "Clear skies, go outside" },
  partly: { fa: "هوا نیمه‌ابریه", en: "It's partly cloudy" },
  cloudy: { fa: "امروز آسمون ابریه", en: "The sky is cloudy today" },
  fog: { fa: "مه گرفته، حواست به رانندگی باشه", en: "It's foggy, drive carefully" },
  rain: { fa: "بارونه، چتر یادت نره", en: "It's raining, don't forget your umbrella" },
  snow: { fa: "برف میاد، گرم بپوش", en: "Snow's coming, dress warm" },
  thunder: { fa: "رعد و برقه، بهتره بمونی خونه", en: "There's a thunderstorm, better stay home" },
};

function describe(code: number, locale: Locale): { condition: Condition; label: string; message: string } {
  let condition: Condition;
  if (code === 0) condition = "clear";
  else if (code <= 2) condition = "partly";
  else if (code === 3) condition = "cloudy";
  else if (code <= 48) condition = "fog";
  else if (code <= 67) condition = "rain";
  else if (code <= 77) condition = "snow";
  else if (code <= 82) condition = "rain";
  else if (code <= 86) condition = "snow";
  else condition = "thunder";
  return { condition, label: LABELS[condition][locale], message: MESSAGES[condition][locale] };
}

export async function fetchWeather(lat: number, lng: number, locale: Locale): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,weather_code,is_day` +
    `&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather request failed");
  const j = await res.json();
  return {
    temp: Math.round(j.current.temperature_2m),
    high: Math.round(j.daily.temperature_2m_max[0]),
    low: Math.round(j.daily.temperature_2m_min[0]),
    isDay: j.current.is_day === 1,
    ...describe(j.current.weather_code, locale),
  };
}

export async function searchCities(
  query: string,
  locale: Locale,
  signal?: AbortSignal,
): Promise<City[]> {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}` +
    `&count=50&language=${locale}&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const j = await res.json();
  return (j.results ?? []).map(
    (x: {
      name: string;
      admin1?: string;
      country: string;
      country_code?: string;
      latitude: number;
      longitude: number;
      timezone: string;
      feature_code?: string;
      population?: number;
    }) => ({
      name: x.name,
      admin1: x.admin1,
      country: x.country,
      countryCode: (x.country_code ?? "").toUpperCase(),
      lat: x.latitude,
      lng: x.longitude,
      timezone: x.timezone,
      featureCode: x.feature_code,
      population: x.population,
    }),
  );
}
