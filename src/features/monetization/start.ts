import { useEffect } from 'react';

import { settingsRepo } from '@/features/settings/hooks';

import { startAds } from './ads';
import { hydrateMonetization } from './persist';
import { startPurchases } from './purchases';

/** Starts purchases and ads once the database is ready. Safe to call in Expo Go. */
export function useStartMonetization(): void {
  useEffect(() => {
    hydrateMonetization(settingsRepo);
    void startPurchases();
    void startAds();
  }, []);
}
