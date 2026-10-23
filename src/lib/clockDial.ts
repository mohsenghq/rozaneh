/**
 * Geometry for the classic dial, in a 100×100 viewBox.
 *
 *   minute ticks   r 44 → 46.5   (thin, 60 of them)
 *   hour markers   r 39 → 46.5   (thick, every 5th tick)
 *   numerals       r 31          (inside the markers, never on them)
 *
 * Every position is computed here, so the component only renders numbers.
 */
export const DIAL = {
  center: 50,
  tickOuter: 46.5,
  minuteInner: 45,
  hourInner: 42,
  numeralRadius: 36.5,
} as const;

export interface Point {
  x: number;
  y: number;
}

/** Point on a circle; 0° is 12 o'clock and angles increase clockwise. */
export function polar(radius: number, degrees: number): Point {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return {
    x: round(DIAL.center + radius * Math.cos(rad)),
    y: round(DIAL.center + radius * Math.sin(rad)),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface DialTick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  major: boolean;
}

export function dialTicks(): DialTick[] {
  return Array.from({ length: 60 }, (_, i) => {
    const major = i % 5 === 0;
    const inner = polar(major ? DIAL.hourInner : DIAL.minuteInner, i * 6);
    const outer = polar(DIAL.tickOuter, i * 6);
    return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, major };
  });
}

export interface DialNumeral extends Point {
  hour: number;
}

export function dialNumerals(): DialNumeral[] {
  return Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1;
    return { hour, ...polar(DIAL.numeralRadius, hour * 30) };
  });
}

export interface HandLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** A hand from a short tail behind the centre to its tip. */
export function handLine(degrees: number, length: number, tail = 0): HandLine {
  const from = polar(-tail, degrees);
  const to = polar(length, degrees);
  return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
}
