import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tube from '../components/game/Tube';
import GradientButton from '../components/ui/GradientButton';
import { colors, fontFamily, liquidOrder, radii, spacing } from '../theme/tokens';
import { playLevel } from '../game/progress';
import { SCORE_MAX } from '../game/scoring';
import { useResponsive } from '../theme/responsive';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function LevelCompleteScreen() {
  const params = useLocalSearchParams<{
    level: string;
    moves: string;
    par: string;
    stars: string;
    coins: string;
    undo: string;
    colors: string;
    seconds: string;
    extra: string;
    score: string;
    efficiency: string;
    time: string;
    restraint: string;
  }>();
  const { isCompact, isShort, gutter } = useResponsive();
  const level = Number(params.level ?? 1);
  const moves = Number(params.moves ?? 0);
  const par = Number(params.par ?? 0);
  const stars = Number(params.stars ?? 3);
  const coins = Number(params.coins ?? 0);
  const usedUndo = params.undo === '1';
  const usedExtra = params.extra === '1';
  const seconds = Number(params.seconds ?? 0);
  const score = Number(params.score ?? 0);
  const scoreMax = SCORE_MAX.base + SCORE_MAX.efficiency + SCORE_MAX.time + SCORE_MAX.restraint;
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  // Show up to four of the colors this level used.
  const purity = liquidOrder.slice(0, Math.min(4, Number(params.colors ?? 4))).map((c) => ({ name: capitalize(c), color: c }));

  function goTo(next: number) {
    playLevel(next);
    // After a reload (web keeps the /level-complete URL) or a deep link there is nothing to go
    // back to, so land on the Play tab instead.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <View style={styles.backdrop}>
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.centerWrap, { paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.sheet, (isCompact || isShort) && { padding: 18 }]}>
            <View style={styles.badgeRow}>
              <MaterialIcons name="auto-awesome" size={14} color={colors.onSurface} />
              <Text style={styles.badgeText}>
                {stars === 3 ? 'PERFECT SORT' : 'SORTED'}
                {usedUndo || usedExtra ? '' : ' · NO POWER-UPS'}
              </Text>
            </View>

            <Text style={[styles.title, isCompact && { fontSize: 26 }]}>LEVEL {level}</Text>
            <Text style={[styles.cleared, isCompact && { fontSize: 26 }]}>CLEARED!</Text>

            <View style={[styles.starsRow, isShort && { marginTop: 12 }]}>
              <MaterialIcons name="star" size={40} color={stars >= 1 ? colors.amber : 'rgba(255,209,59,0.2)'} />
              <View style={styles.starCenterWrap}>
                <MaterialIcons name="star" size={64} color={stars >= 2 ? colors.amber : 'rgba(255,209,59,0.2)'} />
              </View>
              <MaterialIcons name="star" size={40} color={stars >= 3 ? colors.amber : 'rgba(255,209,59,0.2)'} />
            </View>
            <Text style={[styles.starsLabel, isShort && { marginBottom: 14 }]}>
              {stars} / 3 Stars Earned · {moves <= par ? 'Under Target Moves' : 'Over Target Moves'}
            </Text>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderLabel}>LABORATORY PURITY</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="verified" size={14} color={colors.primaryContainer} />
                  <Text style={styles.cardHeaderMeta}>100% Sorted</Text>
                </View>
              </View>
              <View style={styles.purityRow}>
                {purity.map((p) => (
                  <View key={p.name} style={styles.purityItem}>
                    <Tube
                      colorsStack={[p.color, p.color, p.color, p.color]}
                      capacity={4}
                      width={isCompact ? 32 : 40}
                      height={isCompact || isShort ? 80 : 100}
                    />
                    <Text style={styles.purityLabel}>{p.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.statRow}>
                <View style={styles.statLeft}>
                  <View style={styles.statIcon}>
                    <MaterialIcons name="swap-vert" size={18} color={colors.cyan} />
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.statTitle}>Moves Used</Text>
                    <Text style={styles.statSub}>
                      Target: {par} · {moves <= par ? 'Under Par!' : `${moves - par} over par`}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.statValue}>{moves}</Text>
                  <Text style={styles.statValueSub}>{clock}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.statRow}>
                <View style={styles.statLeft}>
                  <View style={styles.statIcon}>
                    <MaterialIcons name="monetization-on" size={18} color={colors.amber} />
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.statTitle}>Victory Coins</Text>
                    <Text style={styles.statSub}>Base reward + efficiency</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.statValue, { color: colors.amber }]}>+{coins}</Text>
                  <Text style={styles.statValueSub}>Total</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={{ gap: 6 }}>
                <View style={styles.rowBetween}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="leaderboard" size={16} color={colors.secondary} />
                    <Text style={styles.themeUnlockText}>Leaderboard Score</Text>
                  </View>
                  <Text style={styles.themeUnlockMeta}>
                    {score} / {scoreMax}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={[colors.violet, colors.cyan]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${Math.round((score / scoreMax) * 100)}%` }]}
                  />
                </View>
                <Text style={styles.scoreBreakdown}>
                  Clear +{SCORE_MAX.base} · Moves +{params.efficiency ?? 0} · Time +{params.time ?? 0} · No power-ups +
                  {params.restraint ?? 0}
                </Text>
              </View>
            </View>

            <GradientButton label="Next Level" icon="arrow-forward" fullWidth onPress={() => goTo(level + 1)} />
            <View style={{ height: 10 }} />
            <GradientButton
              label={`Claim 2X Coins (+${coins * 2})`}
              icon="play-circle-filled"
              fullWidth
              colorsArr={[colors.amber, colors.amber, colors.amber]}
              edgeColor="#B37A00"
              textColor="#3D2900"
            />

            <View style={styles.footerRow}>
              <FooterAction icon="replay" label="Replay" onPress={() => goTo(level)} />
              <FooterAction icon="auto-fix-high" label="Cheers" />
              <FooterAction icon="share" label="Share" />
            </View>

            <Pressable style={styles.closeBtn} onPress={() => goTo(level + 1)}>
              <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FooterAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.footerAction} onPress={onPress}>
      <MaterialIcons name={icon} size={18} color={colors.onSurfaceVariant} />
      <Text style={styles.footerActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,8,18,0.8)' },
  centerWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },
  sheet: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  badgeText: { color: colors.onSurface, fontFamily: fontFamily.labelSm, fontSize: 10, letterSpacing: 0.6 },
  title: { color: colors.onSurface, fontFamily: fontFamily.displayLg, fontSize: 30, textAlign: 'center' },
  cleared: {
    color: colors.cyan,
    fontFamily: fontFamily.displayLg,
    fontSize: 30,
    textAlign: 'center',
    marginTop: 2,
  },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  starCenterWrap: { marginHorizontal: 4 },
  starsLabel: {
    color: colors.onSurfaceVariant,
    fontFamily: fontFamily.labelMd,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeaderLabel: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 11, letterSpacing: 0.5 },
  cardHeaderMeta: { color: colors.primaryContainer, fontFamily: fontFamily.labelSm, fontSize: 11 },
  purityRow: { flexDirection: 'row', justifyContent: 'space-between' },
  purityItem: { alignItems: 'center', gap: 8 },
  purityLabel: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 11 },

  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  statLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: { color: colors.onSurface, fontFamily: fontFamily.labelLg, fontSize: 13 },
  statSub: { color: colors.onSurfaceVariant, fontFamily: fontFamily.bodySm, fontSize: 11 },
  statValue: { color: colors.onSurface, fontFamily: fontFamily.counterNum, fontSize: 18 },
  statValueSub: { color: colors.primaryContainer, fontFamily: fontFamily.labelSm, fontSize: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeUnlockText: { color: colors.onSurface, fontFamily: fontFamily.labelMd, fontSize: 12 },
  scoreBreakdown: { color: colors.onSurfaceVariant, fontFamily: fontFamily.bodySm, fontSize: 10 },
  themeUnlockMeta: { color: colors.secondary, fontFamily: fontFamily.labelSm, fontSize: 11 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.4)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 },
  footerAction: { alignItems: 'center', gap: 4 },
  footerActionText: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 11 },

  closeBtn: { position: 'absolute', top: 12, right: 12, padding: 6 },
});
