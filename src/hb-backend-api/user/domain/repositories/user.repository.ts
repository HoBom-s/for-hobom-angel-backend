import { Types } from "mongoose";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";

/** Mutable profile/authz/lifecycle fields the aggregate can change after creation. */
export type UserAuthzPatch = Partial<
  Pick<
    UserEntity,
    | "nickname"
    | "roles"
    | "shelterRoles"
    | "status"
    | "withdrawnAt"
    | "purgeAfter"
  >
>;

/**
 * Persistence contract over the users collection. Works with raw (already
 * encrypted) documents; PII crypto and domain mapping live in the adapter.
 */
export interface UserRepository {
  insert(doc: Partial<UserEntity>): Promise<UserEntity>;
  /**
   * Version-guarded update: applies `patch` (and bumps version) only if the
   * stored version still equals `expectedVersion`. Throws
   * {@link OptimisticLockException} when it doesn't (a concurrent update won).
   */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: UserAuthzPatch,
  ): Promise<void>;
  findById(id: Types.ObjectId): Promise<UserEntity | null>;
  findByNickname(nickname: string): Promise<UserEntity | null>;
  findByCi(ci: string): Promise<UserEntity | null>;
}
