/** Collapses whitespace and trims a string. */
export function squish(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Cuts a string to `max` characters, adding an ellipsis when it was longer. */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
