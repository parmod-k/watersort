# WaterSortApp

Water sort puzzle game built with Expo (SDK 57) and React Native.

## Run in development

```powershell
npm install
npm start
```

## Backend

The app runs fully offline and does not call the API. The `server/` folder (Node.js + MySQL) is kept
for reference and is not used by the app.

## Players, coins and in-app purchases

There is no sign-up and no server. Everything is stored on the device, and the App Store and Google Play
are the only outside services.

| What | Where it lives | Code |
| --- | --- | --- |
| Guest player ID (random UUID made on first launch), name, levels, scores, coins, coin totals, coin history (last 200), purchase history, Remove Ads / VIP status | `localStorage` backed by SQLite | `game/progress.ts`, `game/wallet.ts` |
| Settings | `localStorage` backed by SQLite | `game/settings.ts` |
| Purchases | Google Play Billing / StoreKit 2 through [`expo-iap`](https://github.com/hyochan/expo-iap) | `game/billing.native.ts`, `game/shop.ts` |
| Off-device copy of progress | Android: Auto Backup to Google Drive. iOS: Keychain | `game/backup.ts`, `game/backup.ios.ts` |

Screens: **Shop** (coin packs, Remove Ads, VIP Pass, Restore Purchases) opens from the coin counter's
**+** or from Settings → Go to → Shop. **Profile** (player ID, balance, earned/spent, purchase history,
coin history) opens from Settings → Go to → Profile.

### Products to create

Use the same product IDs in both stores. If you change them, update `game/shop.ts`.

| Product ID | Type (Play / App Store) | Gives |
| --- | --- | --- |
| `coins_500`, `coins_1500`, `coins_4000`, `coins_10000` | One-time product, consumable / Consumable | That many coins, once per purchase |
| `remove_ads` | One-time product, non-consumable / Non-Consumable | No interstitial ads, forever (rewarded ads stay optional) |
| `vip_monthly`, `vip_yearly` | Subscription with one auto-renewing base plan / Auto-Renewable Subscription (both in one subscription group) | No interstitial ads + 200 coins a day (`VIP.dailyCoins`) |

Prices are set in the store consoles and shown in the player's currency. The pack labels ("Popular",
"Best value") are in `game/shop.ts`. Keep them true for the prices you set.

**Google Play Console:** upload a build to a testing track first, because products can only be created
once the app has the BILLING permission (expo-iap adds it). Then go to Monetize → Products → In-app
products / Subscriptions. Add testers under Settings → License testing so they can buy with test cards.

**App Store Connect:** sign the Paid Applications agreement, then create the products under the app's
In-App Purchases and Subscriptions. Test with a Sandbox Apple ID (Settings → App Store → Sandbox
Account) or TestFlight.

Purchases need a development or release build (`npx expo run:android`, `npx expo run:ios`, or the APK
below), not Expo Go. The app's Android package must match the one on Play, and the build must be
installed from Play (internal testing track) or signed with the same key, for real product details to load.

### How purchases are kept correct

- **Each purchase pays once.** Coins are saved together with the store's purchase ID (iOS transaction ID,
  Android purchase token) in a single write, and only then is the transaction finished with the store.
  If the app dies in between, the store sends the purchase again on the next launch, and the saved ID
  stops it from paying twice. Restore also goes through this check.
- **Pending payments** (Android cash or bank methods) show as *Pending* in the purchase history and pay
  when Google confirms them, even if that happens while the game is closed.
- **Remove Ads / VIP** are re-checked with the store at launch and every time the game returns to the
  foreground. Refunds, cancellations and expiry are picked up there. Offline, the last confirmed state
  is used. A Play subscription counts as active for up to 7 days without a store check.
- **Restore Purchases** (Shop) brings back Remove Ads and an active VIP from the store account, and
  delivers any coin pack that was paid for but never delivered.
- Ad-free (Remove Ads or VIP) turns off banners, interstitials, app-open ads and the bonus-gift offer. Rewarded ads stay because players choose them. See the ads section below.

### Limitations (no backend)

- **Coin packs can't be restored by the stores.** Once a consumable is delivered and finished, neither
  Google Play nor the App Store lists it again. Coins bought earlier come back only with the device
  backup below. If that backup is missing (backup turned off, or a different Google account or Apple ID),
  those coins are lost. Only a server-side account could guarantee them.
- **Purchase and coin history are per device.** They come back with the device backup, but the stores
  don't provide your app's history. On a fresh device without a backup, Restore recreates entries for
  Remove Ads and VIP only.
- **No server receipt validation.** StoreKit 2 verifies transactions on the device. On Android, nothing
  checks purchases against Google's servers, so a rooted device running a billing-patching tool could
  fake a purchase. Coins and ad-free status are client-side and can't be fully protected without a server.
- **Subscription details are partial on Android.** Google Play gives the app "active" and "will renew"
  only. The expiry date, renewal history and grace periods need the Play Developer API (a server).
  iOS gives the expiry date and auto-renew status, and each renewal is added to the history when the
  app sees it.
- **Upgrading monthly ↔ yearly** goes through the store's subscription settings (Shop → Manage
  subscription). The app doesn't do in-app plan switching.
- **Rare edge case:** if two devices on the same store account both see the same coin purchase before
  either finishes it, both can pay it out.

### Restoring progress on a new device (no sign-up)

- **Android:** `allowBackup` is on, and the app sets no backup rules, so Android Auto Backup saves the
  game's SQLite data to the player's Google account (about once a day, on Wi-Fi while charging) and
  restores it when the game is installed from Play on a new phone or reinstalled. The player needs
  Backup turned on in Android settings. `expo-secure-store`'s Android backup rules are switched off in
  `app.json` (`configureAndroidBackup: false`) because they would back up SharedPreferences only and
  leave the save out. To test: `adb shell bmgr backupnow com.watersortapp`, uninstall, then reinstall.
