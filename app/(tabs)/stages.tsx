import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import GameHeader from '../../components/GameHeader';
import Panel from '../../components/ui/Panel';
import Pill from '../../components/ui/Pill';
import GradientButton from '../../components/ui/GradientButton';
import { artTextShadow, chassis, colors, fontFamily, radii, spacing } from '../../theme/tokens';
import { colorCountFor, isMysteryLevel } from '../../game/levels';
import { playLevel, useProgress } from '../../game/progress';
import { contentMaxWidth, useResponsive } from '../../theme/responsive';

type LevelState = 'locked' | 'current' | 'done';

type LevelNode = {
  id: number;
  state: LevelState;
  stars?: number;
  label?: string;
  offset: number;
};

const LEVELS_PER_CHAPTER = 20;
const CHAPTER_NAMES = [
  'First Drops',
  'Color Splash',
  'Prismatic Laboratory',
  'Shade Shifter',
  'Mystery Vault',
  'Liquid Labyrinth',
];
const OFFSETS = [0, 55, -50, 45, -20, 60, -30];

function chapterName(chapter: number) {
  return CHAPTER_NAMES[(chapter - 1) % CHAPTER_NAMES.length];
}

/** A short description of what makes a level hard, shown under the current node. */
function levelLabel(level: number) {
  if (isMysteryLevel(level)) return 'Mystery Layers';
  return `${colorCountFor(level)} Colors`;
}

function Stars({ count }: { count: number }) {
  return (
    <View style={styles.starsRow}>
      {[0, 1, 2].map((i) => (
        <MaterialIcons
          key={i}
          name="star"
          size={i === 1 ? 18 : 15}
          color={i < count ? colors.goldPale : 'rgba(255,255,255,0.35)'}
          style={styles.starIcon}
        />
      ))}
    </View>
  );
}

const NODE_LOOKS: Record<LevelState, { fill: [string, string, string]; border: string; rim: string }> = {
  done: { fill: chassis.green, border: '#FFFFFF', rim: colors.greenRim },
  current: { fill: chassis.gold, border: '#FFFFFF', rim: colors.goldRim },
  locked: { fill: ['#C4B5FD', '#8B5CF6', '#6D28D9'], border: 'rgba(255,255,255,0.6)', rim: colors.purpleRim },
};

