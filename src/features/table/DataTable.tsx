import { FlashList } from '@shopify/flash-list';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import type { Application, Stage } from '@/db/schema';
import { stageColor, stageLabel } from '@/features/stages/label';
import { formatMoney } from '@/lib/format';
import { columnWidth, Icon, size, space, StagePill, Text, useTheme } from '@/ui';

import { cellText, summarize, type ColumnConfig, type ColumnId, type SortState } from './columns';

const ROW_HEIGHT = size.hit + space.md;

export type DataTableProps = {
  rows: readonly Application[];
  columns: ColumnConfig;
  sort: SortState;
  onSort: (column: ColumnId) => void;
  onOpen: (id: string) => void;
  stageById: ReadonlyMap<string, Stage>;
  locale: string;
};

/**
 * Horizontally scrollable table. The first column stays in place: it is translated by the
 * horizontal scroll offset on the native driver, so it never lags behind.
 */
export function DataTable({
  rows,
  columns,
  sort,
  onSort,
  onOpen,
  stageById,
  locale,
}: DataTableProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [scrollX] = useState(() => new Animated.Value(0));
  const visible = useMemo(() => columns.filter((c) => c.visible), [columns]);
  const totalWidth = visible.reduce((sum, c) => sum + columnWidth[c.width], 0);
  const summary = summarize(rows);
  const [pinned, ...rest] = visible;
  if (!pinned) return null;

  const pinnedStyle = [
    styles.pinned,
    { width: columnWidth[pinned.width], transform: [{ translateX: scrollX }] },
  ];

  return (
    <Animated.ScrollView
      horizontal
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      })}
      scrollEventThrottle={16}
      bounces={false}
      style={styles.fill}
      contentContainerStyle={{ minWidth: '100%' }}
    >
      <View style={{ width: totalWidth, flex: 1 }}>
        {/* Header */}
        <View
          style={[
            styles.row,
            styles.header,
            { borderBottomColor: colors.borderStrong, backgroundColor: colors.background },
          ]}
        >
          {visible.map((column, index) => {
            const active = sort.column === column.id;
            const name = t(`table.column.${column.id}`);
            const cell = (
              <Pressable
                key={column.id}
                onPress={() => onSort(column.id)}
                accessibilityRole="button"
                accessibilityLabel={`${t('table.sortBy', { column: name })}${active ? `, ${t(sort.direction === 'asc' ? 'table.sortedAsc' : 'table.sortedDesc')}` : ''}`}
                testID={`table-header-${column.id}`}
                style={[styles.cell, styles.headerCell, { width: columnWidth[column.width] }]}
              >
                <Text
                  variant="subhead"
                  color={active ? 'primary' : 'textMuted'}
                  numberOfLines={1}
                  style={styles.shrink}
                >
                  {name}
                </Text>
                {active ? (
                  <Icon
                    icon={sort.direction === 'asc' ? ArrowUp : ArrowDown}
                    color="primary"
                    size="small"
                  />
                ) : null}
              </Pressable>
            );
            return index === 0 ? (
              <Animated.View
                key={column.id}
                style={[
                  pinnedStyle,
                  { backgroundColor: colors.background, borderRightColor: colors.border },
                ]}
              >
                {cell}
              </Animated.View>
            ) : (
              cell
            );
          })}
        </View>

        <FlashList
          data={rows}
          keyExtractor={(a) => a.id}
          renderItem={({ item, index }) => (
            <TableRow
              application={item}
              pinned={pinned}
              rest={rest}
              stageById={stageById}
              locale={locale}
              onOpen={onOpen}
              striped={index % 2 === 1}
              pinnedStyle={pinnedStyle}
            />
          )}
          extraData={visible}
        />

        {/* Summary */}
        <View
          style={[
            styles.row,
            styles.summary,
            { borderTopColor: colors.borderStrong, backgroundColor: colors.surfaceAlt },
          ]}
        >
          <Animated.View
            style={[
              pinnedStyle,
              { backgroundColor: colors.surfaceAlt, borderRightColor: colors.border },
            ]}
          >
            <View style={[styles.cell, { width: columnWidth[pinned.width] }]}>
              <Text variant="subhead" numberOfLines={2}>
                {t('table.summaryCount', { count: summary.count })}
              </Text>
            </View>
          </Animated.View>
          {rest.map((column) => (
            <View key={column.id} style={[styles.cell, { width: columnWidth[column.width] }]}>
              {column.id === 'salary' && summary.medianSalary != null ? (
                <Text variant="subhead" numberOfLines={2} testID="table-median">
                  {t('table.summaryMedian', {
                    value: formatMoney(summary.medianSalary, 'EUR', locale),
                  })}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </Animated.ScrollView>
  );
}

type RowProps = {
  application: Application;
  pinned: ColumnConfig[number];
  rest: ColumnConfig;
  stageById: ReadonlyMap<string, Stage>;
  locale: string;
  onOpen: (id: string) => void;
  striped: boolean;
  pinnedStyle: object[];
};

const TableRow = memo(function TableRow({
  application: a,
  pinned,
  rest,
  stageById,
  locale,
  onOpen,
  striped,
  pinnedStyle,
}: RowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const bg = striped ? colors.surfaceAlt : colors.surface;
  const ctx = { t, locale, stageById };
  return (
    <Pressable
      onPress={() => onOpen(a.id)}
      accessibilityRole="button"
      accessibilityLabel={`${a.company}, ${a.title}`}
      testID={`table-row-${a.id}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surfacePressed : bg, height: ROW_HEIGHT },
      ]}
    >
      <Animated.View
        style={[pinnedStyle, { backgroundColor: bg, borderRightColor: colors.border }]}
      >
        <View style={[styles.cell, { width: columnWidth[pinned.width] }]}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {a.company}
          </Text>
        </View>
      </Animated.View>
      {rest.map((column) => (
        <View key={column.id} style={[styles.cell, { width: columnWidth[column.width] }]}>
          {column.id === 'stage' ? (
            <StagePill
              label={stageLabel(stageById.get(a.stageId), t)}
              color={stageColor(stageById.get(a.stageId))}
            />
          ) : (
            <Text
              variant="callout"
              color={column.id === 'title' ? 'text' : 'textMuted'}
              numberOfLines={2}
            >
              {cellText(a, column.id, ctx)}
            </Text>
          )}
        </View>
      ))}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  header: { borderBottomWidth: 1, minHeight: size.hit },
  headerCell: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  summary: { borderTopWidth: 1, minHeight: size.hit + space.sm },
  cell: { paddingHorizontal: space.md, paddingVertical: space.sm, justifyContent: 'center' },
  pinned: { zIndex: 1, borderRightWidth: StyleSheet.hairlineWidth },
  shrink: { flexShrink: 1 },
});
