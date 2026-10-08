import 'expo-sqlite/localStorage/install';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { BoardEntry, BoardKind } from './scoring';
import type { Settings } from './settings';

/**
 * Where the Water Sort API (the server/ folder) runs. Set EXPO_PUBLIC_API_URL for real builds;
 * in development it defaults to port 4000 on the machine running the Expo dev server, which
 * phones on the same Wi-Fi can reach.
 */
function apiBase() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'web') return `${globalThis.location?.protocol ?? 'http:'}//${globalThis.location?.hostname ?? 'localhost'}:4000`;
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (devHost) return `http://${devHost}:4000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
}

const ACCOUNT_KEY = 'watersort.account.v1';

/** This device's anonymous account; `name` is the last name the server confirmed. */
type Account = { id: number; token: string; name: string };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function loadAccount(): Account | null {
  try {
    const a = JSON.parse(globalThis.localStorage?.getItem(ACCOUNT_KEY) ?? 'null');
    return a && typeof a.token === 'string' && Number.isFinite(a.id) ? a : null;
  } catch {
    return null;
  }
}

export function saveAccount(account: Account | null) {
  try {
    if (account) globalThis.localStorage?.setItem(ACCOUNT_KEY, JSON.stringify(account));
    else globalThis.localStorage?.removeItem(ACCOUNT_KEY);
  } catch {}
}

async function request<T>(method: string, path: string, { token, body }: { token?: string; body?: unknown } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(apiBase() + path, {
      method,
      signal: controller.signal,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, json.error ?? `HTTP ${res.status}`);
    return json as T;
  } finally {
    clearTimeout(timer);
  }
}

export type ServerBoard = { kind: BoardKind; total: number; top: BoardEntry[]; around: BoardEntry[]; me: BoardEntry };

export const api = {
  register: (name?: string) =>
    request<{ token: string; player: { id: number; name: string } }>('POST', '/players', { body: { name } }),
  rename: (token: string, name: string) => request<{ player: { name: string } }>('PATCH', '/me', { token, body: { name } }),
  putSettings: (token: string, settings: Settings) =>
    request<{ settings: Settings }>('PUT', '/me/settings', { token, body: settings }),
  putProgress: (token: string, progress: unknown) => request('PUT', '/me/progress', { token, body: progress }),
  leaderboard: (token: string, kind: BoardKind) => request<ServerBoard>('GET', `/leaderboard?kind=${kind}`, { token }),
};
