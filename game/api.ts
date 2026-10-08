import 'expo-sqlite/localStorage/install';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import type { CloudProgress } from './progress';
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

export type Provider = 'google' | 'apple';
export type Login = { provider: Provider; email: string | null };

/**
 * This device's account. `name` is the last name the server confirmed; `logins` are the Google /
 * Apple identities linked to it (empty for a guest, which only this device can use).
 */
export type Account = { id: number; token: string; name: string; logins: Login[] };

/**
 * The token lives in the iOS Keychain / Android Keystore, not in app storage. On iOS the Keychain
 * survives reinstalling the app; on Android it doesn't, which is why linking Google matters there.
 */
const tokenStore =
  Platform.OS === 'web'
    ? {
        get: () => globalThis.localStorage?.getItem(ACCOUNT_KEY) ?? null,
        set: (v: string) => globalThis.localStorage?.setItem(ACCOUNT_KEY, v),
        remove: () => globalThis.localStorage?.removeItem(ACCOUNT_KEY),
      }
    : {
        get: () => SecureStore.getItem(ACCOUNT_KEY),
        set: (v: string) => SecureStore.setItem(ACCOUNT_KEY, v, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK }),
        remove: () => void SecureStore.deleteItemAsync(ACCOUNT_KEY).catch(() => {}),
      };

function readAccount(): Account | null {
  try {
    let raw = tokenStore.get();
    // Builds before secure storage kept the account in plain app storage: move it.
    const legacy = Platform.OS === 'web' ? null : globalThis.localStorage?.getItem(ACCOUNT_KEY);
    if (!raw && legacy) {
      tokenStore.set(legacy);
      globalThis.localStorage?.removeItem(ACCOUNT_KEY);
      raw = legacy;
    }
    const a = JSON.parse(raw ?? 'null');
    if (!a || typeof a.token !== 'string' || !Number.isFinite(a.id)) return null;
    return { ...a, logins: Array.isArray(a.logins) ? a.logins : [] };
  } catch {
    return null;
  }
}

let account: Account | null | undefined;
const accountListeners = new Set<() => void>();

export function loadAccount(): Account | null {
  if (account === undefined) account = readAccount();
  return account;
}

export function saveAccount(next: Account | null) {
  account = next;
  try {
    if (next) tokenStore.set(JSON.stringify(next));
    else tokenStore.remove();
  } catch {}
  accountListeners.forEach((l) => l());
}

export function useAccount() {
  return useSyncExternalStore(
    (l) => {
      accountListeners.add(l);
      return () => accountListeners.delete(l);
    },
    loadAccount,
  );
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
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
    const json = res.status === 204 ? {} : await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, json.error ?? `HTTP ${res.status}`);
    return json as T;
  } finally {
    clearTimeout(timer);
  }
}

/** An account as the server returns it on sign-in and from GET /me. */
export type ServerAccount = {
  player: { id: number; name: string };
  logins: Login[];
  settings: Settings;
  progress: CloudProgress | null;
};

export type SignInResult = ServerAccount & { result: 'linked' | 'existing' | 'created'; token: string };

export type ServerBoard = { kind: BoardKind; total: number; top: BoardEntry[]; around: BoardEntry[]; me: BoardEntry };

export const api = {
  register: (name?: string) =>
    request<{ token: string; player: { id: number; name: string } }>('POST', '/players', { body: { name } }),
  rename: (token: string, name: string) => request<{ player: { name: string } }>('PATCH', '/me', { token, body: { name } }),
  putSettings: (token: string, settings: Settings) =>
    request<{ settings: Settings }>('PUT', '/me/settings', { token, body: settings }),
  putProgress: (token: string, progress: unknown) => request('PUT', '/me/progress', { token, body: progress }),
  signIn: (provider: Provider, idToken: string, token?: string) =>
    request<SignInResult>('POST', `/auth/${provider}`, { token, body: { idToken } }),
  logout: (token: string) => request('POST', '/me/logout', { token }),
  deleteAccount: (token: string) => request('DELETE', '/me', { token }),
  leaderboard: (token: string, kind: BoardKind) => request<ServerBoard>('GET', `/leaderboard?kind=${kind}`, { token }),
};
