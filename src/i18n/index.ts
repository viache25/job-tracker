import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './de.json';
import en from './en.json';
import ru from './ru.json';

export const LANGUAGES = ['ru', 'de', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];
export type LanguagePreference = Language | 'system';

export const DEFAULT_LANGUAGE: Language = 'ru';

export const resources = {
  ru: { translation: ru },
  de: { translation: de },
  en: { translation: en },
} as const;

function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

/** Picks the UI language: explicit preference, else the first supported device language, else ru. */
export function resolveLanguage(
  preference: LanguagePreference,
  deviceLanguageCodes: readonly (string | null | undefined)[],
): Language {
  if (preference !== 'system') return preference;
  for (const code of deviceLanguageCodes) {
    const short = code?.toLowerCase().split(/[-_]/)[0];
    if (short && isLanguage(short)) return short;
  }
  return DEFAULT_LANGUAGE;
}

/** BCP 47 locale for Intl helpers. */
export function localeFor(language: Language): string {
  return { ru: 'ru-RU', de: 'de-AT', en: 'en-GB' }[language];
}

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
