import { useTranslation } from 'react-i18next';

import { Banner, Button, Row } from '@/ui';

import { dismissRewardHint, showRewarded } from '../ads';
import { useReward } from '../hooks';
import { useMonetization } from '../store';

/** Shown once after an interstitial: one video turns ads off for 12 hours. */
export function RewardHint() {
  const { t } = useTranslation();
  const hint = useMonetization((s) => s.rewardHint);
  const reward = useReward();
  if (!hint || !reward.visible || !reward.ready || reward.remainingMs > 0) return null;
  return (
    <Banner tone="info" title={t('ads.hintTitle')} body={t('ads.hintBody')} testID="reward-hint">
      <Row gap="sm">
        <Button label={t('ads.watch')} size="small" onPress={() => void showRewarded()} />
        <Button
          label={t('common.later')}
          size="small"
          variant="ghost"
          onPress={dismissRewardHint}
        />
      </Row>
    </Banner>
  );
}
