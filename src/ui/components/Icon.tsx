import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '../theme';
import { size as sizes, type ThemeColors } from '../tokens';

export type IconProps = {
  icon: LucideIcon;
  size?: 'small' | 'normal' | 'large';
  color?: keyof ThemeColors;
  tint?: string;
};

const SIZE = { small: sizes.iconSmall, normal: sizes.icon, large: sizes.iconLarge } as const;

/** Decorative icon. Interactive icons go through IconButton, which carries the label. */
export function Icon({ icon: Glyph, size = 'normal', color = 'text', tint }: IconProps) {
  const { colors } = useTheme();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Glyph size={SIZE[size]} color={tint ?? colors[color]} strokeWidth={2} />
    </View>
  );
}
