import {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  useFonts,
} from '@expo-google-fonts/onest';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDatabaseReady } from '@/db/useDatabaseReady';
import { useResolvedLanguage, useThemePreference } from '@/features/settings/preferences';
import i18n from '@/i18n';
import { palette, space, ThemeProvider, typography, useTheme } from '@/ui';
import { useStackScreenOptions } from '@/ui/navigation';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
  });
  const db = useDatabaseReady();
  const ready = (fontsLoaded || !!fontError) && db.ready;

  useEffect(() => {
    if (ready || db.error) void SplashScreen.hideAsync();
  }, [ready, db.error]);

  if (db.error) {
    const cause = db.error.cause instanceof Error ? `\n\n${db.error.cause.message}` : '';
    return <DatabaseError message={`${db.error.message}${cause}`} />;
  }
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <Preferences>
          <RootStack />
        </Preferences>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

/** Applies the saved theme and language. Rendered only once the database is ready. */
function Preferences({ children }: { children: React.ReactNode }) {
  const [theme] = useThemePreference();
  const language = useResolvedLanguage();
  if (i18n.language !== language) void i18n.changeLanguage(language);
  return <ThemeProvider preference={theme}>{children}</ThemeProvider>;
}

function RootStack() {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  const screenOptions = useStackScreenOptions();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: t('tabs.applications') }}
        />
        <Stack.Screen name="application/[id]" options={{ title: '' }} />
        <Stack.Screen name="application/form" options={{ title: t('form.newTitle') }} />
        <Stack.Screen name="add" options={{ presentation: 'modal', title: t('add.title') }} />
        <Stack.Screen name="stages" options={{ title: t('stagesEditor.title') }} />
        <Stack.Screen name="dev/ui" options={{ title: 'UI' }} />
      </Stack>
    </>
  );
}

/** Shown if the database cannot be opened; deliberately plain (no theme or i18n yet). */
function DatabaseError({ message }: { message: string }) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>Database error</Text>
      <Text selectable>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    justifyContent: 'center',
    padding: space.xxl,
    gap: space.md,
    backgroundColor: palette.light.background,
  },
  errorTitle: {
    fontSize: typography.title.fontSize,
    lineHeight: typography.title.lineHeight,
    color: palette.light.text,
  },
});
