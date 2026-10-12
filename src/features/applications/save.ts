import type { Application, FieldSource } from '@/db/schema';
import { sha256 } from '@/lib/crypto';

import { mergeFieldSources, toApplicationInput, type ApplicationFormValues } from './formSchema';
import type { ApplicationInput, ApplicationsRepo } from './repo';

export type SaveResult =
  { ok: true; application: Application } | { ok: false; duplicate: Application };

/**
 * Creates an application from form values. A URL that already exists is reported as a
 * duplicate instead (unless `allowDuplicate`), so the user can open the existing one.
 */
export async function createFromForm(
  repo: ApplicationsRepo,
  values: ApplicationFormValues,
  {
    extras = {},
    fieldSources = {},
    dirty = {},
    allowDuplicate = false,
  }: {
    extras?: Partial<ApplicationInput>;
    fieldSources?: Partial<Record<string, FieldSource>>;
    dirty?: Partial<Record<keyof ApplicationFormValues, unknown>>;
    allowDuplicate?: boolean;
  } = {},
): Promise<SaveResult> {
  const input = toApplicationInput(values, extras);
  input.urlHash = input.url ? await sha256(input.url) : null;
  if (input.urlHash && !allowDuplicate) {
    const existing = repo.findByUrlHash(input.urlHash);
    if (existing) return { ok: false, duplicate: existing };
  }
  input.fieldSources = mergeFieldSources(fieldSources, dirty);
  return { ok: true, application: repo.create(input) };
}

export async function updateFromForm(
  repo: ApplicationsRepo,
  current: Application,
  values: ApplicationFormValues,
  dirty: Partial<Record<keyof ApplicationFormValues, unknown>>,
): Promise<Application> {
  const input = toApplicationInput(values);
  input.urlHash = input.url ? await sha256(input.url) : null;
  input.fieldSources = mergeFieldSources(current.fieldSources, dirty);
  return repo.update(current.id, input);
}
