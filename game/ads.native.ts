import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADS } from './economy';

/**
 * Production ad unit IDs from the AdMob console. Debug builds always use Google's test units:
 * never show real ads to yourself, it can get the AdMob account suspended.
 */
const PROD_UNITS = {
  rewarded: Platform.select({ ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/IOS_REWARDED', default: 'ca-app-pub-XXXXXXXXXXXXXXXX/ANDROID_REWARDED' }),
  interstitial: Platform.select({
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/IOS_INTERSTITIAL',
    default: 'ca-app-pub-XXXXXXXXXXXXXXXX/ANDROID_INTERSTITIAL',
  }),
};
const UNITS = __DEV__ ? { rewarded: TestIds.REWARDED, interstitial: TestIds.INTERSTITIAL } : PROD_UNITS;

let canRequestAds = false;
let rewarded: RewardedAd | null = null;
let interstitial: InterstitialAd | null = null;
let rewardedReady = false;
const listeners = new Set<() => void>();

function setRewardedReady(ready: boolean) {
  rewardedReady = ready;
  listeners.forEach((l) => l());
}

function loadRewarded() {
  rewarded?.destroy();
  setRewardedReady(false);
  rewarded = RewardedAd.createForAdRequest(UNITS.rewarded);
  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => setRewardedReady(true));
  // No fill or a network error: try again later rather than hammering the ad server.
  rewarded.addAdEventListener(AdEventType.ERROR, () => setTimeout(loadRewarded, 30_000));
  rewarded.load();
}

function loadInterstitial() {
  interstitial?.destroy();
  interstitial = InterstitialAd.createForAdRequest(UNITS.interstitial);
  interstitial.addAdEventListener(AdEventType.ERROR, () => setTimeout(loadInterstitial, 60_000));
  interstitial.load();
}

/**
 * Asks for consent where the law requires it (Google's UMP form, e.g. in the EEA/UK), then starts
 * the SDK and preloads one ad of each kind. Safe to call more than once.
 */
let started: Promise<void> | null = null;
export function initAds() {
  started ??= (async () => {
    try {
      const consent = await AdsConsent.gatherConsent();
      canRequestAds = consent.canRequestAds;
    } catch {
      // Consent form failed to load (e.g. offline). Ads may still be allowed from a previous session.
      canRequestAds = (await AdsConsent.getConsentInfo().catch(() => null))?.canRequestAds ?? false;
    }
    if (!canRequestAds) return;
    await mobileAds().initialize();
    loadRewarded();
    loadInterstitial();
  })();
  return started;
}

/** True while a rewarded ad is loaded and ready to show; re-renders when that changes. */
export function useRewardedReady() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => rewardedReady,
  );
}

/** Shows a rewarded ad. Resolves true only if the player watched long enough to earn the reward. */
export function showRewarded(): Promise<boolean> {
  const ad = rewarded;
  if (!ad || !rewardedReady) return Promise.resolve(false);
  setRewardedReady(false);
  return new Promise((resolve) => {
    let earned = false;
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      resolve(earned);
      loadRewarded();
    });
    ad.show().catch(() => {
      resolve(false);
      loadRewarded();
    });
  });
}

/**
 * Shows an interstitial between levels: never before ADS.interstitialFromLevel, then once every
 * ADS.interstitialEvery levels. Resolves when the ad closes (or straight away if none is shown).
 */
export function maybeShowInterstitial(clearedLevel: number): Promise<void> {
  const ad = interstitial;
  const due = clearedLevel >= ADS.interstitialFromLevel && clearedLevel % ADS.interstitialEvery === 0;
  if (!ad || !ad.loaded || !due) return Promise.resolve();
  return new Promise((resolve) => {
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      resolve();
      loadInterstitial();
    });
    ad.show().catch(() => {
      resolve();
      loadInterstitial();
    });
  });
}
