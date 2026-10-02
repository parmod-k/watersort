import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fontFamily } from '../theme/tokens';
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

export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const icon = ICONS[route.name] ?? 'circle';
          const label = LABELS[route.name] ?? route.name;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                if (!focused) navigation.navigate(route.name);
              }}
              style={styles.item}
            >
              <MaterialIcons
                name={icon}
                size={24}
                color={focused ? colors.primaryContainer : colors.onSurfaceVariant}
              />
              <Text style={[styles.label, { color: focused ? colors.primaryContainer : colors.onSurfaceVariant }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: 'rgba(15,17,40,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  row: {
    height: 56,
    width: '100%',
    maxWidth: contentMaxWidth.page,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 44, height: '100%' },
  label: { fontFamily: fontFamily.labelSm, fontSize: 11 },
});
