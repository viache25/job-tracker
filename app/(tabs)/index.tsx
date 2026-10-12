import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ChevronDown, ChevronRight, Inbox, Plus, SearchX } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Application, Stage } from '@/db/schema';
import { ApplicationRow } from '@/features/applications/components/ApplicationRow';
import { FilterSheet } from '@/features/applications/components/FilterSheet';
import { SearchBar } from '@/features/applications/components/SearchBar';
import { countActiveFilters, groupByStage, isFilterActive } from '@/features/applications/filter';
import { useAllApplications, useApplications } from '@/features/applications/hooks';
import { useListQuery } from '@/features/applications/useListQuery';
import { useStages } from '@/features/stages/hooks';
import { stageColor, stageLabel } from '@/features/stages/label';
import {
  EmptyState,
  radius,
  size,
  Icon,
  IconButton,
  Screen,
  ScreenHeader,
  space,
  StageDot,
  Text,
  useTheme,
} from '@/ui';

type Item =
  | { type: 'header'; key: string; stage: Stage; count: number }
  | { type: 'archive'; key: string; count: number; open: boolean }
  | { type: 'row'; key: string; application: Application; showStage: boolean };

export default function ApplicationsScreen() {
  const { t } = useTranslation();
  const stages = useStages();
  const total = useAllApplications().length;
  const query = useListQuery();
  const rows = useApplications(query.filter, query.sort);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const stageById = useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);

  const items = useMemo<Item[]>(() => {
    const { groups, archive } = groupByStage(rows, stages);
    const out: Item[] = [];
    for (const group of groups) {
      out.push({
        type: 'header',
        key: `h-${group.stage.id}`,
        stage: group.stage,
        count: group.items.length,
      });
      for (const a of group.items)
        out.push({ type: 'row', key: a.id, application: a, showStage: false });
    }
    if (archive.length > 0) {
      out.push({ type: 'archive', key: 'archive', count: archive.length, open: archiveOpen });
      if (archiveOpen) {
        for (const a of archive)
          out.push({ type: 'row', key: a.id, application: a, showStage: true });
      }
    }
    return out;
  }, [rows, stages, archiveOpen]);

  const openApplication = useCallback((id: string) => router.push(`/application/${id}`), []);
  const add = () => router.push('/add');

  const renderItem = ({ item }: { item: Item }) => {
    switch (item.type) {
      case 'header':
        return <StageHeader stage={item.stage} count={item.count} />;
      case 'archive':
        return (
          <ArchiveToggle
            count={item.count}
            open={item.open}
            onPress={() => setArchiveOpen(!item.open)}
          />
        );
      case 'row':
        return (
          <View style={styles.rowWrap}>
            <ApplicationRow
              application={item.application}
              stage={stageById.get(item.application.stageId)}
              onPress={openApplication}
              showStage={item.showStage}
            />
          </View>
        );
    }
  };

  return (
    <Screen edges={['top']} testID="applications-screen">
      <ScreenHeader
        title={t('tabs.applications')}
        right={
          <IconButton
            icon={Plus}
            accessibilityLabel={t('applications.add')}
            onPress={add}
            variant="filled"
            testID="add-button"
          />
        }
      />
      {total === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t('applications.emptyTitle')}
          body={t('applications.emptyBody')}
          actionLabel={t('applications.add')}
          onAction={add}
          testID="applications-empty"
        />
      ) : (
        <>
          <SearchBar
            value={query.search}
            onChange={query.setSearch}
            onOpenFilters={() => setFiltersOpen(true)}
            activeFilters={countActiveFilters(query.filter)}
          />
          {items.length === 0 && isFilterActive(query.filter) ? (
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
            <FlashList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.key}
              getItemType={(item) => item.type}
              contentContainerStyle={styles.list}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            />
          )}
        </>
      )}
      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filter={query.filter}
        onChange={query.setFilter}
        onReset={query.resetFilter}
        stages={stages}
        sort={query.sort}
        onSortChange={query.setSort}
      />
    </Screen>
  );
}

function StageHeader({ stage, count }: { stage: Stage; count: number }) {
  const { t } = useTranslation();
  return (
    <View style={styles.header} accessibilityRole="header">
      <StageDot color={stageColor(stage)} />
      <Text variant="headline" style={styles.headerTitle}>
        {stageLabel(stage, t)}
      </Text>
      <Text variant="subhead" color="textSubtle">
        {count}
      </Text>
    </View>
  );
}

function ArchiveToggle({
  count,
  open,
  onPress,
}: {
  count: number;
  open: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`${t('applications.archive')}, ${count}`}
      testID="archive-toggle"
      style={({ pressed }) => [
        styles.header,
        styles.archive,
        pressed && { backgroundColor: colors.surfacePressed },
      ]}
    >
      <Icon icon={open ? ChevronDown : ChevronRight} color="textMuted" size="small" />
      <Text variant="headline" color="textMuted" style={styles.headerTitle}>
        {t('applications.archive')}
      </Text>
      <Text variant="subhead" color="textSubtle">
        {count}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: space.sm, paddingBottom: space.xxxl },
  rowWrap: { paddingBottom: space.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingTop: space.lg,
    paddingBottom: space.sm,
    minHeight: size.hit,
  },
  archive: { borderRadius: radius.md, paddingHorizontal: space.xs },
  headerTitle: { flex: 1 },
});
