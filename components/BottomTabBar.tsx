import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { artTextShadow, chassis, colors, fontFamily } from '../theme/tokens';
import { contentMaxWidth } from '../theme/responsive';

type BottomTabBarProps = {
  state: { routes: { key: string; name: string }[]; index: number };
  navigation: { navigate: (name: string) => void };
};

const ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  index: 'play-circle-filled',
  stages: 'map',
  themes: 'palette',
  rank: 'emoji-events',
};

const LABELS: Record<string, string> = {
  index: 'Play',
  stages: 'Stages',
  themes: 'Themes',
  rank: 'Rank',
};

/** Purple dock with a gold top rim; the active tab rises into a glossy gold squircle. */
export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={chassis.dock}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}
      >
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const icon = ICONS[route.name] ?? 'circle';
            const label = LABELS[route.name] ?? route.name;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  if (!focused) navigation.navigate(route.name);
                }}
                style={styles.item}
              >
                {focused ? (
                  <View style={styles.activeRim}>
                    <LinearGradient colors={chassis.gold} style={styles.activeFace}>
                      <MaterialIcons name={icon} size={26} color={colors.purpleInk} />
                    </LinearGradient>
                  </View>
                ) : (
                  <MaterialIcons name={icon} size={26} color="#D8C7FF" style={styles.idleIcon} />
                )}
                <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    shadowColor: '#12052B',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  wrap: {
    width: '100%',
    borderTopWidth: 3,
    borderTopColor: colors.goldPale,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  row: {
    height: 64,
    width: '100%',
    maxWidth: contentMaxWidth.page,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 6,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2, minWidth: 48, height: '100%' },
  idleIcon: { marginBottom: 2 },
  // The active tab pokes up above the dock's rim.
  activeRim: {
    marginTop: -22,
    borderRadius: 16,
    paddingBottom: 4,
    backgroundColor: colors.goldRim,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  activeFace: { width: 48, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#D8C7FF', fontFamily: fontFamily.bold, fontSize: 11 },
  labelActive: { color: colors.goldLight, fontFamily: fontFamily.black, ...artTextShadow },
});
