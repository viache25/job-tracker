import { useLocales } from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { localeFor, resolveLanguage, type Language, type LanguagePreference } from '@/i18n';
import type { ThemePreference } from '@/ui';

import { useSetting } from './hooks';

export const themePreferenceSchema = z.enum(['system', 'light', 'dark']);
export const languagePreferenceSchema = z.enum(['system', 'ru', 'de', 'en']);

export const SETTING_KEYS = {
  theme: 'theme',
  language: 'language',
  listSort: 'list.sort',
  listFilter: 'list.filter',
  tableColumns: 'table.columns',
  tableSort: 'table.sort',
} as const;

export function useThemePreference() {
  return useSetting<ThemePreference>(SETTING_KEYS.theme, themePreferenceSchema, 'system');
}

export function useLanguagePreference() {
  return useSetting<LanguagePreference>(SETTING_KEYS.language, languagePreferenceSchema, 'system');
}

/** Language the UI should use right now, following the device when set to "system". */
export function useResolvedLanguage(): Language {
  const [preference] = useLanguagePreference();
  const locales = useLocales();
  return resolveLanguage(
    preference,
    locales.map((l) => l.languageCode),
  );
}

/** Current UI language and the BCP 47 locale for Intl formatting. */
export function useLocale(): { language: Language; locale: string } {
  const { i18n } = useTranslation();
  const language = (['ru', 'de', 'en'] as const).find((l) => l === i18n.language) ?? 'ru';
  return { language, locale: localeFor(language) };
}
