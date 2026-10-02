import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GameHeader from '../../components/GameHeader';
import Panel from '../../components/ui/Panel';
import Pill from '../../components/ui/Pill';
import GradientButton, { ButtonVariant } from '../../components/ui/GradientButton';
import Tube from '../../components/game/Tube';
import { artTextShadow, colors, fontFamily, radii, spacing } from '../../theme/tokens';
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
  { id: '1', name: 'Standard Cylinder', sub: 'Default Classic', tag: 'Equipped', tagColor: '#10B981', cta: 'In Use', ctaKind: 'equipped' },
  { id: '2', name: 'Alchemist Flask', sub: 'Erlenmeyer Core', tag: '250ml', tagColor: '#00B2FE', cta: 'Equip', ctaKind: 'equip' },
  { id: '3', name: 'Potion Bottle', sub: 'Curved Witching Phial', tag: 'Cork Stopper', tagColor: '#F59E0B', cta: 'Equip', ctaKind: 'equip' },
  { id: '4', name: 'Galaxy Shards', sub: '4/5 Shards', tag: 'Epic Tier', tagColor: '#A855F7', cta: '500', ctaKind: 'locked' },
  { id: '5', name: 'Cryo Tube', sub: 'Reinforced Chamber', tag: 'Tech', tagColor: '#00B2FE', cta: '1,200', ctaKind: 'locked' },
  { id: '6', name: 'Prism Crystal', sub: 'Faceted VIP Glow', tag: 'Legendary', tagColor: '#FF2E93', cta: 'VIP Pass', ctaKind: 'locked' },
];

const CTA_VARIANT: Record<VialItem['ctaKind'], ButtonVariant> = { equipped: 'cream', equip: 'green', locked: 'gold' };

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
              <Pill variant={i === tab ? 'purple' : 'cream'} radius={radii.full} style={styles.tabPill}>
                <Text style={[styles.tabText, i === tab && styles.tabTextActive]}>{t}</Text>
              </Pill>
            </Pressable>
          ))}
        </View>

        <Panel style={styles.previewCard} radius={28}>
          <View style={styles.previewTop}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE PREVIEW</Text>
            </View>
            <View style={styles.editionPill}>
              <Text style={styles.editionText}>Standard Edition</Text>
            </View>
          </View>
          <View style={styles.previewStage}>
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
            <GradientButton label="Try in Game" icon="sports-esports" variant="purple" height={46} />
          </View>
        </Panel>

        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialIcons name="category" size={18} color={colors.goldPale} style={styles.headerIcon} />
            <Text style={styles.sectionTitle}>Vial Collections</Text>
          </View>
          <Text style={styles.sectionMeta}>3 / 6 Unlocked</Text>
        </View>

        <View style={[styles.grid, { gap: gridGap }]}>
          {vials.map((v) => (
            <Panel key={v.id} style={[styles.card, { width: cardW }]} radius={22}>
              {v.tag && (
                <View style={[styles.cardTag, { backgroundColor: v.tagColor }]}>
                  <Text style={styles.cardTagText} numberOfLines={1}>
                    {v.ctaKind === 'equipped' ? '✓ ' : ''}
                    {v.tag}
                  </Text>
                </View>
              )}
              <View style={styles.cardTubeWrap}>
                <Tube colorsStack={['cyan']} capacity={2} width={40} height={90} selected={v.ctaKind === 'equipped'} />
              </View>
              <Text style={styles.cardName} numberOfLines={1}>
                {v.name}
              </Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {v.sub}
              </Text>
              <GradientButton
                label={v.cta}
                icon={v.ctaKind === 'equipped' ? 'check' : v.ctaKind === 'locked' && v.cta !== 'VIP Pass' ? 'monetization-on' : undefined}
                variant={CTA_VARIANT[v.ctaKind]}
                height={40}
                compact
                fullWidth
                disabled={v.ctaKind === 'equipped'}
                style={{ marginTop: 6 }}
              />
            </Panel>
          ))}
        </View>

        <Panel variant="purple" radius={radii.full} style={styles.treasuryBar}>
          <View style={styles.treasuryLeft}>
            <View style={styles.coinDisk}>
              <MaterialIcons name="monetization-on" size={22} color={colors.goldRim} />
            </View>
            <View>
              <Text style={styles.treasuryLabel}>TREASURY</Text>
              <Text style={styles.treasuryValue}>1,450</Text>
            </View>
          </View>
          <GradientButton label="Watch for +50" icon="play-circle-filled" variant="gold" height={44} compact={isCompact} />
        </Panel>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: '100%', maxWidth: contentMaxWidth.page, alignSelf: 'center', paddingTop: spacing.sm, paddingBottom: 24 },
  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  tabPill: { paddingHorizontal: 14, paddingVertical: 7 },
  tabText: { color: colors.inkSoft, fontFamily: fontFamily.extraBold, fontSize: 13 },
  tabTextActive: { color: '#FFFFFF' },

  previewCard: { padding: 14, marginBottom: spacing.lg },
  previewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.guava },
  liveText: { color: colors.guava, fontFamily: fontFamily.black, fontSize: 11, letterSpacing: 1 },
  editionPill: { backgroundColor: colors.creamEdge, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  editionText: { color: colors.inkSoft, fontFamily: fontFamily.bold, fontSize: 11 },
  // A sky-blue lagoon well so the clear glass reads against the cream card.
  previewStage: {
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 18,
    borderRadius: 20,
    backgroundColor: '#38BDF8',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 12,
  },
  previewBottom: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  previewTitle: { color: colors.ink, fontFamily: fontFamily.extraBold, fontSize: 18 },
  previewSub: { color: colors.inkSoft, fontFamily: fontFamily.medium, fontSize: 12, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerIcon: artTextShadow,
  sectionTitle: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 17, ...artTextShadow },
  sectionMeta: { color: colors.onArtGold, fontFamily: fontFamily.black, fontSize: 12, ...artTextShadow },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  card: { padding: 10, gap: 2 },
  cardTag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    maxWidth: '100%',
  },
  cardTagText: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 10 },
  cardTubeWrap: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 10,
    marginVertical: 6,
    borderRadius: 16,
    backgroundColor: '#7DD3FC',
  },
  cardName: { color: colors.ink, fontFamily: fontFamily.extraBold, fontSize: 14 },
  cardSub: { color: colors.inkSoft, fontFamily: fontFamily.medium, fontSize: 11 },

  treasuryBar: {
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  treasuryLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coinDisk: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.goldPale,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treasuryLabel: { color: '#E9D5FF', fontFamily: fontFamily.black, fontSize: 9, letterSpacing: 1 },
  treasuryValue: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 17 },
});
