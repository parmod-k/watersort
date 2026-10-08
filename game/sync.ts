import { useSyncExternalStore } from 'react';
import { api, ApiError, loadAccount, saveAccount, type ServerBoard } from './api';
import { cleanPlayerName, getProgress, subscribeProgress } from './progress';
import { getSettings, subscribeSettings } from './settings';
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
  const fresh = { id: player.id, token, name: player.name };
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
    const { coins, unlocked, records, owned, equipped, ledger } = p;
    await api.putProgress(acc.token, { coins, unlocked, records, owned, equipped, ledger });
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
