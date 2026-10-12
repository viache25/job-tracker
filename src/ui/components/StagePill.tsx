import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { radius, size, space, type StageColor } from '../tokens';
import { Text } from './Text';

export type StagePillProps = {
  label: string;
  color: StageColor;
  testID?: string;
};

export function StagePill({ label, color, testID }: StagePillProps) {
  const { stageColor } = useTheme();
  const { bg, fg } = stageColor(color);
  return (
    <View style={[styles.pill, { backgroundColor: bg }]} testID={testID}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text variant="caption" tint={fg} numberOfLines={1} maxFontSizeMultiplier={1.6}>
        {label}
      </Text>
    </View>
  );
}

/** Small colored dot for stage lists. */
export function StageDot({ color }: { color: StageColor }) {
  const { stageColor } = useTheme();
  return <View style={[styles.dot, { backgroundColor: stageColor(color).fg }]} />;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: size.pillHeight,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: size.dot, height: size.dot, borderRadius: radius.pill },
});
