import type { StageColor } from '@/ui/tokens';

import type { StageKind } from './schema';

export type DefaultStage = {
  key: string;
  color: StageColor;
  kind: StageKind;
  needsAction: boolean;
};

/** Built-in funnel stages (PRD 5.2). Names come from i18n by key until the user renames them. */
export const DEFAULT_STAGES: readonly DefaultStage[] = [
  { key: 'wishlist', color: 'slate', kind: 'active', needsAction: false },
  { key: 'applied', color: 'blue', kind: 'active', needsAction: false },
  { key: 'acknowledged', color: 'teal', kind: 'active', needsAction: false },
  { key: 'action', color: 'amber', kind: 'active', needsAction: true },
  { key: 'test', color: 'violet', kind: 'active', needsAction: true },
  { key: 'interview', color: 'orange', kind: 'active', needsAction: true },
  { key: 'offer', color: 'green', kind: 'active', needsAction: true },
  { key: 'rejected', color: 'red', kind: 'closed', needsAction: false },
  { key: 'withdrawn', color: 'gray', kind: 'closed', needsAction: false },
];

/** Stage new applications land in when nothing else is chosen. */
export const DEFAULT_STAGE_KEY = 'wishlist';
