import type { AgeSignals } from '../modules/age-signals';

/**
 * Age band from the Google Play Age Signals API, used only to keep the game age-appropriate
 * (child-safe ads for minors). Play's terms forbid using it for ad targeting, marketing,
 * profiling or analytics, so it is never sent anywhere or stored.
 */
export type AgeBand = 'child' | 'teen' | 'adult' | 'unknown';

export function ageBandFrom(s: AgeSignals | null): AgeBand {
  if (!s) return 'unknown';
  // Unverified user in a region where verification is mandatory: assume a minor until Play says otherwise.
  if (s.status === 'VERIFICATION_REQUIRED') return 'teen';
  if (s.status !== 'SHARED' || s.ageLower == null) return 'unknown';
  if (s.ageLower >= 18) return 'adult';
  if (s.ageLower < 13) return 'child';
  return 'teen';
}

/** Ad request settings for each band. Empty for adults and unknown users: the game's normal setup. */
export function adSettingsFor(band: AgeBand) {
  switch (band) {
    case 'child':
      return { tagForChildDirectedTreatment: true, tagForUnderAgeOfConsent: true, maxAdContentRating: 'G' as const };
    case 'teen':
      return { tagForUnderAgeOfConsent: true, maxAdContentRating: 'PG' as const };
    default:
      return {};
  }
}
