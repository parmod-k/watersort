import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GameHeader from '../../components/GameHeader';
import Panel from '../../components/ui/Panel';
import Pill from '../../components/ui/Pill';
import GradientButton, { ButtonVariant } from '../../components/ui/GradientButton';
import Tube, { TubeColor } from '../../components/game/Tube';
import { artTextShadow, colors, fontFamily, radii, spacing } from '../../theme/tokens';
import { contentMaxWidth, useResponsive } from '../../theme/responsive';
import { CosmeticItem, CosmeticSlot, isOwned, itemsFor } from '../../game/cosmetics';
import { buyCosmetic, claimDailyBonus, equipCosmetic, totalStars, useProgress } from '../../game/progress';
import { DAILY_BONUS, formatCountdown, msUntilReset, today, useNow } from '../../game/daily';

const tabs: { slot: CosmeticSlot; label: string; section: string }[] = [
  { slot: 'vial', label: 'Vial Shapes', section: 'Vial Collection' },
  { slot: 'fluid', label: 'Fluid Styles', section: 'Fluid Collection' },
  { slot: 'stopper', label: 'Stoppers', section: 'Stopper Collection' },
];

/** Fluid styles show several colors so the recolor is visible; other slots show one. */
const PREVIEW_STACK: Record<CosmeticSlot, TubeColor[]> = {
  vial: ['cyan', 'purple', 'yellow'],
  fluid: ['red', 'green', 'yellow'],
  stopper: ['pink', 'cyan', 'orange'],
};
const CARD_STACK: Record<CosmeticSlot, TubeColor[]> = {
  vial: ['cyan', 'cyan'],
  fluid: ['pink', 'lime'],
  stopper: ['orange', 'orange'],
};

type ItemAction = {
  label: string;
  variant: ButtonVariant;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  disabled: boolean;
  onPress?: () => void;
};

