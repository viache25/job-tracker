import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import i18n, { LANGUAGES } from '@/i18n';
import { applicationsRepo } from '@/features/applications/hooks';
import { useStages } from '@/features/stages/hooks';
import { stageLabel } from '@/features/stages/label';

import { pickCsv, shareCsv } from './files';
import {
  applicationsToCsv,
  ImportError,
  importApplications,
  parseApplicationsCsv,
} from './transfer';

/** Export and import actions for the settings screen, with user-facing messages. */
export function useDataTransfer() {
  const { t } = useTranslation();
  const stages = useStages();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const exportCsv = async () => {
    const list = applicationsRepo.list();
    if (list.length === 0) {
      Alert.alert(t('data.nothingToExport'));
      return;
    }
    setBusy('export');
    try {
      const byId = new Map(stages.map((s) => [s.id, s]));
      const csv = applicationsToCsv(list, (id) => stageLabel(byId.get(id), t));
      const date = new Date().toISOString().slice(0, 10);
      if (!(await shareCsv(csv, `job-tracker-${date}.csv`))) Alert.alert(t('data.exportFailed'));
    } catch {
      Alert.alert(t('data.exportFailed'));
    } finally {
      setBusy(null);
    }
  };

  const importCsv = async () => {
    setBusy('import');
    try {
      const text = await pickCsv();
      if (text === null) return;
      // Built-in stages are matched by their name in every UI language.
      const names = (s: (typeof stages)[number]) =>
        LANGUAGES.map((lng) => stageLabel(s, i18n.getFixedT(lng)));
      const parsed = parseApplicationsCsv(text, stages, names);
      const result = await importApplications(applicationsRepo, parsed);
      Alert.alert(
        t('data.importDone', { count: result.added }),
        t('data.importDetails', { skipped: result.skipped, invalid: result.invalid }),
      );
    } catch (e) {
      const reason = e instanceof ImportError ? e.reason : 'format';
      Alert.alert(t('data.importFailed'), t(`data.errors.${reason}`));
    } finally {
      setBusy(null);
    }
  };

  return { busy, exportCsv, importCsv };
}
