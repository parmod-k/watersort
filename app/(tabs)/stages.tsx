import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import GameHeader from '../../components/GameHeader';
import GlassPill from '../../components/ui/GlassPill';
import GradientButton from '../../components/ui/GradientButton';
import { colors, fontFamily, radii, spacing } from '../../theme/tokens';

type LevelState = 'locked' | 'current' | 'done';

type LevelNode = {
  id: number;
  state: LevelState;
  stars?: number;
  label?: string;
  offset: number;
};

const levels: LevelNode[] = [
  { id: 44, state: 'locked', offset: 60 },
  { id: 43, state: 'locked', offset: -30 },
  { id: 42, state: 'current', label: 'Liquid Prism Core', offset: 0 },
  { id: 41, state: 'done', stars: 3, offset: 55 },
  { id: 40, state: 'done', stars: 3, offset: -50 },
  { id: 39, state: 'done', stars: 3, offset: 45 },
  { id: 38, state: 'done', stars: 3, offset: -20 },
];

function Stars({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
      {[0, 1, 2].map((i) => (
        <MaterialIcons key={i} name="star" size={i === 1 ? 14 : 12} color="#FFD13B" />
      ))}
    </View>
  );
}

export default function StagesScreen() {
  return (
    <View style={styles.screen}>
      <GameHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassPill style={styles.chapterCard} radius={radii.lg}>
          <View style={styles.chapterRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <MaterialIcons name="science" size={20} color={colors.primaryContainer} />
              <View>
                <Text style={styles.chapterLabel}>CHAPTER 3</Text>
                <Text style={styles.chapterTitle}>Prismatic Laboratory</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.chapterFraction}>
                42<Text style={styles.chapterFractionSub}> / 60</Text>
              </Text>
              <Text style={styles.chapterSolved}>70% Solved</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[colors.violet, colors.cyan]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: '70%' }]}
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
              <Text style={styles.bossLabel}>Boss Flask: Neon Tube Skin</Text>
            </View>
            <Text style={styles.bossSub}>Level 45</Text>
          </View>

          {levels.map((lvl) => (
            <View key={lvl.id} style={[styles.nodeWrap, { alignSelf: 'center', marginLeft: lvl.offset }]}>
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
            </View>
          ))}
        </View>

        <GradientButton
          label="Jump to Level 42"
          icon="my-location"
          fullWidth
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
