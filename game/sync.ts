import { useSyncExternalStore } from 'react';
import { api, ApiError, loadAccount, saveAccount, type Provider, type ServerBoard } from './api';
import { providerIdToken, signOutProviders } from './identity';
import { cleanPlayerName, getProgress, resetProgress, restoreProgress, subscribeProgress } from './progress';
import { getSettings, subscribeSettings, updateSettings } from './settings';
import type { BoardKind } from './scoring';

/**
 * Cloud sync. The device stays the source of truth (the game plays fully offline); changes are
 * pushed to the server a moment after they happen so leaderboards and the coin history stay current.
 */

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline';

const PUSH_DELAY = 2000;
const RETRY_DELAY = 30_000;

let status: SyncStatus = 'idle';
const statusListeners = new Set<() => void>();
const dirty = { settings: true, progress: true };
let timer: ReturnType<typeof setTimeout> | undefined;
let running: Promise<void> | null = null;

function setStatus(next: SyncStatus) {
  status = next;
  statusListeners.forEach((l) => l());
}

export function useSyncStatus() {
  return useSyncExternalStore(
    (l) => {
      statusListeners.add(l);
      return () => statusListeners.delete(l);
    },
    () => status,
  );
}

function schedule(delay = PUSH_DELAY) {
  clearTimeout(timer);
  timer = setTimeout(() => void flush(), delay);
}

/** Registers this device on first use. A token the server no longer knows is replaced. */
async function account() {
  const saved = loadAccount();
  if (saved) return saved;
  const { token, player } = await api.register(cleanPlayerName(getProgress().playerName) ?? undefined);
  const fresh = { id: player.id, token, name: player.name, logins: [] };
  saveAccount(fresh);
  dirty.settings = dirty.progress = true;
  return fresh;
}

async function push() {
  const acc = await account();
  const p = getProgress();
  if (p.playerName !== acc.name && cleanPlayerName(p.playerName)) {
    await api.rename(acc.token, p.playerName);
    saveAccount({ ...acc, name: p.playerName });
  }
  if (dirty.settings) {
    dirty.settings = false;
    await api.putSettings(acc.token, getSettings());
  }
  if (dirty.progress) {
    dirty.progress = false;
    const { coins, unlocked, records, owned, equipped, ledger, trial, bonusDay } = p;
    await api.putProgress(acc.token, { coins, unlocked, records, owned, equipped, ledger, trial, bonusDay });
  }
}

/** Sends everything that changed. Safe to call any time; concurrent calls share one run. */
export function flush(): Promise<void> {
  running ??= (async () => {
    clearTimeout(timer);
    setStatus('syncing');
    try {
      try {
        await push();
      } catch (e) {
        // The server lost this account (e.g. a database reset): start a new one and resend.
        if (!(e instanceof ApiError && e.status === 401)) throw e;
        saveAccount(null);
        await push();
      }
      setStatus('synced');
    } catch {
      dirty.settings = dirty.progress = true;
      setStatus('offline');
      schedule(RETRY_DELAY);
    } finally {
      running = null;
    }
    // Something changed while this run was in flight.
    if (status === 'synced' && (dirty.settings || dirty.progress)) schedule();
  })();
  return running;
}

let started = false;
export function startSync() {
  if (started) return;
  started = true;
  subscribeProgress(() => {
    dirty.progress = true;
    schedule();
  });
  subscribeSettings(() => {
    dirty.settings = true;
    schedule();
  });
  void flush();
}

/** The online leaderboard, after making sure the server has this device's latest scores. */
export async function fetchLeaderboard(kind: BoardKind): Promise<ServerBoard> {
  await flush();
  const acc = loadAccount();
  if (!acc || status !== 'synced') throw new Error('offline');
  return api.leaderboard(acc.token, kind);
}

// ---------------------------------------------------------------------------
// Permanent accounts
// ---------------------------------------------------------------------------

type Summary = { level: number; coins: number };

/**
 * Asked when signing in to an account whose cloud progress is behind this device's: keep the cloud
 * copy, or overwrite it with this device's progress.
 */
export type ChooseProgress = (device: Summary, cloud: Summary) => Promise<'cloud' | 'device'>;

/**
 * Signs in with Google or Apple. A guest's progress moves to the new login ("linked"); signing in
 * to an account that already exists (new phone, cleared data) restores its cloud progress.
 * Resolves "cancelled" if the player closed the sign-in sheet.
 */
export async function signInWith(provider: Provider, chooseProgress: ChooseProgress) {
  const idToken = await providerIdToken(provider);
  if (!idToken) return 'cancelled' as const;
  await flush();
  const res = await api.signIn(provider, idToken, loadAccount()?.token);
  const acc = { id: res.player.id, token: res.token, name: res.player.name, logins: res.logins };

  if (res.result === 'existing' && res.progress) {
    const device = getProgress();
    const choice =
      device.unlocked > res.progress.level
        ? await chooseProgress({ level: device.unlocked, coins: device.coins }, { level: res.progress.level, coins: res.progress.coins })
        : 'cloud';
    saveAccount(acc);
    if (choice === 'cloud') {
      restoreProgress(res.progress, res.player.name);
      updateSettings(res.settings);
    } else {
      restoreProgress({ ...res.progress, ...cloudShape(device) }, res.player.name);
    }
  } else {
    // A new login: this device's progress becomes the account's.
    saveAccount(acc);
  }
  dirty.settings = dirty.progress = true;
  await flush();
  return res.result;
}

/** This device's progress in the shape restoreProgress takes, keeping the account's name. */
function cloudShape(p: ReturnType<typeof getProgress>) {
  const { records, owned, equipped, trial, bonusDay } = p;
  return { coins: p.coins, level: p.unlocked, data: { records, owned, equipped, trial, bonusDay } };
}

/** Signs this device out of a linked account and starts over as a new guest. */
export async function signOut() {
  const acc = loadAccount();
  if (!acc) return;
  await api.logout(acc.token);
  startOver();
}

/** Permanently deletes the account on the server, then starts over as a new guest. */
export async function deleteAccount() {
  const acc = loadAccount();
  if (acc) await api.deleteAccount(acc.token);
  startOver();
}

function startOver() {
  signOutProviders();
  saveAccount(null);
  resetProgress();
  dirty.settings = dirty.progress = true;
  void flush();
}
