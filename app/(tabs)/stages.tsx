import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import GameHeader from '../../components/GameHeader';
import GlassPill from '../../components/ui/GlassPill';
import GradientButton from '../../components/ui/GradientButton';
import { colors, fontFamily, radii, spacing } from '../../theme/tokens';
import { colorCountFor, isMysteryLevel } from '../../game/levels';
import { playLevel, useProgress } from '../../game/progress';

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
    <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
      {[0, 1, 2].map((i) => (
        <MaterialIcons key={i} name="star" size={i === 1 ? 14 : 12} color={i < count ? '#FFD13B' : 'rgba(255,209,59,0.25)'} />
      ))}
    </View>
  );
}

export default function StagesScreen() {
  const progress = useProgress();
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassPill style={styles.chapterCard} radius={radii.lg}>
          <View style={styles.chapterRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <MaterialIcons name="science" size={20} color={colors.primaryContainer} />
              <View>
                <Text style={styles.chapterLabel}>CHAPTER {chapter}</Text>
                <Text style={styles.chapterTitle}>{chapterName(chapter)}</Text>
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
              colors={[colors.violet, colors.cyan]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${chapterPct}%` }]}
            />
          </View>
        </GlassPill>

        <GlassPill tint="low" style={styles.trialCard} radius={radii.lg}>
          <View style={styles.trialTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="hourglass-top" size={18} color={colors.secondary} />
              <Text style={styles.trialTitle}>Daily Alchemist Trial #12</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialIcons name="schedule" size={14} color={colors.tertiaryFixed} />
              <Text style={styles.trialTimer}>04:22:15</Text>
            </View>
          </View>
          <Text style={styles.trialDesc}>Beat in under 10 liquid pours</Text>
          <View style={styles.trialRewardsRow}>
            <View style={styles.trialReward}>
              <MaterialIcons name="monetization-on" size={16} color={colors.amber} />
              <Text style={styles.trialRewardText}>+100</Text>
            </View>
            <View style={styles.trialReward}>
              <MaterialIcons name="tips-and-updates" size={16} color={colors.primary} />
              <Text style={styles.trialRewardText}>+1 Hint Flask</Text>
            </View>
            <View style={{ flex: 1 }} />
            <GradientButton
              label="Accept"
              icon="arrow-forward"
              height={38}
              colorsArr={[colors.secondaryContainer, colors.violet, colors.secondaryContainer]}
              edgeColor="#6D019C"
              textColor="#FFFFFF"
            />
          </View>
        </GlassPill>

        <View style={styles.path}>
          <View style={styles.boss}>
            <View style={styles.bossBox}>
              <MaterialIcons name="card-giftcard" size={30} color={colors.amber} />
              <View style={styles.bossLock}>
                <MaterialIcons name="lock" size={12} color={colors.outline} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <MaterialIcons name="stars" size={14} color={colors.amber} />
              <Text style={styles.bossLabel}>Mystery Flask: Hidden Layers</Text>
            </View>
            <Text style={styles.bossSub}>Level {nextMystery}</Text>
          </View>

          {levels.map((lvl) => (
            <Pressable
              key={lvl.id}
              disabled={lvl.state === 'locked'}
              onPress={() => start(lvl.id)}
              style={[styles.nodeWrap, { alignSelf: 'center', marginLeft: lvl.offset }]}
            >
              {lvl.state === 'current' && <Text style={styles.currentTag}>CURRENT</Text>}
              <View
                style={[
                  styles.node,
                  lvl.state === 'current' && styles.nodeCurrent,
                  lvl.state === 'done' && styles.nodeDone,
                ]}
              >
                {lvl.state === 'locked' && <MaterialIcons name="lock" size={20} color={colors.outline} />}
                {lvl.state === 'current' && <MaterialIcons name="play-arrow" size={28} color={colors.primaryContainer} />}
                {lvl.state === 'done' && <MaterialIcons name="check-circle" size={18} color={colors.primaryContainer} />}
                <Text
                  style={[
                    styles.nodeNumber,
                    lvl.state === 'locked' && { color: colors.outline, fontSize: 13 },
                  ]}
                >
                  {lvl.id}
                </Text>
              </View>
              {lvl.state === 'done' && lvl.stars !== undefined && <Stars count={lvl.stars} />}
              {lvl.label && <Text style={styles.nodeSub}>{lvl.label}</Text>}
            </Pressable>
          ))}
        </View>

        <GradientButton
          label={`Jump to Level ${frontier}`}
          icon="my-location"
          fullWidth
          onPress={() => start(frontier)}
          style={{ marginTop: spacing.xl }}
        />
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.margin, paddingTop: spacing.md, paddingBottom: 24 },
  chapterCard: { padding: 16, marginBottom: spacing.md },
  chapterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  chapterLabel: { color: colors.primaryFixedDim, fontFamily: fontFamily.labelSm, fontSize: 11, letterSpacing: 1 },
  chapterTitle: { color: colors.onSurface, fontFamily: fontFamily.headlineSm, fontSize: 18, marginTop: 2 },
  chapterFraction: { color: colors.primaryContainer, fontFamily: fontFamily.counterNum, fontSize: 20 },
  chapterFractionSub: { color: colors.onSurfaceVariant, fontFamily: fontFamily.bodySm, fontSize: 12 },
  chapterSolved: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 11 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.4)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  trialCard: { padding: 16, marginBottom: spacing.xl },
  trialTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  trialTitle: { color: colors.secondary, fontFamily: fontFamily.labelMd, fontSize: 13 },
  trialTimer: { color: colors.tertiaryFixed, fontFamily: fontFamily.labelSm, fontSize: 11, fontWeight: '700' },
  trialDesc: { color: colors.onSurface, fontFamily: fontFamily.bodyMd, fontSize: 14, marginBottom: 10 },
  trialRewardsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trialReward: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trialRewardText: { color: colors.onSurface, fontFamily: fontFamily.labelSm, fontSize: 11 },

  path: { alignItems: 'center', paddingTop: 8 },
  boss: { alignItems: 'center', marginBottom: 36, opacity: 0.85 },
  bossBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bossLock: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bossLabel: { color: colors.tertiary, fontFamily: fontFamily.labelSm, fontSize: 11 },
  bossSub: { color: colors.onSurfaceVariant, fontFamily: fontFamily.counterNum, fontSize: 13, marginTop: 2 },

  nodeWrap: { alignItems: 'center', marginBottom: 40 },
  currentTag: {
    color: colors.primaryContainer,
    fontFamily: fontFamily.labelSm,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 6,
    backgroundColor: 'rgba(0,229,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  node: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  nodeCurrent: {
    borderColor: colors.primaryContainer,
    backgroundColor: colors.surfaceContainer,
    shadowColor: colors.cyan,
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  nodeDone: {
    backgroundColor: colors.surfaceContainer,
    borderColor: 'rgba(0,229,255,0.35)',
  },
  nodeNumber: { color: colors.onSurface, fontFamily: fontFamily.counterNum, fontSize: 16, marginTop: 2 },
  nodeSub: { color: colors.primary, fontFamily: fontFamily.labelMd, fontSize: 12, marginTop: 6 },
});
