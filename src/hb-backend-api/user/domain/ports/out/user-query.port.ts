import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

/** Read-side port. Returns hydrated {@link User} aggregates (no plaintext PII). */
export interface UserQueryPort {
  findById(id: UserId): Promise<User | null>;
  findByNickname(nickname: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  /**
   * Non-withdrawn members holding a role at this shelter — the staff roster.
   * Bounded by `limit` (a roster is small; no cursor).
   */
  findByShelter(shelterId: ShelterId, limit: number): Promise<User[]>;
  /** Platform-wide count in a lifecycle status (operator stats). */
  countByStatus(status: UserStatus): Promise<number>;
  /** Sign-ups created within [from, to) (operator stats). */
  countCreatedBetween(from: Date, to: Date): Promise<number>;
  /**
   * Ids of withdrawn accounts whose purge grace has elapsed (`purgeAfter <= now`)
   * — the daily 3am erasure sweep's work-list. Already-anonymized rows drop out
   * (their `purgeAfter` is cleared on erasure).
   */
  findWithdrawnToPurge(now: Date, limit: number): Promise<string[]>;
}
