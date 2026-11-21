import { requireOptionalNativeModule } from 'expo-modules-core';

export type AgeSignalsStatus = 'SHARED' | 'NOT_SHARED' | 'VERIFICATION_REQUIRED' | 'UNSPECIFIED' | 'NOT_REQUESTED';

export type AgeSignals = {
  /** A law in the user's region (e.g. Texas, Brazil, California from 2027) makes sharing mandatory. */
  mandatory: boolean;
  status: AgeSignalsStatus;
  /** Inclusive bounds; ageUpper is null for the top band (18+). Only set when status is SHARED. */
  ageLower?: number | null;
  ageUpper?: number | null;
  ageRangeSource?: 'TIER_A' | 'TIER_B' | 'TIER_C' | 'TIER_D' | null;
  significantChangeStatus?: 'APPROVED' | 'PENDING' | 'DECLINED' | null;
  significantChangeApprovalDate?: number | null;
  installId?: string | null;
};

type NativeModule = { checkAsync(promptOutsideMandatoryRegions: boolean): Promise<AgeSignals> };

/** Android only (Google Play). Null on iOS, web, and builds made before this module was added. */
const native = requireOptionalNativeModule<NativeModule>('AgeSignals');

export const isAvailable = native != null;

export function checkAgeSignals(promptOutsideMandatoryRegions = false): Promise<AgeSignals | null> {
  return native ? native.checkAsync(promptOutsideMandatoryRegions) : Promise.resolve(null);
}
