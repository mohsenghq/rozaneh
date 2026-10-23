import { describe, expect, it } from "vitest";
import { clockAngles } from "./clock";

describe("clockAngles", () => {
  it("returns zero angles at 12:00:00.000", () => {
    expect(clockAngles(new Date(2026, 0, 1, 12, 0, 0, 0))).toEqual({
      hour: 0,
      minute: 0,
      second: 0,
    });
  });

  it("includes fractional minutes in the hour hand", () => {
    const angles = clockAngles(new Date(2026, 0, 1, 3, 15, 30, 0));
    expect(angles.second).toBe(180);
    expect(angles.minute).toBe(93);
    expect(angles.hour).toBeCloseTo(97.75, 5);
  });

  it("handles the last second of the day", () => {
    const angles = clockAngles(new Date(2026, 0, 1, 23, 59, 59, 0));
    expect(angles.second).toBe(354);
    expect(angles.minute).toBeCloseTo(359.9, 5);
    expect(angles.hour).toBeCloseTo(359.9917, 3);
  });

  it("never returns negative angles", () => {
    const angles = clockAngles(new Date(2026, 0, 1, 0, 0, 0, 0));
    expect(angles.hour).toBeGreaterThanOrEqual(0);
    expect(angles.minute).toBeGreaterThanOrEqual(0);
    expect(angles.second).toBeGreaterThanOrEqual(0);
  });
});