- **iOS:** a compact snapshot of progress is kept in the Keychain. iOS keeps Keychain items when an app
  is deleted, so reinstalling on the same iPhone brings progress back. The app's data and the Keychain
  item also move to a new iPhone through iCloud backup, encrypted Finder backup or Quick Start.
- **Not implemented, and why:**
  - *Live cross-device sync* through iCloud key-value storage or Google Play Games Saved Games would
    need custom native modules, plus iCloud entitlements or Play Games sign-in. They also wouldn't work
    across platforms.
  - *Moving progress between iOS and Android* isn't possible without a backend.

## Build an Android APK for testing (local)

### Prerequisites

- Node.js and npm
- JDK (17+; JDK 25 works with Gradle 9.3.1). Check with `java -version`.
- Android SDK, with `ANDROID_HOME` set (e.g. `C:\Users\<you>\AppData\Local\Android\Sdk`). Check with `echo $env:ANDROID_HOME`.

### Steps

1. **Install dependencies** (if `node_modules` is missing or `package.json` changed)

   ```powershell
   npm install
   ```
```npx expo-doctor```
2. **Generate the native Android project.** Run this the first time, and again whenever you change `app.json`, icons or native packages:

   ```powershell
   npx expo prebuild --platform android --clean
   ```

   The `android/` folder is generated and git-ignored. Don't edit it by hand.

3. **Build the release APK**

   ```powershell
   cd android
   .\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
   ```

   - The first build takes 10–20 minutes because it downloads Gradle, the NDK and other dependencies. Later builds are much faster.
   - `arm64-v8a` covers almost all real phones. Leave out the flag to build every ABI, including x86 emulators. That build is slower and the APK is larger.
   - For JS/UI-only changes, re-run this step. You don't need step 2.

4. **Find the APK**

   ```
   android\app\build\outputs\apk\release\app-release.apk
   ```

5. **Install it on a phone**

   - Over USB (with USB debugging enabled on the phone):

     ```powershell
     & "$env:ANDROID_HOME\platform-tools\adb.exe" install -r android\app\build\outputs\apk\release\app-release.apk
     ```

   - Or copy the APK to the phone, open it, and allow "Install unknown apps" when Android asks.

> This APK is signed with the debug keystore. That's fine for testing, but a Play Store upload needs a proper release keystore.

### Troubleshooting

- **Gradle download times out** (`Downloading ... gradle-9.3.1-bin.zip failed: timeout`): download the zip with curl and point the wrapper at the local file.

  ```powershell
  curl.exe -L -o $HOME\.gradle\gradle-9.3.1-bin.zip https://services.gradle.org/distributions/gradle-9.3.1-bin.zip
  ```

  Then, in `android\gradle\wrapper\gradle-wrapper.properties`, set the following (use your own user path):

  ```
  distributionUrl=file\:///C\:/Users/<you>/.gradle/gradle-9.3.1-bin.zip
  networkTimeout=120000
  validateDistributionUrl=false
  ```

  Running `expo prebuild --clean` resets this file, so you'll need to re-apply the change after it.

- **`Cannot get property 'googleMobileAdsJson' on extra properties extension`:** a react-native-google-mobile-ads
  17.2 bug with Expo projects. `plugins/withGoogleMobileAdsBackend.js` (listed in `app.json`) works around
  it by setting `RNGMA_ANDROID_BACKEND=classic` in `gradle.properties` on every prebuild.
- **Other download timeouts during the build:** re-run the build. Gradle resumes where it stopped.
- **"SDK location not found":** create `android\local.properties` containing
  `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk`
- **Lock or "another process" errors:** run `.\gradlew.bat --stop` in `android\`, then try again.

## Ads (AdMob)

The code is in `game/ads.native.ts` (ad unit IDs, frequency, ad-free checks) and `components/AdBanner.native.tsx`.
Frequency settings are under `ADS` in `game/economy.ts`. Debug builds always use Google's test ads.
Release builds use the IDs below.

AdMob app ID (Android, in `app.json`): `ca-app-pub-5371388954072964~8691216029`

| Format | Android ad unit ID | Where and when |
| --- | --- | --- |
| Rewarded | `ca-app-pub-5371388954072964/9068735955` | Player's choice: double level coins, or coins when short for a booster |
| Interstitial | `ca-app-pub-5371388954072964/1828540189` | After "Next Level" every 3rd level, from level 6 |
| Banner (anchored adaptive) | `ca-app-pub-5371388954072964/1956532691` | Bottom of Stages, Themes, Rank and Profile. Never on the Play board or in the Shop |
| Rewarded interstitial | `ca-app-pub-5371388954072964/5350736812` | "Bonus gift" (+75 coins) every 5th level from level 10, on levels without an interstitial. A 5-second intro with "No thanks" comes first, as AdMob requires |
| App open | `ca-app-pub-5371388954072964/3669244626` | When returning to the game after 30 s or more away, at most every 4 minutes, from level 6. Never after a purchase, Restore or Manage subscription |

Remove Ads / VIP turn off everything except rewarded ads. The iOS unit IDs are still placeholders
(`ca-app-pub-XXXXXXXXXXXXXXXX/IOS_…` in `game/ads.native.ts`, and Google's test `iosAppId` in `app.json`),
so iOS release builds show no ads until an iOS app is added in AdMob.

## Rewarded Amount
    100 coins


## Production

  cd D:\work\WaterSortApp
  npx --yes eas-cli@latest whoami
  npx --yes eas-cli@latest project:info
  npx --yes eas-cli@latest build --platform android --profile production