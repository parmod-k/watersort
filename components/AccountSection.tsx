import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { MaterialIcons } from '@expo/vector-icons';
import GradientButton from './ui/GradientButton';
import { colors, fontFamily } from '../theme/tokens';
import { useAccount, type Provider } from '../game/api';
import { ask, tell } from '../game/dialog';
import { availableProviders } from '../game/identity';
import { deleteAccount, signInWith, signOut, type ChooseProgress } from '../game/sync';

const PROVIDER_NAMES: Record<Provider, string> = { google: 'Google', apple: 'Apple' };

const chooseProgress: ChooseProgress = async (device, cloud) =>
  (await ask(
    'Which progress should we keep?',
    `This device: level ${device.level}, ${device.coins.toLocaleString()} coins\n` +
      `Your account: level ${cloud.level}, ${cloud.coins.toLocaleString()} coins\n\nThe other one will be replaced.`,
    [
      { label: 'Account', value: 'cloud' as const },
      { label: 'This device', value: 'device' as const },
    ],
  )) ?? 'cloud';

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');

/**
 * Settings section for the permanent account: link Google / Apple so progress survives a new phone
 * or cleared app data, sign out, or delete the account.
 */
export default function AccountSection() {
  const account = useAccount();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [busy, setBusy] = useState(false);
  const logins = account?.logins ?? [];
  const linked = logins.length > 0;

  useEffect(() => {
    availableProviders().then(setProviders, () => setProviders([]));
  }, []);

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (e) {
      tell('Account', message(e));
    } finally {
      setBusy(false);
    }
  }

  const signIn = (provider: Provider) =>
    run(async () => {
      const result = await signInWith(provider, chooseProgress);
      if (result === 'existing') tell('Welcome back!', 'Your account and progress have been restored.');
      else if (result !== 'cancelled') tell('Progress saved', `Your progress is now linked to ${PROVIDER_NAMES[provider]}.`);
    });

  const confirmSignOut = () =>
    run(async () => {
      const ok = await ask('Sign out?', 'This device starts again as a new player. Sign in again any time to get your progress back.', [
        { label: 'Cancel', value: false, style: 'cancel' },
        { label: 'Sign out', value: true },
      ]);
      if (ok) await signOut();
    });

  const confirmDelete = () =>
    run(async () => {
      const ok = await ask(
        'Delete account?',
        'Your progress, coins, purchases and leaderboard entries are deleted for good. This cannot be undone.',
        [
          { label: 'Cancel', value: false, style: 'cancel' },
          { label: 'Delete', value: true, style: 'destructive' },
        ],
      );
      if (ok) await deleteAccount();
    });

  const unlinked = providers.filter((p) => !logins.some((l) => l.provider === p));

  return (
    <View style={styles.wrap}>
      <Text style={styles.section}>Account</Text>
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <MaterialIcons name={linked ? 'verified-user' : 'person-outline'} size={22} color={linked ? colors.greenLight : colors.goldLight} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>{linked ? 'Progress backed up' : 'Guest account'}</Text>
            <Text style={styles.statusText}>
              {linked
                ? logins.map((l) => `${PROVIDER_NAMES[l.provider]}${l.email ? ` · ${l.email}` : ''}`).join('\n')
                : 'Sign in so you never lose your progress when you change phones or clear app data.'}
            </Text>
          </View>
          {busy && <ActivityIndicator color="#FFFFFF" />}
        </View>

        {unlinked.map((p) =>
          p === 'apple' && Platform.OS === 'ios' ? (
            <AppleAuthentication.AppleAuthenticationButton
              key={p}
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={14}
              style={styles.appleButton}
              onPress={() => signIn('apple')}
            />
          ) : (
            <GradientButton
              key={p}
              label={`Continue with ${PROVIDER_NAMES[p]}`}
              icon="login"
              variant="cream"
              height={48}
              fullWidth
              disabled={busy}
              onPress={() => signIn(p)}
            />
          ),
        )}
        {providers.length === 0 && <Text style={styles.statusText}>Signing in is available in the iOS and Android app.</Text>}

        <View style={styles.linkRow}>
          {linked && (
            <Pressable onPress={confirmSignOut} disabled={busy} hitSlop={8} accessibilityRole="button">
              <Text style={styles.link}>Sign out</Text>
            </Pressable>
          )}
          <Pressable onPress={confirmDelete} disabled={busy} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.link, styles.danger]}>Delete account</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  section: { color: '#D8C7FF', fontFamily: fontFamily.black, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 },
  card: {
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusTitle: { color: '#FFFFFF', fontFamily: fontFamily.black, fontSize: 15 },
  statusText: { color: '#D8C7FF', fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 16 },
  appleButton: { width: '100%', height: 48 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  link: { color: '#FFFFFF', fontFamily: fontFamily.bold, fontSize: 13, textDecorationLine: 'underline' },
  danger: { color: '#FCA5A5' },
});
