/**
 * Every coin amount in the game. Tune the economy here; nothing else hard-codes a reward or price
 * (cosmetic prices live with their items in cosmetics.ts).
 */
export const ECONOMY = {
  startingCoins: 1450,
  /** First clear of a level. */
  firstClearReward: (stars: number) => 100 + stars * 50,
  /** Replaying a cleared level without improving its stars, so replays can't be farmed. */
  replayReward: 20,
  trialReward: 100,
  dailyBonus: 50,
  /** Watching a rewarded ad when short of coins for a booster. */
  adReward: 100,
  /** Bonus-gift ad offered between levels (rewarded interstitial). */
  bonusAdReward: 75,
};

/** How often ads appear. Rewarded ads are always the player's choice; these limit the forced ones. */
export const ADS = {
  /** No interstitials while a new player learns the game. */
  interstitialFromLevel: 6,
  /** Then one interstitial every this many cleared levels. */
  interstitialEvery: 3,
  /** Bonus-gift offer (rewarded interstitial with a skippable intro) from this level... */
  bonusFromLevel: 10,
  /** ...every this many levels, on levels where no interstitial is due. */
  bonusEvery: 5,
  /** App-open ad when returning to the game after at least this long away... */
  appOpenAfterAwayMs: 30_000,
  /** ...and at most this often. */
  appOpenMinGapMs: 4 * 60_000,
  /** Banners show on these menu screens only, never on the board or next to Shop purchase buttons. */
  bannerScreens: ['/stages', '/themes', '/rank', '/profile'],
};

/** True when a cleared level gets an interstitial (see ADS). */
export function interstitialDue(level: number) {
  return level >= ADS.interstitialFromLevel && level % ADS.interstitialEvery === 0;
}

/** True when a cleared level offers the bonus-gift ad instead (never on an interstitial level). */
export function bonusAdDue(level: number) {
  return level >= ADS.bonusFromLevel && level % ADS.bonusEvery === 0 && !interstitialDue(level);
}

export type Booster = 'undo' | 'hint' | 'restart' | 'extraBottle';

/** Each level gives `free` uses of a booster; after that every use costs `cost` coins. */
export const BOOSTERS: Record<Booster, { free: number; cost: number }> = {
  undo: { free: 3, cost: 20 },
  hint: { free: 3, cost: 50 },
  restart: { free: 1, cost: 30 },
  extraBottle: { free: 0, cost: 100 },
};

/** Coins the next use costs, given how many times it was already used on this level. */
export function boosterPrice(kind: Booster, used: number) {
  const b = BOOSTERS[kind];
  return used < b.free ? 0 : b.cost;
}

/**
 * Coins for clearing a level. A replay pays the difference when it earns more stars than the best
 * so far, otherwise the small replay reward.
 */
export function levelReward(stars: number, bestStars?: number) {
  if (bestStars === undefined) return ECONOMY.firstClearReward(stars);
  if (stars > bestStars) return ECONOMY.firstClearReward(stars) - ECONOMY.firstClearReward(bestStars);
  return ECONOMY.replayReward;
}

export type CoinReason = 'level' | 'trial' | 'daily' | 'shop' | 'ad' | 'purchase' | 'vip' | Booster;

/** One coin change. `ref` ties a purchase payout to its store transaction. */
export type LedgerEntry = { at: number; amount: number; reason: CoinReason; ref?: string };

/** How many recent coin changes are kept (shown in the profile's coin history). */
export const LEDGER_SIZE = 200;
