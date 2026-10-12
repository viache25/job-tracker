import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Application, Stage } from '@/db/schema';
import { stageColor, stageLabel } from '@/features/stages/label';
import { daysSince } from '@/lib/format';
import { radius, size, space, StagePill, Text, useTheme } from '@/ui';

export type ApplicationRowProps = {
  application: Application;
  stage: Stage | undefined;
  onPress: (id: string) => void;
  /** Hide the stage pill when the row already sits under its stage header. */
  showStage?: boolean;
};

export const ApplicationRow = memo(function ApplicationRow({
  application,
  stage,
  onPress,
  showStage = true,
}: ApplicationRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const days = Math.max(0, daysSince(application.updatedAt));
  const ago = days === 0 ? t('time.today') : t('time.daysAgo', { count: days });
  const label = stageLabel(stage, t);

  return (
    <Pressable
      onPress={() => onPress(application.id)}
      accessibilityRole="button"
      accessibilityLabel={`${application.company}, ${application.title}, ${label}, ${ago}`}
      testID={`application-row-${application.id}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surfacePressed : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.main}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {application.company}
        </Text>
        <Text variant="callout" color="textMuted" numberOfLines={2}>
          {application.title}
        </Text>
      </View>
      <View style={styles.side}>
        {showStage ? <StagePill label={label} color={stageColor(stage)} /> : null}
        <Text variant="caption" color="textSubtle">
          {ago}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: size.hit + space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  main: { flex: 1, gap: space.xxs },
  side: { alignItems: 'flex-end', gap: space.xs, maxWidth: '45%' },
});
