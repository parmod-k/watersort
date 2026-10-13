import * as SecureStore from 'expo-secure-store';

/**
 * iOS deletes an app's files when it is uninstalled but keeps its Keychain items, so a copy of the
 * progress snapshot kept there brings the player back after a reinstall on the same iPhone. With
 * AFTER_FIRST_UNLOCK (not "this device only") the item also travels in encrypted iCloud/Finder
 * backups and Quick Start transfers to a new iPhone.
 */

const KEY = 'watersort.backup.v1';
const WRITE_DELAY = 1500;

let pending: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

export function loadBackup(): string | null {
  try {
    return SecureStore.getItem(KEY);
  } catch {
    return null;
  }
}

/** Progress often changes several times in a row (level reward, trial bonus), so writes are batched. */
export function saveBackup(json: string) {
  pending = json;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const value = pending;
    pending = null;
    if (value === null) return;
    SecureStore.setItemAsync(KEY, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK }).catch(() => {});
  }, WRITE_DELAY);
}
