import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/tokens';

type Props = { children: React.ReactNode };

const backdrop = require('../../assets/tiki-background.jpg');

/** The illustrated tiki-bar beach scene behind every screen, with a readability vignette. */
export default function ScreenBackground({ children }: Props) {
  return (
    <View style={styles.root}>
      <Image source={backdrop} resizeMode="cover" style={styles.art} />
      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', 'rgba(69,26,3,0.35)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backdrop, overflow: 'hidden' },
  // Explicit size so web doesn't fall back to the image's intrinsic dimensions.
  art: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
});
