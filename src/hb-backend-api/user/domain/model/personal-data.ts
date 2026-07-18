/**
 * The identity/profile PII the platform holds about a member — the payload of a
 * DSAR access (export) request. `realName`/`phone` are decrypted at read time;
 * for an already-erased subject they come back as the {@link ERASED_PII} marker.
 */
export interface PersonalData {
  userId: string;
  email: string;
  nickname: string;
  realName: string;
  phone: string;
  roles: string[];
  status: string;
  createdAt: Date | null;
  withdrawnAt: Date | null;
}

/** Non-empty tombstone for the required encrypted PII fields after erasure. */
export const ERASED_PII = "[erased]";

/** Tombstoned, unique-index-safe email/nickname for an erased subject. */
export function erasedEmail(userId: string): string {
  return `deleted+${userId}@removed.invalid`;
}
export function erasedNickname(userId: string): string {
  return `deleted-${userId}`;
}
