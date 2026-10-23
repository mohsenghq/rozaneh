import { describe, expect, it } from "vitest";
import { cityLabel, cityMeta, normalizeCityResults } from "./city";
import type { City } from "./weather";

const city = (partial: Partial<City> & Pick<City, "name">): City => ({
  country: "ایران",
  countryCode: "IR",
  lat: 35,
  lng: 51,
  timezone: "Asia/Tehran",
  admin1: "استان تهران",
  ...partial,
});

const raw: City[] = [
  city({
    name: "تهران",
    admin1: "استان تهران",
    featureCode: "PPLC",
    population: 7153309,
    lat: 35.69439,
    lng: 51.42151,
  }),
  city({ name: "تهران", featureCode: "PPL", lat: 35.75, lng: 51.5148 }),
  city({ name: "تهران", featureCode: "PPLX", lat: 35.6373, lng: 51.3516 }),
  city({ name: "تهران‌سر", featureCode: "PPL", lat: 35.6974, lng: 51.2552 }),
  city({ name: "تهران‌پارس", featureCode: "PPLX", lat: 35.72634, lng: 51.5206 }),
  city({ name: "تهرانی", admin1: "فارس", featureCode: "PPLL", lat: 29.03, lng: 54.64 }),
  city({ name: "تهران کوه", admin1: "اصفهان", featureCode: "MT", lat: 33.2, lng: 52.37 }),
];

describe("normalizeCityResults", () => {
  it("returns exactly one Tehran for the full city name", () => {
    const results = normalizeCityResults(raw, "تهران", "fa");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("تهران");
    expect(results[0].featureCode).toBe("PPLC");
  });

  it("drops neighbourhoods, localities, and mountains", () => {
    const results = normalizeCityResults(raw, "تهر", "fa");
    expect(results.some((c) => c.featureCode === "PPLX")).toBe(false);
    expect(results.some((c) => c.featureCode === "PPLL")).toBe(false);
    expect(results.some((c) => c.featureCode === "MT")).toBe(false);
    expect(results.some((c) => c.name === "تهران")).toBe(true);
  });

  it("keeps same-name cities in different provinces", () => {
    const results = normalizeCityResults(
      [
        city({ name: "شهر", admin1: "استان الف", featureCode: "PPLA", population: 100 }),
        city({ name: "شهر", admin1: "استان ب", featureCode: "PPLA", population: 200 }),
      ],
      "شهر",
      "fa",
    );
    expect(results).toHaveLength(2);
  });

  it("shows province and country in labels", () => {
    const tehran = normalizeCityResults(raw, "تهران", "fa")[0];
    expect(cityMeta(tehran)).toContain("استان تهران");
    expect(cityLabel(tehran)).toContain("ایران");
  });
});
