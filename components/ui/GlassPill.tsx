import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radii } from '../../theme/tokens';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tint?: 'default' | 'low' | 'glow';
  radius?: number;
};

export default function GlassPill({ children, style, tint = 'default', radius = radii.full }: Props) {
  return (
    <View
      style={[
        styles.base,
        { borderRadius: radius },
        tint === 'low' && styles.low,
        tint === 'glow' && styles.glow,
        style,
      ]}
    >
      <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: radius }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(38, 40, 64, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  low: {
    backgroundColor: 'rgba(24, 26, 49, 0.75)',
  },
  glow: {
    backgroundColor: 'rgba(38, 40, 64, 0.8)',
    shadowColor: colors.cyan,
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
});
