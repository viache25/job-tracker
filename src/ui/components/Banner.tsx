import { CircleAlert, Info, CircleCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { radius, space } from '../tokens';
import { Icon } from './Icon';
import { Text } from './Text';

export type BannerProps = {
  tone: 'info' | 'success' | 'warning' | 'error';
  title: string;
  body?: string;
  children?: ReactNode;
  testID?: string;
};

export function Banner({ tone, title, body, children, testID }: BannerProps) {
  const { colors } = useTheme();
  const fg = {
    info: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.danger,
  }[tone];
  const icon = tone === 'success' ? CircleCheck : tone === 'info' ? Info : CircleAlert;
  return (
    <View
      testID={testID}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      style={[styles.banner, { backgroundColor: colors.surface, borderColor: fg }]}
    >
      <Icon icon={icon} tint={fg} />
      <View style={styles.texts}>
        <Text variant="bodyStrong">{title}</Text>
        {body ? (
          <Text variant="callout" color="textMuted">
            {body}
          </Text>
        ) : null}
        {children ? <View style={styles.actions}>{children}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  texts: { flex: 1, gap: space.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
});
