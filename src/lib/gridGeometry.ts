import { GRID_COLS, type WidgetId } from "./settings";

/** The dashboard is designed at this width; smaller windows scale the whole stage. */
export const REF_GRID_W = 976;
export const REF_ROW_H = 69;
export const REF_GAP = 20;
export const REF_COL_W = (REF_GRID_W - REF_GAP * (GRID_COLS - 1)) / GRID_COLS;

export const STACK_BREAKPOINT = 768;
export const MIN_STAGE_SCALE = 0.5;

export function refHeight(rows: number): number {
  const r = Math.max(1, Math.ceil(rows));
  return r * REF_ROW_H + (r - 1) * REF_GAP;
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
