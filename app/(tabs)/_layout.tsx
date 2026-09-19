import React from 'react';
import { Tabs } from 'expo-router';
import BottomTabBar from '../../components/BottomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="stages" />
      <Tabs.Screen name="themes" />
      <Tabs.Screen name="rank" />
    </Tabs>
  );
}
