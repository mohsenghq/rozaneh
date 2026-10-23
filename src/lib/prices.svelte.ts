import { storage } from "wxt/utils/storage";
import { fetchPrices, type PriceItem } from "./prices";
import { app } from "./store.svelte";
import type { Locale } from "./calendar";

interface CachedPrices {
  items: PriceItem[];
  locale: Locale;
  at: number;
}

const pricesItem = storage.defineItem<CachedPrices | null>("local:prices", {
  fallback: null,
});

const TTL = 10 * 60 * 1000;

class PricesStore {
  items = $state<PriceItem[]>([]);
  loading = $state(false);
  updatedAt = $state<number | null>(null);

  async init() {
    try {
      const cached = await pricesItem.getValue();
      if (cached) {
        this.items = cached.items;
        this.updatedAt = cached.at;
      }
    } catch {}
  }

  async refresh(force = false) {
    const locale = app.locale;
    try {
      const cached = await pricesItem.getValue();
      if (!force && cached && cached.locale === locale && Date.now() - cached.at < TTL) {
        this.items = cached.items;
        this.updatedAt = cached.at;
        return;
      }
    } catch {}
    this.loading = true;
    try {
      const items = await fetchPrices(locale);
      this.items = items;
      this.updatedAt = Date.now();
      pricesItem.setValue({ items, locale, at: Date.now() }).catch(() => {});
    } catch {
    } finally {
      this.loading = false;
    }
  }
}

export const prices = new PricesStore();
