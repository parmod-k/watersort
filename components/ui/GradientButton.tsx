import React, { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontFamily } from '../../theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  colorsArr?: [string, string, string];
  edgeColor?: string;
  textColor?: string;
  height?: number;
  fullWidth?: boolean;
  /** Tighter padding and text for narrow spaces. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function GradientButton({
  label,
  onPress,
  icon,
  colorsArr = [colors.primaryFixedDim, colors.primaryContainer, colors.primaryFixed],
  edgeColor = '#009BB0',
  textColor = colors.onPrimaryFixed,
  height = 52,
  fullWidth = false,
  compact = false,
  style,
}: Props) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress?.();
      }}
      style={[fullWidth ? { width: '100%' as const } : undefined, style]}
    >
      <View
        style={[
          styles.wrap,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: pressed ? edgeColor : 'transparent',
            paddingBottom: pressed ? 0 : 5,
          },
        ]}
      >
        <LinearGradient
          colors={colorsArr}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            {
              height: pressed ? height - 3 : height - 5,
              borderRadius: height / 2,
              marginTop: pressed ? 3 : 0,
            },
            compact && { paddingHorizontal: 14 },
          ]}
        >
          {icon && <MaterialIcons name={icon} size={20} color={textColor} style={{ marginRight: compact ? 4 : 8 }} />}
          <Text style={[styles.label, { color: textColor }, compact && { fontSize: 15 }]} numberOfLines={1}>
            {label}
          </Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  label: {
    fontFamily: fontFamily.headlineSm,
    fontSize: 17,
  },
});
