import { describe, it, expect } from "vitest";
import { todayLocalDate } from "./wallpaperRotation";

describe("todayLocalDate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayLocalDate(new Date(2026, 6, 4))).toBe("2026-07-04");
  });

  it("zero-pads single-digit month and day", () => {
    expect(todayLocalDate(new Date(2026, 0, 9))).toBe("2026-01-09");
  });
});
