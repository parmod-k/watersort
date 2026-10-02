# WaterSortApp

Water sort puzzle game built with Expo (SDK 57) and React Native.

## Run in development

```powershell
npm install
npm start
```

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

- **Other download timeouts during the build:** re-run the build. Gradle resumes where it stopped.
- **"SDK location not found":** create `android\local.properties` containing
  `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk`
- **Lock or "another process" errors:** run `.\gradlew.bat --stop` in `android\`, then try again.
