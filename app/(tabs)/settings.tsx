import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useLanguagePreference, useThemePreference } from '@/features/settings/preferences';
import type { LanguagePreference } from '@/i18n';
import {
  ListRow,
  ListSection,
  Screen,
  Segmented,
  Select,
  Stack,
  Text,
  type ThemePreference,
} from '@/ui';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const [theme, setTheme] = useThemePreference();
  const [language, setLanguage] = useLanguagePreference();
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <Screen scroll>
      <Stack gap="sm">
        <Text variant="subhead" color="textMuted">
          {t('settings.theme')}
        </Text>
        <Segmented<ThemePreference>
          accessibilityLabel={t('settings.theme')}
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: t('settings.themeSystem') },
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
          testID="settings-theme"
        />
      </Stack>

      <Select<LanguagePreference>
        label={t('settings.language')}
        value={language}
        onChange={setLanguage}
        placeholder={t('settings.languageSystem')}
        closeLabel={t('common.close')}
        options={[
          { value: 'system', label: t('settings.languageSystem') },
          { value: 'ru', label: 'Русский' },
          { value: 'de', label: 'Deutsch' },
          { value: 'en', label: 'English' },
        ]}
        testID="settings-language"
      />

      <ListSection title={t('settings.tracker')}>
        <ListRow title={t('stagesEditor.title')} onPress={() => router.push('/stages')} last />
      </ListSection>

      <ListSection title={t('settings.about')} footer={t('settings.privacyNote')}>
        <ListRow title={t('settings.version')} value={version} last={!__DEV__} />
        {__DEV__ ? (
          <ListRow title="UI showcase" onPress={() => router.push('/dev/ui')} last />
        ) : null}
      </ListSection>
    </Screen>
  );
}
