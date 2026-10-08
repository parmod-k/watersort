/**
 * Web build: Google Mobile Ads is native-only, so ads are switched off here. The iOS/Android
 * implementation is ads.native.ts, which Metro picks instead of this file on device.
 */

export function initAds() {
  return Promise.resolve();
}

export function useRewardedReady() {
  return false;
}

export function showRewarded(): Promise<boolean> {
  return Promise.resolve(false);
}

export function maybeShowInterstitial(_clearedLevel: number): Promise<void> {
  return Promise.resolve();
}
