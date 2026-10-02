import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import GameHeader from '../../components/GameHeader';
import Panel from '../../components/ui/Panel';
import Pill from '../../components/ui/Pill';
import { artTextShadow, chassis, colors, fontFamily, radii, spacing } from '../../theme/tokens';
import { useProgress } from '../../game/progress';
import { BoardKind, buildBoard, leagueFor, statsFor } from '../../game/scoring';
import { contentMaxWidth, useResponsive } from '../../theme/responsive';

const segments: { kind: BoardKind; label: string }[] = [
  { kind: 'level', label: 'Top Level' },
  { kind: 'stars', label: 'Stars' },
  { kind: 'score', label: 'Score' },
];

const BOARD_TITLES: Record<BoardKind, string> = {
  level: 'Highest Level Reached',
  stars: 'Most Stars Earned',
  score: 'Efficiency Score',
};

/** Gold, silver and bronze medal fills for the top three. */
const PODIUM: [string, string, string][] = [
  ['#FDE047', '#FBBF24', '#D97706'],
  ['#F1F5F9', '#CBD5E1', '#94A3B8'],
  ['#FDBA74', '#EA8A3E', '#B45309'],
];
const AVATAR_TINTS = ['#00B2FE', '#FF2E93', '#10B981', '#A855F7', '#F59E0B', '#EF4444'];
const SHOWN = 5;

function formatValue(kind: BoardKind, e: { level: number; stars: number; score: number }) {
  if (kind === 'level') return `Lvl ${e.level}`;
  if (kind === 'stars') return e.stars.toLocaleString();
  return e.score.toLocaleString();
}

function Medal({
  icon,
  name,
  desc,
  value,
  goal,
  color,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  name: string;
  desc: string;
  value: number;
  goal: number;
  color: string;
}) {
  const done = value >= goal;
  return (
    <Panel style={styles.medalCard} radius={22}>
      <View style={[styles.medalCircle, { backgroundColor: done ? color : colors.creamEdge }]}>
        <MaterialIcons name={icon} size={26} color={done ? '#FFFFFF' : colors.inkMuted} />
      </View>
      <Text style={styles.medalName}>{name}</Text>
      <Text style={[styles.medalTier, { color: done ? colors.greenInk : colors.inkSoft }]}>
        {done ? 'Earned!' : `${Math.min(value, goal)} / ${goal}`}
      </Text>
      <Text style={styles.medalDesc}>{desc}</Text>
      <View style={styles.medalTrack}>
        <View style={[styles.medalFill, { width: `${Math.min(100, (value / goal) * 100)}%`, backgroundColor: color }]} />
      </View>
    </Panel>
  );
}

