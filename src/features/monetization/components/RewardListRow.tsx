import { useTranslation } from 'react-i18next';

import { ListRow } from '@/ui';

import { showRewarded } from '../ads';
import { hoursMinutes } from '../format';
import type { useReward } from '../hooks';

/** "12 hours without ads" row, shared by settings and the purchase screen. */
export function RewardListRow({
  reward,
  last,
}: {
  reward: ReturnType<typeof useReward>;
  last?: boolean;
}) {
  const { t } = useTranslation();
  if (reward.remainingMs > 0) {
    const { hours, minutes } = hoursMinutes(reward.remainingMs);
    return (
      <ListRow
        title={t('ads.rewardTitle')}
        value={t('ads.remaining', { hours, minutes })}
        last={last}
        testID="reward-row"
      />
    );
  }
  return (
    <ListRow
      title={t('ads.rewardTitle')}
      subtitle={reward.ready ? t('ads.rewardBody') : t('ads.rewardLoading')}
      onPress={reward.ready ? () => void showRewarded() : undefined}
      last={last}
      testID="reward-row"
    />
  );
}
