import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/ui';

import { adUnitId } from '../config';
import { useDisplayAds } from '../hooks';
import { adsModule } from '../native';

/**
 * Anchored adaptive banner. Renders nothing for premium users, during the
 * rewarded ad-free window, before consent and in builds without the ads module.
 */
export function AdBanner() {
  const show = useDisplayAds();
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const m = adsModule();
  if (!show || !m || failed) return null;
  const { BannerAd, BannerAdSize } = m;
  return (
    <View
      style={[styles.wrap, { borderTopColor: colors.border, backgroundColor: colors.surface }]}
      testID="ad-banner"
    >
      <BannerAd
        unitId={adUnitId('banner')}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
});
