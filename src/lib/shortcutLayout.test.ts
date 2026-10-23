import { describe, expect, it } from "vitest";
import {
  SHORTCUT_CAPACITY,
  SHORTCUT_COLS,
  SHORTCUT_TILE,
  desktopLayout,
  flowLayout,
  gridHeight,
} from "./shortcutLayout";

describe("shortcut layout", () => {
  it("keeps exactly 15 columns on desktop and fills the width", () => {
    const layout = desktopLayout(944);
    expect(layout.cols).toBe(SHORTCUT_COLS);
    expect(SHORTCUT_TILE * SHORTCUT_COLS + layout.gap * (SHORTCUT_COLS - 1)).toBeCloseTo(944, 5);
  });

  it("reserves two rows and a capacity of 30 on desktop", () => {
    expect(SHORTCUT_CAPACITY).toBe(30);
    expect(gridHeight(2)).toBe(134);
  });

  it("fits fewer columns on narrow widths without shrinking tiles", () => {
    const layout = flowLayout(312);
    expect(layout.cols).toBe(5);
    expect(layout.slot).toBe(SHORTCUT_TILE + layout.gap);
  });

  it("grows the flow height with the number of rows", () => {
    expect(gridHeight(1)).toBeLessThan(gridHeight(2));
    expect(gridHeight(0)).toBe(0);
  });
});
