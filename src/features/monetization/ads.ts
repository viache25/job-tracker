import { Platform } from 'react-native';
import type { InterstitialAd, RewardedAd } from 'react-native-google-mobile-ads';

import { settingsRepo } from '@/features/settings/hooks';

import { adUnitId } from './config';
import { adsModule, trackingModule } from './native';
import { saveAdsState } from './persist';
import {
  adsAllowed,
  afterInterstitial,
  displayAdsAllowed,
  grantReward,
  registerSave,
  type AdsGate,
} from './policy';
import { useMonetization } from './store';

const RETRY_MS = 60_000;

let interstitial: InterstitialAd | null = null;
let rewarded: RewardedAd | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let started = false;
let initialized = false;

function gate(): AdsGate {
  const s = useMonetization.getState();
  return { premium: s.premium, canRequestAds: s.canRequestAds, available: s.adsAvailable };
}

/**
 * Consent first (UMP, then ATT on iOS), then the SDK, then preloading.
 * Nothing is requested until Google says `canRequestAds`.
 */
export async function startAds(): Promise<void> {
  const m = adsModule();
  if (!m || started) return;
  started = true;
  useMonetization.setState({ adsAvailable: true });

  try {
    const info = await m.AdsConsent.gatherConsent(
      __DEV__ ? { debugGeography: m.AdsConsentDebugGeography.EEA } : undefined,
    );
    useMonetization.setState({
      canRequestAds: info.canRequestAds,
      privacyOptionsRequired:
        info.privacyOptionsRequirementStatus ===
        m.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
    });
  } catch {
    // Consent could not be gathered (offline). Google may still allow requests
    // from a previous session.
    const info = await m.AdsConsent.getConsentInfo().catch(() => null);
    useMonetization.setState({ canRequestAds: info?.canRequestAds ?? false });
  }

  await initializeAfterConsent();
}

async function initializeAfterConsent(): Promise<void> {
  const m = adsModule();
  if (!m || initialized || !useMonetization.getState().canRequestAds) return;
  initialized = true;
  await requestTracking();
  await m.default().initialize();
  preload();
  useMonetization.subscribe((s, prev) => {
    if (s.premium && !prev.premium) dropAds();
    if (!s.premium && prev.premium) preload();
  });
}

/** iOS App Tracking Transparency: asked once, after the consent form. */
async function requestTracking(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  const t = trackingModule();
  if (!t) return;
  try {
    const current = await t.getTrackingPermissionsAsync();
    if (current.status === 'undetermined' && current.canAskAgain)
      await t.requestTrackingPermissionsAsync();
  } catch {
    // Not fatal: ads fall back to non-personalized.
  }
}

function preload(): void {
  if (!initialized || !adsAllowed(gate())) return;
  loadInterstitial();
  loadRewarded();
}

function dropAds(): void {
  interstitial = null;
  rewarded = null;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  useMonetization.setState({ rewardedReady: false, rewardHint: false });
}

function retryLater(): void {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    preload();
  }, RETRY_MS);
}

function loadInterstitial(): void {
  const m = adsModule();
  if (!m || interstitial) return;
  const ad = m.InterstitialAd.createForAdRequest(adUnitId('interstitial'));
  ad.addAdEventListener(m.AdEventType.OPENED, () => {
    saveAdsState(settingsRepo, afterInterstitial(useMonetization.getState().ads));
  });
  ad.addAdEventListener(m.AdEventType.CLOSED, () => {
    interstitial = null;
    useMonetization.setState({ rewardHint: true });
    loadInterstitial();
  });
  ad.addAdEventListener(m.AdEventType.ERROR, () => {
    if (interstitial === ad) interstitial = null;
    retryLater();
  });
  interstitial = ad;
  ad.load();
}

function loadRewarded(): void {
  const m = adsModule();
  if (!m || rewarded) return;
  const ad = m.RewardedAd.createForAdRequest(adUnitId('rewarded'));
  ad.addAdEventListener(m.RewardedAdEventType.LOADED, () => {
    useMonetization.setState({ rewardedReady: true });
  });
  ad.addAdEventListener(m.AdEventType.ERROR, () => {
    if (rewarded === ad) rewarded = null;
    useMonetization.setState({ rewardedReady: false });
    retryLater();
  });
  rewarded = ad;
  ad.load();
}

/**
 * Called after a new application is saved. Shows the interstitial when the random
 * gap is reached and the ad is already loaded; otherwise the user is never kept waiting.
 */
export function onApplicationCreated(): void {
  const { ads } = useMonetization.getState();
  const { state, due } = registerSave(ads);
  saveAdsState(settingsRepo, state);
  if (!due || !displayAdsAllowed(gate(), state, new Date())) return;
  const ad = interstitial;
  if (!ad?.loaded) return;
  ad.show().catch(() => {
    interstitial = null;
    loadInterstitial();
  });
}

/** Plays the rewarded video; resolves true when it was watched to the end. */
export function showRewarded(): Promise<boolean> {
  const m = adsModule();
  const ad = rewarded;
  if (!m || !ad?.loaded) return Promise.resolve(false);
  return new Promise((resolve) => {
    let earned = false;
    const offEarned = ad.addAdEventListener(m.RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    const offClosed = ad.addAdEventListener(m.AdEventType.CLOSED, () => {
      offEarned();
      offClosed();
      rewarded = null;
      useMonetization.setState({ rewardedReady: false, rewardHint: false });
      if (earned)
        saveAdsState(settingsRepo, grantReward(useMonetization.getState().ads, new Date()));
      loadRewarded();
      resolve(earned);
    });
    ad.show().catch(() => {
      offEarned();
      offClosed();
      rewarded = null;
      useMonetization.setState({ rewardedReady: false });
      loadRewarded();
      resolve(false);
    });
  });
}

/** Re-opens Google's consent form from settings. */
export async function openPrivacyOptions(): Promise<void> {
  const m = adsModule();
  if (!m) return;
  const info = await m.AdsConsent.showPrivacyOptionsForm();
  useMonetization.setState({ canRequestAds: info.canRequestAds });
  if (!info.canRequestAds) dropAds();
  else if (initialized) preload();
  else await initializeAfterConsent();
}

export function dismissRewardHint(): void {
  useMonetization.setState({ rewardHint: false });
}
