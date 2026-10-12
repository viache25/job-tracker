import { useTranslation } from 'react-i18next';

import { WORK_MODES, type Stage } from '@/db/schema';
import { stageLabel } from '@/features/stages/label';
import {
  BottomSheet,
  Button,
  ListSection,
  Row,
  Segmented,
  Stack,
  SwitchRow,
  Tag,
  Text,
} from '@/ui';

import { SORT_KEYS, type ListFilter, type SortKey } from '../filter';

type StoredFilter = Omit<ListFilter, 'search'>;

export type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  filter: StoredFilter;
  onChange: (filter: StoredFilter) => void;
  onReset: () => void;
  stages: readonly Stage[];
  /** The table sorts by column headers, so it hides this block. */
  sort?: SortKey;
  onSortChange?: (sort: SortKey) => void;
};

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterSheet({
  visible,
  onClose,
  filter,
  onChange,
  onReset,
  stages,
  sort,
  onSortChange,
}: FilterSheetProps) {
  const { t } = useTranslation();
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('filters.title')}
      closeLabel={t('common.close')}
      testID="filter-sheet"
      footer={
        <Row>
          <Button label={t('common.reset')} variant="secondary" onPress={onReset} />
          <Button label={t('common.done')} onPress={onClose} fullWidth />
        </Row>
      }
    >
      <Stack gap="lg">
        {sort && onSortChange ? (
          <Stack gap="sm">
            <Text variant="subhead" color="textMuted">
              {t('filters.sort')}
            </Text>
            <Segmented<SortKey>
              accessibilityLabel={t('filters.sort')}
              value={sort}
              onChange={onSortChange}
              options={SORT_KEYS.map((key) => ({ value: key, label: t(`filters.sortBy.${key}`) }))}
            />
          </Stack>
        ) : null}

        <Stack gap="sm">
          <Text variant="subhead" color="textMuted">
            {t('filters.stage')}
          </Text>
          <Row wrap>
            {stages.map((stage) => (
              <Tag
                key={stage.id}
                label={stageLabel(stage, t)}
                selected={filter.stageIds.includes(stage.id)}
                onPress={() => onChange({ ...filter, stageIds: toggle(filter.stageIds, stage.id) })}
                testID={`filter-stage-${stage.key ?? stage.id}`}
              />
            ))}
          </Row>
          {filter.stageIds.length === 0 ? (
            <Text variant="footnote" color="textSubtle">
              {t('filters.allStages')}
            </Text>
          ) : null}
        </Stack>

        <Stack gap="sm">
          <Text variant="subhead" color="textMuted">
            {t('filters.workMode')}
          </Text>
          <Row wrap>
            {WORK_MODES.map((mode) => (
              <Tag
                key={mode}
                label={t(`workMode.${mode}`)}
                selected={filter.workModes.includes(mode)}
                onPress={() => onChange({ ...filter, workModes: toggle(filter.workModes, mode) })}
              />
            ))}
          </Row>
        </Stack>

        <ListSection>
          <SwitchRow
            label={t('filters.hasSalary')}
            value={filter.hasSalary}
            onChange={(hasSalary) => onChange({ ...filter, hasSalary })}
          />
          <SwitchRow
            label={t('filters.deadlineSoon')}
            value={filter.deadlineSoon}
            onChange={(deadlineSoon) => onChange({ ...filter, deadlineSoon })}
            last
          />
        </ListSection>
      </Stack>
    </BottomSheet>
  );
}
