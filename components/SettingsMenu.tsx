import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { haptic } from '../game/haptics';
import { router, usePathname, type Href } from 'expo-router';
import Panel from './ui/Panel';
import IconButton from './ui/IconButton';
import AccountSection from './AccountSection';
import { artTextShadow, chassis, colors, fontFamily } from '../theme/tokens';
import { setPlayerName, useProgress } from '../game/progress';
import { updateSettings, useSettings, type Settings } from '../game/settings';
import { useSyncStatus, type SyncStatus } from '../game/sync';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const DESTINATIONS: { href: Href; path: string; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { href: '/', path: '/', label: 'Play', icon: 'play-circle-filled' },
  { href: '/stages', path: '/stages', label: 'Stages', icon: 'map' },
  { href: '/themes', path: '/themes', label: 'Themes', icon: 'palette' },
  { href: '/rank', path: '/rank', label: 'Rank', icon: 'emoji-events' },
];

const TOGGLES: { key: keyof Settings; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'sound', label: 'Sound effects', icon: 'volume-up' },
  { key: 'haptics', label: 'Vibration', icon: 'vibration' },
];

const SYNC_LABELS: Record<SyncStatus, { text: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  idle: { text: 'Connecting…', icon: 'cloud-queue' },
  syncing: { text: 'Saving to cloud…', icon: 'cloud-upload' },
  synced: { text: 'Saved to cloud', icon: 'cloud-done' },
  offline: { text: 'Offline · saved on this device', icon: 'cloud-off' },
};

/** Player name, preferences and screen navigation, opened from the header squircle. */
export default function SettingsMenu({ visible, onClose }: Props) {
  const pathname = usePathname();
  const settings = useSettings();
  const { playerName } = useProgress();
  const sync = SYNC_LABELS[useSyncStatus()];
  const [nameDraft, setNameDraft] = useState(playerName);
  const [nameError, setNameError] = useState(false);
  useEffect(() => {
    if (visible) {
      setNameDraft(playerName);
      setNameError(false);
    }
  }, [visible, playerName]);

  function saveName() {
    const ok = setPlayerName(nameDraft);
    setNameError(!ok);
    if (ok) haptic.selection();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose}>
        {/* Swallow taps inside the card so only the scrim closes it. */}
        <Pressable style={styles.cardWrap} onPress={() => {}}>
          <Panel variant="purple" radius={28} style={styles.card}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Settings</Text>
              <IconButton icon="close" shape="round" size={36} onPress={onClose} />
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.section}>Player name</Text>
              <View style={[styles.nameRow, nameError && styles.nameRowError]}>
                <MaterialIcons name="person" size={22} color={colors.goldLight} />
                <TextInput
                  value={nameDraft}
                  onChangeText={(t) => {
                    setNameDraft(t);
                    setNameError(false);
                  }}
                  onSubmitEditing={saveName}
                  onBlur={saveName}
                  maxLength={20}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="done"
                  placeholder="Your name"
                  placeholderTextColor="#B9A6E8"
                  accessibilityLabel="Player name"
                  style={styles.nameInput}
                />
              </View>
              <Text style={[styles.hint, nameError && styles.hintError]}>
                {nameError ? '3-20 letters, numbers, spaces or _' : 'Shown on the leaderboards'}
              </Text>

              <Text style={styles.section}>Preferences</Text>
              {TOGGLES.map((t) => (
                <View key={t.key} style={styles.toggleRow}>
                  <MaterialIcons name={t.icon} size={24} color={colors.goldLight} />
                  <Text style={styles.rowLabel}>{t.label}</Text>
                  <Switch
                    value={settings[t.key]}
                    onValueChange={(on) => {
                      updateSettings({ [t.key]: on });
                      // Confirm vibration when it is switched on (the wrapper skips it when off).
                      if (t.key === 'haptics' && on) haptic.selection();
                    }}
                    trackColor={{ false: 'rgba(255,255,255,0.25)', true: colors.green }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel={t.label}
                  />
                </View>
              ))}
              <View style={styles.syncRow}>
                <MaterialIcons name={sync.icon} size={16} color="#D8C7FF" />
                <Text style={styles.syncText}>{sync.text}</Text>
              </View>

              <AccountSection />

              <Text style={styles.section}>Go to</Text>
              {DESTINATIONS.map((d) => {
                const active = pathname === d.path;
                return (
                  <Pressable
                    key={d.path}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      haptic.selection();
                      onClose();
                      if (!active) router.navigate(d.href);
                    }}
                  >
                    {({ pressed }) => (
                      <LinearGradient
                        colors={active ? chassis.gold : ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)']}
                        style={[styles.row, active && styles.rowActive, pressed && { opacity: 0.8 }]}
                      >
                        <MaterialIcons name={d.icon} size={26} color={active ? colors.purpleInk : colors.goldLight} />
                        <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>{d.label}</Text>
                        <MaterialIcons
                          name="chevron-right"
                          size={24}
                          color={active ? colors.purpleInk : '#D8C7FF'}
                        />
                      </LinearGradient>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Panel>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', padding: 16 },
  cardWrap: { width: '100%', maxWidth: 360 },
  card: { width: '100%', padding: 16, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { color: colors.goldLight, fontFamily: fontFamily.black, fontSize: 24, ...artTextShadow },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  rowActive: { borderColor: '#FFFFFF' },
  scroll: { maxHeight: 560 },
  scrollBody: { gap: 10 },
  section: { color: '#D8C7FF', fontFamily: fontFamily.black, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  nameRowError: { borderColor: colors.coral },
  nameInput: { flex: 1, color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 17, paddingVertical: 0 },
  hint: { color: '#D8C7FF', fontFamily: fontFamily.semiBold, fontSize: 12, marginTop: -4, marginLeft: 4 },
  hintError: { color: '#FCA5A5' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 4 },
  syncText: { color: '#D8C7FF', fontFamily: fontFamily.semiBold, fontSize: 12 },
  rowLabel: { flex: 1, color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 17, ...artTextShadow },
  rowLabelActive: { color: colors.purpleInk, textShadowColor: 'transparent' },
});
