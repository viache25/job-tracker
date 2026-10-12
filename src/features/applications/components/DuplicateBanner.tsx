import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { Application } from '@/db/schema';
import { Banner, Button } from '@/ui';

/** Shown when the link is already in the tracker; offers to open the existing application. */
export function DuplicateBanner({
  duplicate,
  onAddAnyway,
}: {
  duplicate: Application;
  onAddAnyway?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Banner
      tone="warning"
      title={t('duplicate.title')}
      body={t('duplicate.body', { company: duplicate.company, title: duplicate.title })}
      testID="duplicate-banner"
    >
      <Button
        label={t('duplicate.open')}
        size="small"
        onPress={() => router.replace(`/application/${duplicate.id}`)}
        testID="duplicate-open"
      />
      {onAddAnyway ? (
        <Button
          label={t('duplicate.addAnyway')}
          size="small"
          variant="secondary"
          onPress={onAddAnyway}
        />
      ) : null}
    </Banner>
  );
}
