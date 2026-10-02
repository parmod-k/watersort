import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GameHeader from '../../components/GameHeader';
import GlassPill from '../../components/ui/GlassPill';
import { colors, fontFamily, radii, spacing } from '../../theme/tokens';
import { useProgress } from '../../game/progress';
import { BoardKind, buildBoard, leagueFor, statsFor } from '../../game/scoring';

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

const PODIUM = [colors.amber, '#C7CEDB', '#D08A55'];
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
    <GlassPill tint="low" style={styles.medalCard} radius={radii.md}>
      <View style={[styles.medalCircle, { borderColor: done ? color : colors.onSurfaceVariant }]}>
        <MaterialIcons name={icon} size={26} color={done ? color : colors.onSurface} />
      </View>
      <Text style={styles.medalName}>{name}</Text>
      <Text style={[styles.medalTier, { color: done ? color : colors.onSurfaceVariant }]}>
        {done ? 'Earned' : `${Math.min(value, goal)} / ${goal}`}
      </Text>
      <Text style={styles.medalDesc}>{desc}</Text>
      <View style={styles.medalTrack}>
        <View
          style={[
            styles.medalFill,
            { width: `${Math.min(100, (value / goal) * 100)}%`, backgroundColor: done ? color : colors.cyan },
          ]}
        />
      </View>
    </GlassPill>
  );
}

