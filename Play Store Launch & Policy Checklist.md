# Play Store Launch & Policy Checklist

Updated: Nov 21, 2026

## Is checklist ko kaise use karein

Har naye app ke launch se pehle ye checklist upar se neeche tick karein. Ye WaterSortApp (Expo SDK 57, AdMob, Play Billing) mein jo kuch kiya gaya hai uspar based hai, isliye ads + in-app purchase wale kisi bhi game ya app par seedha lagta hai.

- Har section mein pehle **rule** hai, phir **app mein kaise kiya** (file / setting ka naam), taaki agle app mein copy kar sakein.
- `- [ ]` items tick karte jaayein. Naye app ke liye is doc ki copy banayein.
- Google ki policies har kuch mahine badalti hain. Release se pehle Play Console ke **Policy status** aur **Inbox** emails zaroor dekhein. Is doc ke facts memory aur app code se hain, web se re-check nahi kiye gaye.

## 1. Pre-launch zaroori cheezein

Play Console ke **App content** page ke saare declarations bhare bina app review mein nahi jaata.

| Cheez | Rule | WaterSortApp mein |
| --- | --- | --- |
| Target SDK | Naye apps aur updates ko latest-1 se naya API level target karna hoga | compileSdk / targetSdk 36 (Expo SDK 57 default) |
| Permissions | Sirf wahi permission jo feature ko chahiye; extra permission = rejection risk | Sirf `MODIFY_AUDIO_SETTINGS` (app.json `android.permissions`); expo-audio mein mic off |
| Privacy policy | Public URL, app ke andar bhi link, ads/IAP/data collection likha ho | [Privacy policy](https://kiratitechsolutions.github.io/watersort-privacy-policy/) + [Terms](https://kiratitechsolutions.github.io/watersort-terms-of-service/): store listing, Profile screen (Legal row) aur Shop subscription text mein; URLs `game/legal.ts` mein |
| Ads declaration | App content > Ads: "Haan, app mein ads hain" | Yes (AdMob) |
| App access | Login ho to test account dena | Login nahi hai: "All functionality available" |
| Store listing | Screenshots asli gameplay ke, title mein "best/#1/free" jaise words nahi, keyword stuffing nahi | — |
| Package name | Ek baar publish ke baad badal nahi sakta | `com.watersortapp` |
| Signing | Play App Signing on; upload key safe rakhein, git mein nahi | `.jks` / `.p12` gitignored; EAS remote credentials |
| Build format | AAB zaroori | eas.json `buildType: app-bundle`, `autoIncrement` |

- [ ] App content ke saare declarations complete (Ads, App access, Content rating, Target audience, Data safety, Government app, Financial features, Health)
- [ ] Privacy policy URL live hai aur app ke andar khulta hai (naye app: nayi GitHub Pages repo `<app>-privacy-policy`, `game/legal.ts` mein URL)
- [ ] Merged AndroidManifest mein koi anchaahi permission nahi (libraries bhi permission jodti hain: `AD_ID`, `BILLING` theek hain)
- [ ] Closed testing: naye personal developer account par 12 testers x 14 din ki shart (organization account par lagu nahi)

## 2. Data safety aur privacy

Data safety form mein app ke saath-saath har SDK ka data bhi likhna hota hai; AdMob aur Play Billing ka data chhupana sabse aam rejection hai.

| SDK / feature | Data safety mein kya likhein |
| --- | --- |
| AdMob (react-native-google-mobile-ads) | Device or other IDs (Advertising ID), Approximate location, App interactions, Diagnostics / crash logs. Purpose: Advertising, Analytics, Fraud prevention. Shared: Yes |
| Play Billing (expo-iap) | Purchase history. Purpose: App functionality |
| Local save (expo-sqlite, expo-secure-store) | Device par hi rehta hai, server par nahi jaata: "collected" nahi maana jaata |
| Leaderboard / server | Agar naam ya score server par jaata hai to "App activity / In-app" + "User IDs" likhein |
| Encryption in transit | Yes (HTTPS) |

App mein kaise kiya:

- `delayAppMeasurementInit: true` (app.json AdMob plugin): consent milne se pehle AdMob measurement shuru nahi hota.
- `allowBackup: true`, lekin expo-secure-store ka `configureAndroidBackup: false` taaki secure keys backup mein na jaayein.
- Account system nahi hai, isliye account-deletion URL ki zaroorat nahi. Login jodenge to app ke andar aur web par **account delete** ka option zaroori hai.

* [ ] Data safety form har SDK ke docs se match karta hai (Google ka "AdMob Data safety" page dekhein)
* [ ] Privacy policy aur Data safety form ek hi baat kehte hain
* [ ] Login hai to in-app + web account deletion link

## 3. Ads policy (AdMob)

Ads tabhi safe hain jab consent pehle aaye, ad hamesha band kiya ja sake, aur ad kabhi galti se click na ho. Ye rules `game/ads.native.ts` aur `game/economy.ts` mein lagaye gaye hain.

### Consent (EEA, UK, Switzerland)

- Google UMP form: `AdsConsent.gatherConsent()` SDK start hone se pehle. `canRequestAds` false ho to koi ad request nahi.
- AdMob console > Privacy & messaging mein GDPR message banana zaroori; US states ke liye bhi message on karein.
- Profile screen par "Privacy settings" button jab `privacyOptionsRequirementStatus === REQUIRED` ho (`showPrivacyOptions()`).

### Format ke rules

| Format | Rule | App mein setting |
| --- | --- | --- |
| Interstitial | Sirf natural break par (level complete), gameplay ke beech nahi, app khulte hi nahi | Level 6 se, har 3 level par ek (`interstitialFromLevel`, `interstitialEvery`) |
| Rewarded | User khud chune; reward saaf likha ho; reward tabhi jab `EARNED_REWARD` aaye | Coins ke liye button; Remove Ads ke baad bhi rehta hai |
| Rewarded interstitial | Shuru hone se pehle skip karne wali intro screen zaroori | Bonus gift: level 10 se, har 5 level, interstitial wale level par nahi |
| App open | Loading/return par; jaldi-jaldi nahi; purchase sheet se lautne par nahi | 30 s bahar rehne ke baad, min 4 min gap, `holdAppOpen()` purchase ke dauraan |
| Banner | Buttons se door, game board par nahi, content ko na dhake | Sirf Stages, Themes, Rank, Profile screens par; Shop mein nahi |

### Kabhi mat karna

- Apne ads khud click karna ya real ads par test karna: debug build mein hamesha `TestIds` (`__DEV__` check).
- Ad ko button ke bilkul paas rakhna (accidental clicks), ya fake close button.
- Ek screen par ek se zyada full-screen ad, ya back button dabane par ad.
- "Ad dekho to aage badho" jahan ad dekhna zaroori ho (rewarded hamesha optional).
- Bachchon ke app mein personalized ads (dekhein section 5).

* [ ] `app-ads.txt` developer website ke root par, AdMob mein verified ([kiratitechsolutions.github.io/app-ads.txt](https://kiratitechsolutions.github.io/app-ads.txt); Play Console ki developer website bhi `https://kiratitechsolutions.github.io` honi chahiye)
* [ ] Production ad unit IDs sirf release build mein; test device AdMob mein add
* [ ] Remove Ads / VIP lene par interstitial, banner, app-open band ho jaate hain
* [ ] Ad load fail hone par retry 30–60 s baad, lagatar request nahi

## 4. In-app purchases aur subscriptions

Digital cheezein (coins, Remove Ads, VIP) sirf Google Play Billing se bik sakti hain; koi doosra payment link ya UPI nahi. App mein `expo-iap` (store: play) + `game/billing.native.ts`.

| Rule | App mein kaise |
| --- | --- |
| Har purchase server/store se confirm ho, ek hi baar mile | `handlePurchase()` store ke purchase token se ek hi baar pay karta hai; unfinished purchases app start par deliver (`initBilling()`) |
| Purchase acknowledge / finish karna (3 din mein nahi to Google refund kar deta hai) | Deliver ke baad `finishTransaction` |
| Restore purchases button | Shop screen mein Restore Purchases; reinstall/naye phone par Remove Ads wapas |
| Subscription: price, period, auto-renew, cancel kaise — buy button ke paas saaf likha | Shop mein VIP ke neeche: "Renews automatically until cancelled. Cancel any time in your Google Play..." |
| Subscription manage/cancel ka rasta | `deepLinkToSubscriptions()` Play subscription page kholta hai |
| Free trial ho to trial ke baad kitna charge hoga, bold mein | — |
| Loot box / random reward ho to odds dikhane zaroori | Random paid reward nahi hai |

- [ ] Play Console mein saare product IDs active, prices har country mein set
- [ ] License testers add karke test purchase + refund + restore check kiya
- [ ] Subscription cancel karne par entitlement expiry par band hota hai
- [ ] Purchase sheet khulte waqt app-open ad nahi aata

## 5. Age rating, bachche aur Age Signals

Target audience 13+ rakhein jab tak app Families policy ke liye taiyaar na ho; under-13 chunte hi Families policy ke saare rules (certified ad SDKs, koi personalized ad nahi) lagu ho jaate hain.

| Cheez | Rule | WaterSortApp mein |
| --- | --- | --- |
| Content rating (IARC questionnaire) | Sach bharein; ads aur in-app purchase ke sawaal "Yes" | Simulated gambling nahi, violence nahi |
| Target audience | Under-13 select kiya to Families policy + Teacher Approved jaise rules | Play Console mein jo chuna hai woh confirm karein (casual puzzle hai, bachche bhi khel sakte hain, isliye neeche wali protection) |
| "Appeals to children" | Cartoon/colourful game bachchon ko attract kare to Google khud Families mein daal sakta hai | Ad settings minors ke liye safe rakhi hain |
| Play Age Signals API | US (Texas; California AB 1043 aur Brazil Digital ECA Jan 2027 se) mein age range Play deta hai | `modules/age-signals` (library 0.0.6) + `game/ageSignals.ts` |

Age Signals se ads kaise badalte hain (`initAds()` mein, SDK start se pehle):

| Age band | Ad settings |
| --- | --- |
| Child (13 se kam) | `tagForChildDirectedTreatment`, `tagForUnderAgeOfConsent`, max rating G |
| Teen (13–17) ya verification baaki | `tagForUnderAgeOfConsent`, max rating PG |
| Adult / unknown | Normal |

- Age data sirf age-appropriate experience ke liye; Play ke terms ke mutabik ad targeting, analytics ya server par bhejna mana hai.
- Play ka "age share karein" prompt sirf mandatory regions mein (`checkAgeSignals(false)`).

* [ ] Content rating questionnaire har bade update par dobara check
* [ ] Target audience aur store listing ki graphics ek doosre se match karti hain
* [ ] Naya app: `modules/age-signals` folder copy karein, `initAds()` wala hissa jodein, native build banayein

## 6. Technical quality (Play Console warnings)

Ye warnings rejection nahi karti, lekin Play Console ke "quality" aur "Android vitals" score girati hain aur store ranking par asar daalti hain. Sab config plugins mein hain, kyunki `android/` folder `expo prebuild` se dobara banta hai.

| Warning | Fix | Kahan |
| --- | --- | --- |
| Code shrink / DEX optimisation low | Release mein minify + shrinkResources; `proguard-android-optimize.txt` | `expo-build-properties` + `plugins/withPlayStoreCompliance.js` |
| Large screens / tablets par orientation lock | `portrait` ki jagah `sensorPortrait`, `resizeableActivity` hatana | `plugins/withPlayStoreCompliance.js` |
| Edge-to-edge: deprecated `statusBarColor` / `navigationBarColor` (Android 15+) | Theme se dono attributes hatana | `plugins/withoutDeprecatedBarColors.js` |
| Predictive back gesture | Abhi off rakha hai jab tak har screen test na ho | app.json `predictiveBackGestureEnabled: false` |
| 16 KB memory page size (Android 15+) | Native libraries 16 KB aligned hon; RN 0.86 / Expo 57 mein default | Naya native SDK jodte waqt check |
| AdMob build error (`googleMobileAdsJson`) | Gradle property pin | `plugins/withGoogleMobileAdsBackend.js` |

- [ ] Pre-launch report (Play Console > Testing) mein crash ya accessibility error nahi
- [ ] ANR rate 0.47% aur crash rate 1.09% se neeche (Android vitals bad-behaviour threshold)
- [ ] Release AAB ek asli phone par install karke ads, purchase aur restore test kiye
- [ ] Naye app mein ye 4 plugin files copy karke app.json `plugins` mein jodein

## 7. iOS / App Store (jab iOS par launch karein)

WaterSortApp mein iOS abhi taiyaar nahi hai: iOS ad unit IDs `XXXX` placeholder hain aur `iosAppId` Google ka test ID hai.

- [ ] Asli iOS AdMob app ID aur ad unit IDs (`game/ads.native.ts`, app.json)
- [ ] App Tracking Transparency: `userTrackingUsageDescription` set hai; ATT prompt UMP consent ke baad dikhe
- [ ] Privacy manifest (`PrivacyInfo.xcprivacy`) aur App Store "App Privacy" labels AdMob ke hisaab se
- [ ] Restore Purchases button (Apple ise zaroori maanta hai) aur subscription terms + privacy policy link purchase screen par
- [ ] Age: Apple ka Declared Age Range API (Texas/Utah jaise kanoon) — Age Signals module sirf Android hai
- [ ] iCloud backup (`game/backup.ios.ts`) App Privacy mein likhein agar user data jaata hai

## 8. Release se pehle aakhri check

Release ka order yahi rakhein: internal testing, phir closed testing, phir production mein staged rollout (pehle 10–20%).

1. `npm test` aur `npx tsc --noEmit` pass.
2. `eas build -p android --profile production` (native badlav ho to OTA nahi, naya build).
3. Internal testing par upload; pre-launch report dekhein.
4. Asli phone par: consent form, ads (test device), purchase, restore, Remove Ads ke baad ads band.
5. Release notes, Data safety, content rating dobara dekhein.
6. Production staged rollout; 2–3 din Android vitals aur AdMob "Policy center" dekhein, phir 100%.

### Aam rejection ke kaaran

| Kaaran | Bachav |
| --- | --- |
| Data safety form SDK ke data se match nahi | Section 2 ki table |
| Privacy policy link toota ya app mein nahi | Live URL + in-app link |
| Ads gameplay ke beech, ya button ke paas (accidental click) | Section 3 ke format rules |
| Real ads par khud test karna (AdMob account ban) | Debug mein `TestIds`, test device |
| Bina zaroorat permission | Merged manifest check |
| Subscription terms saaf nahi | Buy button ke paas price, period, cancel |
| Store listing mein misleading screenshots / keywords | Asli gameplay screenshots |
| Policy email ignore karna (jaise Age Signals) | Play Console Inbox har release se pehle |

## Links (WaterSortApp)

| Link | URL | Kahan use |
| --- | --- | --- |
| Privacy policy | https://kiratitechsolutions.github.io/watersort-privacy-policy/ | Play Console store listing, Profile, Shop |
| Terms of service | https://kiratitechsolutions.github.io/watersort-terms-of-service/ | Profile, Shop (subscription ke paas) |
| app-ads.txt | https://kiratitechsolutions.github.io/app-ads.txt | AdMob verification (developer website ke root par) |
| robots.txt | https://kiratitechsolutions.github.io/robots.txt | Crawlers ko app-ads.txt padhne dena (block na kare) |
