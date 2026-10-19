import { Check, ChevronDown } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { radius, size, space } from '../tokens';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';
import { Text } from './Text';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  /** Leading accessory, e.g. a stage dot. */
  left?: ReactNode;
};

export type SelectProps<T extends string> = {
  label?: string;
  value: T | null | undefined;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder: string;
  closeLabel: string;
  /** Renders the trigger compactly (inline in a row). */
  compact?: boolean;
  testID?: string;
};

/** Picker that opens a bottom sheet with the options. */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  closeLabel,
  compact,
  testID,
}: SelectProps<T>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={styles.wrap}>
      {label && !compact ? (
        <Text variant="subhead" color="textMuted">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={
          label ? `${label}: ${selected?.label ?? placeholder}` : (selected?.label ?? placeholder)
        }
        testID={testID}
        style={({ pressed }) => [
          styles.trigger,
          compact && styles.compact,
          {
            backgroundColor: pressed ? colors.surfacePressed : colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {selected?.left}
        <Text
          variant="body"
          color={selected ? 'text' : 'textSubtle'}
          numberOfLines={1}
          style={styles.value}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Icon icon={ChevronDown} color="textSubtle" size="small" />
      </Pressable>
      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        closeLabel={closeLabel}
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option.label}
              style={({ pressed }) => [
                styles.option,
                pressed && { backgroundColor: colors.surfacePressed },
              ]}
            >
              {option.left}
              <Text variant="body" style={styles.value} numberOfLines={2}>
                {option.label}
              </Text>
              {isSelected ? <Icon icon={Check} color="primary" /> : null}
            </Pressable>
          );
        })}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: size.inputHeight,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.md,
  },
  compact: { minHeight: size.hit, alignSelf: 'flex-start' },
  value: { flexShrink: 1, flexGrow: 1 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: size.hit + space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
  },
});
