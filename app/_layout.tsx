import 'react-native-gesture-handler';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts as useQuicksandFonts,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import {
  useFonts as useNunitoFonts,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
} from '@expo-google-fonts/nunito-sans';
import { View } from 'react-native';
import { colors } from '../theme/tokens';

export default function RootLayout() {
  const [quicksandLoaded] = useQuicksandFonts({ Quicksand_600SemiBold, Quicksand_700Bold });
  const [nunitoLoaded] = useNunitoFonts({ NunitoSans_500Medium, NunitoSans_600SemiBold });

  if (!quicksandLoaded || !nunitoLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.surface }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="level-complete" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
