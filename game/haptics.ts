import * as Haptics from 'expo-haptics';
import { getSettings } from './settings';

/** Vibration feedback that respects the Haptics setting. Every call fails silently. */
export const haptic = {
  selection() {
    if (getSettings().haptics) Haptics.selectionAsync().catch(() => {});
  },
  impact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
    if (getSettings().haptics) Haptics.impactAsync(style).catch(() => {});
  },
  notify(type: Haptics.NotificationFeedbackType) {
    if (getSettings().haptics) Haptics.notificationAsync(type).catch(() => {});
  },
};

export const { ImpactFeedbackStyle, NotificationFeedbackType } = Haptics;
