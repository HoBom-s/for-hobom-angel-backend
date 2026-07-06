import { RegisterUser } from "src/hb-backend-api/user/domain/model/register-user";
import { User } from "src/hb-backend-api/user/domain/model/user";

/**
 * Write-side port for the user aggregate.
 *  - `register` inserts a new member (adapter encrypts PII from the write-model).
 *  - `save` persists mutable authz/lifecycle state of an existing aggregate
 *    (roles, shelter grants, status) — it never touches PII.
 */
export interface UserPersistencePort {
  register(registration: RegisterUser): Promise<User>;
  save(user: User): Promise<void>;
}
