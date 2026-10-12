import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { radius, size, space } from '../tokens';
import { Icon } from './Icon';
import { Text } from './Text';

export type ListSectionProps = {
  title?: string;
  count?: number;
  footer?: string;
  children: ReactNode;
  testID?: string;
};

/** Grouped list block (iOS settings style). */
export function ListSection({ title, count, footer, children, testID }: ListSectionProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.section} testID={testID}>
      {title ? <SectionHeader title={title} count={count} /> : null}
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
      {footer ? (
        <Text variant="footnote" color="textSubtle" style={styles.footer}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export function SectionHeader({
  title,
  count,
  right,
}: {
  title: string;
  count?: number;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header} accessibilityRole="header">
      <Text variant="subhead" color="textMuted" style={styles.headerTitle}>
        {title}
        {count !== undefined ? `  ·  ${count}` : ''}
      </Text>
      {right}
    </View>
  );
}

export type ListRowProps = {
  title: string;
  subtitle?: string;
  value?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  last?: boolean;
  testID?: string;
};

export function ListRow({
  title,
  subtitle,
  value,
  left,
  right,
  onPress,
  chevron = !!onPress,
  destructive,
  accessibilityLabel,
  accessibilityHint,
  last,
  testID,
}: ListRowProps) {
  const { colors } = useTheme();
  const body = (
    <>
      {left}
      <View style={styles.texts}>
        <Text variant="body" color={destructive ? 'danger' : 'text'} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" color="textMuted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="callout" color="textMuted" numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      ) : null}
      {right}
      {chevron ? <Icon icon={ChevronRight} color="textSubtle" size="small" /> : null}
    </>
  );
  const rowStyle = [
    styles.row,
    !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  ];
  if (!onPress) {
    return (
      <View style={rowStyle} testID={testID} accessible accessibilityLabel={accessibilityLabel}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, value].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      testID={testID}
      style={({ pressed }) => [rowStyle, pressed && { backgroundColor: colors.surfacePressed }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.xs },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xs,
    minHeight: 28,
  },
  headerTitle: { flex: 1, textTransform: 'uppercase', letterSpacing: 0.4 },
  group: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  footer: { paddingHorizontal: space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: size.hit + space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  texts: { flex: 1, gap: space.xxs },
  value: { maxWidth: '45%' },
});
