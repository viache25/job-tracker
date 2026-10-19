import type { LucideIcon } from 'lucide-react-native';
import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../theme';
import { radius, size, space, typography } from '../tokens';
import { Icon } from './Icon';
import { Text } from './Text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
  /** Shown after the label, e.g. a field source badge. */
  badge?: React.ReactNode;
  required?: boolean;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    hint,
    error,
    icon,
    badge,
    required,
    multiline,
    onFocus,
    onBlur,
    accessibilityLabel,
    ...rest
  },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.focus : colors.border;
  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text variant="subhead" color="textMuted">
            {label}
            {required ? ' *' : ''}
          </Text>
          {badge}
        </View>
      ) : null}
      <View
        style={[
          styles.field,
          multiline && styles.multiline,
          { backgroundColor: colors.surface, borderColor, borderWidth: focused || error ? 2 : 1 },
        ]}
      >
        {icon ? <Icon icon={icon} color="textSubtle" /> : null}
        <TextInput
          ref={ref}
          {...rest}
          multiline={multiline}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: colors.text }, multiline && styles.inputMultiline]}
        />
      </View>
      {error ? (
        <Text variant="footnote" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="footnote" color="textSubtle">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

export const TextArea = forwardRef<TextInput, TextFieldProps>(function TextArea(props, ref) {
  return <TextField ref={ref} multiline textAlignVertical="top" {...props} />;
});

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: size.inputHeight,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  multiline: { alignItems: 'flex-start', paddingVertical: space.sm, minHeight: 120 },
  input: { flex: 1, ...typography.body, paddingVertical: space.sm },
  inputMultiline: { minHeight: 100 },
});
