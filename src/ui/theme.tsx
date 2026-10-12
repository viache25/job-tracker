import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import {
  palette,
  stagePalette,
  type ColorScheme,
  type StageColor,
  type ThemeColors,
} from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  stageColor: (color: StageColor) => { bg: string; fg: string };
};

function buildTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: palette[scheme],
    stageColor: (color) => stagePalette[color][scheme],
  };
}

const ThemeContext = createContext<Theme>(buildTheme('light'));

export function resolveScheme(
  preference: ThemePreference,
  system: string | null | undefined,
): ColorScheme {
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({
  preference = 'system',
  children,
}: {
  preference?: ThemePreference;
  children: ReactNode;
}) {
  const system = useColorScheme();
  const scheme = resolveScheme(preference, system);
  const theme = useMemo(() => buildTheme(scheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