export default function StagesScreen() {
  const progress = useProgress();
  const { width, isTablet, gutter } = useResponsive();
  // Wider screens spread the winding path out further.
  const offsetScale = Math.min(Math.max(width / 400, 0.75), 1.6);
  const frontier = progress.unlocked;
  const chapter = Math.ceil(frontier / LEVELS_PER_CHAPTER);
  const chapterStart = (chapter - 1) * LEVELS_PER_CHAPTER + 1;
  const solvedInChapter = frontier - chapterStart;
  const chapterPct = Math.round((solvedInChapter / LEVELS_PER_CHAPTER) * 100);

  // A window around the newest unlocked level, highest at the top of the path.
  const first = Math.max(1, frontier - 4);
  const levels: LevelNode[] = [];
  for (let id = frontier + 2; id >= first; id--) {
    levels.push({
      id,
      state: id > frontier ? 'locked' : id === frontier ? 'current' : 'done',
      stars: progress.records[id]?.stars,
      label: id === frontier ? levelLabel(id) : undefined,
      offset: OFFSETS[id % OFFSETS.length],
    });
  }
  let nextMystery = frontier + 1;
  while (!isMysteryLevel(nextMystery)) nextMystery++;

  function start(level: number) {
    playLevel(level);
    router.navigate('/');
  }

  return (
    <View style={styles.screen}>
      <GameHeader />
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]} showsVerticalScrollIndicator={false}>
        <Panel style={styles.chapterCard}>
          <View style={styles.chapterRow}>
            <View style={styles.chapterLeft}>
              <View style={styles.chapterIcon}>
                <MaterialIcons name="science" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.chapterLabel}>CHAPTER {chapter}</Text>
                <Text style={styles.chapterTitle} numberOfLines={1}>
                  {chapterName(chapter)}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.chapterFraction}>
                {solvedInChapter}
                <Text style={styles.chapterFractionSub}> / {LEVELS_PER_CHAPTER}</Text>
              </Text>
              <Text style={styles.chapterSolved}>{chapterPct}% Solved</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[colors.greenLight, colors.green, colors.greenDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.progressFill, { width: `${Math.max(chapterPct, 4)}%` }]}
            />
          </View>
        </Panel>

        <Panel variant="highlight" style={styles.trialCard}>
          <View style={styles.trialTop}>
            <Pill variant="purple" radius={radii.full} style={styles.trialRibbon}>
              <MaterialIcons name="hourglass-top" size={14} color={colors.goldPale} />
              <Text style={styles.trialRibbonText} numberOfLines={1}>
                Daily Trial #12
              </Text>
            </Pill>
            <View style={styles.trialTimer}>
              <MaterialIcons name="schedule" size={14} color={colors.guava} />
              <Text style={styles.trialTimerText}>04:22:15</Text>
            </View>
          </View>
          <Text style={styles.trialDesc}>Beat in under 10 liquid pours</Text>
          <View style={styles.trialRewardsRow}>
            <View style={styles.trialReward}>
              <MaterialIcons name="monetization-on" size={16} color={colors.goldRim} />
              <Text style={styles.trialRewardText}>+100</Text>
            </View>
            <View style={styles.trialReward}>
              <MaterialIcons name="tips-and-updates" size={16} color={colors.purple} />
              <Text style={styles.trialRewardText}>+1 Hint</Text>
            </View>
            <View style={{ flexGrow: 1 }} />
            <GradientButton label="Accept" icon="arrow-forward" height={44} />
          </View>
        </Panel>

        <View style={styles.path}>
          <View style={styles.boss}>
            <View style={styles.bossRim}>
              <LinearGradient colors={['#E879F9', '#9333EA', '#4338CA']} style={styles.bossBox}>
                <MaterialIcons name="card-giftcard" size={32} color={colors.goldPale} />
              </LinearGradient>
              <View style={styles.bossLock}>
                <MaterialIcons name="lock" size={12} color={colors.purpleInk} />
              </View>
            </View>
            <View style={styles.bossLabelRow}>
              <MaterialIcons name="stars" size={14} color={colors.goldPale} />
              <Text style={styles.bossLabel}>Mystery Flask: Hidden Layers</Text>
            </View>
            <Text style={styles.bossSub}>Level {nextMystery}</Text>
          </View>

          {levels.map((lvl) => {
            const look = NODE_LOOKS[lvl.state];
            const size = lvl.state === 'current' ? 84 : 70;
            return (
              <Pressable
                key={lvl.id}
                disabled={lvl.state === 'locked'}
                onPress={() => start(lvl.id)}
                style={[styles.nodeWrap, { alignSelf: 'center', marginLeft: lvl.offset * offsetScale }]}
              >
                {lvl.state === 'current' && (
                  <View style={styles.currentTag}>
                    <Text style={styles.currentTagText}>CURRENT</Text>
                  </View>
                )}
                <View style={[styles.nodeRim, { borderRadius: size / 2, backgroundColor: look.rim }]}>
                  <LinearGradient
                    colors={look.fill}
                    style={[styles.node, { width: size, height: size, borderRadius: size / 2, borderColor: look.border }]}
                  >
                    <View pointerEvents="none" style={[styles.nodeGloss, { borderRadius: size / 2 }]} />
                    {lvl.state === 'locked' && <MaterialIcons name="lock" size={20} color="rgba(255,255,255,0.85)" />}
                    {lvl.state === 'current' && <MaterialIcons name="play-arrow" size={30} color={colors.goldInk} />}
                    {lvl.state === 'done' && <MaterialIcons name="check" size={20} color="#FFFFFF" />}
                    <Text
                      style={[
                        styles.nodeNumber,
                        lvl.state === 'current' && { color: colors.goldInk, textShadowColor: 'rgba(255,255,255,0.6)' },
                        lvl.state === 'locked' && { fontSize: 14, opacity: 0.9 },
                      ]}
                    >
                      {lvl.id}
                    </Text>
                  </LinearGradient>
                </View>
                {lvl.state === 'done' && lvl.stars !== undefined && <Stars count={lvl.stars} />}
                {lvl.label && <Text style={styles.nodeSub}>{lvl.label}</Text>}
              </Pressable>
            );
          })}
        </View>

        <GradientButton
          label={`Jump to Level ${frontier}`}
          icon="my-location"
          variant="gold"
          fullWidth={!isTablet}
          onPress={() => start(frontier)}
          style={{ marginTop: spacing.lg, alignSelf: 'center', minWidth: isTablet ? 360 : undefined }}
        />
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: '100%', maxWidth: contentMaxWidth.page, alignSelf: 'center', paddingTop: spacing.sm, paddingBottom: 24 },

  chapterCard: { padding: 14, marginBottom: spacing.md },
  chapterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 },
  chapterLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  chapterIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.lagoon,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterLabel: { color: colors.purple, fontFamily: fontFamily.black, fontSize: 11, letterSpacing: 1 },
  chapterTitle: { color: colors.ink, fontFamily: fontFamily.extraBold, fontSize: 19 },
  chapterFraction: { color: colors.greenInk, fontFamily: fontFamily.black, fontSize: 22 },
  chapterFractionSub: { color: colors.inkMuted, fontFamily: fontFamily.bold, fontSize: 13 },
  chapterSolved: { color: colors.inkSoft, fontFamily: fontFamily.bold, fontSize: 11 },
  progressTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.creamEdge,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 6 },

  trialCard: { padding: 14, marginBottom: spacing.xl },
  trialTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 },
  trialRibbon: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 1 },
  trialRibbonText: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 12 },
  trialTimer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trialTimerText: { color: colors.guava, fontFamily: fontFamily.black, fontSize: 12 },
  trialDesc: { color: colors.ink, fontFamily: fontFamily.bold, fontSize: 15, marginBottom: 10 },
  trialRewardsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  trialReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  trialRewardText: { color: colors.ink, fontFamily: fontFamily.black, fontSize: 12 },

  path: { alignItems: 'center', paddingTop: 8 },
  boss: { alignItems: 'center', marginBottom: 34 },
  bossRim: { borderRadius: 22, paddingBottom: 5, backgroundColor: colors.purpleRim },
  bossBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.goldPale,
  },
  bossLock: {
    position: 'absolute',
    bottom: -4,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.goldPale,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bossLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  bossLabel: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 12, ...artTextShadow },
  bossSub: { color: colors.onArtGold, fontFamily: fontFamily.black, fontSize: 13, marginTop: 2, ...artTextShadow },

  nodeWrap: { alignItems: 'center', marginBottom: 34 },
  currentTag: {
    backgroundColor: colors.guava,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 6,
  },
  currentTagText: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 10, letterSpacing: 1 },
  nodeRim: {
    paddingBottom: 5,
    shadowColor: '#12052B',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  node: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, overflow: 'hidden' },
  nodeGloss: {
    position: 'absolute',
    top: 3,
    left: '15%',
    right: '15%',
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  nodeNumber: {
    color: '#FFFFFF',
    fontFamily: fontFamily.black,
    fontSize: 17,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 0.5,
  },
  starsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 1, marginTop: 4 },
  starIcon: { textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  nodeSub: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 13, marginTop: 6, ...artTextShadow },
});
