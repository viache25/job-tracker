import { Tabs } from 'expo-router';
import { List, Settings, Table2, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { fontFamily, size, useTheme } from '@/ui';

function tabIcon(Glyph: LucideIcon) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Glyph color={color} size={size.icon} strokeWidth={2} />;
  };
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: fontFamily.semibold, color: colors.text },
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fontFamily.medium },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.applications'), tabBarIcon: tabIcon(List) }}
      />
      <Tabs.Screen name="table" options={{ title: t('tabs.table'), tabBarIcon: tabIcon(Table2) }} />
      <Tabs.Screen
        name="settings"
        options={{ title: t('tabs.settings'), tabBarIcon: tabIcon(Settings) }}
      />
    </Tabs>
  );
}
