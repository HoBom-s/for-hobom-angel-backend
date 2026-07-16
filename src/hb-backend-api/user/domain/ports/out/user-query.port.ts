import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

/** Read-side port. Returns hydrated {@link User} aggregates (no plaintext PII). */
export interface UserQueryPort {
  findById(id: UserId): Promise<User | null>;
  findByNickname(nickname: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  /** Platform-wide count in a lifecycle status (operator stats). */
  countByStatus(status: UserStatus): Promise<number>;
  /** Sign-ups created within [from, to) (operator stats). */
  countCreatedBetween(from: Date, to: Date): Promise<number>;
}
