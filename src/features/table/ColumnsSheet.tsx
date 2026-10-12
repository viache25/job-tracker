import { ArrowDown, ArrowUp, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import {
  BottomSheet,
  Button,
  Icon,
  IconButton,
  Segmented,
  size,
  space,
  Stack,
  Text,
  useTheme,
} from '@/ui';

import {
  DEFAULT_COLUMNS,
  moveColumn,
  PINNED_COLUMN,
  type ColumnConfig,
  type ColumnWidth,
} from './columns';

export function ColumnsSheet({
  visible,
  onClose,
  columns,
  onChange,
}: {
  visible: boolean;
  onClose: () => void;
  columns: ColumnConfig;
  onChange: (columns: ColumnConfig) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const update = (index: number, patch: Partial<ColumnConfig[number]>) =>
    onChange(columns.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('table.columns')}
      closeLabel={t('common.close')}
      testID="columns-sheet"
      footer={
        <View style={styles.footer}>
          <Button
            label={t('common.reset')}
            variant="secondary"
            onPress={() => onChange(DEFAULT_COLUMNS)}
          />
          <Button label={t('common.done')} onPress={onClose} fullWidth />
        </View>
      }
    >
      {columns.map((column, index) => {
        const pinned = column.id === PINNED_COLUMN;
        const name = t(`table.column.${column.id}`);
        return (
          <Stack
            key={column.id}
            gap="sm"
            style={[
              styles.item,
              index < columns.length - 1 && {
                borderBottomColor: colors.border,
                borderBottomWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <View style={styles.row}>
              {pinned ? (
                <View style={styles.lock}>
                  <Icon icon={Lock} color="textSubtle" size="small" />
                </View>
              ) : (
                <Switch
                  value={column.visible}
                  onValueChange={(visible) => update(index, { visible })}
                  accessibilityLabel={t('table.showColumn', { column: name })}
                  trackColor={{ true: colors.primary, false: colors.borderStrong }}
                  thumbColor={colors.surface}
                  ios_backgroundColor={colors.borderStrong}
                />
              )}
              <Text
                variant="body"
                style={styles.name}
                color={column.visible ? 'text' : 'textMuted'}
              >
                {name}
                {pinned ? ` · ${t('table.pinned')}` : ''}
              </Text>
              {!pinned ? (
                <>
                  <IconButton
                    icon={ArrowUp}
                    accessibilityLabel={`${t('common.moveUp')}: ${name}`}
                    onPress={() => onChange(moveColumn(columns, column.id, -1))}
                    disabled={index <= 1}
                  />
                  <IconButton
                    icon={ArrowDown}
                    accessibilityLabel={`${t('common.moveDown')}: ${name}`}
                    onPress={() => onChange(moveColumn(columns, column.id, 1))}
                    disabled={index === columns.length - 1}
                  />
                </>
              ) : null}
            </View>
            {column.visible ? (
              <Segmented<ColumnWidth>
                accessibilityLabel={t('table.width', { column: name })}
                value={column.width}
                onChange={(width) => update(index, { width })}
                options={[
                  { value: 'narrow', label: t('table.widthNarrow') },
                  { value: 'normal', label: t('table.widthNormal') },
                  { value: 'wide', label: t('table.widthWide') },
                ]}
              />
            ) : null}
          </Stack>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  item: { paddingVertical: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: size.hit },
  // Same width as a Switch so names line up.
  lock: { width: 51, alignItems: 'center' },
  name: { flex: 1 },
  footer: { flexDirection: 'row', gap: space.sm },
});
