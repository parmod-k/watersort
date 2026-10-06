import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, usePathname, type Href } from 'expo-router';
import Panel from './ui/Panel';
import IconButton from './ui/IconButton';
import { artTextShadow, chassis, colors, fontFamily } from '../theme/tokens';

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

/** Settings sheet opened from the header squircle; holds the screen navigation that used to live in the bottom dock. */
export default function SettingsMenu({ visible, onClose }: Props) {
  const pathname = usePathname();
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
            {DESTINATIONS.map((d) => {
              const active = pathname === d.path;
              return (
                <Pressable
                  key={d.path}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
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
  rowLabel: { flex: 1, color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 17, ...artTextShadow },
  rowLabelActive: { color: colors.purpleInk, textShadowColor: 'transparent' },
});
