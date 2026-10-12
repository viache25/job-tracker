import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { radius, space } from '../tokens';
import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

export function EmptyState({ icon, title, body, actionLabel, onAction, testID }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
        <Icon icon={icon} size="large" color="textMuted" />
      </View>
      <Text variant="title" align="center" accessibilityRole="header">
        {title}
      </Text>
      {body ? (
        <Text variant="callout" color="textMuted" align="center">
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xxl,
    flexGrow: 1,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
