import { describe, expect, it } from "vitest";
import { DIAL, dialNumerals, dialTicks, handLine, polar } from "./clockDial";

const distance = (x: number, y: number) => Math.hypot(x - DIAL.center, y - DIAL.center);

describe("clock dial geometry", () => {
  it("places 60 ticks, 12 of them major", () => {
    const ticks = dialTicks();
    expect(ticks).toHaveLength(60);
    expect(ticks.filter((t) => t.major)).toHaveLength(12);
  });

  it("starts major markers at the hour radius and minor ticks at the minute radius", () => {
    const ticks = dialTicks();
    for (const tick of ticks) {
      const inner = distance(tick.x1, tick.y1);
      expect(inner).toBeCloseTo(tick.major ? DIAL.hourInner : DIAL.minuteInner, 1);
    }
  });

  it("keeps every tick's outer end on the outer edge of the dial", () => {
    for (const tick of dialTicks()) {
      expect(distance(tick.x2, tick.y2)).toBeCloseTo(DIAL.tickOuter, 1);
    }
  });

  it("puts numerals inside the markers, not on them", () => {
    for (const n of dialNumerals()) {
      expect(distance(n.x, n.y)).toBeCloseTo(DIAL.numeralRadius, 1);
      expect(DIAL.numeralRadius + 4.5).toBeLessThan(DIAL.hourInner);
    }
  });

  it("puts 12 at the top and 3 at the right", () => {
    const [twelve, three] = [dialNumerals()[11], dialNumerals()[2]];
    expect(twelve.x).toBeCloseTo(50, 1);
    expect(twelve.y).toBeCloseTo(50 - DIAL.numeralRadius, 1);
    expect(three.x).toBeCloseTo(50 + DIAL.numeralRadius, 1);
    expect(three.y).toBeCloseTo(50, 1);
  });

  it("draws an hour hand with its tail behind the centre", () => {
    const hand = handLine(0, 22, 6);
    expect(hand.y1).toBeCloseTo(56, 1);
    expect(hand.y2).toBeCloseTo(28, 1);
  });

  it("polar is clockwise from 12", () => {
    expect(polar(10, 90).x).toBeCloseTo(60, 1);
    expect(polar(10, 90).y).toBeCloseTo(50, 1);
  });
});
