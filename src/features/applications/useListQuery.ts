import { useMemo } from 'react';

import { SETTING_KEYS } from '@/features/settings/preferences';
import { useSetting } from '@/features/settings/hooks';

import {
  DEFAULT_SORT,
  EMPTY_FILTER,
  listFilterSchema,
  sortSchema,
  type ListFilter,
  type SortKey,
} from './filter';
import { useSearchStore } from './uiStore';

const storedFilterSchema = listFilterSchema.omit({ search: true });
type StoredFilter = Omit<ListFilter, 'search'>;
const { search: _ignored, ...EMPTY_STORED } = EMPTY_FILTER;

/** Filter (persisted, plus the in-memory search text) and sort shared by list and table. */
export function useListQuery() {
  const search = useSearchStore((s) => s.search);
  const setSearch = useSearchStore((s) => s.setSearch);
  const [stored, setStored] = useSetting<StoredFilter>(
    SETTING_KEYS.listFilter,
    storedFilterSchema,
    EMPTY_STORED,
  );
  const [sort, setSort] = useSetting<SortKey>(SETTING_KEYS.listSort, sortSchema, DEFAULT_SORT);
  const filter = useMemo<ListFilter>(() => ({ ...stored, search }), [stored, search]);

  return {
    filter,
    sort,
    search,
    setSearch,
    setSort,
    setFilter: (next: StoredFilter) => setStored(next),
    resetFilter: () => setStored(EMPTY_STORED),
  };
}
