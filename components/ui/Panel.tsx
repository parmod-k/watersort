import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { chassis, colors, radii } from '../../theme/tokens';

export type PanelVariant = 'cream' | 'gold' | 'purple' | 'frost' | 'highlight';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: PanelVariant;
  radius?: number;
  /** Height of the extruded bottom rim; 0 for a flat panel. */
  rim?: number;
};

const LOOKS: Record<PanelVariant, { fill: readonly [string, string, ...string[]]; frame: string; inner: string; rim: string }> = {
  cream: { fill: chassis.cream, frame: '#FCD34D', inner: 'rgba(255,255,255,0.9)', rim: '#D99A2B' },
  highlight: { fill: ['#FFFBEA', '#FFF1C2', '#FFE08A'], frame: colors.gold, inner: '#FFFFFF', rim: colors.goldRim },
  gold: { fill: chassis.gold, frame: '#FEF3C7', inner: 'rgba(255,255,255,0.6)', rim: colors.goldRim },
  purple: { fill: chassis.purple, frame: '#FDE047', inner: 'rgba(255,255,255,0.35)', rim: colors.purpleRim },
  frost: { fill: ['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.22)'], frame: colors.frostEdge, inner: 'rgba(255,255,255,0.25)', rim: 'transparent' },
};

// Layout props stay on the outer shell; everything else (padding, gap, alignment) applies inside.
const OUTER_KEYS = new Set([
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
  'width', 'maxWidth', 'minWidth', 'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'position',
  'top', 'left', 'right', 'bottom', 'zIndex',
]);

/**
 * A chunky cartoon-3D card: double-bevel frame (bright outer rim plus a thin inner highlight)
 * over a soft gradient body, sitting on an extruded bottom lip.
 */
export default function Panel({ children, style, variant = 'cream', radius = radii.lg, rim }: Props) {
  const look = LOOKS[variant];
  const lip = rim ?? (variant === 'frost' ? 0 : 4);
  const flat = StyleSheet.flatten(style) ?? {};
  const outer: ViewStyle = {};
  const inner: ViewStyle = {};
  for (const [k, v] of Object.entries(flat)) {
    (OUTER_KEYS.has(k) ? outer : inner)[k as keyof ViewStyle] = v as never;
  }
  return (
    <View
      style={[
        styles.shell,
        variant === 'frost' && styles.frostShell,
        { borderRadius: radius, paddingBottom: lip, backgroundColor: look.rim },
        outer,
      ]}
    >
      <LinearGradient
        colors={look.fill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.body, { borderRadius: radius, borderColor: look.frame }, inner]}
      >
        <View
          pointerEvents="none"
          style={[styles.innerBevel, { borderRadius: Math.max(0, radius - 3), borderColor: look.inner }]}
        />
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    shadowColor: '#12052B',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  frostShell: { shadowOpacity: 0.25, elevation: 0 },
  body: { borderWidth: 3, overflow: 'hidden' },
  innerBevel: { ...StyleSheet.absoluteFill, borderWidth: 1.5 },
});
