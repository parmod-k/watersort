import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { artTextShadow, chassis, colors, fontFamily } from '../../theme/tokens';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  /** Purple tool button (default) or the big gold hero button. */
  variant?: 'purple' | 'gold';
  /** Round booster disk, or a rounded-square "squircle" (header settings). */
  shape?: 'round' | 'squircle';
  badge?: string | number;
  badgeTone?: 'green' | 'gold';
  /** Caption under the button, drawn over the backdrop art. */
  label?: string;
  /** Caption color for light surfaces; drops the over-art shadow. */
  labelColor?: string;
  size?: number;
  iconColor?: string;
  iconSize?: number;
  disabled?: boolean;
};

/** Chunky glossy booster button with a bright frame, extruded rim and an optional corner badge. */
export default function IconButton({
  icon,
  onPress,
  variant = 'purple',
  shape = 'round',
  badge,
  badgeTone = 'green',
  label,
  labelColor,
  size = 56,
  iconColor,
  iconSize,
  disabled = false,
}: Props) {
  const gold = variant === 'gold';
  const radius = shape === 'round' ? size / 2 : size * 0.3;
  const lip = Math.max(3, Math.round(size * 0.08));
  const border = size >= 52 ? 4 : 3;
  return (
    <View style={styles.wrap}>
      <Pressable
        disabled={disabled}
        hitSlop={4}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onPress?.();
        }}
      >
        {({ pressed }) => (
          <View style={{ paddingTop: pressed ? lip - 1 : 0 }}>
            <View
              style={[
                styles.shell,
                {
                  width: size,
                  height: size + (pressed ? 1 : lip),
                  borderRadius: radius,
                  paddingBottom: pressed ? 1 : lip,
                  backgroundColor: gold ? colors.goldRim : colors.purpleRim,
                  opacity: disabled ? 0.55 : 1,
                },
              ]}
            >
              <LinearGradient
                colors={gold ? chassis.gold : chassis.purple}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.face,
                  { borderRadius: radius, borderWidth: border, borderColor: gold ? '#FFFFFF' : colors.goldPale },
                ]}
              >
                <View pointerEvents="none" style={[styles.gloss, { borderRadius: radius }]} />
                <MaterialIcons
                  name={icon}
                  size={iconSize ?? Math.round(size * 0.48)}
                  color={iconColor ?? (gold ? colors.goldInk : '#FFFFFF')}
                  style={styles.iconShadow}
                />
              </LinearGradient>
            </View>
            {badge !== undefined && (
              <View
                style={[
                  styles.badge,
                  { bottom: pressed ? -2 : lip - 4 },
                  badgeTone === 'gold' ? styles.badgeGold : styles.badgeGreen,
                ]}
              >
                <Text style={[styles.badgeText, badgeTone === 'gold' && { color: colors.goldInk }]}>{badge}</Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
      {label && (
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            size < 50 && { fontSize: 10 },
            gold && { color: colors.onArtGold, fontSize: size < 70 ? 12 : 13 },
            labelColor !== undefined && { color: labelColor, textShadowColor: 'transparent' },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  shell: {
    shadowColor: '#12052B',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  face: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  gloss: {
    position: 'absolute',
    top: 2,
    left: '14%',
    right: '14%',
    height: '42%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  iconShadow: { textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  badge: {
    position: 'absolute',
    right: -4,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGreen: { backgroundColor: '#10B981' },
  badgeGold: { backgroundColor: colors.goldPale },
  badgeText: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 11 },
  label: {
    marginTop: 4,
    color: '#FFFFFF',
    fontFamily: fontFamily.black,
    fontSize: 12,
    letterSpacing: 0.3,
    ...artTextShadow,
  },
});
