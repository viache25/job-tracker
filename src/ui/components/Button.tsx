import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { opacity, radius, size, space } from '../tokens';
import { Icon } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'normal' | 'small';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size: buttonSize = 'normal',
  icon,
  loading,
  disabled,
  fullWidth,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const palette = {
    primary: {
      bg: colors.primary,
      pressed: colors.primaryPressed,
      fg: colors.onPrimary,
      border: colors.primary,
    },
    accent: {
      bg: colors.accent,
      pressed: colors.accentPressed,
      fg: colors.onAccent,
      border: colors.accent,
    },
    danger: {
      bg: colors.danger,
      pressed: colors.danger,
      fg: colors.onDanger,
      border: colors.danger,
    },
    secondary: {
      bg: colors.surface,
      pressed: colors.surfacePressed,
      fg: colors.text,
      border: colors.borderStrong,
    },
    ghost: {
      bg: 'transparent',
      pressed: colors.surfacePressed,
      fg: colors.primary,
      border: 'transparent',
    },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      hitSlop={buttonSize === 'small' ? (size.hit - size.buttonHeightSmall) / 2 : 0}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: buttonSize === 'small' ? size.buttonHeightSmall : size.buttonHeight,
          paddingHorizontal: buttonSize === 'small' ? space.md : space.xl,
          backgroundColor: pressed ? palette.pressed : palette.bg,
          borderColor: palette.border,
          opacity: disabled
            ? opacity.disabled
            : pressed && variant === 'danger'
              ? opacity.pressed
              : 1,
        },
        fullWidth && styles.fullWidth,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.fg} />
        ) : icon ? (
          <Icon icon={icon} size={buttonSize === 'small' ? 'small' : 'normal'} tint={palette.fg} />
        ) : null}
        <Text
          variant={buttonSize === 'small' ? 'subhead' : 'bodyStrong'}
          tint={palette.fg}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xs,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
