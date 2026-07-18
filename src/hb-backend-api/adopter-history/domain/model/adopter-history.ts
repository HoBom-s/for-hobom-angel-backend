/**
 * A member's placement track record, shown to a shelter screening an applicant.
 * Read model only — aggregated from adoption/foster applications + the account
 * status. `returns` (파양) is the key trust signal; `sanctioned` flags an
 * operator suspension.
 */
export interface AdopterHistory {
  userId: string;
  adoptions: number;
  returns: number;
  fosters: number;
  sanctioned: boolean;
}
