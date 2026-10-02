import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GlassPill from './ui/GlassPill';
import IconButton from './ui/IconButton';
import { colors, fontFamily, radii, spacing } from '../theme/tokens';
import { useProgress } from '../game/progress';

type Props = {
  level?: number;
  coins?: number;
};

export default function GameHeader(props: Props) {
  const insets = useSafeAreaInsets();
  const progress = useProgress();
  const level = props.level ?? progress.current;
  const coins = props.coins ?? progress.coins;
  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.row}>
        <View style={styles.left}>
          <IconButton icon="settings" onPress={() => {}} />
          <GlassPill style={styles.levelPill}>
            <Text style={styles.levelText}>Level {level}</Text>
          </GlassPill>
        </View>
        <View style={styles.right}>
          <GlassPill style={styles.coinPill} radius={radii.full}>
            <View style={styles.coinInner}>
              <MaterialIcons name="monetization-on" size={18} color={colors.amber} />
              <Text style={styles.coinText}>{coins.toLocaleString()}</Text>
            </View>
          </GlassPill>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={18} color={colors.onPrimary} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: 'rgba(15,17,40,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  row: {
    height: 64,
    paddingHorizontal: spacing.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelPill: { height: 40, paddingHorizontal: spacing.md, justifyContent: 'center', alignItems: 'center' },
  levelText: { color: colors.primary, fontFamily: fontFamily.labelLg, fontSize: 14 },
  coinPill: { height: 40, paddingLeft: spacing.sm, paddingRight: spacing.md, justifyContent: 'center' },
  coinInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coinText: { color: colors.onSurface, fontFamily: fontFamily.counterNum, fontSize: 16 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
