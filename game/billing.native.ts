import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  deepLinkToSubscriptions,
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getActiveSubscriptions,
  getAvailablePurchases,
  getUserFriendlyErrorMessage,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases as storeRestorePurchases,
  type ActiveSubscription,
  type ExpoPurchaseError,
  type Product,
  type ProductSubscription,
  type Purchase,
  type PurchaseAndroid,
  type PurchaseIOS,
} from 'expo-iap';
import { holdAppOpen } from './ads';
import { applyPurchase, getProgress, notePendingPurchase, setEntitlements } from './progress';
import {
  IN_APP_SKUS,
  productKind,
  productName,
  REMOVE_ADS,
  SUBSCRIPTION_SKUS,
  type BillingState,
  type BuyResult,
  type ProductKind,
  type RestoreResult,
  type StoreProduct,
} from './shop';
import { pickSubscription, purchaseCoins, type PurchaseRecord, type SubscriptionState } from './wallet';

/**
 * Google Play Billing / StoreKit 2 through expo-iap, with no server. Every purchase, whether it
 * arrives from the purchase sheet, from the store replaying an unfinished transaction at launch,
 * or from Restore, goes through handlePurchase(), which pays it at most once (keyed by the store's
 * purchase ID) and only then finishes it with the store.
 */

let state: BillingState = { status: 'connecting', products: {}, buying: null, restoring: false };
const listeners = new Set<() => void>();

