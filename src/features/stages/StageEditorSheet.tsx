import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Stage, StageKind } from '@/db/schema';
import {
  Banner,
  BottomSheet,
  Button,
  Icon,
  ListSection,
  radius,
  Row,
  Segmented,
  Select,
  size,
  STAGE_COLORS,
  StageDot,
  Stack,
  SwitchRow,
  Text,
  TextField,
  useTheme,
  type StageColor,
} from '@/ui';

import { stageColor, stageLabel } from './label';

export type StageDraft = {
  name: string;
  color: StageColor;
  kind: StageKind;
  needsAction: boolean;
  hidden: boolean;
};

export function StageEditorSheet({
  stage,
  visible,
  onClose,
  onSave,
  onDelete,
  otherStages,
  applicationCount,
}: {
  /** null creates a new stage. */
  stage: Stage | null;
  visible: boolean;
  onClose: () => void;
  onSave: (draft: StageDraft) => void;
  onDelete?: (moveTo?: string) => void;
  otherStages: readonly Stage[];
  applicationCount: number;
}) {
  const { t } = useTranslation();
  const { stageColor: palette, colors } = useTheme();
  const [draft, setDraft] = useState<StageDraft>(() => ({
    name: stage ? stageLabel(stage, t) : '',
    color: stage ? stageColor(stage) : 'blue',
    kind: stage?.kind ?? 'active',
    needsAction: stage?.needsAction ?? false,
    hidden: stage?.hidden ?? false,
  }));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [moveTo, setMoveTo] = useState<string | undefined>(otherStages[0]?.id);
  const valid = draft.name.trim().length > 0;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={stage ? t('stagesEditor.edit') : t('stagesEditor.add')}
      closeLabel={t('common.close')}
      testID="stage-editor"
      footer={
        <Button
          label={t('common.save')}
          onPress={() => onSave({ ...draft, name: draft.name.trim() })}
          disabled={!valid}
          testID="stage-save"
        />
      }
    >
      <Stack gap="lg">
        <TextField
          label={t('stagesEditor.name')}
          value={draft.name}
          onChangeText={(name) => setDraft({ ...draft, name })}
          autoFocus={!stage}
          testID="stage-name"
        />
        <Stack gap="sm">
          <Text variant="subhead" color="textMuted">
            {t('stagesEditor.color')}
          </Text>
          <Row wrap gap="sm">
            {STAGE_COLORS.map((color) => {
              const selected = draft.color === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => setDraft({ ...draft, color })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t(`colors.${color}`)}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: palette(color).bg,
                      borderColor: selected ? palette(color).fg : colors.border,
                    },
                  ]}
                >
                  {selected ? (
                    <Icon icon={Check} tint={palette(color).fg} size="small" />
                  ) : (
                    <View style={[styles.dot, { backgroundColor: palette(color).fg }]} />
                  )}
                </Pressable>
              );
            })}
          </Row>
        </Stack>
        <Stack gap="sm">
          <Text variant="subhead" color="textMuted">
            {t('stagesEditor.kind')}
          </Text>
          <Segmented<StageKind>
            accessibilityLabel={t('stagesEditor.kind')}
            value={draft.kind}
            onChange={(kind) => setDraft({ ...draft, kind })}
            options={[
              { value: 'active', label: t('stagesEditor.kindActive') },
              { value: 'closed', label: t('stagesEditor.kindClosed') },
            ]}
          />
          <Text variant="footnote" color="textSubtle">
            {t('stagesEditor.kindHint')}
          </Text>
        </Stack>
        <ListSection>
          <SwitchRow
            label={t('stagesEditor.needsAction')}
            description={t('stagesEditor.needsActionHint')}
            value={draft.needsAction}
            onChange={(needsAction) => setDraft({ ...draft, needsAction })}
          />
          <SwitchRow
            label={t('stagesEditor.hidden')}
            description={t('stagesEditor.hiddenHint')}
            value={draft.hidden}
            onChange={(hidden) => setDraft({ ...draft, hidden })}
            last
          />
        </ListSection>

        {stage && onDelete ? (
          confirmDelete ? (
            <Banner
              tone="error"
              title={t('stagesEditor.deleteTitle')}
              body={
                applicationCount > 0
                  ? t('stagesEditor.deleteMoveBody', { count: applicationCount })
                  : t('stagesEditor.deleteBody')
              }
            >
              <Stack gap="sm" style={styles.fill}>
                {applicationCount > 0 ? (
                  <Select
                    label={t('stagesEditor.moveTo')}
                    value={moveTo}
                    onChange={setMoveTo}
                    placeholder={t('stagesEditor.moveTo')}
                    closeLabel={t('common.close')}
                    options={otherStages.map((s) => ({
                      value: s.id,
                      label: stageLabel(s, t),
                      left: <StageDot color={stageColor(s)} />,
                    }))}
                  />
                ) : null}
                <Row>
                  <Button
                    label={t('common.cancel')}
                    size="small"
                    variant="secondary"
                    onPress={() => setConfirmDelete(false)}
                  />
                  <Button
                    label={t('common.delete')}
                    size="small"
                    variant="danger"
                    disabled={applicationCount > 0 && !moveTo}
                    onPress={() => onDelete(applicationCount > 0 ? moveTo : undefined)}
                    testID="stage-delete-confirm"
                  />
                </Row>
              </Stack>
            </Banner>
          ) : (
            <Button
              label={t('stagesEditor.delete')}
              variant="ghost"
              onPress={() => setConfirmDelete(true)}
              testID="stage-delete"
            />
          )
        ) : null}
      </Stack>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  swatch: {
    width: size.hit,
    height: size.hit,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: size.dot, height: size.dot, borderRadius: radius.pill },
  fill: { flex: 1 },
});
