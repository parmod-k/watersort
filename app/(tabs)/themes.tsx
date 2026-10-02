import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GameHeader from '../../components/GameHeader';
import GlassPill from '../../components/ui/GlassPill';
import GradientButton from '../../components/ui/GradientButton';
import Tube from '../../components/game/Tube';
import { colors, fontFamily, radii, spacing } from '../../theme/tokens';
import { contentMaxWidth, useResponsive } from '../../theme/responsive';

const tabs = ['Vial Shapes', 'Fluid Styles', 'Stoppers'];

type VialItem = {
  id: string;
  name: string;
  sub: string;
  tag?: string;
  tagColor?: string;
  cta: string;
  ctaKind: 'equipped' | 'equip' | 'locked';
};

const vials: VialItem[] = [
  { id: '1', name: 'Standard Cylinder', sub: 'Default Classic', tag: 'Equipped', tagColor: colors.primaryContainer, cta: 'In Use', ctaKind: 'equipped' },
  { id: '2', name: 'Alchemist Flask', sub: 'Erlenmeyer Core', tag: '250ml', tagColor: colors.onSurfaceVariant, cta: 'Equip', ctaKind: 'equip' },
  { id: '3', name: 'Potion Bottle', sub: 'Curved Witching Phial', tag: 'Cork Stopper', tagColor: colors.amber, cta: 'Equip', ctaKind: 'equip' },
  { id: '4', name: 'Galaxy Shards', sub: '4/5 Shards', tag: 'Epic Tier', tagColor: colors.secondary, cta: '500 Coins', ctaKind: 'locked' },
  { id: '5', name: 'Cryo Tube', sub: 'Reinforced Chamber', tag: 'Tech', tagColor: colors.onSurfaceVariant, cta: '1,200 Coins', ctaKind: 'locked' },
  { id: '6', name: 'Prism Crystal', sub: 'Faceted VIP Glow', tag: 'Legendary', tagColor: colors.amber, cta: 'VIP Pass', ctaKind: 'locked' },
];

