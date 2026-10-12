import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { radius, space } from '../tokens';
import { Text } from './Text';

/** Tiny label, e.g. where a field value came from. */
export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'primary';
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.badge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
    >
      <Text
        variant="caption"
        color={tone === 'primary' ? 'primary' : 'textMuted'}
        maxFontSizeMultiplier={1.4}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
