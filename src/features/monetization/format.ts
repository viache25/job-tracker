/** Splits milliseconds into whole hours and minutes, rounding minutes up. */
export function hoursMinutes(ms: number): { hours: number; minutes: number } {
  const total = Math.ceil(ms / 60_000);
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}