export default function RankScreen() {
  const [segment, setSegment] = useState(0);
  const { gutter } = useResponsive();
  const progress = useProgress();
  const stats = statsFor(progress.records, progress.unlocked);
  const league = leagueFor(stats.score);
  const kind = segments[segment].kind;

  const me = useMemo(
    () => ({ name: progress.playerName, level: stats.level, stars: stats.stars, score: stats.score }),
    [progress.playerName, stats.level, stats.stars, stats.score],
  );
  const board = useMemo(() => buildBoard(me, kind), [me, kind]);
  const myIndex = board.findIndex((e) => e.isMe);
  const myEntry = board[myIndex];
  const scoreBoard = useMemo(() => buildBoard(me, 'score'), [me]);
  const myScoreRank = scoreBoard.find((e) => e.isMe)!.rank;
  const topPct = Math.max(1, Math.round((myScoreRank / scoreBoard.length) * 100));
  const avgScore = stats.cleared > 0 ? Math.round(stats.score / stats.cleared) : 0;

  // The nearest rival ranked above the player on this board.
  const ahead = board.filter((e) => !e.isMe && e.rank < myEntry.rank).pop();
  let chase = 'You lead this board!';
  if (ahead) {
    if (kind === 'level') chase = `Reach level ${ahead.level + 1} to pass ${ahead.name}`;
    else {
      const gap = (kind === 'stars' ? ahead.stars - me.stars : ahead.score - me.score) + 1;
      chase = `${gap.toLocaleString()} more ${kind === 'stars' ? 'stars' : 'pts'} to pass ${ahead.name}`;
    }
  }

  return (
    <View style={styles.screen}>
      <GameHeader />
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]} showsVerticalScrollIndicator={false}>
        <Panel style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <LinearGradient colors={chassis.purple} style={styles.avatarRing}>
                <MaterialIcons name="person" size={30} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>{league.name.toUpperCase()}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName} numberOfLines={1}>
                {progress.playerName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="auto-awesome" size={13} color={colors.purple} />
                <Text style={styles.playerTitle}>{league.name} Alchemist</Text>
              </View>
            </View>
            <Pill variant="green" radius={radii.full} style={styles.lvlPill}>
              <Text style={styles.lvlPillText}>Lvl {stats.level}</Text>
            </Pill>
          </View>

          <View style={styles.leagueRow}>
            <View style={styles.leagueIcon}>
              <MaterialIcons name="shield" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.leagueTitle}>{league.name} League</Text>
              <Text style={styles.leagueSub}>
                {league.next
                  ? `${(league.next.at - stats.score).toLocaleString()} pts to ${league.next.name}`
                  : 'Top league reached'}
              </Text>
            </View>
            <View style={styles.topGlobalPill}>
              <MaterialIcons name="public" size={12} color="#FFFFFF" />
              <Text style={styles.topGlobalText}>Top {topPct}%</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatBox icon="star" tint={colors.gold} value={stats.stars} label="Total Stars" />
            <StatBox icon="speed" tint={colors.lagoon} value={avgScore} label="Avg Level Score" />
            <StatBox icon="verified" tint={colors.purpleLight} value={stats.perfect} label="Perfect Sorts" />
          </View>
        </Panel>

        <View style={styles.segmentRow}>
          {segments.map((s, i) => (
            <Pressable key={s.kind} style={{ flex: 1 }} onPress={() => setSegment(i)}>
              {i === segment ? (
                <Pill variant="gold" radius={radii.full} style={styles.segmentPill}>
                  <Text numberOfLines={1} style={[styles.segmentText, styles.segmentTextActive]}>
                    {s.label}
                  </Text>
                </Pill>
              ) : (
                <View style={[styles.segmentPill, styles.segmentIdle]}>
                  <Text numberOfLines={1} style={styles.segmentText}>
                    {s.label}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.standingsHeader}>
          <Text style={styles.standingsTitle}>{BOARD_TITLES[kind]}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="info-outline" size={13} color={colors.onArtGold} style={artTextShadow} />
            <Text style={styles.standingsMeta}>Sample rivals · offline</Text>
          </View>
        </View>

        {board.slice(0, SHOWN).map((p, idx) => {
          const medal = p.rank <= 3 ? PODIUM[p.rank - 1] : undefined;
          return (
            <Panel
              key={p.name}
              variant={p.isMe ? 'highlight' : 'cream'}
              style={styles.playerRow}
              radius={20}
              rim={3}
            >
              {medal ? (
                <LinearGradient colors={medal} style={styles.rankBadge}>
                  <Text style={[styles.rankNum, { color: colors.goldInk }]}>{p.rank}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.rankBadge, { backgroundColor: colors.creamEdge }]}>
                  <Text style={styles.rankNum}>{p.rank}</Text>
                </View>
              )}
              <View style={[styles.playerAvatar, { backgroundColor: AVATAR_TINTS[idx % AVATAR_TINTS.length] }]}>
                <Text style={styles.playerInitial}>{p.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {p.isMe ? `You (${p.name})` : p.name}
                </Text>
                <Text style={styles.rowMeta}>
                  Level {p.level} · {p.stars} stars
                </Text>
              </View>
              <Text style={styles.rowValue}>{formatValue(kind, p)}</Text>
            </Panel>
          );
        })}

        <Panel variant="purple" style={styles.meRow} radius={20}>
          <Pill variant="gold" radius={radii.full} style={styles.meBadge}>
            <Text style={styles.meBadgeText}>#{myEntry.rank}</Text>
          </Pill>
          <View style={{ flex: 1 }}>
            <Text style={styles.meName} numberOfLines={1}>
              You ({progress.playerName})
            </Text>
            <Text style={styles.mePromoting}>{chase}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.meValue}>{formatValue(kind, me)}</Text>
            <Text style={styles.meOf}>of {board.length} players</Text>
          </View>
        </Panel>

        <Panel variant="frost" style={styles.scoringNote} radius={18}>
          <Text style={styles.scoringText}>
            Level score: clear +100 · fewest pours up to +100 · time up to +50 · no Undo +50 · no extra bottle +50.
            Your best score per level counts. Players on the same level share a rank.
          </Text>
        </Panel>

        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialIcons name="military-tech" size={18} color={colors.goldPale} style={artTextShadow} />
            <Text style={styles.sectionTitle}>Alchemy Medals</Text>
          </View>
          <Text style={styles.sectionMeta}>{stats.cleared} levels cleared</Text>
        </View>

        <View style={styles.medalsRow}>
          <Medal icon="bolt" name="Speed Pourer" desc="Clear 10 levels in under 45s" value={stats.fast} goal={10} color={colors.gold} />
          <Medal
            icon="psychology"
            name="Pure Genius"
            desc="Clear 30 levels without Undo"
            value={stats.noUndo}
            goal={30}
            color={colors.purpleLight}
          />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function StatBox({
  icon,
  tint,
  value,
  label,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  tint: string;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statBox}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <MaterialIcons name={icon} size={18} color={tint} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: '100%', maxWidth: contentMaxWidth.page, alignSelf: 'center', paddingTop: spacing.sm, paddingBottom: 24 },

  profileCard: { padding: 14, marginBottom: spacing.md, gap: 12 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { width: 58, height: 58 },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: colors.goldPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: colors.gold,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  proBadgeText: { color: colors.goldInk, fontFamily: fontFamily.black, fontSize: 8 },
  playerName: { color: colors.ink, fontFamily: fontFamily.extraBold, fontSize: 18 },
  playerTitle: { color: colors.purple, fontFamily: fontFamily.bold, fontSize: 12 },
  lvlPill: { paddingHorizontal: 12, paddingVertical: 4 },
  lvlPillText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.black,
    fontSize: 12,
    textShadowColor: '#064E1C',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0.5,
  },

  leagueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.creamDeep,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.creamEdge,
    padding: 10,
  },
  leagueIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.lagoon,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueTitle: { color: colors.ink, fontFamily: fontFamily.extraBold, fontSize: 14 },
  leagueSub: { color: colors.inkSoft, fontFamily: fontFamily.medium, fontSize: 11 },
  topGlobalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.guava,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  topGlobalText: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 10 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', gap: 2, flex: 1 },
  statValue: { color: colors.ink, fontFamily: fontFamily.black, fontSize: 18 },
  statLabel: { color: colors.inkSoft, fontFamily: fontFamily.bold, fontSize: 10 },

  segmentRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(59,11,117,0.75)',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.goldPale,
    padding: 4,
    marginBottom: spacing.md,
  },
  segmentPill: { paddingVertical: 7, alignItems: 'center' },
  segmentIdle: { borderRadius: 999, borderWidth: 2, borderColor: 'transparent' },
  segmentText: { color: '#E9D5FF', fontFamily: fontFamily.extraBold, fontSize: 13 },
  segmentTextActive: { color: colors.goldInk, fontFamily: fontFamily.black },

  standingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  standingsTitle: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 15, ...artTextShadow },
  standingsMeta: { color: colors.onArtGold, fontFamily: fontFamily.bold, fontSize: 11, ...artTextShadow },

  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: { color: colors.inkSoft, fontFamily: fontFamily.black, fontSize: 13 },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitial: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 15 },
  rowName: { color: colors.ink, fontFamily: fontFamily.extraBold, fontSize: 14 },
  rowMeta: { color: colors.inkSoft, fontFamily: fontFamily.medium, fontSize: 11 },
  rowValue: { color: colors.purple, fontFamily: fontFamily.black, fontSize: 15 },

  meRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 10, marginBottom: spacing.md },
  meBadge: { paddingHorizontal: 9, paddingVertical: 3 },
  meBadgeText: { color: colors.goldInk, fontFamily: fontFamily.black, fontSize: 13 },
  meName: { color: '#FFFFFF', fontFamily: fontFamily.extraBold, fontSize: 14 },
  mePromoting: { color: colors.goldLight, fontFamily: fontFamily.bold, fontSize: 11 },
  meValue: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 16 },
  meOf: { color: '#E9D5FF', fontFamily: fontFamily.bold, fontSize: 10 },

  scoringNote: { padding: 12, marginBottom: spacing.lg },
  scoringText: { color: '#FFFFFF', fontFamily: fontFamily.semiBold, fontSize: 11, lineHeight: 16, ...artTextShadow },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 17, ...artTextShadow },
  sectionMeta: { color: colors.onArtGold, fontFamily: fontFamily.black, fontSize: 12, ...artTextShadow },

  medalsRow: { flexDirection: 'row', gap: 12 },
  medalCard: { flex: 1, padding: 12, alignItems: 'center', gap: 3 },
  medalCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  medalName: { color: colors.ink, fontFamily: fontFamily.extraBold, fontSize: 14 },
  medalTier: { fontFamily: fontFamily.black, fontSize: 12 },
  medalDesc: { color: colors.inkSoft, fontFamily: fontFamily.medium, fontSize: 11, textAlign: 'center' },
  medalTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.creamEdge,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    width: '100%',
    marginTop: 6,
    overflow: 'hidden',
  },
  medalFill: { height: '100%', borderRadius: 4 },
});
