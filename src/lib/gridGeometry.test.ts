import { describe, expect, it } from "vitest";
import {
  MIN_STAGE_SCALE,
  REF_GAP,
  REF_GRID_W,
  REF_ROW_H,
  SHORTCUT_ROW_EXTRA,
  refHeight,
  rowExtra,
  stageScale,
} from "./gridGeometry";

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

  it("pushes rows below the shortcut bar down by the card's extra height", () => {
    expect(SHORTCUT_ROW_EXTRA).toBeGreaterThan(0);
    expect(rowExtra(0)).toBe(0);
    expect(rowExtra(1)).toBe(SHORTCUT_ROW_EXTRA);
    expect(refHeight(2)).toBe(REF_ROW_H * 2 + REF_GAP + SHORTCUT_ROW_EXTRA);
    expect(refHeight(1)).toBe(REF_ROW_H);
  });
});
