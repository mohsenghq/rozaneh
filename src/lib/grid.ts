import { widgetSizes, type WidgetId, type WidgetPos } from "./settings";

export interface GridItem {
  i: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function toItems(layout: WidgetPos[]): GridItem[] {
  return layout.map((p) => ({ ...p, ...widgetSizes[p.i] }));
}

function collides(a: GridItem, b: GridItem): boolean {
  return a.i !== b.i && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Vertically compact the layout: items float up until they hit another item.
 */
export function compact(items: GridItem[]): GridItem[] {
  const out = items.map((o) => ({ ...o }));
  const placed: GridItem[] = [];
  const rest = out.sort((a, b) => a.y - b.y || a.x - b.x);
  for (const item of rest) {
    let y = item.y;
    while (y > 0 && !placed.some((p) => collides(p, { ...item, y: y - 1 }))) y--;
    while (placed.some((p) => collides(p, { ...item, y }))) y++;
    item.y = y;
    placed.push(item);
  }
  return out;
}
