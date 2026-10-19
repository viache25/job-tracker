import {
  adFreeRemaining,
  adsAllowed,
  afterInterstitial,
  displayAdsAllowed,
  grantReward,
  initialAdsState,
  randomGap,
  registerSave,
  REWARD_DURATION_MS,
} from './policy';

const gate = { premium: false, canRequestAds: true, available: true };

describe('randomGap', () => {
  it('stays within 2..6 for the whole random range', () => {
    expect(randomGap(() => 0)).toBe(2);
    expect(randomGap(() => 0.5)).toBe(4);
    expect(randomGap(() => 0.9999)).toBe(6);
    expect(randomGap(() => 1)).toBe(6);
  });
});

describe('interstitial counter', () => {
  it('becomes due after `gap` saves and resets after showing', () => {
    let state = { ...initialAdsState(() => 0), gap: 3 };
    const results: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      const r = registerSave(state);
      state = r.state;
      results.push(r.due);
    }
    expect(results).toEqual([false, false, true]);
    state = afterInterstitial(state, () => 0.99);
    expect(state.saves).toBe(0);
    expect(state.gap).toBe(6);
  });

  it('stays due when the ad was not ready, so the next save can show it', () => {
    const state = { saves: 4, gap: 4, adFreeUntil: null };
    expect(registerSave(state).due).toBe(true);
  });
});

describe('reward', () => {
  const now = new Date('2026-10-19T10:00:00Z');

  it('hides display ads for 12 hours', () => {
    const state = grantReward(initialAdsState(), now);
    expect(adFreeRemaining(state, now)).toBe(REWARD_DURATION_MS);
    expect(displayAdsAllowed(gate, state, new Date('2026-10-19T21:59:00Z'))).toBe(false);
    expect(displayAdsAllowed(gate, state, new Date('2026-10-19T22:00:00Z'))).toBe(true);
  });

  it('treats a broken timestamp as no reward', () => {
    expect(adFreeRemaining({ adFreeUntil: 'nope' }, now)).toBe(0);
  });
});

describe('gate', () => {
  it('blocks ads for premium, without consent and without the native module', () => {
    expect(adsAllowed(gate)).toBe(true);
    expect(adsAllowed({ ...gate, premium: true })).toBe(false);
    expect(adsAllowed({ ...gate, canRequestAds: false })).toBe(false);
    expect(adsAllowed({ ...gate, available: false })).toBe(false);
  });
});
