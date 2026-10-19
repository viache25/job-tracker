import { z } from 'zod';

import type { SettingsRepo } from '@/features/settings/repo';

import { adsStateSchema, initialAdsState, type AdsState } from './policy';
import { useMonetization } from './store';

export const MONETIZATION_KEYS = { ads: 'ads.state', premium: 'premium.active' } as const;

/** Loads the saved ad counters and the last known premium status into the store. */
export function hydrateMonetization(repo: SettingsRepo): void {
  useMonetization.setState({
    ads: repo.get(MONETIZATION_KEYS.ads, adsStateSchema, initialAdsState()),
    premium: repo.get(MONETIZATION_KEYS.premium, z.boolean(), false),
  });
}

export function saveAdsState(repo: SettingsRepo, ads: AdsState): void {
  useMonetization.setState({ ads });
  repo.set(MONETIZATION_KEYS.ads, ads);
}

/** Remembers premium so it survives going offline. */
export function savePremium(repo: SettingsRepo, premium: boolean): void {
  if (useMonetization.getState().premium !== premium) useMonetization.setState({ premium });
  repo.set(MONETIZATION_KEYS.premium, premium);
}
