import { CircleCheck, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { RewardListRow } from '@/features/monetization/components/RewardListRow';
import { usePremium, useReward } from '@/features/monetization/hooks';
import { openLegal } from '@/features/monetization/links';
import {
  loadPackages,
  purchase,
  restorePurchases,
  type StorePackage,
} from '@/features/monetization/purchases';
import { useMonetization } from '@/features/monetization/store';
import {
  Button,
  Card,
  EmptyState,
  Icon,
  ListRow,
  ListSection,
  Loading,
  Row,
  Screen,
  Stack,
  Text,
} from '@/ui';

type Packages = { status: 'loading' } | { status: 'ready'; packages: StorePackage[] };

export default function PremiumScreen() {
  const { t } = useTranslation();
  const premium = usePremium();
  const purchasesReady = useMonetization((s) => s.purchasesReady);
  const [packages, setPackages] = useState<Packages>({ status: 'loading' });
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadPackages()
      .catch(() => [])
      .then((list) => {
        if (alive) setPackages({ status: 'ready', packages: list });
      });
    return () => {
      alive = false;
    };
  }, [purchasesReady]);

  const buy = async (pkg: StorePackage) => {
    setBusy(pkg.id);
    const outcome = await purchase(pkg);
    setBusy(null);
    if (outcome === 'failed') Alert.alert(t('premium.failedTitle'), t('premium.failedBody'));
  };

  const restore = async () => {
    setBusy('restore');
    const ok = await restorePurchases().catch(() => false);
    setBusy(null);
    Alert.alert(ok ? t('premium.restoredTitle') : t('premium.nothingToRestore'));
  };

  if (premium) {
    return (
      <Screen testID="premium-screen">
        <EmptyState
          icon={CircleCheck}
          title={t('premium.activeTitle')}
          body={t('premium.activeBody')}
          testID="premium-active"
        />
      </Screen>
    );
  }

  return (
    <Screen scroll testID="premium-screen">
      <Stack gap="sm">
        <Row gap="sm">
          <Icon icon={Sparkles} color="primary" />
          <Text variant="title">{t('premium.title')}</Text>
        </Row>
        <Text variant="callout" color="textMuted">
          {t('premium.body')}
        </Text>
      </Stack>

      {packages.status === 'loading' ? (
        <Loading label={t('common.loading')} />
      ) : packages.packages.length === 0 ? (
        <Card>
          <Text variant="callout" color="textMuted">
            {t('premium.unavailable')}
          </Text>
        </Card>
      ) : (
        <Stack gap="md">
          {packages.packages.map((pkg) => (
            <Card key={pkg.id} testID={`package-${pkg.id}`}>
              <Stack gap="sm">
                <Text variant="headline">{pkg.title}</Text>
                <Text variant="callout" color="textMuted">
                  {pkg.period ? t('premium.subscription') : t('premium.oneTime')}
                </Text>
                <Button
                  label={t('premium.buy', { price: pkg.price })}
                  onPress={() => void buy(pkg)}
                  loading={busy === pkg.id}
                  disabled={busy !== null}
                  fullWidth
                />
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <RewardRow />

      <ListSection footer={t('premium.footer')}>
        <ListRow
          title={t('premium.restore')}
          onPress={() => void restore()}
          testID="premium-restore"
        />
        <ListRow title={t('about.privacy')} onPress={() => openLegal('privacy')} />
        <ListRow title={t('about.terms')} onPress={() => openLegal('terms')} last />
      </ListSection>
    </Screen>
  );
}

function RewardRow() {
  const { t } = useTranslation();
  const reward = useReward();
  if (!reward.visible) return null;
  return (
    <ListSection title={t('ads.orWatch')}>
      <RewardListRow reward={reward} last />
    </ListSection>
  );
}
