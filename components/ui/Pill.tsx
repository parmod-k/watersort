import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { chassis, colors, radii } from '../../theme/tokens';

export type PillVariant = 'gold' | 'amber' | 'purple' | 'cream' | 'green';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: PillVariant;
  radius?: number;
};

const LOOKS: Record<PillVariant, { fill: [string, string, string]; border: string; rim: string }> = {
  gold: { fill: ['#FDE047', '#FBBF24', '#F59E0B'], border: '#FEF9C3', rim: colors.goldRim },
  amber: { fill: chassis.amber, border: '#FDE68A', rim: '#92400E' },
  purple: { fill: ['#A855F7', '#6D28D9', '#312E81'], border: colors.goldPale, rim: colors.purpleRim },
  cream: { fill: chassis.cream, border: '#FCD34D', rim: '#D99A2B' },
  green: { fill: chassis.green, border: '#FFFFFF', rim: colors.greenRim },
};

/** Small HUD capsule (counters, plaques, tags): glossy gradient, bright border, short bottom lip. */
export default function Pill({ children, style, variant = 'gold', radius = radii.md }: Props) {
  const look = LOOKS[variant];
  return (
    <View style={[styles.shell, { borderRadius: radius, backgroundColor: look.rim }]}>
      <LinearGradient
        colors={look.fill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.face, { borderRadius: radius, borderColor: look.border }, style]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingBottom: 3,
    shadowColor: '#12052B',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  face: { borderWidth: 2, justifyContent: 'center' },
});
