import { Alert, Linking } from 'react-native';

/** Hosted on GitHub Pages; the same URLs are in the Play Console store listing. */
export const PRIVACY_POLICY_URL = 'https://kiratitechsolutions.github.io/watersort-privacy-policy/';
export const TERMS_URL = 'https://kiratitechsolutions.github.io/watersort-terms-of-service/';

export function openLegal(url: string) {
  Linking.openURL(url).catch(() => Alert.alert("Couldn't open link", url));
}