export default function ThemesScreen() {
  const [tab, setTab] = useState(0);
  const progress = useProgress();
  const now = useNow();
  const { width, isTablet, isCompact, gutter } = useResponsive();
  // 2 cards per row on phones, 3 on tablets; sized from the centred column width.
  const columns = isTablet ? 3 : 2;
  const gridGap = 12;
  const columnW = Math.min(width, contentMaxWidth.page) - gutter * 2;
  const cardW = Math.floor((columnW - gridGap * (columns - 1)) / columns);

  const { slot, section } = tabs[tab];
  const items = itemsFor(slot);
  const stars = totalStars(progress.records);
  const owns = (item: CosmeticItem) => isOwned(item, progress.owned, progress.unlocked, stars);
  const equippedId = progress.equipped[slot];
  // The item shown in the big preview; tapping a card previews it without equipping.
  const [previewIds, setPreviewIds] = useState<Partial<Record<CosmeticSlot, string>>>({});
  const preview = items.find((i) => i.id === previewIds[slot]) ?? items.find((i) => i.id === equippedId) ?? items[0];
  const bonusClaimed = progress.bonusDay === today(now);

  function actionFor(item: CosmeticItem): ItemAction {
    if (item.id === equippedId) return { label: 'In Use', variant: 'cream', icon: 'check', disabled: true };
    if (owns(item)) return { label: 'Equip', variant: 'green', disabled: false, onPress: () => equipCosmetic(item.id) };
    const u = item.unlock;
    if (u.kind === 'coins') {
      const affordable = progress.coins >= u.price;
      return {
        label: u.price.toLocaleString(),
        variant: 'gold',
        icon: 'monetization-on',
        disabled: !affordable,
        onPress: () => buyCosmetic(item.id),
      };
    }
    if (u.kind === 'level') return { label: `Level ${u.level}`, variant: 'purple', icon: 'lock', disabled: true };
    if (u.kind === 'stars') return { label: `${stars}/${u.stars}`, variant: 'purple', icon: 'star', disabled: true };
    return { label: 'Equip', variant: 'green', disabled: false, onPress: () => equipCosmetic(item.id) };
  }

  /** Why a locked item can't be equipped yet, shown under the preview. */
  function lockHint(item: CosmeticItem) {
    const u = item.unlock;
    if (owns(item)) return item.sub;
    if (u.kind === 'coins')
      return progress.coins >= u.price ? `Buy for ${u.price.toLocaleString()} coins` : `Need ${(u.price - progress.coins).toLocaleString()} more coins`;
    if (u.kind === 'level') return `Unlocks when you reach level ${u.level}`;
    if (u.kind === 'stars') return `Unlocks at ${u.stars} stars (you have ${stars})`;
    return item.sub;
  }

  const previewAction = actionFor(preview);
  const unlockedCount = items.filter(owns).length;

  return (
    <View style={styles.screen}>
      <GameHeader />
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]} showsVerticalScrollIndicator={false}>
        <View style={styles.tabsRow}>
          {tabs.map((t, i) => (
            <Pressable key={t.slot} onPress={() => setTab(i)}>
              <Pill variant={i === tab ? 'purple' : 'cream'} radius={radii.full} style={styles.tabPill}>
                <Text style={[styles.tabText, i === tab && styles.tabTextActive]}>{t.label}</Text>
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
              <Text style={styles.editionText}>{preview.tag}</Text>
            </View>
          </View>
          <View style={styles.previewStage}>
            <Tube
              colorsStack={PREVIEW_STACK[slot]}
              capacity={4}
              width={isTablet ? 80 : isCompact ? 54 : 64}
              height={isTablet ? 250 : isCompact ? 170 : 200}
              look={{ ...progress.equipped, [slot]: preview.id }}
            />
          </View>
          <View style={styles.previewBottom}>
            <View style={{ flex: 1, minWidth: 160 }}>
              <Text style={styles.previewTitle}>{preview.name}</Text>
              <Text style={styles.previewSub}>{lockHint(preview)}</Text>
            </View>
            <GradientButton
              label={previewAction.label}
              icon={previewAction.icon}
              variant={previewAction.variant}
              disabled={previewAction.disabled}
              onPress={previewAction.onPress}
              height={46}
            />
          </View>
        </Panel>

        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialIcons name="category" size={18} color={colors.goldPale} style={styles.headerIcon} />
            <Text style={styles.sectionTitle}>{section}</Text>
          </View>
          <Text style={styles.sectionMeta}>
            {unlockedCount} / {items.length} Unlocked
          </Text>
        </View>

        <View style={[styles.grid, { gap: gridGap }]}>
          {items.map((item) => {
            const action = actionFor(item);
            const equipped = item.id === equippedId;
            return (
              <Pressable key={item.id} onPress={() => setPreviewIds((p) => ({ ...p, [slot]: item.id }))}>
                <Panel
                  variant={item.id === preview.id ? 'highlight' : 'cream'}
                  style={[styles.card, { width: cardW }]}
                  radius={22}
                >
                  <View style={[styles.cardTag, { backgroundColor: equipped ? '#10B981' : item.tagColor }]}>
                    <Text style={styles.cardTagText} numberOfLines={1}>
                      {equipped ? '✓ Equipped' : item.tag}
                    </Text>
                  </View>
                  <View style={styles.cardTubeWrap}>
                    <Tube
                      colorsStack={CARD_STACK[slot]}
                      capacity={2}
                      width={40}
                      height={90}
                      selected={equipped}
                      look={{ ...progress.equipped, [slot]: item.id }}
                    />
                  </View>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {item.sub}
                  </Text>
                  <GradientButton
                    label={action.label}
                    icon={action.icon}
                    variant={action.variant}
                    height={40}
                    compact
                    fullWidth
                    disabled={action.disabled}
                    onPress={action.onPress}
                    style={{ marginTop: 6 }}
                  />
                </Panel>
              </Pressable>
            );
          })}
        </View>

        <Panel variant="purple" radius={radii.full} style={styles.treasuryBar}>
          <View style={styles.treasuryLeft}>
            <View style={styles.coinDisk}>
              <MaterialIcons name="monetization-on" size={22} color={colors.goldRim} />
            </View>
            <View>
              <Text style={styles.treasuryLabel}>TREASURY</Text>
              <Text style={styles.treasuryValue}>{progress.coins.toLocaleString()}</Text>
            </View>
          </View>
          <GradientButton
            label={bonusClaimed ? `Next in ${formatCountdown(msUntilReset(now))}` : `Daily +${DAILY_BONUS}`}
            icon={bonusClaimed ? 'schedule' : 'card-giftcard'}
            variant="gold"
            height={44}
            compact={isCompact}
            disabled={bonusClaimed}
            onPress={claimDailyBonus}
          />
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
