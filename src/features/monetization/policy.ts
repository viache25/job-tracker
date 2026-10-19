import { z } from 'zod';

/** Interstitials appear after a random number of new applications in this range. */
export const INTERSTITIAL_GAP = { min: 2, max: 6 } as const;
/** How long one rewarded video keeps ads away. */
export const REWARD_DURATION_MS = 12 * 60 * 60 * 1000;

export const adsStateSchema = z.object({
  /** New applications saved since the last interstitial. */
  saves: z.number().int().min(0),
  /** How many saves the next interstitial waits for. */
  gap: z.number().int().min(INTERSTITIAL_GAP.min).max(INTERSTITIAL_GAP.max),
  /** ISO time until which ads are hidden after a rewarded video. */
  adFreeUntil: z.string().nullable(),
});
export type AdsState = z.infer<typeof adsStateSchema>;

export type Random = () => number;

export function randomGap(random: Random = Math.random): number {
  const span = INTERSTITIAL_GAP.max - INTERSTITIAL_GAP.min + 1;
  const n = INTERSTITIAL_GAP.min + Math.floor(random() * span);
  return Math.min(INTERSTITIAL_GAP.max, Math.max(INTERSTITIAL_GAP.min, n));
}

export function initialAdsState(random: Random = Math.random): AdsState {
  return { saves: 0, gap: randomGap(random), adFreeUntil: null };
}

/** Counts a newly created application; `due` means an interstitial may be shown now. */
export function registerSave(state: AdsState): { state: AdsState; due: boolean } {
  const saves = state.saves + 1;
  return { state: { ...state, saves }, due: saves >= state.gap };
}

/** After an interstitial was shown: start counting again towards a fresh random gap. */
export function afterInterstitial(state: AdsState, random: Random = Math.random): AdsState {
  return { ...state, saves: 0, gap: randomGap(random) };
}

export function grantReward(state: AdsState, now: Date): AdsState {
  return { ...state, adFreeUntil: new Date(now.getTime() + REWARD_DURATION_MS).toISOString() };
}

/** Milliseconds of ad-free time left, 0 when none. */
export function adFreeRemaining(state: Pick<AdsState, 'adFreeUntil'>, now: Date): number {
  if (!state.adFreeUntil) return 0;
  const until = Date.parse(state.adFreeUntil);
  if (Number.isNaN(until)) return 0;
  return Math.max(0, until - now.getTime());
}

export type AdsGate = {
  /** The user has the premium entitlement. */
  premium: boolean;
  /** Consent flow finished and Google allows ad requests. */
  canRequestAds: boolean;
  /** Native ads module is present (false in Expo Go and on web). */
  available: boolean;
};

/** Whether ads may be loaded at all (rewarded video included). */
export function adsAllowed(gate: AdsGate): boolean {
  return gate.available && gate.canRequestAds && !gate.premium;
}

/** Whether banner and interstitial may show right now. */
export function displayAdsAllowed(gate: AdsGate, state: AdsState, now: Date): boolean {
  return adsAllowed(gate) && adFreeRemaining(state, now) === 0;
}
