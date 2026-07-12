import { User } from "src/hb-backend-api/user/domain/model/user";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

/** Read-side port. Returns hydrated {@link User} aggregates (no plaintext PII). */
export interface UserQueryPort {
  findById(id: UserId): Promise<User | null>;
  findByNickname(nickname: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
