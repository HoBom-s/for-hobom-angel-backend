import { Types } from "mongoose";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";

/** Mutable authz/lifecycle fields the aggregate can change after creation. */
export type UserAuthzPatch = Partial<
  Pick<
    UserEntity,
    "roles" | "shelterRoles" | "status" | "withdrawnAt" | "purgeAfter"
  >
>;

/**
 * Persistence contract over the users collection. Works with raw (already
 * encrypted) documents; PII crypto and domain mapping live in the adapter.
 */
export interface UserRepository {
  insert(doc: Partial<UserEntity>): Promise<UserEntity>;
  update(id: Types.ObjectId, patch: UserAuthzPatch): Promise<void>;
  findById(id: Types.ObjectId): Promise<UserEntity | null>;
  findByNickname(nickname: string): Promise<UserEntity | null>;
  findByCi(ci: string): Promise<UserEntity | null>;
}
