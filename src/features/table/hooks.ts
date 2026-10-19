import { useMemo } from 'react';

import { SETTING_KEYS } from '@/features/settings/preferences';
import { useSetting } from '@/features/settings/hooks';

import {
  columnConfigSchema,
  DEFAULT_COLUMNS,
  DEFAULT_TABLE_SORT,
  normalizeColumns,
  sortStateSchema,
  type ColumnConfig,
  type SortState,
} from './columns';

export function useTableColumns(): [ColumnConfig, (columns: ColumnConfig) => void] {
  const [stored, setStored] = useSetting(
    SETTING_KEYS.tableColumns,
    columnConfigSchema,
    DEFAULT_COLUMNS,
  );
  const columns = useMemo(() => normalizeColumns(stored), [stored]);
  return [columns, setStored];
}

export function useTableSort(): [SortState, (sort: SortState) => void] {
  return useSetting(SETTING_KEYS.tableSort, sortStateSchema, DEFAULT_TABLE_SORT);
}
