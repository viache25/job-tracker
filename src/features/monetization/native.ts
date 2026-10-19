import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type AdsModule = typeof import('react-native-google-mobile-ads');
type PurchasesModule = typeof import('react-native-purchases');
type TrackingModule = typeof import('expo-tracking-transparency');

/**
 * Ads and purchases ship native code that Expo Go and the web build do not have.
 * There the modules are reported as missing and the app simply runs without ads.
 */
export const nativeMonetization =
  Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

function load<T>(get: () => T): T | null {
  if (!nativeMonetization) return null;
  try {
    return get();
  } catch {
    return null;
  }
}

let ads: AdsModule | null | undefined;
let purchases: PurchasesModule | null | undefined;
let tracking: TrackingModule | null | undefined;

/* eslint-disable @typescript-eslint/no-require-imports -- lazy so Expo Go never loads them */
export function adsModule(): AdsModule | null {
  if (ads === undefined) ads = load(() => require('react-native-google-mobile-ads') as AdsModule);
  return ads;
}

export function purchasesModule(): PurchasesModule | null {
  if (purchases === undefined)
    purchases = load(() => require('react-native-purchases') as PurchasesModule);
  return purchases;
}

export function trackingModule(): TrackingModule | null {
  if (tracking === undefined)
    tracking = load(() => require('expo-tracking-transparency') as TrackingModule);
  return tracking;
}
/* eslint-enable @typescript-eslint/no-require-imports */
