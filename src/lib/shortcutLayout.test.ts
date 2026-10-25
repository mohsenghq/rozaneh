import { describe, expect, it } from "vitest";
import {
  SHORTCUT_CAPACITY,
  SHORTCUT_CARD_H,
  SHORTCUT_COLS,
  SHORTCUT_TILE,
  desktopLayout,
  flowLayout,
  gridHeight,
} from "./shortcutLayout";

describe("shortcut layout", () => {
  it("keeps exactly 12 columns on desktop and fills the width", () => {
    const layout = desktopLayout(944);
    expect(layout.cols).toBe(SHORTCUT_COLS);
    expect(SHORTCUT_TILE * SHORTCUT_COLS + layout.gap * (SHORTCUT_COLS - 1)).toBeCloseTo(944, 5);
  });

  it("shows a single row and a capacity of 12 on desktop", () => {
    expect(SHORTCUT_CAPACITY).toBe(12);
    expect(gridHeight(1)).toBe(70);
    expect(SHORTCUT_CARD_H).toBe(gridHeight(1) + 16);
  });

  it("fits fewer columns on narrow widths without shrinking tiles", () => {
    const layout = flowLayout(344);
    expect(layout.cols).toBe(5);
    expect(layout.slot).toBe(SHORTCUT_TILE + layout.gap);
  });

  it("grows the flow height with the number of rows", () => {
    expect(gridHeight(1)).toBeLessThan(gridHeight(2));
    expect(gridHeight(0)).toBe(0);
  });
});
