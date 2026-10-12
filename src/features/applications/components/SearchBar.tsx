import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

import { Icon, IconButton, radius, size, space, Text, typography, useTheme } from '@/ui';

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onOpenFilters: () => void;
  activeFilters: number;
};

export function SearchBar({ value, onChange, onOpenFilters, activeFilters }: SearchBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.field, { backgroundColor: colors.surfaceAlt }]}>
        <Icon icon={Search} color="textSubtle" size="small" />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={t('filters.searchPlaceholder')}
          placeholderTextColor={colors.textSubtle}
          accessibilityLabel={t('common.search')}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="never"
          style={[styles.input, { color: colors.text }]}
          testID="search-input"
        />
        {value ? (
          <IconButton
            icon={X}
            accessibilityLabel={t('common.clear')}
            onPress={() => onChange('')}
            color="textSubtle"
          />
        ) : null}
      </View>
      <View>
        <IconButton
          icon={SlidersHorizontal}
          accessibilityLabel={
            activeFilters > 0 ? `${t('filters.open')} (${activeFilters})` : t('filters.open')
          }
          onPress={onOpenFilters}
          selected={activeFilters > 0}
          testID="open-filters"
        />
        {activeFilters > 0 ? (
          <View style={[styles.count, { backgroundColor: colors.primary }]} pointerEvents="none">
            <Text variant="caption" color="onPrimary" maxFontSizeMultiplier={1.2}>
              {activeFilters}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: size.hit,
    borderRadius: radius.md,
    paddingLeft: space.md,
  },
  input: { flex: 1, ...typography.callout, paddingVertical: space.sm },
  count: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
  },
});
