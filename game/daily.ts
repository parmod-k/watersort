import { useEffect, useState } from 'react';

const DAY_MS = 86_400_000;
/** Day number of the first Daily Trial (1 Jan 2026), so trial #1 fell on that date. */
const FIRST_TRIAL_DAY = Math.floor(Date.UTC(2026, 0, 1) / DAY_MS);

export const TRIAL_REWARD = 100;
export const DAILY_BONUS = 50;

/** Days since the epoch in the player's local time zone; changes at local midnight. */
export function today(now = Date.now()) {
  return Math.floor((now - new Date(now).getTimezoneOffset() * 60_000) / DAY_MS);
}

export function trialNumber(day: number) {
  return Math.max(1, day - FIRST_TRIAL_DAY + 1);
}

/** Milliseconds until the next local midnight, when trials and bonuses reset. */
export function msUntilReset(now = Date.now()) {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now;
}

export function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/**
 * Today's trial replays one of the player's 30 most recent cleared levels, picked from the date so
 * it is the same all day. A new player with nothing cleared gets level 1.
 */
export function pickTrialLevel(day: number, unlocked: number) {
  const cleared = unlocked - 1;
  if (cleared < 1) return 1;
  const pool = Math.min(30, cleared);
  // Integer hash of the day so consecutive days don't walk through levels in order.
  let h = Math.imul(day ^ 0x5bd1e995, 0x27d4eb2d);
  h ^= h >>> 15;
  return cleared - pool + 1 + ((h >>> 0) % pool);
}

/** Re-renders every second; returns the current time. */
export function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
