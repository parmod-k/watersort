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
};

/** How often ads appear. Rewarded ads are always the player's choice; these limit the forced ones. */
export const ADS = {
  /** No interstitials while a new player learns the game. */
  interstitialFromLevel: 6,
  /** Then one interstitial every this many cleared levels. */
  interstitialEvery: 3,
};

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

export type CoinReason = 'level' | 'trial' | 'daily' | 'shop' | 'ad' | Booster;

export type LedgerEntry = { at: number; amount: number; reason: CoinReason };

/** How many recent coin changes are kept for debugging balance complaints. */
export const LEDGER_SIZE = 50;
