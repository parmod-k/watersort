import 'expo-sqlite/localStorage/install';
import { useSyncExternalStore } from 'react';

/** Player preferences. Kept apart from progress so resetting progress never touches them. */
export type Settings = {
  sound: boolean;
  haptics: boolean;
};

const STORAGE_KEY = 'watersort.settings.v1';
const DEFAULTS: Settings = { sound: true, haptics: true };

function load(): Settings {
  try {
    const saved = JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return DEFAULTS;
    return {
      sound: typeof saved.sound === 'boolean' ? saved.sound : DEFAULTS.sound,
      haptics: typeof saved.haptics === 'boolean' ? saved.haptics : DEFAULTS.haptics,
    };
  } catch {
    return DEFAULTS;
  }
}

let state: Settings = load();
const listeners = new Set<() => void>();

export function subscribeSettings(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current settings, for code outside React (sound and haptics helpers). */
export function getSettings() {
  return state;
}

export function useSettings() {
  return useSyncExternalStore(subscribeSettings, getSettings, getSettings);
}

export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, ...patch };
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable; the change still applies until the app restarts.
  }
  listeners.forEach((l) => l());
}
