import { ArrowDown, ArrowUp, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Stage } from '@/db/schema';
import { useAllApplications } from '@/features/applications/hooks';
import { stagesRepo, useStages } from '@/features/stages/hooks';
import { stageColor, stageLabel } from '@/features/stages/label';
import { StageEditorSheet, type StageDraft } from '@/features/stages/StageEditorSheet';
import { Button, IconButton, ListRow, ListSection, Row, Screen, StageDot } from '@/ui';

type Editing = { stage: Stage | null } | null;

export default function StagesScreen() {
  const { t } = useTranslation();
  const stages = useStages();
  const applications = useAllApplications();
  const [editing, setEditing] = useState<Editing>(null);

  const countIn = (id: string) => applications.filter((a) => a.stageId === id).length;

  const save = (draft: StageDraft) => {
    if (!editing) return;
    const { stage } = editing;
    if (stage) {
      // Keep built-in stages translatable until the user actually renames them.
      const name =
        stage.key && draft.name === stageLabel({ ...stage, name: '' }, t) ? '' : draft.name;
      stagesRepo.update(stage.id, { ...draft, name });
    } else {
      stagesRepo.create(draft);
    }
    setEditing(null);
  };

  const describe = (stage: Stage) =>
    [
      stage.kind === 'closed' ? t('stagesEditor.kindClosed') : t('stagesEditor.kindActive'),
      stage.needsAction ? t('stagesEditor.needsAction') : null,
      stage.hidden ? t('stagesEditor.hiddenShort') : null,
      t('stagesEditor.count', { count: countIn(stage.id) }),
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <Screen scroll testID="stages-screen">
      <ListSection footer={t('stagesEditor.footer')}>
        {stages.map((stage, index) => (
          <ListRow
            key={stage.id}
            left={<StageDot color={stageColor(stage)} />}
            title={stageLabel(stage, t)}
            subtitle={describe(stage)}
            onPress={() => setEditing({ stage })}
            chevron={false}
            last={index === stages.length - 1}
            testID={`stage-row-${stage.key ?? stage.id}`}
            right={
              <Row gap="xxs">
                <IconButton
                  icon={ArrowUp}
                  accessibilityLabel={`${t('common.moveUp')}: ${stageLabel(stage, t)}`}
                  onPress={() => stagesRepo.move(stage.id, -1)}
                  disabled={index === 0}
                />
                <IconButton
                  icon={ArrowDown}
                  accessibilityLabel={`${t('common.moveDown')}: ${stageLabel(stage, t)}`}
                  onPress={() => stagesRepo.move(stage.id, 1)}
                  disabled={index === stages.length - 1}
                />
              </Row>
            }
          />
        ))}
      </ListSection>
      <Button
        label={t('stagesEditor.add')}
        icon={Plus}
        variant="secondary"
        onPress={() => setEditing({ stage: null })}
        testID="stage-add"
      />
      {editing ? (
        <StageEditorSheet
          key={editing.stage?.id ?? 'new'}
          visible
          stage={editing.stage}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={
            editing.stage
              ? (moveTo) => {
                  stagesRepo.remove(editing.stage!.id, moveTo);
                  setEditing(null);
                }
              : undefined
          }
          otherStages={stages.filter((s) => s.id !== editing.stage?.id)}
          applicationCount={editing.stage ? countIn(editing.stage.id) : 0}
        />
      ) : null}
    </Screen>
  );
}
