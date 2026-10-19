import { Platform } from 'react-native';

/**
 * Production ad unit IDs from the AdMob dashboard (list_banner, after_save_interstitial,
 * no_ads_12h_rewarded). Development builds always use Google's test units, so nobody
 * clicks real ads by accident.
 */
const PRODUCTION_AD_UNITS: Record<'ios' | 'android', Record<AdPlacement, string | null>> = {
  android: {
    banner: 'ca-app-pub-5676291919327888/7498210391',
    interstitial: 'ca-app-pub-5676291919327888/5175299381',
    rewarded: 'ca-app-pub-5676291919327888/6330352972',
  },
  ios: {
    banner: 'ca-app-pub-5676291919327888/9071321522',
    interstitial: 'ca-app-pub-5676291919327888/5913665982',
    rewarded: 'ca-app-pub-5676291919327888/4139303908',
  },
};

export type AdPlacement = 'banner' | 'interstitial' | 'rewarded';

const TEST_AD_UNITS: Record<'ios' | 'android', Record<AdPlacement, string>> = {
  android: {
    banner: 'ca-app-pub-3940256099942544/9214589741',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2435281174',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
};

/** Preview builds for testers set this so they never see (or tap) real ads. */
const FORCE_TEST_ADS = process.env.EXPO_PUBLIC_TEST_ADS === '1';

export function adUnitId(placement: AdPlacement, { dev = __DEV__ || FORCE_TEST_ADS } = {}): string {
  const os = Platform.OS === 'ios' ? 'ios' : 'android';
  const production = PRODUCTION_AD_UNITS[os][placement];
  return !dev && production ? production : TEST_AD_UNITS[os][placement];
}

/** RevenueCat public SDK keys (safe to ship); EAS env values override them. */
const REVENUECAT_KEYS = {
  android: 'goog_KfRizwtKxOCCEvlaxAIOMTgnSAP',
  ios: null,
} as const;

export function revenueCatKey(): string | null {
  const fromEnv =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  return fromEnv || (Platform.OS === 'ios' ? REVENUECAT_KEYS.ios : REVENUECAT_KEYS.android);
}

/** The single RevenueCat entitlement that removes ads. */
export const PREMIUM_ENTITLEMENT = 'premium';

export const LEGAL_LINKS = {
  privacy: 'https://trineon.dev/privacy.html',
  terms: 'https://trineon.dev/terms.html',
  imprint: 'https://trineon.dev/impressum.html',
  support: 'mailto:support@trineon.dev',
} as const;
