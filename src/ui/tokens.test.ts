import { palette, stagePalette } from './tokens';

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe.each(['light', 'dark'] as const)('%s theme contrast (WCAG AA 4.5:1)', (scheme) => {
  const c = palette[scheme];

  it.each(['text', 'textMuted', 'textSubtle', 'primary', 'danger'] as const)(
    '%s on background, surface and surfaceAlt',
    (key) => {
      for (const bg of [c.background, c.surface, c.surfaceAlt]) {
        expect(contrast(c[key], bg)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it('button labels', () => {
    expect(contrast(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.onAccent, c.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.onDanger, c.danger)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(Object.keys(stagePalette) as (keyof typeof stagePalette)[])('stage %s', (color) => {
    const { bg, fg } = stagePalette[color][scheme];
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