export default function ThemesScreen() {
  const [tab, setTab] = useState(0);
  const { width, isTablet, isCompact, gutter } = useResponsive();
  // 2 cards per row on phones, 3 on tablets; sized from the centred column width.
  const columns = isTablet ? 3 : 2;
  const gridGap = 12;
  const columnW = Math.min(width, contentMaxWidth.page) - gutter * 2;
  const cardW = Math.floor((columnW - gridGap * (columns - 1)) / columns);

  return (
    <View style={styles.screen}>
      <GameHeader />
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]} showsVerticalScrollIndicator={false}>
        <View style={styles.tabsRow}>
          {tabs.map((t, i) => (
            <Pressable key={t} onPress={() => setTab(i)}>
              <GlassPill
                tint={i === tab ? 'glow' : 'low'}
                style={[styles.tabPill, i === tab && styles.tabPillActive]}
              >
                <Text style={[styles.tabText, i === tab && styles.tabTextActive]}>{t}</Text>
              </GlassPill>
            </Pressable>
          ))}
        </View>

        <GlassPill tint="low" style={styles.previewCard} radius={radii.lg}>
          <View style={styles.previewTop}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE PREVIEW</Text>
            </View>
            <View style={styles.editionPill}>
              <Text style={styles.editionText}>Standard Edition</Text>
            </View>
          </View>
          <View style={styles.previewTubeWrap}>
            <Tube
              colorsStack={['cyan', 'purple', 'yellow']}
              capacity={4}
              width={isTablet ? 80 : isCompact ? 54 : 64}
              height={isTablet ? 250 : isCompact ? 170 : 200}
            />
          </View>
          <View style={styles.previewBottom}>
            <View style={{ flex: 1, minWidth: 160 }}>
              <Text style={styles.previewTitle}>Standard Cylinder</Text>
              <Text style={styles.previewSub}>Classic balanced acoustic crystal</Text>
            </View>
            <GradientButton
              label="Try in Game"
              icon="sports-esports"
              height={40}
              colorsArr={[colors.surfaceContainerHighest, colors.surfaceContainerHighest, colors.surfaceContainerHighest]}
              edgeColor="#000000"
              textColor={colors.onSurface}
            />
          </View>
        </GlassPill>

        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialIcons name="category" size={16} color={colors.onSurfaceVariant} />
            <Text style={styles.sectionTitle}>Vial Collections</Text>
          </View>
          <Text style={styles.sectionMeta}>3 / 6 Unlocked</Text>
        </View>

        <View style={styles.grid}>
          {vials.map((v) => (
            <GlassPill key={v.id} tint="low" style={[styles.card, { width: cardW }]} radius={radii.md}>
              {v.tag && (
                <Text style={[styles.cardTag, { color: v.tagColor }]} numberOfLines={1}>
                  {v.ctaKind === 'equipped' ? '✓ ' : ''}
                  {v.tag}
                </Text>
              )}
              <View style={styles.cardTubeWrap}>
                <Tube colorsStack={['cyan']} capacity={2} width={40} height={90} />
              </View>
              <Text style={styles.cardName} numberOfLines={1}>
                {v.name}
              </Text>
              <Text style={styles.cardSub} numberOfLines={1}>{v.sub}</Text>
              {v.ctaKind === 'equipped' ? (
                <View style={styles.inUsePill}>
                  <MaterialIcons name="check" size={14} color={colors.onSurfaceVariant} />
                  <Text style={styles.inUseText}>In Use</Text>
                </View>
              ) : (
                <GradientButton
                  label={v.cta}
                  height={34}
                  colorsArr={
                    v.ctaKind === 'equip'
                      ? [colors.primaryFixedDim, colors.primaryContainer, colors.primaryFixed]
                      : [colors.surfaceContainerHighest, colors.surfaceContainerHighest, colors.surfaceContainerHighest]
                  }
                  edgeColor={v.ctaKind === 'equip' ? '#009BB0' : '#000'}
                  textColor={v.ctaKind === 'equip' ? colors.onPrimaryFixed : colors.onSurface}
                />
              )}
            </GlassPill>
          ))}
        </View>

        <GlassPill tint="glow" style={styles.treasuryBar} radius={radii.full}>
          <View style={styles.treasuryRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="monetization-on" size={18} color={colors.amber} />
              <View>
                <Text style={styles.treasuryLabel}>TREASURY</Text>
                <Text style={styles.treasuryValue}>1,450</Text>
              </View>
            </View>
            <GradientButton
              label="Watch for +50 Shards"
              icon="play-circle-filled"
              height={40}
              colorsArr={[colors.secondaryContainer, colors.violet, colors.secondaryContainer]}
              edgeColor="#6D019C"
              textColor="#fff"
            />
          </View>
        </GlassPill>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { width: '100%', maxWidth: contentMaxWidth.page, alignSelf: 'center', paddingTop: spacing.md, paddingBottom: 24 },
  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  tabPill: { paddingHorizontal: 14, paddingVertical: 8 },
  tabPillActive: { borderColor: colors.primaryContainer },
  tabText: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelMd, fontSize: 12 },
  tabTextActive: { color: colors.primaryContainer },

  previewCard: { padding: 16, marginBottom: spacing.xl },
  previewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cyan },
  liveText: { color: colors.primary, fontFamily: fontFamily.labelSm, fontSize: 10, letterSpacing: 1 },
  editionPill: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  editionText: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 10 },
  previewTubeWrap: { alignItems: 'center', paddingVertical: 20 },
  previewBottom: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  previewTitle: { color: colors.onSurface, fontFamily: fontFamily.headlineSm, fontSize: 17 },
  previewSub: { color: colors.onSurfaceVariant, fontFamily: fontFamily.bodySm, fontSize: 12, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { color: colors.onSurface, fontFamily: fontFamily.labelLg, fontSize: 14 },
  sectionMeta: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 11 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.xl },
  card: { padding: 12, gap: 6 },
  cardTag: { fontFamily: fontFamily.labelSm, fontSize: 10, letterSpacing: 0.3 },
  cardTubeWrap: { alignItems: 'center', paddingVertical: 10 },
  cardName: { color: colors.onSurface, fontFamily: fontFamily.headlineSm, fontSize: 14 },
  cardSub: { color: colors.onSurfaceVariant, fontFamily: fontFamily.bodySm, fontSize: 11 },
  inUsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    paddingVertical: 8,
    marginTop: 4,
  },
  inUseText: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 11 },

  treasuryBar: { padding: 12 },
  treasuryRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  treasuryLabel: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 9, letterSpacing: 0.5 },
  treasuryValue: { color: colors.onSurface, fontFamily: fontFamily.counterNum, fontSize: 15 },
});
