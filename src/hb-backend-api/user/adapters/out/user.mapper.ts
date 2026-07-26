import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { ShelterRoleGrant } from "src/hb-backend-api/user/domain/model/shelter-role-grant";
import { Email } from "src/hb-backend-api/user/domain/model/vo/email.vo";
import { Nickname } from "src/hb-backend-api/user/domain/model/vo/nickname.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

/** Rehydrates a persisted document into the {@link User} aggregate. */
export function toDomain(doc: UserEntity): User {
  return User.reconstitute({
    id: UserId.fromString(String(doc._id)),
    nickname: Nickname.of(doc.nickname),
    email: Email.of(doc.email),
    passwordHash: doc.passwordHash,
    verifiedChannel: doc.verifiedChannel,
    roles: doc.roles,
    shelterRoles: (doc.shelterRoles ?? []).map((grant) =>
      ShelterRoleGrant.of(
        ShelterId.fromString(String(grant.shelterId)),
        grant.role,
      ),
    ),
    status: doc.status,
    withdrawnAt: doc.withdrawnAt ?? null,
    purgeAfter: doc.purgeAfter ?? null,
    suspendedAt: doc.suspendedAt ?? null,
    sanctionReason: doc.sanctionReason ?? null,
    version: doc.version ?? 0,
    createdAt: doc.createdAt ?? null,
  });
}
