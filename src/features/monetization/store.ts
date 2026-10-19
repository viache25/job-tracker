import { create } from 'zustand';

import { initialAdsState, type AdsState } from './policy';

export type MonetizationState = {
  /** Native ads module exists in this build. */
  adsAvailable: boolean;
  /** Consent gathered and Google allows requests. */
  canRequestAds: boolean;
  /** The privacy options form must be reachable from settings (GDPR regions). */
  privacyOptionsRequired: boolean;
  premium: boolean;
  /** Purchases are configured (store keys present, native module available). */
  purchasesReady: boolean;
  ads: AdsState;
  rewardedReady: boolean;
  /** Show the "one video = 12 hours without ads" hint after an interstitial. */
  rewardHint: boolean;
};

export const useMonetization = create<MonetizationState>(() => ({
  adsAvailable: false,
  canRequestAds: false,
  privacyOptionsRequired: false,
  premium: false,
  purchasesReady: false,
  ads: initialAdsState(),
  rewardedReady: false,
  rewardHint: false,
}));
