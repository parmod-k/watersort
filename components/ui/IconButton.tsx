import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fontFamily } from '../../theme/tokens';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  badge?: string | number;
  badgeColor?: string;
  size?: number;
  iconColor?: string;
  iconSize?: number;
};

export default function IconButton({
  icon,
  onPress,
  badge,
  badgeColor = colors.surfaceContainerHighest,
  size = 48,
  iconColor = colors.onSurface,
  iconSize = 20,
}: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        { width: size, height: size, borderRadius: size / 2, transform: [{ scale: pressed ? 0.9 : 1 }] },
      ]}
    >
      <MaterialIcons name={icon} size={iconSize} color={iconColor} />
      {badge !== undefined && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: 'rgba(38, 40, 64, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.onSurface,
    fontFamily: fontFamily.labelSm,
    fontSize: 10,
  },
});
