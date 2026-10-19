import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { space } from '../tokens';
import { Text } from './Text';

export function Loading({ label }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.wrap, { backgroundColor: colors.background }]}
      accessibilityLabel={label}
      accessible
    >
      <ActivityIndicator color={colors.primary} size="large" />
      {label ? (
        <Text variant="callout" color="textMuted">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xxl,
  },
});
