import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GameHeader from '../../components/GameHeader';
import Panel from '../../components/ui/Panel';
import GradientButton from '../../components/ui/GradientButton';
import { artTextShadow, chassis, colors, fontFamily, spacing } from '../../theme/tokens';
import { contentMaxWidth, useResponsive } from '../../theme/responsive';
import { useProgress } from '../../game/progress';
import { statsFor } from '../../game/scoring';
import { productName } from '../../game/shop';
import { isAdFree, subscriptionActive, type PurchaseRecord } from '../../game/wallet';
import type { CoinReason } from '../../game/economy';

type IconName = keyof typeof MaterialIcons.glyphMap;

const REASONS: Record<CoinReason, { label: string; icon: IconName }> = {
  level: { label: 'Level cleared', icon: 'flag' },
  trial: { label: 'Daily Trial', icon: 'emoji-events' },
  daily: { label: 'Daily bonus', icon: 'card-giftcard' },
  shop: { label: 'Theme item', icon: 'palette' },
  ad: { label: 'Rewarded ad', icon: 'ondemand-video' },
  purchase: { label: 'Coin pack', icon: 'shopping-bag' },
  vip: { label: 'VIP gift', icon: 'workspace-premium' },
  undo: { label: 'Undo', icon: 'undo' },
  hint: { label: 'Hint', icon: 'lightbulb' },
  restart: { label: 'Restart', icon: 'replay' },
  extraBottle: { label: 'Extra bottle', icon: 'add-circle' },
};

const STATUS: Record<PurchaseRecord['status'], { label: string; color: string }> = {
  completed: { label: 'Completed', color: colors.greenDeep },
  restored: { label: 'Restored', color: colors.lagoon },
  pending: { label: 'Pending', color: colors.amber },
};

const formatDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const formatTime = (ms: number) =>
  new Date(ms).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const SHORT_HISTORY = 15;

