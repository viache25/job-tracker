import { useTheme } from './theme';
import { fontFamily } from './tokens';

/** Header and screen options shared by every stack, derived from the theme. */
export function useStackScreenOptions() {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.primary,
    headerTitleStyle: { fontFamily: fontFamily.semibold, color: colors.text },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal' as const,
    contentStyle: { backgroundColor: colors.background },
  };
}
