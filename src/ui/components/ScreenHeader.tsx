import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '../tokens';
import { Text } from './Text';

/** Large title for tab screens, with optional actions on the right. */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <Text variant="display" accessibilityRole="header" style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {right ? <View style={styles.actions}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  title: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
});