export default function RankScreen() {
  const [segment, setSegment] = useState(0);
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassPill tint="low" style={styles.profileCard} radius={radii.lg}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing} />
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>{league.name.toUpperCase()}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName}>{progress.playerName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="auto-awesome" size={12} color={colors.secondary} />
                <Text style={styles.playerTitle}>{league.name} Alchemist</Text>
              </View>
            </View>
            <View style={styles.lvlPill}>
              <Text style={styles.lvlPillText}>Lvl {stats.level}</Text>
            </View>
          </View>

          <View style={styles.leagueRow}>
            <MaterialIcons name="shield" size={20} color={colors.primaryContainer} />
            <View style={{ flex: 1 }}>
              <Text style={styles.leagueTitle}>{league.name} League</Text>
              <Text style={styles.leagueSub}>
                {league.next
                  ? `${(league.next.at - stats.score).toLocaleString()} pts to ${league.next.name}`
                  : 'Top league reached'}
              </Text>
            </View>
            <View style={styles.topGlobalPill}>
              <MaterialIcons name="public" size={12} color={colors.onSurfaceVariant} />
              <Text style={styles.topGlobalText}>Top {topPct}%</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="star" size={16} color={colors.amber} />
                <Text style={styles.statValue}>{stats.stars}</Text>
              </View>
              <Text style={styles.statLabel}>Total Stars</Text>
            </View>
            <View style={styles.statBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="speed" size={16} color={colors.cyan} />
                <Text style={styles.statValue}>{avgScore}</Text>
              </View>
              <Text style={styles.statLabel}>Avg Level Score</Text>
            </View>
            <View style={styles.statBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="verified" size={16} color={colors.secondary} />
                <Text style={styles.statValue}>{stats.perfect}</Text>
              </View>
              <Text style={styles.statLabel}>Perfect Sorts</Text>
            </View>
          </View>
        </GlassPill>

        <View style={styles.segmentRow}>
          {segments.map((s, i) => (
            <Pressable key={s.kind} style={{ flex: 1 }} onPress={() => setSegment(i)}>
              <View style={[styles.segmentPill, i === segment && styles.segmentPillActive]}>
                <Text style={[styles.segmentText, i === segment && styles.segmentTextActive]}>{s.label}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.standingsHeader}>
          <Text style={styles.standingsTitle}>{BOARD_TITLES[kind]}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="info-outline" size={13} color={colors.secondary} />
            <Text style={styles.standingsMeta}>Sample rivals · offline</Text>
          </View>
        </View>

        {board.slice(0, SHOWN).map((p) => {
          const crown = p.rank <= 3 ? PODIUM[p.rank - 1] : undefined;
          return (
            <GlassPill
              key={p.name}
              tint={p.isMe ? 'glow' : 'low'}
              style={[styles.playerRow, p.isMe && { borderColor: colors.cyan, borderWidth: 1 }]}
              radius={radii.md}
            >
              <View style={[styles.rankBadge, crown && { backgroundColor: 'transparent', borderWidth: 2, borderColor: crown }]}>
                {crown && <MaterialIcons name="emoji-events" size={10} color={crown} style={styles.crownIcon} />}
                <Text style={styles.rankNum}>{p.rank}</Text>
              </View>
              <View style={styles.playerAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{p.isMe ? `You (${p.name})` : p.name}</Text>
                <Text style={styles.rowMeta}>
                  Level {p.level} · {p.stars} stars
                </Text>
              </View>
              <Text style={styles.rowStars}>{formatValue(kind, p)}</Text>
            </GlassPill>
          );
        })}

        <GlassPill tint="glow" style={styles.meRow} radius={radii.md}>
          <View style={styles.meBadge}>
            <Text style={styles.meBadgeText}>#{myEntry.rank}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName}>You ({progress.playerName})</Text>
            <Text style={styles.mePromoting}>{chase}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.rowStars}>{formatValue(kind, me)}</Text>
            <Text style={styles.rowXp}>of {board.length} players</Text>
          </View>
        </GlassPill>

        <Text style={styles.scoringNote}>
          Level score: clear +100 · fewest pours up to +100 · time up to +50 · no Undo +50 · no extra bottle +50. Your
          best score per level counts. Players on the same level share a rank.
        </Text>

        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialIcons name="military-tech" size={16} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Alchemy Medals</Text>
          </View>
          <Text style={styles.sectionMeta}>{stats.cleared} levels cleared</Text>
        </View>

        <View style={styles.medalsRow}>
          <Medal icon="bolt" name="Speed Pourer" desc="Clear 10 levels in under 45s" value={stats.fast} goal={10} color={colors.amber} />
          <Medal
            icon="psychology"
            name="Pure Genius"
            desc="Clear 30 levels without Undo"
            value={stats.noUndo}
            goal={30}
            color={colors.secondary}
          />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.margin, paddingTop: spacing.md, paddingBottom: 24 },

  profileCard: { padding: 16, marginBottom: spacing.lg, gap: 14 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { width: 56, height: 56 },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: colors.cyan,
  },
  proBadge: {
    position: 'absolute',
    bottom: -4,
    left: 8,
    backgroundColor: colors.cyan,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  proBadgeText: { color: colors.onPrimary, fontFamily: fontFamily.labelSm, fontSize: 8 },
  playerName: { color: colors.onSurface, fontFamily: fontFamily.headlineSm, fontSize: 17 },
  playerTitle: { color: colors.secondary, fontFamily: fontFamily.labelMd, fontSize: 12 },
  lvlPill: { backgroundColor: colors.surfaceContainerHighest, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  lvlPillText: { color: colors.onSurface, fontFamily: fontFamily.labelSm, fontSize: 11 },

  leagueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 10,
  },
  leagueTitle: { color: colors.onSurface, fontFamily: fontFamily.labelLg, fontSize: 13 },
  leagueSub: { color: colors.onSurfaceVariant, fontFamily: fontFamily.bodySm, fontSize: 11 },
  topGlobalPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  topGlobalText: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 10 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', gap: 2, flex: 1 },
  statValue: { color: colors.onSurface, fontFamily: fontFamily.counterNum, fontSize: 16 },
  statLabel: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 10 },

  segmentRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999, padding: 4, marginBottom: spacing.lg },
  segmentPill: { paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  segmentPillActive: { backgroundColor: colors.cyan },
  segmentText: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelMd, fontSize: 12 },
  segmentTextActive: { color: colors.onPrimary },

  standingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  standingsTitle: { color: colors.onSurface, fontFamily: fontFamily.labelLg, fontSize: 13 },
  standingsMeta: { color: colors.secondary, fontFamily: fontFamily.labelSm, fontSize: 10 },

  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, marginBottom: 8 },
  meRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, marginBottom: spacing.md, borderColor: colors.cyan, borderWidth: 1 },
  rankBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  crownIcon: { position: 'absolute', top: -10 },
  rankNum: { color: colors.onSurface, fontFamily: fontFamily.counterNum, fontSize: 12 },
  playerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainerHighest },
  rowName: { color: colors.onSurface, fontFamily: fontFamily.headlineSm, fontSize: 14 },
  rowMeta: { color: colors.onSurfaceVariant, fontFamily: fontFamily.bodySm, fontSize: 11 },
  rowStars: { color: colors.onSurface, fontFamily: fontFamily.counterNum, fontSize: 15 },
  rowXp: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 10 },
  meBadge: { backgroundColor: colors.cyan, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  meBadgeText: { color: colors.onPrimary, fontFamily: fontFamily.counterNum, fontSize: 12 },
  mePromoting: { color: colors.cyan, fontFamily: fontFamily.labelSm, fontSize: 10 },
  scoringNote: { color: colors.onSurfaceVariant, fontFamily: fontFamily.bodySm, fontSize: 11, lineHeight: 16, marginBottom: spacing.xl },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { color: colors.onSurface, fontFamily: fontFamily.labelLg, fontSize: 14 },
  sectionMeta: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 11 },

  medalsRow: { flexDirection: 'row', gap: 12 },
  medalCard: { flex: 1, padding: 14, alignItems: 'center', gap: 4 },
  medalCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  medalName: { color: colors.onSurface, fontFamily: fontFamily.headlineSm, fontSize: 13 },
  medalTier: { fontFamily: fontFamily.labelSm, fontSize: 11 },
  medalDesc: { color: colors.onSurfaceVariant, fontFamily: fontFamily.bodySm, fontSize: 10, textAlign: 'center' },
  medalTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.4)', width: '100%', marginTop: 6, overflow: 'hidden' },
  medalFill: { height: '100%', borderRadius: 2 },
});
