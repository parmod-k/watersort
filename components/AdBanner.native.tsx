import React from 'react';
import { StyleSheet, View } from 'react-native';
import { usePathname } from 'expo-router';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { BANNER_UNIT, useCanRequestAds } from '../game/ads';
import { ADS } from '../game/economy';
import { useProgress } from '../game/progress';
import { isAdFree } from '../game/wallet';

/**
 * Anchored adaptive banner under the menu screens (ADS.bannerScreens). Not shown on the Play board,
 * where taps near the bottles would be accidental clicks, nor for Remove Ads / VIP players.
 */
export default function AdBanner() {
  const canRequestAds = useCanRequestAds();
  const { entitlements } = useProgress();
  const pathname = usePathname();
  if (!canRequestAds || isAdFree(entitlements) || !ADS.bannerScreens.includes(pathname)) return null;
  return (
    <View style={styles.wrap}>
      <BannerAd unitId={BANNER_UNIT} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
});
