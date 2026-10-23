/** Tile and label metrics shared by the desktop and narrow layouts. */
export const SHORTCUT_TILE = 44;
export const SHORTCUT_LABEL_H = 18;
export const SHORTCUT_ROW_PITCH = SHORTCUT_TILE + SHORTCUT_LABEL_H;
export const SHORTCUT_ROW_GAP = 10;

/** Desktop: exactly this many tiles per row, and two rows reserved. */
export const SHORTCUT_COLS = 15;
export const SHORTCUT_DESKTOP_ROWS = 2;
export const SHORTCUT_CAPACITY = SHORTCUT_COLS * SHORTCUT_DESKTOP_ROWS;

const FLOW_GAP = 12;

export interface ShortcutLayout {
  cols: number;
  gap: number;
  slot: number;
}

/** Fixed 15 columns; the gap stretches to fill the card width. */
export function desktopLayout(width: number): ShortcutLayout {
  const gap =
    width > 0 ? Math.max(4, (width - SHORTCUT_COLS * SHORTCUT_TILE) / (SHORTCUT_COLS - 1)) : FLOW_GAP;
  return { cols: SHORTCUT_COLS, gap, slot: SHORTCUT_TILE + gap };
}

/** Narrow screens: as many columns as fit, and rows grow with the content. */
export function flowLayout(width: number): ShortcutLayout {
  const cols =
    width > 0
      ? Math.max(1, Math.min(SHORTCUT_COLS, Math.floor((width + FLOW_GAP) / (SHORTCUT_TILE + FLOW_GAP))))
      : 1;
  return { cols, gap: FLOW_GAP, slot: SHORTCUT_TILE + FLOW_GAP };
}

export function gridHeight(rows: number): number {
  const r = Math.max(0, rows);
  return r === 0 ? 0 : r * SHORTCUT_ROW_PITCH + (r - 1) * SHORTCUT_ROW_GAP;
}
