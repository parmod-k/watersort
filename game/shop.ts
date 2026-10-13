/**
 * Everything sold for real money. Product IDs must match the ones created in Google Play Console
 * and App Store Connect exactly (see README → In-app purchases).
 */

export type CoinPack = { id: string; coins: number; tag?: string };
export type SubscriptionPlan = { id: string; period: 'month' | 'year'; tag?: string };

/** Consumables: bought any number of times, each purchase pays its coins once. */
export const COIN_PACKS: CoinPack[] = [
  { id: 'coins_500', coins: 500 },
  { id: 'coins_1500', coins: 1500, tag: 'Popular' },
  { id: 'coins_4000', coins: 4000, tag: 'Big pack' },
  { id: 'coins_10000', coins: 10000, tag: 'Mega pack' },
];

/** Non-consumable: owned forever by the store account, restorable on any device. */
export const REMOVE_ADS = 'remove_ads';

/** Auto-renewing subscriptions in one group (App Store) / two products (Play). */
export const VIP_PLANS: SubscriptionPlan[] = [
  { id: 'vip_monthly', period: 'month' },
  { id: 'vip_yearly', period: 'year', tag: 'Best value' },
];

/** What VIP gives while active: no interstitial ads plus a daily coin gift. */
export const VIP = { dailyCoins: 200 };

export type ProductKind = 'coins' | 'removeAds' | 'subscription';

export const IN_APP_SKUS = [...COIN_PACKS.map((p) => p.id), REMOVE_ADS];
export const SUBSCRIPTION_SKUS = VIP_PLANS.map((p) => p.id);

export function productKind(productId: string): ProductKind | null {
  if (productId === REMOVE_ADS) return 'removeAds';
  if (COIN_PACKS.some((p) => p.id === productId)) return 'coins';
  if (VIP_PLANS.some((p) => p.id === productId)) return 'subscription';
  return null;
}

export function coinsFor(productId: string) {
  return COIN_PACKS.find((p) => p.id === productId)?.coins ?? 0;
}

/** A product as the store sells it in the player's country. */
export type StoreProduct = { id: string; title: string; price: string; type: 'in-app' | 'subs'; offerToken?: string };

export type BillingState = {
  /** unavailable: no store on this device/platform, or it couldn't be reached (retried on resume). */
  status: 'connecting' | 'ready' | 'unavailable';
  products: Record<string, StoreProduct>;
  /** Product whose purchase sheet is open. */
  buying: string | null;
  restoring: boolean;
};

export type BuyResult =
  | { outcome: 'success' | 'pending' | 'cancelled' }
  | { outcome: 'error'; message: string };

export type RestoreResult = { ok: true; restored: string[] } | { ok: false; message: string };

/** Fallback names for history rows when the store's product details aren't loaded. */
export function productName(productId: string) {
  const coins = coinsFor(productId);
  if (coins) return `${coins.toLocaleString()} Coins`;
  if (productId === REMOVE_ADS) return 'Remove Ads';
  const plan = VIP_PLANS.find((p) => p.id === productId);
  if (plan) return plan.period === 'month' ? 'VIP Monthly' : 'VIP Yearly';
  return productId;
}
