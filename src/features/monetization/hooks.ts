import { useEffect, useState } from 'react';

import { adFreeRemaining, adsAllowed, displayAdsAllowed } from './policy';
import { useMonetization } from './store';

/** Current time, refreshed every `intervalMs` so countdowns and expiries re-render. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function useGate() {
  const premium = useMonetization((s) => s.premium);
  const canRequestAds = useMonetization((s) => s.canRequestAds);
  const available = useMonetization((s) => s.adsAvailable);
  return { premium, canRequestAds, available };
}

/** Banner and interstitial may show right now. */
export function useDisplayAds(): boolean {
  const gate = useGate();
  const ads = useMonetization((s) => s.ads);
  return displayAdsAllowed(gate, ads, useNow());
}

/** State for the "12 hours without ads" action. */
export function useReward() {
  const gate = useGate();
  const ready = useMonetization((s) => s.rewardedReady);
  const ads = useMonetization((s) => s.ads);
  const remainingMs = adFreeRemaining(ads, useNow());
  return {
    /** The action makes sense at all (not premium, ads possible in this build). */
    visible: adsAllowed(gate),
    ready,
    remainingMs,
  };
}

export function usePremium(): boolean {
  return useMonetization((s) => s.premium);
}
