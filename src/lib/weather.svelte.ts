import { storage } from "wxt/utils/storage";
import { fetchWeather, type WeatherData } from "./weather";
import { app } from "./store.svelte";
import type { Locale } from "./calendar";

interface CachedWeather {
  lat: number;
  lng: number;
  locale: Locale;
  data: WeatherData;
  at: number;
}

const weatherItem = storage.defineItem<CachedWeather | null>("local:weather", {
  fallback: null,
});

const TTL = 30 * 60 * 1000;

class WeatherStore {
  data = $state<WeatherData | null>(null);
  loading = $state(false);

  async init() {
    try {
      const cached = await weatherItem.getValue();
      if (cached) this.data = cached.data;
    } catch {}
  }

  async refresh() {
    const { lat, lng } = app.location;
    const locale = app.locale;
    try {
      const cached = await weatherItem.getValue();
      if (
        cached &&
        cached.lat === lat &&
        cached.lng === lng &&
        cached.locale === locale &&
        Date.now() - cached.at < TTL
      ) {
        this.data = cached.data;
        return;
      }
    } catch {}
    this.loading = true;
    try {
      const data = await fetchWeather(lat, lng, locale);
      this.data = data;
      weatherItem.setValue({ lat, lng, locale, data, at: Date.now() }).catch(() => {});
    } catch {
    } finally {
      this.loading = false;
    }
  }
}

export const weather = new WeatherStore();
