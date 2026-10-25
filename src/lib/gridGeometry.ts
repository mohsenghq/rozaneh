import { GRID_COLS, type WidgetId } from "./settings";
import { SHORTCUT_CARD_H } from "./shortcutLayout";

/** The dashboard is designed at this width; smaller windows scale the whole stage. */
export const REF_GRID_W = 976;
export const REF_ROW_H = 69;
export const REF_GAP = 20;
export const REF_COL_W = (REF_GRID_W - REF_GAP * (GRID_COLS - 1)) / GRID_COLS;

export const STACK_BREAKPOINT = 768;
export const MIN_STAGE_SCALE = 0.5;

/**
 * The shortcut card is taller than one grid row, so every row below it shifts
 * down by the difference. This keeps the normal REF_GAP between the bar and the
 * widgets underneath instead of letting the card eat into the gap.
 */
export const SHORTCUT_ROW_EXTRA = Math.max(0, SHORTCUT_CARD_H - REF_ROW_H);

/** Extra vertical offset for rows under the shortcut bar. */
export function rowExtra(y: number): number {
  return y > 0 ? SHORTCUT_ROW_EXTRA : 0;
}

export function refHeight(rows: number): number {
  const r = Math.max(1, Math.ceil(rows));
  return r * REF_ROW_H + (r - 1) * REF_GAP + (r > 1 ? SHORTCUT_ROW_EXTRA : 0);
}

/**
 * Uniform scale for the reference stage. Never upscales: the layout keeps its
 * original size on large screens and shrinks as a whole when space is short.
 */
export function stageScale({
  width,
  height,
  rows,
}: {
  width: number;
  height: number;
  rows: number;
}): number {
  if (width <= 0 || height <= 0) return 1;
  const fit = Math.min(1, width / REF_GRID_W, height / refHeight(rows));
  return Math.max(MIN_STAGE_SCALE, fit);
}

/** Heights used in the stacked (narrow) layout; shortcuts size themselves. */
export function stackClass(id: WidgetId): string {
  return id === "clock" || id === "weather" ? "h-40" : "";
}
