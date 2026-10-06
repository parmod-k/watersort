import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Pill from './ui/Pill';
import IconButton from './ui/IconButton';
import SettingsMenu from './SettingsMenu';
import { colors, fontFamily, radii } from '../theme/tokens';
import { useProgress } from '../game/progress';
import { contentMaxWidth, useResponsive } from '../theme/responsive';

type Props = {
  level?: number;
  coins?: number;
  /** Optional extra pill shown between the level plaque and the coins (e.g. the Moves counter). */
  accessory?: React.ReactNode;
};

/** Top HUD floating over the art: settings squircle, purple level plaque, gold coin counter. */
export default function GameHeader(props: Props) {
  const insets = useSafeAreaInsets();
  const progress = useProgress();
  const level = props.level ?? progress.current;
  const coins = props.coins ?? progress.coins;
  const { isCompact, gutter } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={[styles.row, { paddingHorizontal: gutter }]}>
        <View style={styles.left}>
          <IconButton
            icon="settings"
            shape="squircle"
            size={isCompact ? 40 : 44}
            iconColor={colors.goldLight}
            onPress={() => setMenuOpen(true)}
          />
          <Pill variant="purple" radius={radii.full} style={styles.levelPlaque}>
            <MaterialIcons name="star" size={14} color={colors.goldPale} />
            <View style={styles.levelStack}>
              <Text style={styles.levelKicker}>TIKI BAR</Text>
              <Text style={styles.levelText} numberOfLines={1}>
                Level {level}
              </Text>
            </View>
            <MaterialIcons name="star" size={14} color={colors.goldPale} />
          </Pill>
        </View>
        <View style={styles.right}>
          {props.accessory}
          <Pill variant="gold" style={styles.coinPill}>
            <MaterialIcons name="monetization-on" size={18} color={colors.goldRim} />
            <Text style={styles.coinText} numberOfLines={1}>
              {coins.toLocaleString()}
            </Text>
            <View style={styles.plus}>
              <MaterialIcons name="add" size={14} color="#FFFFFF" />
            </View>
          </Pill>
        </View>
      </View>
      <SettingsMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  row: {
    minHeight: 56,
    width: '100%',
    maxWidth: contentMaxWidth.board,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelPlaque: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4 },
  levelStack: { alignItems: 'center' },
  levelKicker: { color: '#FDE68A', fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1.5, lineHeight: 10 },
  levelText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.black,
    fontSize: 15,
    lineHeight: 18,
    textShadowColor: '#2A0845',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0.5,
  },
  coinPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 8, paddingRight: 4, height: 36 },
  coinText: { color: colors.goldInk, fontFamily: fontFamily.black, fontSize: 14 },
  plus: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
