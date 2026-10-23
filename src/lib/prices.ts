import { localeNum, type Locale } from "./calendar";

export interface PriceItem {
  key: string;
  label: string;
  prefix: string;
  value: number;
  changePct: number;
  up: boolean;
}

const SYMBOLS: { key: string; prefix: string; fa: string; en: string }[] = [
  { key: "price_dollar_rl", prefix: "$", fa: "دلار", en: "Dollar" },
  { key: "geram18", prefix: "", fa: "طلای ۱۸ عیار", en: "18k Gold" },
];

export function formatToman(n: number, locale: Locale): string {
  return localeNum(n.toLocaleString("en-US"), locale);
}

async function fetchOne(symbol: string): Promise<{ rial: number; changePct: number; up: boolean }> {
  const res = await fetch(
    `https://api.tgju.org/v1/market/indicator/summary-table-data/${symbol}?length=1&start=0`,
  );
  if (!res.ok) throw new Error("price request failed");
  const j = await res.json();
  const row = j.data?.[0];
  if (!row) throw new Error("no price data");
  const rial = Number(String(row[3]).replace(/[^\d]/g, ""));
  const pctCell = String(row[5]);
  const up = /"high"/.test(pctCell);
  const match = pctCell.replace(/<[^>]*>/g, "").match(/([\d.]+)/);
  return { rial, changePct: match ? Number(match[1]) : 0, up };
}

export async function fetchPrices(locale: Locale): Promise<PriceItem[]> {
  return Promise.all(
    SYMBOLS.map(async (s) => {
      const { rial, changePct, up } = await fetchOne(s.key);
      return {
        key: s.key,
        label: s[locale],
        prefix: s.prefix,
        value: Math.round(rial / 10),
        changePct,
        up,
      };
    }),
  );
}
