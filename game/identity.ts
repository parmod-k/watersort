import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import type { Provider } from './api';

/**
 * Native Google / Apple sign-in. Each returns the provider's ID token for the server to verify, or
 * null if the player cancelled. Client IDs come from the Google Cloud console (see README).
 */

let googleConfigured = false;

async function googleIdToken() {
  if (!googleConfigured) {
    GoogleSignin.configure({
      // The *web* client ID: Google puts it in the ID token's audience, which the server checks.
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
    googleConfigured = true;
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();
  if (!isSuccessResponse(res)) return null;
  if (!res.data.idToken) throw new Error('Google sign-in returned no ID token (check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID).');
  return res.data.idToken;
}

async function appleIdToken() {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    return credential.identityToken;
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
}

export function providerIdToken(provider: Provider) {
  return provider === 'google' ? googleIdToken() : appleIdToken();
}

/** Sign-in options on this device: Apple first on iOS (Apple requires it beside Google), none on web. */
export async function availableProviders(): Promise<Provider[]> {
  if (Platform.OS === 'web') return [];
  if (Platform.OS === 'ios') return (await AppleAuthentication.isAvailableAsync()) ? ['apple', 'google'] : ['google'];
  return ['google'];
}

/** Forgets the Google session too, so the next sign-in shows the account picker. */
export function signOutProviders() {
  if (Platform.OS !== 'web') GoogleSignin.signOut().catch(() => {});
}
