import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { radius, size, space } from '../tokens';
import { Icon } from './Icon';
import { Text } from './Text';

export type TagProps = {
  label: string;
  icon?: LucideIcon;
  /** Makes the tag a toggle (filter chips). */
  onPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export function Tag({ label, icon, onPress, selected, accessibilityLabel, testID }: TagProps) {
  const { colors } = useTheme();
  const fg = selected ? colors.onPrimary : colors.textMuted;
  const content = (
    <View style={styles.row}>
      {icon ? <Icon icon={icon} size="small" tint={fg} /> : null}
      <Text variant="subhead" tint={fg} numberOfLines={1} maxFontSizeMultiplier={1.6}>
        {label}
      </Text>
    </View>
  );
  const style = [
    styles.tag,
    {
      backgroundColor: selected ? colors.primary : colors.surfaceAlt,
      borderColor: selected ? colors.primary : colors.border,
    },
  ];
  if (!onPress) {
    return (
      <View style={style} testID={testID} accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={(size.hit - 32) / 2}
      testID={testID}
      style={({ pressed }) => [
        style,
        styles.pressable,
        pressed && !selected && { backgroundColor: colors.surfacePressed },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    alignSelf: 'flex-start',
  },
  pressable: { minHeight: 32, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
