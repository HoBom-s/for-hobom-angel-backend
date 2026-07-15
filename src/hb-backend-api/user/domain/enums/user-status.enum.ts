/**
 * Account lifecycle. Drives the deletion batch. SUSPENDED = sanctioned by an
 * operator; the member is blocked from acting until reinstated.
 */
export enum UserStatus {
  ACTIVE = "ACTIVE",
  DORMANT = "DORMANT",
  SUSPENDED = "SUSPENDED",
  WITHDRAWN = "WITHDRAWN",
}