function Stat({ icon, tint, value, label }: { icon: IconName; tint: string; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <MaterialIcons name={icon} size={20} color={tint} />
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** The guest player's identity, wallet, coin history, purchase history and how progress is kept safe. */
export default function ProfileScreen() {
  const progress = useProgress();
  const { gutter } = useResponsive();
  const [showAllCoins, setShowAllCoins] = useState(false);
  const stats = statsFor(progress.records, progress.unlocked);
  const { entitlements, totals } = progress;
  const vip = subscriptionActive(entitlements);

  const coinRows = [...progress.ledger].reverse();
  const shownCoins = showAllCoins ? coinRows : coinRows.slice(0, SHORT_HISTORY);
  const purchases = [...progress.purchases].reverse();

  const adStatus = entitlements.removeAds ? 'Remove Ads owned' : vip ? 'VIP active' : 'Ads between levels';
  const store = Platform.OS === 'ios' ? 'Apple ID' : 'Google account';
  const backupText =
    Platform.OS === 'android'
      ? 'Your progress is saved on this phone, and Android Backup copies it to your Google account. Reinstalling the game, or setting up a new phone from that backup, brings it back.'
      : Platform.OS === 'ios'
        ? 'Your progress is saved on this iPhone and kept in its Keychain, so reinstalling the game keeps it. It also moves with iCloud backups and Quick Start to a new iPhone.'
        : 'Your progress is saved in this browser only.';

  return (
    <View style={styles.screen}>
      <GameHeader />
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]} showsVerticalScrollIndicator={false}>
        <Panel style={styles.card}>
          <View style={styles.playerRow}>
            <LinearGradient colors={chassis.purple} style={styles.avatar}>
              <MaterialIcons name="person" size={30} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName} numberOfLines={1}>
                {progress.playerName}
              </Text>
              <Text style={styles.playerSub}>Guest player · since {formatDate(progress.createdAt)}</Text>
            </View>
            {(entitlements.removeAds || vip) && (
              <View style={[styles.badge, { backgroundColor: vip ? colors.purple : colors.greenDeep }]}>
                <MaterialIcons name={vip ? 'workspace-premium' : 'block'} size={12} color="#FFFFFF" />
                <Text style={styles.badgeText}>{vip ? 'VIP' : 'AD-FREE'}</Text>
              </View>
            )}
          </View>
          <View style={styles.idBox}>
            <Text style={styles.idLabel}>PLAYER ID</Text>
            <Text style={styles.idValue} selectable>
              {progress.playerId}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Stat icon="monetization-on" tint={colors.gold} value={progress.coins.toLocaleString()} label="Balance" />
            <Stat icon="trending-up" tint={colors.greenDeep} value={totals.earned.toLocaleString()} label="Earned" />
            <Stat icon="trending-down" tint={colors.coral} value={totals.spent.toLocaleString()} label="Spent" />
          </View>
          <View style={styles.statRow}>
            <Stat icon="flag" tint={colors.lagoon} value={String(stats.level)} label="Level" />
            <Stat icon="star" tint={colors.gold} value={stats.stars.toLocaleString()} label="Stars" />
            <Stat icon="speed" tint={colors.purpleLight} value={stats.score.toLocaleString()} label="Score" />
          </View>
          <View style={styles.adRow}>
            <MaterialIcons name={isAdFree(entitlements) ? 'verified' : 'info-outline'} size={16} color={colors.inkSoft} />
            <Text style={styles.adText}>{adStatus}</Text>
            {!isAdFree(entitlements) && (
              <Pressable onPress={() => router.navigate('/shop')} hitSlop={8} accessibilityRole="button">
                <Text style={styles.link}>Go ad-free</Text>
              </Pressable>
            )}
          </View>
        </Panel>

        <Text style={styles.sectionTitle}>Purchase History</Text>
        <Panel style={styles.card}>
          {purchases.length === 0 ? (
            <Text style={styles.empty}>No purchases yet.</Text>
          ) : (
            purchases.map((p, i) => (
              <View key={p.key} style={[styles.listRow, i > 0 && styles.listDivider]}>
                <MaterialIcons
                  name={p.kind === 'coins' ? 'shopping-bag' : p.kind === 'removeAds' ? 'block' : 'workspace-premium'}
                  size={22}
                  color={colors.purple}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{productName(p.productId)}</Text>
                  <Text style={styles.rowSub}>
                    {formatTime(p.purchasedAt)}
                    {p.price ? ` · ${p.price}` : ''}
                    {p.coins ? ` · +${p.coins.toLocaleString()} coins` : ''}
                  </Text>
                  {p.orderId && (
                    <Text style={styles.rowMeta} selectable numberOfLines={1}>
                      {p.platform === 'ios' ? 'Transaction' : 'Order'} {p.orderId}
                    </Text>
                  )}
                </View>
                <View style={[styles.statusChip, { backgroundColor: STATUS[p.status].color }]}>
                  <Text style={styles.statusText}>{STATUS[p.status].label}</Text>
                </View>
              </View>
            ))
          )}
        </Panel>

        <Text style={styles.sectionTitle}>Coin History</Text>
        <Panel style={styles.card}>
          {coinRows.length === 0 ? (
            <Text style={styles.empty}>No coin changes yet.</Text>
          ) : (
            shownCoins.map((e, i) => {
              const reason = REASONS[e.reason] ?? { label: e.reason, icon: 'monetization-on' };
              return (
                <View key={`${e.at}-${i}`} style={[styles.listRow, i > 0 && styles.listDivider]}>
                  <MaterialIcons name={reason.icon} size={20} color={colors.inkSoft} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{reason.label}</Text>
                    <Text style={styles.rowSub}>{formatTime(e.at)}</Text>
                  </View>
                  <Text style={[styles.amount, { color: e.amount > 0 ? colors.greenDeep : colors.coral }]}>
                    {e.amount > 0 ? '+' : ''}
                    {e.amount.toLocaleString()}
                  </Text>
                </View>
              );
            })
          )}
          {coinRows.length > SHORT_HISTORY && (
            <Pressable onPress={() => setShowAllCoins((v) => !v)} style={styles.more} accessibilityRole="button">
              <Text style={styles.link}>{showAllCoins ? 'Show less' : `Show all ${coinRows.length}`}</Text>
            </Pressable>
          )}
        </Panel>

        <Panel variant="frost" radius={22} style={styles.backupCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="backup" size={20} color="#FFFFFF" />
            <Text style={styles.backupTitle}>Keeping your progress safe</Text>
          </View>
          <Text style={styles.backupText}>{backupText}</Text>
          {Platform.OS !== 'web' && (
            <Text style={styles.backupText}>
              Remove Ads and VIP belong to your {store}: use Restore Purchases in the Shop on any device.
            </Text>
          )}
          <GradientButton label="Open Shop" icon="storefront" variant="gold" height={42} compact fullWidth onPress={() => router.navigate('/shop')} />
        </Panel>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: '100%', maxWidth: contentMaxWidth.page, alignSelf: 'center', paddingTop: spacing.sm, paddingBottom: 24 },
  card: { padding: 14, gap: 10, marginBottom: spacing.lg },
  sectionTitle: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 17, marginBottom: spacing.md, ...artTextShadow },

  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.goldPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: { color: colors.ink, fontFamily: fontFamily.black, fontSize: 19 },
  playerSub: { color: colors.inkSoft, fontFamily: fontFamily.semiBold, fontSize: 12, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 10 },
  idBox: { backgroundColor: colors.creamEdge, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  idLabel: { color: colors.inkMuted, fontFamily: fontFamily.black, fontSize: 9, letterSpacing: 1 },
  idValue: { color: colors.inkSoft, fontFamily: fontFamily.semiBold, fontSize: 12 },
  statRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 4 },
  statValue: { color: colors.ink, fontFamily: fontFamily.black, fontSize: 16, marginTop: 2 },
  statLabel: { color: colors.inkMuted, fontFamily: fontFamily.bold, fontSize: 11 },
  adRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adText: { flex: 1, color: colors.inkSoft, fontFamily: fontFamily.bold, fontSize: 13 },
  link: { color: colors.purple, fontFamily: fontFamily.extraBold, fontSize: 13, textDecorationLine: 'underline' },

  empty: { color: colors.inkMuted, fontFamily: fontFamily.semiBold, fontSize: 13, textAlign: 'center', paddingVertical: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  listDivider: { borderTopWidth: 1, borderTopColor: colors.creamEdge },
  rowTitle: { color: colors.ink, fontFamily: fontFamily.extraBold, fontSize: 14 },
  rowSub: { color: colors.inkSoft, fontFamily: fontFamily.medium, fontSize: 11 },
  rowMeta: { color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 10 },
  statusChip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 10 },
  amount: { fontFamily: fontFamily.black, fontSize: 15 },
  more: { alignItems: 'center', paddingTop: 4 },

  backupCard: { padding: 14, gap: 10 },
  backupTitle: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 16, ...artTextShadow },
  backupText: { color: '#FFFFFF', fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 17, ...artTextShadow },
});
