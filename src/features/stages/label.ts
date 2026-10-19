import type { TFunction } from 'i18next';

import type { Stage } from '@/db/schema';
import { isStageColor, type StageColor } from '@/ui/tokens';

const BUILT_IN = [
  'wishlist',
  'applied',
  'acknowledged',
  'action',
  'test',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
] as const;
type BuiltInKey = (typeof BUILT_IN)[number];

function isBuiltIn(key: string | null): key is BuiltInKey {
  return key !== null && (BUILT_IN as readonly string[]).includes(key);
}

/** User-given name, else the translated built-in name. */
export function stageLabel(stage: Pick<Stage, 'name' | 'key'> | undefined, t: TFunction): string {
  if (!stage) return t('stages.unknown');
  const name = stage.name.trim();
  if (name) return name;
  if (isBuiltIn(stage.key)) return t(`stages.default.${stage.key}`);
  return t('stages.untitled');
}

export function stageColor(stage: Pick<Stage, 'color'> | undefined): StageColor {
  return stage && isStageColor(stage.color) ? stage.color : 'gray';
}
