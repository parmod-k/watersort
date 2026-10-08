import { createRemoteJWKSet, jwtVerify } from 'jose';
import { BadRequest, HttpError } from './validate.js';

const PROVIDERS = {
  google: { issuer: ['https://accounts.google.com', 'accounts.google.com'], keys: 'https://www.googleapis.com/oauth2/v3/certs' },
  apple: { issuer: 'https://appleid.apple.com', keys: 'https://appleid.apple.com/auth/keys' },
};

export const IDENTITY_PROVIDERS = Object.keys(PROVIDERS);

/**
 * Checks an ID token from Google or Apple sign-in: signed by the provider, not expired, and issued
 * to this app. Returns the provider's stable user id. The app never sends passwords; this token is
 * the proof of who the player is.
 *
 * @param {{ audiences: Partial<Record<'google' | 'apple', string[]>>, keySets?: Record<string, any> }} options
 *   `audiences`: Google OAuth client IDs (the web client ID the app is configured with) and the iOS
 *   bundle ID for Apple. `keySets` replaces the providers' public keys (tests only).
 */
export function createIdentityVerifier({ audiences, keySets = {} }) {
  const sets = {};
  const keysFor = (provider) => (sets[provider] ??= keySets[provider] ?? createRemoteJWKSet(new URL(PROVIDERS[provider].keys)));

  return async function verifyIdToken(provider, idToken) {
    if (!PROVIDERS[provider]) throw new BadRequest('Unknown sign-in provider.');
    if (typeof idToken !== 'string' || idToken.length > 8192) throw new BadRequest('"idToken" is required.');
    const audience = audiences[provider] ?? [];
    if (audience.length === 0) throw new HttpError(503, `${provider} sign-in is not configured on the server.`);
    let payload;
    try {
      ({ payload } = await jwtVerify(idToken, keysFor(provider), { issuer: PROVIDERS[provider].issuer, audience }));
    } catch {
      throw new HttpError(401, 'Sign-in could not be verified. Please try again.');
    }
    if (typeof payload.sub !== 'string' || !payload.sub) throw new HttpError(401, 'Sign-in token has no user id.');
    return { subject: payload.sub, email: typeof payload.email === 'string' ? payload.email : null };
  };
}

/** Audiences from the environment: comma-separated GOOGLE_CLIENT_IDS and APPLE_BUNDLE_IDS. */
export function audiencesFromEnv(env = process.env) {
  const list = (s) => (s ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  return { google: list(env.GOOGLE_CLIENT_IDS), apple: list(env.APPLE_BUNDLE_IDS) };
}
