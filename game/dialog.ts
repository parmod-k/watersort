import { Alert, Platform } from 'react-native';

type Choice<T> = { label: string; value: T; style?: 'cancel' | 'destructive' | 'default' };

/**
 * Native alert with buttons; resolves with the chosen value, or null if dismissed. On web it falls
 * back to confirm(): OK picks the last choice, Cancel the first.
 */
export function ask<T>(title: string, message: string, choices: Choice<T>[]): Promise<T | null> {
  if (Platform.OS === 'web') {
    const ok = globalThis.confirm?.(`${title}\n\n${message}`);
    return Promise.resolve(ok ? choices[choices.length - 1].value : choices[0].value);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      choices.map((c) => ({ text: c.label, style: c.style, onPress: () => resolve(c.value) })),
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}

export function tell(title: string, message: string) {
  if (Platform.OS === 'web') globalThis.alert?.(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
