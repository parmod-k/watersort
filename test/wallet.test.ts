import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deliverPurchase,
  isAdFree,
  NO_ENTITLEMENTS,
  OFFLINE_GRACE_MS,
  pickSubscription,
  purchaseCoins,
  recordPending,
  subscriptionActive,
  totalsFromLedger,
  withCoins,
  type PurchaseRecord,
  type Wallet,
} from '../game/wallet';
import { LEDGER_SIZE } from '../game/economy';

const wallet = (coins = 100): Wallet => ({ coins, totals: { earned: 0, spent: 0 }, ledger: [], purchases: [] });

const coinPurchase = (over: Partial<PurchaseRecord> = {}): PurchaseRecord => ({
  key: 'token-1',
  productId: 'coins_1500',
  kind: 'coins',
  orderId: 'GPA.1',
  platform: 'android',
  purchasedAt: 1000,
  price: '$4.99',
  coins: purchaseCoins('coins_1500', 1),
  status: 'completed',
  ...over,
});

test('withCoins keeps balance, totals and ledger in step', () => {
  let w = withCoins(wallet(100), 50, 'level')!;
  w = withCoins(w, -30, 'hint')!;
  assert.equal(w.coins, 120);
  assert.deepEqual(w.totals, { earned: 50, spent: 30 });
  assert.deepEqual(
    w.ledger.map((e) => e.amount),
    [50, -30],
  );
});

test('withCoins refuses a spend that would go negative', () => {
  assert.equal(withCoins(wallet(10), -20, 'hint'), null);
});

test('withCoins ignores fractions and zero', () => {
  const w = wallet(10);
  assert.equal(withCoins(w, 0, 'level'), w);
  assert.equal(withCoins(w, 2.9, 'level')!.coins, 12);
});

test('ledger is capped at LEDGER_SIZE but totals keep counting', () => {
  let w = wallet(0);
  for (let i = 0; i < LEDGER_SIZE + 10; i++) w = withCoins(w, 1, 'level')!;
  assert.equal(w.ledger.length, LEDGER_SIZE);
  assert.equal(w.totals.earned, LEDGER_SIZE + 10);
  assert.equal(w.coins, LEDGER_SIZE + 10);
});

test('a coin purchase pays once, however often the store re-sends it', () => {
  const first = deliverPurchase(wallet(100), coinPurchase());
  assert.equal(first.delivered, true);
  assert.equal(first.next.coins, 1600);
  assert.equal(first.next.ledger.at(-1)?.ref, 'token-1');

  // App relaunch before finishTransaction, then Restore: same key both times.
  const again = deliverPurchase(first.next, coinPurchase());
  const restored = deliverPurchase(again.next, coinPurchase({ status: 'restored' }));
  assert.equal(again.delivered, false);
  assert.equal(restored.delivered, false);
  assert.equal(restored.next.coins, 1600);
  assert.equal(restored.next.purchases.length, 1);
  assert.equal(restored.next.totals.earned, 1500);
});

test('two different purchases of the same pack both pay', () => {
  const a = deliverPurchase(wallet(0), coinPurchase({ key: 'token-1' })).next;
  const b = deliverPurchase(a, coinPurchase({ key: 'token-2' })).next;
  assert.equal(b.coins, 3000);
  assert.equal(b.purchases.length, 2);
});

test('a pending purchase pays nothing until it completes, then pays once', () => {
  const pending = recordPending(wallet(0), coinPurchase({ orderId: null }));
  assert.equal(pending.coins, 0);
  assert.equal(pending.purchases[0].status, 'pending');
  assert.equal(recordPending(pending, coinPurchase()), pending);

  const done = deliverPurchase(pending, coinPurchase({ orderId: 'GPA.9' }));
  assert.equal(done.delivered, true);
  assert.equal(done.next.coins, 1500);
  assert.equal(done.next.purchases.length, 1);
  assert.equal(done.next.purchases[0].status, 'completed');
  assert.equal(done.next.purchases[0].orderId, 'GPA.9');
});

test('a delivered purchase picks up a late order ID without paying again', () => {
  const first = deliverPurchase(wallet(0), coinPurchase({ orderId: null })).next;
  const later = deliverPurchase(first, coinPurchase({ orderId: 'GPA.7' }));
  assert.equal(later.delivered, false);
  assert.equal(later.next.coins, 1500);
  assert.equal(later.next.purchases[0].orderId, 'GPA.7');
});

test('Remove Ads and subscriptions are recorded without paying coins', () => {
  const r = deliverPurchase(wallet(5), coinPurchase({ key: 'ra', productId: 'remove_ads', kind: 'removeAds', coins: 999 }));
  assert.equal(r.delivered, true);
  assert.equal(r.next.coins, 5);
  assert.equal(r.next.purchases[0].coins, 0);
});

test('multi-quantity coin purchases pay per unit', () => {
  assert.equal(purchaseCoins('coins_500', 3), 1500);
  assert.equal(purchaseCoins('coins_500', 0), 500);
  assert.equal(purchaseCoins('unknown', 1), 0);
});

test('subscriptions with an expiry are active until it passes', () => {
  const e = { ...NO_ENTITLEMENTS, subscription: { productId: 'vip_monthly', active: true, willRenew: false, expiresAt: 2000 }, checkedAt: 0 };
  assert.equal(subscriptionActive(e, 1999), true);
  assert.equal(subscriptionActive(e, 2000), false);
  assert.equal(isAdFree(e, 1999), true);
  assert.equal(isAdFree(e, 2001), false);
});

test('subscriptions without an expiry (Google Play) need a recent store check', () => {
  const e = { ...NO_ENTITLEMENTS, subscription: { productId: 'vip_yearly', active: true, willRenew: true, expiresAt: null }, checkedAt: 1000 };
  assert.equal(subscriptionActive(e, 1000 + OFFLINE_GRACE_MS - 1), true);
  assert.equal(subscriptionActive(e, 1000 + OFFLINE_GRACE_MS), false);
  assert.equal(subscriptionActive({ ...e, checkedAt: null }, 1000), false);
});

test('Remove Ads is ad-free with no subscription', () => {
  assert.equal(isAdFree({ ...NO_ENTITLEMENTS, removeAds: true }), true);
  assert.equal(isAdFree(NO_ENTITLEMENTS), false);
});

test('pickSubscription prefers the active plan that runs longest', () => {
  const monthly = { productId: 'vip_monthly', active: true, willRenew: false, expiresAt: 100 };
  const yearly = { productId: 'vip_yearly', active: true, willRenew: true, expiresAt: 900 };
  const lapsed = { productId: 'vip_monthly', active: false, willRenew: false, expiresAt: 5000 };
  assert.equal(pickSubscription([monthly, yearly, lapsed])?.productId, 'vip_yearly');
  assert.equal(pickSubscription([lapsed]), null);
});

test('totals for old saves are rebuilt from the ledger', () => {
  assert.deepEqual(
    totalsFromLedger([
      { at: 0, amount: 100, reason: 'level' },
      { at: 0, amount: -20, reason: 'undo' },
    ]),
    { earned: 100, spent: 20 },
  );
});
