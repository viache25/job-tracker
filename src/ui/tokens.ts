/**
 * Design tokens. The only place in the app where raw colors, sizes and fonts live.
 * Documented in docs/design.md.
 */

export const palette = {
  light: {
    background: '#F6F5F2',
    surface: '#FFFFFF',
    surfaceAlt: '#EFEDE8',
    surfacePressed: '#E7E4DD',
    border: '#E3E0D9',
    borderStrong: '#C9C5BC',
    text: '#1A1A18',
    textMuted: '#5A5751',
    textSubtle: '#6E6A63',
    primary: '#3450D1',
    primaryPressed: '#2A41AD',
    onPrimary: '#FFFFFF',
    accent: '#C2461D',
    accentPressed: '#A33A17',
    onAccent: '#FFFFFF',
    danger: '#BF3029',
    onDanger: '#FFFFFF',
    success: '#2B7A4B',
    warning: '#9A5B00',
    focus: '#3450D1',
    overlay: 'rgba(20, 20, 19, 0.45)',
    shadow: '#000000',
  },
  dark: {
    background: '#141413',
    surface: '#1E1E1C',
    surfaceAlt: '#282825',
    surfacePressed: '#33322F',
    border: '#34332F',
    borderStrong: '#4A4843',
    text: '#F2F1EE',
    textMuted: '#B3B0A8',
    textSubtle: '#9C988F',
    primary: '#8EA2FF',
    primaryPressed: '#A9B8FF',
    onPrimary: '#0E1330',
    accent: '#FF8A5C',
    accentPressed: '#FFA07A',
    onAccent: '#2A0F04',
    danger: '#FF7B72',
    onDanger: '#2B0705',
    success: '#6FD39A',
    warning: '#F2B65A',
    focus: '#8EA2FF',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: '#000000',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };

/** Stage colors: soft background + strong foreground for each theme. */
export const stagePalette = {
  slate: { light: { bg: '#E6E9EE', fg: '#3D4A5C' }, dark: { bg: '#2B323C', fg: '#C3CEDD' } },
  blue: { light: { bg: '#E1E8FD', fg: '#2B47B8' }, dark: { bg: '#232D4F', fg: '#A9BBFF' } },
  teal: { light: { bg: '#DDF1EE', fg: '#1D6B61' }, dark: { bg: '#1D3633', fg: '#86D9CB' } },
  amber: { light: { bg: '#FBEBC8', fg: '#835000' }, dark: { bg: '#3D3015', fg: '#F5C76E' } },
  violet: { light: { bg: '#ECE3FB', fg: '#5B36A8' }, dark: { bg: '#33284A', fg: '#C9B2FF' } },
  orange: { light: { bg: '#FDE4D8', fg: '#A33F12' }, dark: { bg: '#43271A', fg: '#FFAE85' } },
  green: { light: { bg: '#DEF2E4', fg: '#22693F' }, dark: { bg: '#1E3626', fg: '#8FDDAA' } },
  red: { light: { bg: '#FBE1DF', fg: '#A3271F' }, dark: { bg: '#45201D', fg: '#FF9C94' } },
  pink: { light: { bg: '#FBE2EE', fg: '#9C2A62' }, dark: { bg: '#43202F', fg: '#FF9FCB' } },
  gray: { light: { bg: '#ECEAE6', fg: '#56534D' }, dark: { bg: '#2E2D2A', fg: '#BDB9B0' } },
} as const;

export type StageColor = keyof typeof stagePalette;
export const STAGE_COLORS = Object.keys(stagePalette) as StageColor[];

export function isStageColor(value: string): value is StageColor {
  return value in stagePalette;
}

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const fontFamily = {
  regular: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  semibold: 'Onest_600SemiBold',
  bold: 'Onest_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34 },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, lineHeight: 28 },
  headline: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 22 },
  callout: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 20 },
  subhead: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 19 },
  footnote: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
} as const;

export type TextVariant = keyof typeof typography;

export const size = {
  /** Minimum touch target (Apple HIG). */
  hit: 44,
  icon: 20,
  iconSmall: 16,
  iconLarge: 28,
  hairline: 1,
  inputHeight: 48,
  buttonHeight: 48,
  buttonHeightSmall: 36,
  pillHeight: 24,
  dot: 8,
  swatch: 36,
  maxContentWidth: 640,
} as const;

/** Table column widths (T-18). */
export const columnWidth = {
  narrow: 96,
  normal: 140,
  wide: 220,
} as const;

export const motion = {
  fast: 150,
  normal: 220,
} as const;

export const opacity = {
  disabled: 0.45,
  pressed: 0.7,
} as const;
