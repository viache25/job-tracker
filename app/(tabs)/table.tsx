import { router } from 'expo-router';
import { Columns3, Plus, SearchX, Table2 } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { FilterSheet } from '@/features/applications/components/FilterSheet';
import { SearchBar } from '@/features/applications/components/SearchBar';
import { countActiveFilters, isFilterActive } from '@/features/applications/filter';
import { useAllApplications, useApplications } from '@/features/applications/hooks';
import { useListQuery } from '@/features/applications/useListQuery';
import { useLocale } from '@/features/settings/preferences';
import { useStageMap, useStages } from '@/features/stages/hooks';
import { ColumnsSheet } from '@/features/table/ColumnsSheet';
import { nextSort, sortRows, type ColumnId } from '@/features/table/columns';
import { DataTable } from '@/features/table/DataTable';
import { useTableColumns, useTableSort } from '@/features/table/hooks';
import { EmptyState, IconButton, Screen, ScreenHeader, space } from '@/ui';

export default function TableScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const stages = useStages();
  const stageById = useStageMap();
  const total = useAllApplications().length;
  const query = useListQuery();
  const filtered = useApplications(query.filter, 'updated');
  const [columns, setColumns] = useTableColumns();
  const [sort, setSort] = useTableSort();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const rows = useMemo(() => sortRows(filtered, sort, stageById), [filtered, sort, stageById]);
  const open = useCallback((id: string) => router.push(`/application/${id}`), []);
  const onSort = useCallback(
    (column: ColumnId) => setSort(nextSort(sort, column)),
    [sort, setSort],
  );

  return (
    <Screen edges={['top']} padded={false} testID="table-screen">
      <View style={styles.top}>
        <ScreenHeader
          title={t('tabs.table')}
          right={
            <>
              <IconButton
                icon={Columns3}
                accessibilityLabel={t('table.columns')}
                onPress={() => setColumnsOpen(true)}
                testID="open-columns"
              />
              <IconButton
                icon={Plus}
                accessibilityLabel={t('applications.add')}
                onPress={() => router.push('/add')}
                variant="filled"
              />
            </>
          }
        />
        {total > 0 ? (
          <SearchBar
            value={query.search}
            onChange={query.setSearch}
            onOpenFilters={() => setFiltersOpen(true)}
            activeFilters={countActiveFilters(query.filter)}
          />
        ) : null}
      </View>
      {total === 0 ? (
        <EmptyState
          icon={Table2}
          title={t('applications.emptyTitle')}
          body={t('applications.emptyBody')}
          actionLabel={t('applications.add')}
          onAction={() => router.push('/add')}
        />
      ) : rows.length === 0 && isFilterActive(query.filter) ? (
        <EmptyState
          icon={SearchX}
          title={t('filters.noResults')}
          body={t('filters.noResultsBody')}
          actionLabel={t('common.reset')}
          onAction={() => {
            query.setSearch('');
            query.resetFilter();
          }}
        />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          sort={sort}
          onSort={onSort}
          onOpen={open}
          stageById={stageById}
          locale={locale}
        />
      )}
      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filter={query.filter}
        onChange={query.setFilter}
        onReset={query.resetFilter}
        stages={stages}
      />
      <ColumnsSheet
        visible={columnsOpen}
        onClose={() => setColumnsOpen(false)}
        columns={columns}
        onChange={setColumns}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: space.lg, paddingBottom: space.md },
});
