import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '../theme';
import { size, space } from '../tokens';

export type ScreenProps = {
  children: ReactNode;
  /** Wrap content in a ScrollView. */
  scroll?: boolean;
  /** Horizontal padding (on by default). */
  padded?: boolean;
  /** Safe area edges to respect; headers already cover the top. */
  edges?: Edge[];
  footer?: ReactNode;
  testID?: string;
};

export function Screen({
  children,
  scroll,
  padded = true,
  edges = ['bottom'],
  footer,
  testID,
}: ScreenProps) {
  const { colors } = useTheme();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, padded && styles.padded]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.fill, padded && styles.padded]}>{children}</View>
  );
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.fill, { backgroundColor: colors.background }]}
      testID={testID}
    >
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
        {footer ? (
          <View
            style={[
              styles.footer,
              { borderTopColor: colors.border, backgroundColor: colors.background },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingVertical: space.lg, gap: space.lg },
  padded: { paddingHorizontal: space.lg },
  inner: { gap: space.lg, width: '100%', maxWidth: size.maxContentWidth, alignSelf: 'center' },
  footer: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: space.sm,
  },
});
