import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tube from '../components/game/Tube';
import GradientButton from '../components/ui/GradientButton';
import { colors, fontFamily, radii, spacing } from '../theme/tokens';

const purity = [
  { name: 'Cyan', color: 'cyan' as const },
  { name: 'Violet', color: 'purple' as const },
  { name: 'Amber', color: 'yellow' as const },
  { name: 'Emerald', color: 'emerald' as const },
];

export default function LevelCompleteScreen() {
  return (
    <View style={styles.backdrop}>
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.centerWrap}>
        <View style={styles.sheet}>
          <View style={styles.badgeRow}>
            <MaterialIcons name="auto-awesome" size={14} color={colors.onSurface} />
            <Text style={styles.badgeText}>PERFECT SORT · NO UNDOS</Text>
          </View>

          <Text style={styles.title}>LEVEL 42</Text>
          <Text style={styles.cleared}>CLEARED!</Text>

          <View style={styles.starsRow}>
            <MaterialIcons name="star" size={40} color="rgba(255,209,59,0.4)" />
            <View style={styles.starCenterWrap}>
              <MaterialIcons name="star" size={64} color={colors.amber} />
            </View>
            <MaterialIcons name="star" size={40} color="rgba(255,209,59,0.4)" />
          </View>
          <Text style={styles.starsLabel}>3 / 3 Stars Earned · Under Target Moves</Text>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderLabel}>LABORATORY PURITY</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="verified" size={14} color={colors.primaryContainer} />
                <Text style={styles.cardHeaderMeta}>100% Sorted</Text>
              </View>
            </View>
            <View style={styles.purityRow}>
              {purity.map((p) => (
                <View key={p.name} style={styles.purityItem}>
                  <Tube colorsStack={[p.color, p.color, p.color, p.color]} capacity={4} width={40} height={100} />
                  <Text style={styles.purityLabel}>{p.name}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.statRow}>
              <View style={styles.statLeft}>
                <View style={styles.statIcon}>
                  <MaterialIcons name="swap-vert" size={18} color={colors.cyan} />
                </View>
                <View>
                  <Text style={styles.statTitle}>Moves Used</Text>
                  <Text style={styles.statSub}>Target: 18 · Under Par!</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statValue}>14</Text>
                <Text style={styles.statValueSub}>+50 XP</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <View style={styles.statLeft}>
                <View style={styles.statIcon}>
                  <MaterialIcons name="monetization-on" size={18} color={colors.amber} />
                </View>
                <View>
                  <Text style={styles.statTitle}>Victory Coins</Text>
                  <Text style={styles.statSub}>Base reward + efficiency</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.statValue, { color: colors.amber }]}>+250</Text>
                <Text style={styles.statValueSub}>Total</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={{ gap: 6 }}>
              <View style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="science" size={16} color={colors.secondary} />
                  <Text style={styles.themeUnlockText}>Theme Unlock: Galaxy Vials</Text>
                </View>
                <Text style={styles.themeUnlockMeta}>4/5 Shards (80%)</Text>
              </View>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={[colors.violet, colors.cyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: '80%' }]}
                />
              </View>
            </View>
          </View>

          <GradientButton label="Next Level" icon="arrow-forward" fullWidth onPress={() => router.back()} />
          <View style={{ height: 10 }} />
          <GradientButton
            label="Claim 2X Coins (+500)"
            icon="play-circle-filled"
            fullWidth
            colorsArr={[colors.amber, colors.amber, colors.amber]}
            edgeColor="#B37A00"
            textColor="#3D2900"
          />

          <View style={styles.footerRow}>
            <FooterAction icon="replay" label="Replay" />
            <FooterAction icon="auto-fix-high" label="Cheers" />
            <FooterAction icon="share" label="Share" />
          </View>

          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FooterAction({ icon, label }: { icon: keyof typeof MaterialIcons.glyphMap; label: string }) {
  return (
    <Pressable style={styles.footerAction}>
      <MaterialIcons name={icon} size={18} color={colors.onSurfaceVariant} />
      <Text style={styles.footerActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,8,18,0.8)' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.margin },
  sheet: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  badgeText: { color: colors.onSurface, fontFamily: fontFamily.labelSm, fontSize: 10, letterSpacing: 0.6 },
  title: { color: colors.onSurface, fontFamily: fontFamily.displayLg, fontSize: 30, textAlign: 'center' },
  cleared: {
    color: colors.cyan,
    fontFamily: fontFamily.displayLg,
    fontSize: 30,
    textAlign: 'center',
    marginTop: 2,
  },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  starCenterWrap: { marginHorizontal: 4 },
  starsLabel: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelMd, fontSize: 12, marginTop: 8, marginBottom: 20 },

  card: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeaderLabel: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 11, letterSpacing: 0.5 },
  cardHeaderMeta: { color: colors.primaryContainer, fontFamily: fontFamily.labelSm, fontSize: 11 },
  purityRow: { flexDirection: 'row', justifyContent: 'space-between' },
  purityItem: { alignItems: 'center', gap: 8 },
  purityLabel: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 11 },

  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: { color: colors.onSurface, fontFamily: fontFamily.labelLg, fontSize: 13 },
  statSub: { color: colors.onSurfaceVariant, fontFamily: fontFamily.bodySm, fontSize: 11 },
  statValue: { color: colors.onSurface, fontFamily: fontFamily.counterNum, fontSize: 18 },
  statValueSub: { color: colors.primaryContainer, fontFamily: fontFamily.labelSm, fontSize: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeUnlockText: { color: colors.onSurface, fontFamily: fontFamily.labelMd, fontSize: 12 },
  themeUnlockMeta: { color: colors.secondary, fontFamily: fontFamily.labelSm, fontSize: 11 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.4)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 },
  footerAction: { alignItems: 'center', gap: 4 },
  footerActionText: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 11 },

  closeBtn: { position: 'absolute', top: 12, right: 12, padding: 6 },
});
