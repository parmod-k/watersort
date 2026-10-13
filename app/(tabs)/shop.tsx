import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GameHeader from '../../components/GameHeader';
import Panel from '../../components/ui/Panel';
import GradientButton from '../../components/ui/GradientButton';
import { artTextShadow, colors, fontFamily, spacing } from '../../theme/tokens';
import { contentMaxWidth, useResponsive } from '../../theme/responsive';
import { buy, manageSubscriptions, restorePurchases, useBilling } from '../../game/billing';
import { claimVipCoins, useProgress } from '../../game/progress';
import { COIN_PACKS, productName, REMOVE_ADS, VIP, VIP_PLANS, type BuyResult } from '../../game/shop';
import { subscriptionActive } from '../../game/wallet';
import { formatCountdown, msUntilReset, today, useNow } from '../../game/daily';

function notify(title: string, message: string) {
  if (Platform.OS === 'web') globalThis.alert?.(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

function report(result: BuyResult, success: string) {
  if (result.outcome === 'success') notify('Thank you!', success);
  else if (result.outcome === 'pending')
    notify('Payment pending', 'Your purchase will be delivered as soon as the payment is approved. You can keep playing.');
  else if (result.outcome === 'error') notify('Purchase failed', result.message);
}

const formatDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** Coin packs, Remove Ads, VIP subscriptions and Restore Purchases. */
export default function ShopScreen() {
  const billing = useBilling();
  const progress = useProgress();
  const now = useNow();
  const { width, isTablet, gutter } = useResponsive();
  const columns = isTablet ? 4 : 2;
  const gridGap = 12;
  const columnW = Math.min(width, contentMaxWidth.page) - gutter * 2;
  const cardW = Math.floor((columnW - gridGap * (columns - 1)) / columns);

  const ready = billing.status === 'ready';
  const busy = billing.buying !== null || billing.restoring;
  const { entitlements } = progress;
  const sub = entitlements.subscription;
  const vipActive = subscriptionActive(entitlements, now);
  const vipClaimed = progress.vipDay === today(now);

  /** Price label for a product, or why it can't be bought right now. */
  const priceFor = (id: string) => {
    if (billing.buying === id) return 'Opening…';
    if (billing.status === 'connecting') return 'Loading…';
    return billing.products[id]?.price ?? 'Unavailable';
  };
  const canBuy = (id: string) => ready && !busy && !!billing.products[id];

  async function buyCoins(id: string, coins: number) {
    report(await buy(id), `${coins.toLocaleString()} coins were added to your balance.`);
  }

  async function buyRemoveAds() {
    report(await buy(REMOVE_ADS), 'Forced ads are gone for good. Restore it on any device with the same store account.');
  }

  async function buyVip(id: string) {
    report(await buy(id), `VIP is active: no forced ads and ${VIP.dailyCoins} free coins every day.`);
  }

  async function restore() {
    const r = await restorePurchases();
    if (!r.ok) return notify('Restore failed', r.message);
    if (r.restored.length === 0)
      return notify('Nothing to restore', 'No Remove Ads or active VIP subscription was found for this store account.');
    notify('Purchases restored', r.restored.join('\n'));
  }

  function vipStatus() {
    if (!sub) return '';
    const plan = productName(sub.productId);
    if (sub.expiresAt) {
      return sub.willRenew === false ? `${plan} · cancelled, ends ${formatDate(sub.expiresAt)}` : `${plan} · renews ${formatDate(sub.expiresAt)}`;
    }
    return sub.willRenew === false ? `${plan} · cancelled, active until the period ends` : `${plan} · renews automatically`;
  }

  return (
    <View style={styles.screen}>
      <GameHeader />
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]} showsVerticalScrollIndicator={false}>
        {billing.status === 'unavailable' && (
          <Panel variant="frost" radius={18} style={styles.notice}>
            <MaterialIcons name="cloud-off" size={20} color="#FFFFFF" />
            <Text style={styles.noticeText}>
              {Platform.OS === 'web'
                ? 'Purchases are available in the iOS and Android app.'
                : `Can't reach ${Platform.OS === 'ios' ? 'the App Store' : 'Google Play'} right now. Check your connection; the shop retries when you come back to the game.`}
            </Text>
          </Panel>
        )}

        <View style={styles.sectionHeader}>
          <MaterialIcons name="monetization-on" size={18} color={colors.goldPale} style={artTextShadow} />
          <Text style={styles.sectionTitle}>Coin Shop</Text>
        </View>
        <View style={[styles.grid, { gap: gridGap }]}>
          {COIN_PACKS.map((pack, i) => (
            <Panel key={pack.id} variant={pack.tag ? 'highlight' : 'cream'} radius={22} style={[styles.packCard, { width: cardW }]}>
              {pack.tag ? (
                <View style={styles.packTag}>
                  <Text style={styles.packTagText}>{pack.tag}</Text>
                </View>
              ) : (
                <View style={styles.packTagSpacer} />
              )}
              <View style={styles.coinStack}>
                {Array.from({ length: i + 1 }, (_, k) => (
                  <MaterialIcons key={k} name="monetization-on" size={30} color={colors.gold} style={{ marginLeft: k ? -14 : 0 }} />
                ))}
              </View>
              <Text style={styles.packCoins}>{pack.coins.toLocaleString()}</Text>
              <Text style={styles.packLabel}>coins</Text>
              <GradientButton
                label={priceFor(pack.id)}
                variant="gold"
                height={40}
                compact
                fullWidth
                disabled={!canBuy(pack.id)}
                onPress={() => buyCoins(pack.id, pack.coins)}
                style={{ marginTop: 8 }}
              />
            </Panel>
          ))}
        </View>

        <Panel variant="purple" radius={24} style={styles.offerCard}>
          <View style={styles.offerTop}>
            <View style={[styles.offerIcon, { backgroundColor: colors.coral }]}>
              <MaterialIcons name="block" size={26} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.offerTitle}>Remove Ads</Text>
              <Text style={styles.offerText}>
                One purchase, forever: no banners, no ads between levels or when you open the game. Watching an ad for free coins stays optional.
              </Text>
            </View>
          </View>
          {entitlements.removeAds ? (
            <GradientButton label="Owned" icon="check" variant="cream" height={46} fullWidth disabled />
          ) : (
            <GradientButton
              label={priceFor(REMOVE_ADS)}
              icon="block"
              variant="green"
              height={46}
              fullWidth
              disabled={!canBuy(REMOVE_ADS)}
              onPress={buyRemoveAds}
            />
          )}
        </Panel>

        <Panel variant="highlight" radius={24} style={styles.offerCard}>
          <View style={styles.offerTop}>
            <View style={[styles.offerIcon, { backgroundColor: colors.purple }]}>
              <MaterialIcons name="workspace-premium" size={26} color={colors.goldPale} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.offerTitle, styles.inkText]}>VIP Pass</Text>
              <Text style={[styles.offerText, styles.inkSoftText]}>
                No banner or between-level ads, plus {VIP.dailyCoins} free coins every day while it's active.
              </Text>
            </View>
          </View>
          {vipActive ? (
            <>
              <View style={styles.vipStatus}>
                <MaterialIcons name="verified" size={16} color={colors.greenDeep} />
                <Text style={styles.vipStatusText}>{vipStatus()}</Text>
              </View>
              <GradientButton
                label={vipClaimed ? `Next gift in ${formatCountdown(msUntilReset(now))}` : `Claim ${VIP.dailyCoins} coins`}
                icon={vipClaimed ? 'schedule' : 'card-giftcard'}
                variant="gold"
                height={46}
                fullWidth
                disabled={vipClaimed}
                onPress={() => claimVipCoins()}
              />
              <GradientButton
                label="Manage subscription"
                icon="settings"
                variant="cream"
                height={42}
                compact
                fullWidth
                onPress={() => manageSubscriptions(sub?.productId).catch(() => {})}
              />
            </>
          ) : (
            <View style={styles.planRow}>
              {VIP_PLANS.map((plan) => (
                <View key={plan.id} style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.planLabel}>
                    {plan.period === 'month' ? 'Monthly' : 'Yearly'}
                    {plan.tag ? ` · ${plan.tag}` : ''}
                  </Text>
                  <GradientButton
                    label={priceFor(plan.id)}
                    variant={plan.period === 'year' ? 'green' : 'purple'}
                    height={44}
                    compact
                    fullWidth
                    disabled={!canBuy(plan.id)}
                    onPress={() => buyVip(plan.id)}
                  />
                </View>
              ))}
            </View>
          )}
          {!vipActive && (
            <Text style={styles.finePrint}>
              Renews automatically until cancelled. Cancel any time in your {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}{' '}
              subscription settings.
            </Text>
          )}
        </Panel>

        <Panel variant="frost" radius={22} style={styles.restoreCard}>
          <Text style={styles.restoreTitle}>New phone or reinstalled?</Text>
          <Text style={styles.restoreText}>
            Restore brings back Remove Ads and an active VIP Pass from your {Platform.OS === 'ios' ? 'Apple ID' : 'Google account'}.
            Coin packs are used up when bought, so the stores can't restore them.
          </Text>
          <GradientButton
            label={billing.restoring ? 'Restoring…' : 'Restore Purchases'}
            icon="restore"
            variant="cream"
            height={46}
            fullWidth
            disabled={busy || Platform.OS === 'web'}
            onPress={restore}
          />
          <GradientButton
            label="Purchase history"
            icon="receipt-long"
            variant="purple"
            height={42}
            compact
            fullWidth
            onPress={() => router.navigate('/profile')}
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
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: spacing.md },
  noticeText: { flex: 1, color: '#FFFFFF', fontFamily: fontFamily.semiBold, fontSize: 13, lineHeight: 18 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  sectionTitle: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 17, ...artTextShadow },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  packCard: { padding: 10, alignItems: 'center' },
  packTag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: colors.guava,
  },
  packTagText: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 10 },
  packTagSpacer: { height: 19 },
  coinStack: { flexDirection: 'row', marginTop: 6, marginBottom: 4 },
  packCoins: { color: colors.ink, fontFamily: fontFamily.black, fontSize: 22 },
  packLabel: { color: colors.inkSoft, fontFamily: fontFamily.bold, fontSize: 12, marginTop: -2 },

  offerCard: { padding: 14, gap: 12, marginBottom: spacing.lg },
  offerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  offerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerTitle: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 18 },
  offerText: { color: '#E9D5FF', fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 17, marginTop: 2 },
  inkText: { color: colors.ink },
  inkSoftText: { color: colors.inkSoft },
  vipStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vipStatusText: { flex: 1, color: colors.greenInk, fontFamily: fontFamily.bold, fontSize: 13 },
  planRow: { flexDirection: 'row', gap: 10 },
  planLabel: { color: colors.inkSoft, fontFamily: fontFamily.extraBold, fontSize: 12, textAlign: 'center' },
  finePrint: { color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 15, textAlign: 'center' },

  restoreCard: { padding: 14, gap: 10 },
  restoreTitle: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 16, ...artTextShadow },
  restoreText: { color: '#FFFFFF', fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 17, ...artTextShadow },
});
