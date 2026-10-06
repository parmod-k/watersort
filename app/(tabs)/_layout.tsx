import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ui/ScreenBackground';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    // One shared backdrop behind every screen. Navigation lives in the header's Settings menu,
    // so the tab bar is hidden and the screens keep clear of the bottom safe area themselves.
    <ScreenBackground>
      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        <Tabs
          tabBar={() => null}
          screenOptions={({ navigation }) => ({
            headerShown: false,
            // Inactive tabs stay mounted (on web only pushed behind via z-index), so with transparent
            // scenes they'd show through the active one. Hide every screen that isn't focused.
            sceneStyle: { backgroundColor: 'transparent', display: navigation.isFocused() ? 'flex' : 'none' },
          })}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="stages" />
          <Tabs.Screen name="themes" />
          <Tabs.Screen name="rank" />
        </Tabs>
      </View>
    </ScreenBackground>
  );
}
