import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { radius, size, space } from '../tokens';
import { Text } from './Text';

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  testID?: string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: SegmentedProps<T>) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[styles.track, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={[
              styles.segment,
              selected && { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              variant="subhead"
              color={selected ? 'text' : 'textMuted'}
              numberOfLines={1}
              align="center"
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.xxs,
  },
  segment: {
    flex: 1,
    minHeight: size.hit - space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
});
