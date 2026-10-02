import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tube from '../components/game/Tube';
import Panel from '../components/ui/Panel';
import GradientButton from '../components/ui/GradientButton';
import IconButton from '../components/ui/IconButton';
import { artTextShadow, colors, fontFamily, liquidOrder, spacing, titleTextShadow } from '../theme/tokens';
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
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.centerWrap, { paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}
        >
          <Panel style={[styles.sheet, (isCompact || isShort) && { padding: 16 }]} radius={36} rim={6}>
            <View style={styles.badgeRow}>
              <MaterialIcons name="auto-awesome" size={14} color="#FFFFFF" />
              <Text style={styles.badgeText}>
                {stars === 3 ? 'PERFECT SORT' : 'SORTED'}
                {usedUndo || usedExtra ? '' : ' · NO POWER-UPS'}
              </Text>
            </View>

            <Text style={[styles.title, isCompact && { fontSize: 28 }]}>LEVEL {level}</Text>
            <Text style={[styles.cleared, isCompact && { fontSize: 34 }]}>CLEARED!</Text>

            <View style={[styles.starsRow, isShort && { marginTop: 8 }]}>
              <MaterialIcons name="star" size={44} color={stars >= 1 ? colors.goldPale : '#E7DCC6'} style={styles.star} />
              <View style={styles.starCenterWrap}>
                <MaterialIcons name="star" size={70} color={stars >= 2 ? colors.goldPale : '#E7DCC6'} style={styles.star} />
              </View>
              <MaterialIcons name="star" size={44} color={stars >= 3 ? colors.goldPale : '#E7DCC6'} style={styles.star} />
            </View>
            <Text style={[styles.starsLabel, isShort && { marginBottom: 12 }]}>
              {stars} / 3 Stars Earned · {moves <= par ? 'Under Target Moves' : 'Over Target Moves'}
            </Text>

            <View style={styles.purityCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.purityHeader}>LABORATORY PURITY</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="verified" size={14} color="#FFFFFF" />
                  <Text style={styles.purityMeta}>100% Sorted</Text>
                </View>
              </View>
              <View style={styles.purityRow}>
                {purity.map((p) => (
                  <View key={p.name} style={styles.purityItem}>
                    <Tube
                      colorsStack={[p.color, p.color, p.color, p.color]}
                      capacity={4}
                      width={isCompact ? 32 : 40}
                      height={isCompact || isShort ? 84 : 104}
                      complete
                    />
                    <Text style={styles.purityLabel}>{p.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.statRow}>
                <View style={styles.statLeft}>
                  <View style={[styles.statIcon, { backgroundColor: colors.lagoon }]}>
                    <MaterialIcons name="swap-vert" size={18} color="#FFFFFF" />
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
                  <View style={[styles.statIcon, { backgroundColor: colors.gold }]}>
                    <MaterialIcons name="monetization-on" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.statTitle}>Victory Coins</Text>
                    <Text style={styles.statSub}>Base reward + efficiency</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.statValue, { color: colors.goldRim }]}>+{coins}</Text>
                  <Text style={styles.statValueSub}>Total</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={{ gap: 6 }}>
                <View style={styles.rowBetween}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="leaderboard" size={16} color={colors.purple} />
                    <Text style={styles.scoreTitle}>Leaderboard Score</Text>
                  </View>
                  <Text style={styles.scoreMeta}>
                    {score} / {scoreMax}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={[colors.purpleLight, colors.purple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${Math.max(4, Math.round((score / scoreMax) * 100))}%` }]}
                  />
                </View>
                <Text style={styles.scoreBreakdown}>
                  Clear +{SCORE_MAX.base} · Moves +{params.efficiency ?? 0} · Time +{params.time ?? 0} · No power-ups +
                  {params.restraint ?? 0}
                </Text>
              </View>
            </View>

            <GradientButton label="Next Level" icon="arrow-forward" fullWidth height={60} onPress={() => goTo(level + 1)} />
            <View style={{ height: 10 }} />
            <GradientButton label={`Claim 2X Coins (+${coins * 2})`} icon="play-circle-filled" variant="gold" fullWidth />

            <View style={styles.footerRow}>
              <IconButton icon="replay" label="Replay" size={44} labelColor={colors.inkSoft} onPress={() => goTo(level)} />
              <IconButton icon="celebration" label="Cheers" size={44} labelColor={colors.inkSoft} />
              <IconButton icon="share" label="Share" size={44} labelColor={colors.inkSoft} />
            </View>

            <Pressable style={styles.closeBtn} onPress={() => goTo(level + 1)} hitSlop={8}>
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
            </Pressable>
          </Panel>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  centerWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },
  sheet: { width: '100%', maxWidth: 480, padding: 22, alignItems: 'center' },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.guava,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 12,
  },
  badgeText: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 11, letterSpacing: 0.6 },
  title: { color: colors.purple, fontFamily: fontFamily.black, fontSize: 32, textAlign: 'center', ...titleTextShadow('#2A0845') },
  cleared: {
    color: colors.green,
    fontFamily: fontFamily.black,
    fontSize: 40,
    lineHeight: 46,
    textAlign: 'center',
    ...titleTextShadow('#064E1C'),
  },
  starsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 14 },
  starCenterWrap: { marginHorizontal: 2, marginBottom: 6 },
  star: { textShadowColor: '#B45309', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0.5 },
  starsLabel: {
    color: colors.inkSoft,
    fontFamily: fontFamily.bold,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 16,
    textAlign: 'center',
  },

  purityCard: {
    width: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  purityHeader: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 11, letterSpacing: 0.5, ...artTextShadow },
  purityMeta: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 11, ...artTextShadow },
  purityRow: { flexDirection: 'row', justifyContent: 'space-around' },
  purityItem: { alignItems: 'center', gap: 8 },
  purityLabel: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 11, ...artTextShadow },

  card: {
    width: '100%',
    backgroundColor: colors.creamDeep,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.creamEdge,
    padding: 14,
    marginBottom: 16,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  statLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: { color: colors.ink, fontFamily: fontFamily.extraBold, fontSize: 14 },
  statSub: { color: colors.inkSoft, fontFamily: fontFamily.medium, fontSize: 11 },
  statValue: { color: colors.ink, fontFamily: fontFamily.black, fontSize: 20 },
  statValueSub: { color: colors.purple, fontFamily: fontFamily.bold, fontSize: 11 },
  divider: { height: 2, borderRadius: 1, backgroundColor: colors.creamEdge, marginVertical: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreTitle: { color: colors.ink, fontFamily: fontFamily.extraBold, fontSize: 13 },
  scoreMeta: { color: colors.purple, fontFamily: fontFamily.black, fontSize: 12 },
  scoreBreakdown: { color: colors.inkSoft, fontFamily: fontFamily.medium, fontSize: 10 },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.creamEdge,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 5 },

  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 18 },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.coral,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
