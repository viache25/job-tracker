import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { space } from '../tokens';

type Gap = keyof typeof space;

/** Horizontal stack with a token gap. */
export function Row({
  children,
  gap = 'sm',
  wrap,
  align = 'center',
  justify,
  style,
}: {
  children: ReactNode;
  gap?: Gap;
  wrap?: boolean;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.row,
        { gap: space[gap], alignItems: align, justifyContent: justify },
        wrap && styles.wrap,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Vertical stack with a token gap. */
export function Stack({
  children,
  gap = 'md',
  style,
}: {
  children: ReactNode;
  gap?: Gap;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ gap: space[gap] }, style]}>{children}</View>;
}

export function Spacer() {
  return <View style={styles.spacer} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  wrap: { flexWrap: 'wrap' },
  spacer: { flex: 1 },
});
