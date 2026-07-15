import { Inject, Injectable } from "@nestjs/common";
import { FieldCipher } from "src/shared/crypto/field-cipher";
import { DIToken } from "src/shared/di/token.di";
import { RegisterUser } from "src/hb-backend-api/user/domain/model/register-user";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { UserPersistencePort } from "src/hb-backend-api/user/domain/ports/out/user-persistence.port";
import { UserRepository } from "src/hb-backend-api/user/domain/repositories/user.repository";

@Injectable()
export class UserPersistenceAdapter implements UserPersistencePort {
  constructor(
    @Inject(DIToken.UserModule.UserRepository)
    private readonly userRepository: UserRepository,
    private readonly cipher: FieldCipher,
  ) {}

  public async register(registration: RegisterUser): Promise<User> {
    const user = User.register(registration);
    await this.userRepository.insert({
      _id: user.getId.raw,
      nickname: user.getNickname.raw,
      email: user.getEmail.raw,
      passwordHash: user.getPasswordHash,
      realNameEnc: this.cipher.encrypt(registration.getRealName.raw),
      phoneEnc: this.cipher.encrypt(registration.getPhone.raw),
      verifiedChannel: user.getVerifiedChannel,
      roles: user.getRoles,
      shelterRoles: [],
      status: user.getStatus,
    });
    return user;
  }

  public async save(user: User): Promise<void> {
    await this.userRepository.update(user.getId.raw, user.getVersion, {
      nickname: user.getNickname.raw,
      roles: user.getRoles,
      shelterRoles: user.getShelterRoles.map((grant) => ({
        shelterId: grant.getShelterId.raw,
        role: grant.getRole,
      })),
      status: user.getStatus,
      withdrawnAt: user.getWithdrawnAt ?? undefined,
      purgeAfter: user.getPurgeAfter ?? undefined,
      suspendedAt: user.getSuspendedAt,
      sanctionReason: user.getSanctionReason,
    });
  }
}
