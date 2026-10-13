/**
 * Off-device copy of progress. Android needs none from the app: Android Auto Backup
 * (allowBackup) saves the app's SQLite storage to the player's Google account and restores it when
 * the game is reinstalled or set up on a new phone. On web there is nothing to back up to.
 * The iOS version is backup.ios.ts.
 */

export function loadBackup(): string | null {
  return null;
}

export function saveBackup(_json: string) {}
