import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { haptic, ImpactFeedbackStyle } from '../../game/haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { chassis, colors, fontFamily } from '../../theme/tokens';

export type ButtonVariant = 'green' | 'gold' | 'purple' | 'cream';

type Props = {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  variant?: ButtonVariant;
  height?: number;
  fullWidth?: boolean;
  /** Tighter padding and text for narrow spaces. */
  compact?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const LOOKS: Record<ButtonVariant, { fill: [string, string, string]; border: string; rim: string; text: string; textShadow: string }> = {
  green: { fill: chassis.green, border: '#FFFFFF', rim: colors.greenRim, text: '#FFFFFF', textShadow: '#064E1C' },
  gold: { fill: chassis.gold, border: '#FFFFFF', rim: colors.goldRim, text: colors.goldInk, textShadow: 'rgba(255,255,255,0.6)' },
  purple: { fill: chassis.purple, border: colors.goldPale, rim: colors.purpleRim, text: '#FFFFFF', textShadow: '#2A0845' },
  cream: { fill: chassis.cream, border: '#FCD34D', rim: '#C9A15A', text: colors.inkSoft, textShadow: 'rgba(255,255,255,0.8)' },
};

/**
 * Squishy pill button: glossy vertical gradient inside a bright border, on an extruded bottom lip
 * that collapses when pressed.
 */
export default function GradientButton({
  label,
  onPress,
  icon,
  variant = 'green',
  height = 56,
  fullWidth = false,
  compact = false,
  disabled = false,
  style,
}: Props) {
  const look = LOOKS[variant];
  const lip = Math.round(height * 0.09) + 1;
  const fontSize = compact ? 15 : height >= 52 ? 19 : 15;
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        haptic.impact(ImpactFeedbackStyle.Medium);
        onPress?.();
      }}
      style={[fullWidth ? { width: '100%' as const } : undefined, disabled && { opacity: 0.6 }, style]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.shell,
            { height, borderRadius: height / 2, backgroundColor: look.rim, paddingBottom: pressed ? 1 : lip },
            { marginTop: pressed ? lip - 1 : 0 },
          ]}
        >
          <LinearGradient
            colors={look.fill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.face,
              { borderRadius: height / 2, borderColor: look.border, paddingHorizontal: compact ? 14 : 24 },
            ]}
          >
            {/* Gloss cap across the upper half. */}
            <View pointerEvents="none" style={[styles.gloss, { borderRadius: height / 2 }]} />
            {icon && (
              <MaterialIcons name={icon} size={compact ? 18 : 22} color={look.text} style={{ marginRight: compact ? 4 : 8 }} />
            )}
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: look.text,
                  fontSize,
                  textShadowColor: look.textShadow,
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 0.5,
                },
              ]}
            >
              {label}
            </Text>
          </LinearGradient>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    shadowColor: '#12052B',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  face: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    overflow: 'hidden',
  },
  gloss: {
    position: 'absolute',
    top: 2,
    left: 10,
    right: 10,
    height: '42%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  label: { fontFamily: fontFamily.black, letterSpacing: 0.3 },
});
