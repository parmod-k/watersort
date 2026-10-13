import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  AppOpenAd,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  RewardedInterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADS, interstitialDue } from './economy';
import { getProgress } from './progress';
import { isAdFree } from './wallet';

/**
 * Production ad unit IDs from the AdMob console. Debug builds always use Google's test units:
 * never show real ads to yourself, it can get the AdMob account suspended.
 */
const PROD_UNITS = {
  rewarded: Platform.select({ ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/IOS_REWARDED', default: 'ca-app-pub-2482030283049144/5747921124' }),
  interstitial: Platform.select({
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/IOS_INTERSTITIAL',
    default: 'ca-app-pub-2482030283049144/7388305859',
  }),
  banner: Platform.select({ ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/IOS_BANNER', default: 'ca-app-pub-2482030283049144/6744563167' }),
  rewardedInterstitial: Platform.select({
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/IOS_REWARDED_INTERSTITIAL',
    default: 'ca-app-pub-2482030283049144/5554595413',
  }),
  appOpen: Platform.select({ ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/IOS_APP_OPEN', default: 'ca-app-pub-2482030283049144/9302268733' }),
};
const UNITS = __DEV__
  ? {
      rewarded: TestIds.REWARDED,
      interstitial: TestIds.INTERSTITIAL,
      banner: TestIds.ADAPTIVE_BANNER,
      rewardedInterstitial: TestIds.REWARDED_INTERSTITIAL,
      appOpen: TestIds.APP_OPEN,
    }
  : PROD_UNITS;

export const BANNER_UNIT = UNITS.banner;

/** Google: an app-open ad loaded more than 4 hours ago may no longer pay out, so load a fresh one. */
const APP_OPEN_TTL_MS = 4 * 3_600_000;

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

let canRequestAds = false;
let rewarded: RewardedAd | null = null;
let rewardedReady = false;
let interstitial: InterstitialAd | null = null;
let bonus: RewardedInterstitialAd | null = null;
let bonusReady = false;
let appOpen: AppOpenAd | null = null;
let appOpenLoadedAt = 0;

/** A full-screen ad is on screen (on Android it sends the app to the background). */
let fullscreen = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * Remove Ads and VIP turn off every ad the player didn't ask for: interstitials, banners, app-open
 * and the bonus-gift offer. Rewarded ads stay, since players choose them for coins.
 */
function adFree() {
  return isAdFree(getProgress().entitlements);
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function loadRewarded() {
  rewarded?.destroy();
  rewardedReady = false;
  notify();
  rewarded = RewardedAd.createForAdRequest(UNITS.rewarded);
  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedReady = true;
    notify();
  });
  // No fill or a network error: try again later rather than hammering the ad server.
  rewarded.addAdEventListener(AdEventType.ERROR, () => setTimeout(loadRewarded, 30_000));
  rewarded.load();
}

function loadInterstitial() {
  interstitial?.destroy();
  interstitial = null;
  if (adFree()) return;
  interstitial = InterstitialAd.createForAdRequest(UNITS.interstitial);
  interstitial.addAdEventListener(AdEventType.ERROR, () => setTimeout(loadInterstitial, 60_000));
  interstitial.load();
}

function loadBonus() {
  bonus?.destroy();
  bonus = null;
  bonusReady = false;
  notify();
  if (adFree()) return;
  bonus = RewardedInterstitialAd.createForAdRequest(UNITS.rewardedInterstitial);
  bonus.addAdEventListener(RewardedAdEventType.LOADED, () => {
    bonusReady = true;
    notify();
  });
  bonus.addAdEventListener(AdEventType.ERROR, () => setTimeout(loadBonus, 60_000));
  bonus.load();
}

function loadAppOpen() {
  appOpen?.destroy();
  appOpen = null;
  appOpenLoadedAt = 0;
  if (adFree()) return;
  const ad = AppOpenAd.createForAdRequest(UNITS.appOpen);
  ad.addAdEventListener(AdEventType.LOADED, () => (appOpenLoadedAt = Date.now()));
  ad.addAdEventListener(AdEventType.ERROR, () => setTimeout(loadAppOpen, 60_000));
  ad.load();
  appOpen = ad;
}

/** Ad-free just ended (e.g. VIP expired): start loading the formats it had switched off. */
function reloadIfNeeded() {
  if (!canRequestAds || adFree()) return;
  if (!interstitial) loadInterstitial();
  if (!bonus) loadBonus();
  if (!appOpen) loadAppOpen();
}

/**
 * Shows a full-screen ad. Resolves when it closes, with whether a reward was earned. `onDone`
 * starts loading the next one.
 */
function present(ad: RewardedAd | InterstitialAd | RewardedInterstitialAd | AppOpenAd, onDone: () => void): Promise<boolean> {
  fullscreen = true;
  return new Promise((resolve) => {
    let earned = false;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      fullscreen = false;
      resolve(earned);
      onDone();
    };
    if (ad instanceof RewardedAd || ad instanceof RewardedInterstitialAd) {
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => (earned = true));
    }
    // Every format emits CLOSED; the union's listener signatures just don't line up for TypeScript.
    (ad as InterstitialAd).addAdEventListener(AdEventType.CLOSED, finish);
    ad.show().catch(finish);
  });
}

// ---------------------------------------------------------------------------
// Start-up and app-open ads
// ---------------------------------------------------------------------------

let backgroundedAt = 0;
let lastAppOpenAt = 0;
let holds = 0;
let quietUntil = 0;

/**
 * Keeps app-open ads away while the player is in a store purchase sheet, Restore or the
 * subscription settings (all of which leave the app). Call the returned function when done.
 */
export function holdAppOpen() {
  holds++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds--;
    // The app usually becomes active again just after the store reports back.
    quietUntil = Date.now() + 5000;
  };
}

function maybeShowAppOpen() {
  if (!canRequestAds || adFree() || fullscreen || holds > 0 || Date.now() < quietUntil) return;
  // Not for players still learning the game, and not too often.
  if (getProgress().unlocked < ADS.interstitialFromLevel || Date.now() - lastAppOpenAt < ADS.appOpenMinGapMs) return;
  const ad = appOpen;
  if (!ad || !ad.loaded || Date.now() - appOpenLoadedAt > APP_OPEN_TTL_MS) {
    loadAppOpen();
    return;
  }
  lastAppOpenAt = Date.now();
  void present(ad, loadAppOpen);
}

function watchAppState() {
  AppState.addEventListener('change', (s) => {
    if (s === 'background') {
      // A full-screen ad or the store's sheet backgrounds the app on Android; that isn't the player leaving.
      if (!fullscreen && holds === 0) backgroundedAt = Date.now();
      return;
    }
    if (s !== 'active') return;
    const away = backgroundedAt ? Date.now() - backgroundedAt : 0;
    backgroundedAt = 0;
    reloadIfNeeded();
    if (away >= ADS.appOpenAfterAwayMs) maybeShowAppOpen();
  });
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
    notify();
    loadRewarded();
    loadInterstitial();
    loadBonus();
    loadAppOpen();
    watchAppState();
  })();
  return started;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** True once consent allows ad requests and the SDK is started; banners wait for this. */
export function useCanRequestAds() {
  return useSyncExternalStore(subscribe, () => canRequestAds);
}

/** True while a rewarded ad is loaded and ready to show; re-renders when that changes. */
export function useRewardedReady() {
  return useSyncExternalStore(subscribe, () => rewardedReady);
}

/** Shows a rewarded ad. Resolves true only if the player watched long enough to earn the reward. */
export function showRewarded(): Promise<boolean> {
  const ad = rewarded;
  if (!ad || !rewardedReady) return Promise.resolve(false);
  rewardedReady = false;
  notify();
  return present(ad, loadRewarded);
}

/**
 * Shows an interstitial between levels: never before ADS.interstitialFromLevel, then once every
 * ADS.interstitialEvery levels. Resolves when the ad closes (or straight away if none is shown).
 */
export async function maybeShowInterstitial(clearedLevel: number): Promise<void> {
  if (adFree()) return;
  reloadIfNeeded();
  const ad = interstitial;
  if (!ad || !ad.loaded || !interstitialDue(clearedLevel)) return;
  await present(ad, loadInterstitial);
}

/**
 * True when the bonus-gift ad (rewarded interstitial) can be offered: loaded, and the player isn't
 * ad-free. The caller shows the required skippable intro first.
 */
export function bonusAdReady() {
  return bonusReady && !adFree();
}

/** Shows the bonus-gift ad. Resolves true only if the reward was earned. */
export function showBonusAd(): Promise<boolean> {
  const ad = bonus;
  if (!ad || !bonusAdReady()) return Promise.resolve(false);
  bonusReady = false;
  notify();
  return present(ad, loadBonus);
}
