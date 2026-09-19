import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GameHeader from '../../components/GameHeader';
import GlassPill from '../../components/ui/GlassPill';
import { colors, fontFamily, radii, spacing } from '../../theme/tokens';

const segments = ['Global', 'Friends', 'Weekly Cup'];

type Player = {
  rank: number;
  name: string;
  meta: string;
  stars: number;
  xp?: string;
  crownColor?: string;
};

const players: Player[] = [
  { rank: 1, name: 'AquaQueen', meta: 'Level 60 · Alchemist Supreme', stars: 180, xp: '+5,000 XP', crownColor: colors.amber },
  { rank: 2, name: 'LiquidSorcerer', meta: 'Level 58', stars: 176, xp: '+3,500 XP', crownColor: '#C7CEDB' },
  { rank: 3, name: 'VialWizard', meta: 'Level 57', stars: 171, xp: '+2,000 XP', crownColor: '#D08A55' },
  { rank: 4, name: 'HydroPulse', meta: 'Level 55', stars: 165 },
];

export default function RankScreen() {
  const [segment, setSegment] = useState(0);

  return (
    <View style={styles.screen}>
      <GameHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassPill tint="low" style={styles.profileCard} radius={radii.lg}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing} />
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName}>FluidMaster_99</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="auto-awesome" size={12} color={colors.secondary} />
                <Text style={styles.playerTitle}>Master Alchemist</Text>
              </View>
            </View>
            <View style={styles.lvlPill}>
              <Text style={styles.lvlPillText}>Lvl 42</Text>
            </View>
          </View>

          <View style={styles.leagueRow}>
            <MaterialIcons name="shield" size={20} color={colors.primaryContainer} />
            <View style={{ flex: 1 }}>
              <Text style={styles.leagueTitle}>Diamond Alchemist</Text>
              <Text style={styles.leagueSub}>Tier III League</Text>
            </View>
            <View style={styles.topGlobalPill}>
              <MaterialIcons name="public" size={12} color={colors.onSurfaceVariant} />
              <Text style={styles.topGlobalText}>Top 5% Global</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="star" size={16} color={colors.amber} />
                <Text style={styles.statValue}>124</Text>
              </View>
              <Text style={styles.statLabel}>Total Stars</Text>
            </View>
            <View style={styles.statBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="opacity" size={16} color={colors.cyan} />
                <Text style={styles.statValue}>94.2%</Text>
              </View>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="settings" size={16} color={colors.secondary} />
                <Text style={styles.statValue}>38</Text>
              </View>
              <Text style={styles.statLabel}>Perfect Sorts</Text>
            </View>
          </View>
        </GlassPill>

        <View style={styles.segmentRow}>
          {segments.map((s, i) => (
            <Pressable key={s} style={{ flex: 1 }} onPress={() => setSegment(i)}>
              <View style={[styles.segmentPill, i === segment && styles.segmentPillActive]}>
                <Text style={[styles.segmentText, i === segment && styles.segmentTextActive]}>{s}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.standingsHeader}>
          <Text style={styles.standingsTitle}>Diamond Division Standings</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="timer" size={13} color={colors.secondary} />
            <Text style={styles.standingsMeta}>Resets in 2d 14h</Text>
          </View>
        </View>

        {players.map((p) => (
          <GlassPill key={p.rank} tint="low" style={styles.playerRow} radius={radii.md}>
            <View style={[styles.rankBadge, p.crownColor && { backgroundColor: 'transparent', borderWidth: 2, borderColor: p.crownColor }]}>
              {p.crownColor && <MaterialIcons name="emoji-events" size={10} color={p.crownColor} style={styles.crownIcon} />}
              <Text style={styles.rankNum}>{p.rank}</Text>
            </View>
            <View style={styles.playerAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{p.name}</Text>
              <Text style={styles.rowMeta}>{p.meta}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="star" size={14} color={colors.amber} />
                <Text style={styles.rowStars}>{p.stars}</Text>
              </View>
              {p.xp && <Text style={styles.rowXp}>{p.xp}</Text>}
            </View>
          </GlassPill>
        ))}

        <GlassPill tint="glow" style={styles.meRow} radius={radii.md}>
          <View style={styles.meBadge}>
            <Text style={styles.meBadgeText}>#42</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName}>You (FluidMaster_99)</Text>
            <Text style={styles.mePromoting}>Promoting to Master in 2d 14h</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialIcons name="star" size={14} color={colors.amber} />
              <Text style={styles.rowStars}>124</Text>
            </View>
            <Text style={styles.rowXp}>Level 42</Text>
          </View>
        </GlassPill>

        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialIcons name="military-tech" size={16} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Alchemy Medals</Text>
          </View>
          <Text style={styles.sectionMeta}>View All (14/20) ›</Text>
        </View>

        <View style={styles.medalsRow}>
          <GlassPill tint="low" style={styles.medalCard} radius={radii.md}>
            <View style={[styles.medalCircle, { borderColor: colors.amber }]}>
              <MaterialIcons name="bolt" size={26} color={colors.amber} />
            </View>
            <Text style={styles.medalName}>Speed Pourer</Text>
            <Text style={[styles.medalTier, { color: colors.amber }]}>Gold Tier</Text>
            <Text style={styles.medalDesc}>Complete 10 sorts under 45s</Text>
            <View style={styles.medalTrack}>
              <View style={[styles.medalFill, { width: '100%', backgroundColor: colors.amber }]} />
            </View>
          </GlassPill>
          <GlassPill tint="low" style={styles.medalCard} radius={radii.md}>
            <View style={[styles.medalCircle, { borderColor: colors.onSurfaceVariant }]}>
              <MaterialIcons name="psychology" size={26} color={colors.onSurface} />
            </View>
            <Text style={styles.medalName}>Pure Genius</Text>
            <Text style={[styles.medalTier, { color: colors.onSurfaceVariant }]}>Silver Tier</Text>
            <Text style={styles.medalDesc}>30 sorts without Undo</Text>
            <View style={styles.medalTrack}>
              <View style={[styles.medalFill, { width: '60%', backgroundColor: colors.cyan }]} />
            </View>
          </GlassPill>
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
  meRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, marginBottom: spacing.xl, borderColor: colors.cyan, borderWidth: 1 },
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
