import { describe, expect, it } from "vitest";
import { MIN_STAGE_SCALE, REF_GRID_W, refHeight, stageScale } from "./gridGeometry";

describe("stageScale", () => {
  it("does not upscale when the reference size fits", () => {
    expect(stageScale({ width: 2000, height: 2000, rows: 7 })).toBe(1);
  });

  it("scales the whole stage down when the window is narrower", () => {
    expect(stageScale({ width: 800, height: 2000, rows: 7 })).toBeCloseTo(800 / REF_GRID_W, 5);
  });

  it("scales down when the height is short", () => {
    const height = refHeight(7) / 2;
    expect(stageScale({ width: 2000, height, rows: 7 })).toBeCloseTo(0.5, 5);
  });

  it("never goes below the minimum", () => {
    expect(stageScale({ width: 100, height: 100, rows: 7 })).toBe(MIN_STAGE_SCALE);
  });
});
