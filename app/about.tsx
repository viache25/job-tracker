import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

import { openLegal } from '@/features/monetization/links';
import { ListRow, ListSection, Screen, Stack, Text } from '@/ui';

export default function AboutScreen() {
  const { t } = useTranslation();
  const version = Constants.expoConfig?.version ?? '—';
  return (
    <Screen scroll testID="about-screen">
      <Stack gap="xs">
        <Text variant="display">Job Tracker</Text>
        <Text variant="callout" color="textMuted">
          {t('about.by', { studio: 'Trineon' })}
        </Text>
      </Stack>
      <ListSection>
        <ListRow title={t('settings.version')} value={version} />
        <ListRow
          title={t('about.support')}
          value="support@trineon.dev"
          onPress={() => openLegal('support')}
          last
        />
      </ListSection>
      <ListSection footer={t('settings.privacyNote')}>
        <ListRow title={t('about.privacy')} onPress={() => openLegal('privacy')} />
        <ListRow title={t('about.terms')} onPress={() => openLegal('terms')} />
        <ListRow title={t('about.imprint')} onPress={() => openLegal('imprint')} last />
      </ListSection>
    </Screen>
  );
}
