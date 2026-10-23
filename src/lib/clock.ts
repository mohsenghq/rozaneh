export interface ClockAngles {
  hour: number;
  minute: number;
  second: number;
}

/**
 * Convert a wall-clock date into SVG rotation angles.
 *
 * Fractional seconds are included so the second hand can sweep smoothly if a
 * caller renders faster than once per second. The values are always derived
 * from the date, never from accumulated elapsed time.
 */
export function clockAngles(date: Date): ClockAngles {
  const seconds = date.getSeconds() + date.getMilliseconds() / 1000;
  const minutes = date.getMinutes() + seconds / 60;
  const hours = (date.getHours() % 12) + minutes / 60;

  return {
    hour: hours * 30,
    minute: minutes * 6,
    second: seconds * 6,
  };
}