function update(patch: Partial<BillingState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useBilling() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

// ---------------------------------------------------------------------------
// Connection and catalog
// ---------------------------------------------------------------------------

const RESYNC_EVERY = 60_000;
let connecting: Promise<void> | null = null;
let lastSync = 0;
let listening = false;

/** Connects to the store, loads prices and settles anything left over from earlier sessions. Safe to call again. */
export function initBilling() {
  connecting ??= (async () => {
    // Listen before connecting: the store replays unfinished transactions as soon as it connects.
    if (!listening) {
      listening = true;
      purchaseUpdatedListener((p) => void onPurchaseUpdated(p));
      purchaseErrorListener(onPurchaseError);
      AppState.addEventListener('change', (s) => {
        if (s !== 'active') return;
        if (state.status === 'unavailable') return void initBilling();
        if (Object.keys(state.products).length === 0) void loadProducts().catch(() => {});
        if (Date.now() - lastSync > RESYNC_EVERY) void syncWithStore('sync').catch(() => {});
      });
    }
    update({ status: 'connecting' });
    try {
      await initConnection();
    } catch {
      // No Play Store / not signed in / no network. Retried when the app comes back to the foreground.
      update({ status: 'unavailable' });
      connecting = null;
      return;
    }
    await loadProducts().catch(() => {});
    update({ status: 'ready' });
    await syncWithStore('sync').catch(() => {});
  })();
  return connecting;
}

/** Android needs an offer token to buy a subscription; take the plain base plan's. */
function offerToken(p: ProductSubscription) {
  if (p.platform !== 'android') return undefined;
  const offers = p.subscriptionOffers.filter((o) => o.offerTokenAndroid);
  return (offers.find((o) => o.id === o.basePlanIdAndroid) ?? offers[0])?.offerTokenAndroid ?? undefined;
}

async function loadProducts() {
  const [inApp, subs] = await Promise.all([
    fetchProducts({ skus: IN_APP_SKUS, type: 'in-app' }),
    fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' }),
  ]);
  const products: Record<string, StoreProduct> = {};
  for (const p of (inApp ?? []) as Product[]) {
    products[p.id] = { id: p.id, title: p.displayName || p.title, price: p.displayPrice, type: 'in-app' };
  }
  for (const p of (subs ?? []) as ProductSubscription[]) {
    const token = offerToken(p);
    const offer = p.platform === 'android' ? p.subscriptionOffers.find((o) => o.offerTokenAndroid === token) : undefined;
    products[p.id] = { id: p.id, title: p.displayName || p.title, price: offer?.displayPrice ?? p.displayPrice, type: 'subs', offerToken: token };
  }
  update({ products });
}

// ---------------------------------------------------------------------------
// Delivering purchases
// ---------------------------------------------------------------------------

type Origin = 'purchase' | 'sync' | 'restore';

/** Purchases always come from this device's own store. */
const ANDROID = Platform.OS === 'android';
const asAndroid = (p: Purchase) => (ANDROID ? (p as PurchaseAndroid) : null);
const asIOS = (p: Purchase) => (ANDROID ? null : (p as PurchaseIOS));

/** The store's stable ID for a purchase. Android order IDs only appear once payment clears, so use the token there. */
function purchaseKey(p: Purchase) {
  if (ANDROID) return p.purchaseToken || p.id;
  return asIOS(p)!.transactionId || p.id;
}

function toRecord(p: Purchase, kind: ProductKind, origin: Origin): PurchaseRecord {
  const orderId = ANDROID ? (asAndroid(p)!.transactionId ?? null) : asIOS(p)!.transactionId || p.id;
  // A Remove Ads found by a store check (not just bought) means a reinstall, a new device or Restore.
  const restored = kind === 'removeAds' && origin !== 'purchase';
  return {
    key: purchaseKey(p),
    productId: p.productId,
    kind,
    orderId,
    platform: ANDROID ? 'android' : 'ios',
    purchasedAt: p.transactionDate || Date.now(),
    price: state.products[p.productId]?.price ?? null,
    coins: kind === 'coins' ? purchaseCoins(p.productId, p.quantity) : 0,
    status: restored ? 'restored' : 'completed',
  };
}

function subscriptionFrom(p: Purchase): SubscriptionState {
  return {
    productId: p.productId,
    active: true,
    willRenew: p.isAutoRenewing,
    expiresAt: asIOS(p)?.expirationDateIOS ?? null,
  };
}

const finishing = new Set<string>();

/**
 * Pays out (or records as pending) one purchase, then tells the store it was delivered. Coins are
 * saved before finishTransaction: if the app dies in between, the store re-sends the purchase on
 * the next launch and the saved key stops it from paying twice.
 */
async function handlePurchase(p: Purchase, origin: Origin): Promise<'delivered' | 'pending' | 'ignored'> {
  const kind = productKind(p.productId);
  // Not one of ours (e.g. a product since removed from the catalog): leave it with the store.
  if (!kind) return 'ignored';
  const record = toRecord(p, kind, origin);
  if (p.purchaseState === 'pending') {
    notePendingPurchase(record);
    return 'pending';
  }
  if (p.purchaseState !== 'purchased') return 'ignored';

  if (kind === 'removeAds') setEntitlements({ ...getProgress().entitlements, removeAds: true });
  if (kind === 'subscription') setEntitlements({ ...getProgress().entitlements, subscription: subscriptionFrom(p) });
  applyPurchase(record);

  // Android: an acknowledged non-consumable is already finished. iOS finishing twice is harmless.
  const done = kind !== 'coins' && !!asAndroid(p)?.isAcknowledgedAndroid;
  if (!done && !finishing.has(record.key)) {
    finishing.add(record.key);
    try {
      await finishTransaction({ purchase: p, isConsumable: kind === 'coins' });
    } catch {
      // Not finished: the store keeps offering it and the next sync retries (without paying again).
    } finally {
      finishing.delete(record.key);
    }
  }
  return 'delivered';
}

function toSubscriptionState(a: ActiveSubscription): SubscriptionState {
  return {
    productId: a.productId,
    active: a.isActive,
    willRenew: a.renewalInfoIOS?.willAutoRenew ?? a.autoRenewingAndroid ?? null,
    expiresAt: a.expirationDateIOS ?? null,
  };
}

/**
 * Asks the store what this account owns: delivers anything unfinished, and replaces the cached
 * Remove Ads / VIP state with the store's answer (so refunds and expired or cancelled subscriptions
 * are picked up). Throws if the store can't be reached; the cache is then left as it was.
 */
async function syncWithStore(origin: Exclude<Origin, 'purchase'>) {
  const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
  for (const p of purchases) await handlePurchase(p, origin);
  const subs = await getActiveSubscriptions(SUBSCRIPTION_SKUS);
  setEntitlements({
    removeAds: purchases.some((p) => p.productId === REMOVE_ADS && p.purchaseState === 'purchased'),
    subscription: pickSubscription(subs.map(toSubscriptionState)),
    checkedAt: Date.now(),
  });
  lastSync = Date.now();
  return purchases;
}

// ---------------------------------------------------------------------------
// Buying
// ---------------------------------------------------------------------------

/** The buy() call waiting for the store's answer. Only one purchase sheet is open at a time. */
let waiting: { productId: string; resolve: (r: BuyResult) => void } | null = null;

function settle(productId: string | undefined, result: BuyResult) {
  if (!waiting || (productId && productId !== waiting.productId)) return;
  const w = waiting;
  waiting = null;
  update({ buying: null });
  w.resolve(result);
}

async function onPurchaseUpdated(p: Purchase) {
  const outcome = await handlePurchase(p, 'purchase');
  if (outcome === 'delivered') settle(p.productId, { outcome: 'success' });
  else if (outcome === 'pending') settle(p.productId, { outcome: 'pending' });
}

function onPurchaseError(e: ExpoPurchaseError) {
  const productId = e.productId ?? waiting?.productId;
  if (isUserCancelledError(e)) return settle(productId, { outcome: 'cancelled' });
  if (e.code === ErrorCode.AlreadyOwned) {
    // Bought earlier but never delivered here (other device, or interrupted): fetch and deliver it.
    void syncWithStore('restore').then(
      () => settle(productId, { outcome: 'success' }),
      () => settle(productId, { outcome: 'error', message: getUserFriendlyErrorMessage(e) }),
    );
    return;
  }
  if (e.code === ErrorCode.DeferredPayment || e.code === ErrorCode.Pending) return settle(productId, { outcome: 'pending' });
  settle(productId, { outcome: 'error', message: getUserFriendlyErrorMessage(e) });
}

/** Opens the store's purchase sheet. Resolves once the store reports the result. */
export async function buy(productId: string): Promise<BuyResult> {
  const product = state.products[productId];
  if (state.status !== 'ready' || !product) return { outcome: 'error', message: 'This item is not available right now. Please try again later.' };
  if (waiting) return { outcome: 'error', message: 'Another purchase is in progress.' };
  // Ties the purchase to this player (iOS needs a UUID, which the player ID is).
  const playerId = getProgress().playerId;
  // The purchase sheet leaves the app on Android; returning from it must not trigger an app-open ad.
  const release = holdAppOpen();
  const result = new Promise<BuyResult>((resolve) => (waiting = { productId, resolve })).finally(release);
  update({ buying: productId });
  try {
    if (product.type === 'subs') {
      await requestPurchase({
        type: 'subs',
        request: {
          apple: { sku: productId, appAccountToken: playerId },
          google: {
            skus: [productId],
            obfuscatedAccountId: playerId,
            subscriptionOffers: product.offerToken ? [{ sku: productId, offerToken: product.offerToken }] : [],
          },
        },
      });
    } else {
      await requestPurchase({
        type: 'in-app',
        request: {
          apple: { sku: productId, appAccountToken: playerId },
          google: { skus: [productId], obfuscatedAccountId: playerId },
        },
      });
    }
  } catch (e) {
    // Rejected before the sheet opened, or reported here instead of through the error listener.
    onPurchaseError(e as ExpoPurchaseError);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Restore and manage
// ---------------------------------------------------------------------------

/**
 * Restores Remove Ads and an active VIP subscription from the store account (and delivers any
 * coin pack that was paid for but never delivered). Coin packs already delivered are not
 * returned by either store, and already-saved purchases never pay twice.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  const ready = () => state.status === 'ready';
  if (!ready()) {
    await initBilling();
    if (!ready()) return { ok: false, message: 'The store is not available. Check your connection and try again.' };
  }
  update({ restoring: true });
  const release = holdAppOpen();
  try {
    // iOS: syncs with the App Store (may ask for the Apple ID password). Android: refreshes the cache.
    await storeRestorePurchases();
    const purchases = await syncWithStore('restore');
    const names = new Set(
      purchases.filter((p) => p.purchaseState === 'purchased' && productKind(p.productId)).map((p) => productName(p.productId)),
    );
    return { ok: true, restored: [...names] };
  } catch (e) {
    return { ok: false, message: getUserFriendlyErrorMessage(e as ExpoPurchaseError) };
  } finally {
    update({ restoring: false });
    release();
  }
}

/** Opens the App Store / Google Play page where the player cancels or changes their subscription. */
export async function manageSubscriptions(productId?: string) {
  // No app-open ad when the player comes back from the store's subscription page.
  const release = holdAppOpen();
  const sub = AppState.addEventListener('change', (s) => {
    if (s !== 'active') return;
    sub.remove();
    release();
  });
  try {
    await deepLinkToSubscriptions({
      skuAndroid: productId ?? null,
      packageNameAndroid: Platform.OS === 'android' ? (Constants.expoConfig?.android?.package ?? null) : null,
    });
  } catch (e) {
    sub.remove();
    release();
    throw e;
  }
}
