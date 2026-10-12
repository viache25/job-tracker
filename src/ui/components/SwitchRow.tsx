import { StyleSheet, Switch, View } from 'react-native';

import { useTheme } from '../theme';
import { size, space } from '../tokens';
import { Text } from './Text';

export type SwitchRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
  testID?: string;
};

export function SwitchRow({ label, description, value, onChange, last, testID }: SwitchRowProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <View style={styles.texts}>
        <Text variant="body">{label}</Text>
        {description ? (
          <Text variant="footnote" color="textMuted">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.primary, false: colors.borderStrong }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.borderStrong}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: size.hit + space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  texts: { flex: 1, gap: space.xxs },
});
