import React from 'react';
import { Tabs } from 'expo-router';
import BottomTabBar from '../../components/BottomTabBar';
import ScreenBackground from '../../components/ui/ScreenBackground';

export default function TabsLayout() {
  return (
    // One shared backdrop behind every tab (and behind the dock's rounded corners).
    <ScreenBackground>
      <Tabs
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="stages" />
        <Tabs.Screen name="themes" />
        <Tabs.Screen name="rank" />
      </Tabs>
    </ScreenBackground>
  );
}
