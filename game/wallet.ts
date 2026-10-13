import { LEDGER_SIZE, type CoinReason, type LedgerEntry } from './economy';
import { coinsFor, type ProductKind } from './shop';

/**
 * Coin balance, coin history and purchase records, with the rules that keep them consistent. Pure
 * functions only (no storage, no React) so they can be unit-tested; progress.ts owns the state.
 */

export type CoinTotals = { earned: number; spent: number };

/**
 * A store purchase as this device recorded it. `key` is the store's stable identifier for the
 * purchase (iOS transaction ID, Android purchase token), used to pay each purchase exactly once.
 */
export type PurchaseRecord = {
  key: string;
  productId: string;
  kind: ProductKind;
  /** Order / transaction number shown to the player (Android order IDs appear once payment clears). */
  orderId: string | null;
  platform: 'ios' | 'android';
  purchasedAt: number;
  /** Localized price from the store at the time, when the product details were loaded. */
  price: string | null;
  /** Coins paid out for this purchase (0 for Remove Ads and subscriptions). */
  coins: number;
  /** pending: awaiting payment (Android "slow" payment methods); restored: found via Restore / on a new device. */
  status: 'pending' | 'completed' | 'restored';
};

export type SubscriptionState = {
  productId: string;
  active: boolean;
  /** False once the player cancels: it stays active until it expires. Null if the store doesn't say. */
  willRenew: boolean | null;
  /** iOS reports the expiry; Google Play doesn't expose it to the app without a server. */
  expiresAt: number | null;
};

export type Entitlements = {
  removeAds: boolean;
  subscription: SubscriptionState | null;
  /** Last time the store confirmed these; null if it never has on this device. */
  checkedAt: number | null;
};

export const NO_ENTITLEMENTS: Entitlements = { removeAds: false, subscription: null, checkedAt: null };

/**
 * How long a subscription without a known expiry (Google Play) keeps counting as active while the
 * store can't be reached. Ads need a connection anyway, so this rarely matters.
 */
export const OFFLINE_GRACE_MS = 7 * 86_400_000;

/** Purchase records kept on the device, newest last. */
export const PURCHASES_SIZE = 500;

export type Wallet = {
  coins: number;
  totals: CoinTotals;
  ledger: LedgerEntry[];
  purchases: PurchaseRecord[];
};

/**
 * Every coin change goes through here so the balance, totals and ledger always agree. Returns null
 * when a spend (negative amount) can't be afforded; callers must not proceed in that case.
 */
export function withCoins<T extends Wallet>(w: T, amount: number, reason: CoinReason, ref?: string, at = Date.now()): T | null {
  amount = Math.trunc(amount);
  if (amount === 0) return w;
  if (w.coins + amount < 0) return null;
  const entry: LedgerEntry = ref ? { at, amount, reason, ref } : { at, amount, reason };
  return {
    ...w,
    coins: w.coins + amount,
    totals: amount > 0 ? { ...w.totals, earned: w.totals.earned + amount } : { ...w.totals, spent: w.totals.spent - amount },
    ledger: [...w.ledger, entry].slice(-LEDGER_SIZE),
  };
}

/** Coins a coin-pack purchase pays: the pack size times the quantity bought (Play allows several). */
export function purchaseCoins(productId: string, quantity: number) {
  return coinsFor(productId) * Math.max(1, Math.trunc(quantity) || 1);
}

function upsert(list: PurchaseRecord[], record: PurchaseRecord) {
  const rest = list.filter((r) => r.key !== record.key);
  return [...rest, record].slice(-PURCHASES_SIZE);
}

/** Notes a purchase still waiting for payment. Pays nothing; a later delivery replaces it. */
export function recordPending<T extends Wallet>(w: T, record: PurchaseRecord): T {
  if (w.purchases.some((r) => r.key === record.key)) return w;
  return { ...w, purchases: upsert(w.purchases, { ...record, status: 'pending', coins: 0 }) };
}

/**
 * Pays out a completed purchase and records it, in one state change so a crash can't leave coins
 * paid without the record (or the reverse). A purchase whose key was already delivered pays
 * nothing: the stores re-send unfinished purchases on every launch and on Restore.
 */
export function deliverPurchase<T extends Wallet>(w: T, record: PurchaseRecord): { next: T; delivered: boolean } {
  const existing = w.purchases.find((r) => r.key === record.key);
  if (existing && existing.status !== 'pending') {
    // Already paid. Keep the record, but pick up an order ID that only appeared after payment cleared.
    if (record.orderId && existing.orderId !== record.orderId) {
      return { next: { ...w, purchases: upsert(w.purchases, { ...existing, orderId: record.orderId }) }, delivered: false };
    }
    return { next: w, delivered: false };
  }
  const coins = record.kind === 'coins' ? Math.max(0, Math.trunc(record.coins)) : 0;
  const paid = withCoins(w, coins, 'purchase', record.key, record.purchasedAt || Date.now())!;
  const kept = { ...record, coins, price: record.price ?? existing?.price ?? null };
  return { next: { ...paid, purchases: upsert(paid.purchases, kept) }, delivered: true };
}

/** True while a VIP subscription counts as active. */
export function subscriptionActive(e: Entitlements, now = Date.now()) {
  const s = e.subscription;
  if (!s?.active) return false;
  if (s.expiresAt) return now < s.expiresAt;
  return e.checkedAt !== null && now - e.checkedAt < OFFLINE_GRACE_MS;
}

/** Interstitial ads are skipped for Remove Ads owners and active VIPs. */
export function isAdFree(e: Entitlements, now = Date.now()) {
  return e.removeAds || subscriptionActive(e, now);
}

/** Of several subscription states (e.g. monthly then upgraded to yearly), the one that matters. */
export function pickSubscription(subs: SubscriptionState[]): SubscriptionState | null {
  const active = subs.filter((s) => s.active);
  if (active.length === 0) return null;
  return active.reduce((best, s) => ((s.expiresAt ?? Infinity) > (best.expiresAt ?? Infinity) ? s : best));
}

/** Rebuilds coin totals for saves made before totals were tracked, from whatever ledger survives. */
export function totalsFromLedger(ledger: LedgerEntry[]): CoinTotals {
  let earned = 0;
  let spent = 0;
  for (const e of ledger) {
    if (e.amount > 0) earned += e.amount;
    else spent -= e.amount;
  }
  return { earned, spent };
}
