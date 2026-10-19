import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../theme';
import { opacity, radius, size, type ThemeColors } from '../tokens';
import { Icon } from './Icon';

export type IconButtonProps = {
  icon: LucideIcon;
  /** Required: icons have no visible text. */
  accessibilityLabel: string;
  onPress?: () => void;
  color?: keyof ThemeColors;
  variant?: 'plain' | 'filled';
  disabled?: boolean;
  selected?: boolean;
  testID?: string;
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  color = 'text',
  variant = 'plain',
  disabled,
  selected,
  testID,
}: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed
            ? colors.surfacePressed
            : variant === 'filled' || selected
              ? colors.surfaceAlt
              : 'transparent',
          opacity: disabled ? opacity.disabled : 1,
        },
      ]}
    >
      <Icon icon={icon} color={selected ? 'primary' : color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: size.hit,
    height: size.hit,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
