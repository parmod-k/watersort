import type { BillingState, BuyResult, RestoreResult } from './shop';

/**
 * Web build: there is no App Store / Google Play here, so the shop shows its products as
 * unavailable. The iOS/Android implementation is billing.native.ts, which Metro picks on device.
 */

const STATE: BillingState = { status: 'unavailable', products: {}, buying: null, restoring: false };
const UNAVAILABLE = 'Purchases are available in the iOS and Android app.';

export function initBilling() {
  return Promise.resolve();
}

export function useBilling(): BillingState {
  return STATE;
}

export function buy(_productId: string): Promise<BuyResult> {
  return Promise.resolve({ outcome: 'error', message: UNAVAILABLE });
}

export function restorePurchases(): Promise<RestoreResult> {
  return Promise.resolve({ ok: false, message: UNAVAILABLE });
}

export function manageSubscriptions(_productId?: string) {
  return Promise.resolve();
}
