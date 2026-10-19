import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import { settingsRepo } from '@/features/settings/hooks';

import { PREMIUM_ENTITLEMENT, revenueCatKey } from './config';
import { purchasesModule } from './native';
import { savePremium } from './persist';
import { useMonetization } from './store';

export type StorePackage = {
  id: string;
  title: string;
  price: string;
  /** Subscription period or null for a one-time purchase. */
  period: string | null;
  raw: PurchasesPackage;
};

export type PurchaseOutcome = 'purchased' | 'cancelled' | 'failed';

function applyCustomerInfo(info: CustomerInfo): void {
  savePremium(settingsRepo, info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined);
}

let started = false;

/** Configures RevenueCat and refreshes the premium status. No keys → stays disabled. */
export async function startPurchases(): Promise<void> {
  const m = purchasesModule();
  const apiKey = revenueCatKey();
  if (!m || !apiKey || started) return;
  started = true;
  const Purchases = m.default;
  if (__DEV__) void Purchases.setLogLevel(m.LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
  useMonetization.setState({ purchasesReady: true });
  Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
  try {
    applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch {
    // Offline: keep the last saved status.
  }
}

/** Packages of the current offering, so prices and the model are changed in RevenueCat. */
export async function loadPackages(): Promise<StorePackage[]> {
  const m = purchasesModule();
  if (!m || !useMonetization.getState().purchasesReady) return [];
  const offerings = await m.default.getOfferings();
  return (offerings.current?.availablePackages ?? []).map((p) => ({
    id: p.identifier,
    title: p.product.title,
    price: p.product.priceString,
    period: p.product.subscriptionPeriod ?? null,
    raw: p,
  }));
}

export async function purchase(pkg: StorePackage): Promise<PurchaseOutcome> {
  const m = purchasesModule();
  if (!m) return 'failed';
  try {
    const { customerInfo } = await m.default.purchasePackage(pkg.raw);
    applyCustomerInfo(customerInfo);
    return useMonetization.getState().premium ? 'purchased' : 'failed';
  } catch (e) {
    const code = (e as { code?: unknown }).code;
    return code === m.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ? 'cancelled' : 'failed';
  }
}

/** Restores purchases; resolves true when premium is active afterwards. */
export async function restorePurchases(): Promise<boolean> {
  const m = purchasesModule();
  if (!m || !useMonetization.getState().purchasesReady) return false;
  applyCustomerInfo(await m.default.restorePurchases());
  return useMonetization.getState().premium;
}
