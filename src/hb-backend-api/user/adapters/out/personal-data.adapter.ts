import { Inject, Injectable } from "@nestjs/common";
import { FieldCipher } from "src/shared/crypto/field-cipher";
import { DIToken } from "src/shared/di/token.di";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import {
  ERASED_PII,
  PersonalData,
  erasedEmail,
  erasedNickname,
} from "src/hb-backend-api/user/domain/model/personal-data";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { PersonalDataPort } from "src/hb-backend-api/user/domain/ports/out/personal-data.port";
import { UserRepository } from "src/hb-backend-api/user/domain/repositories/user.repository";

@Injectable()
export class PersonalDataAdapter implements PersonalDataPort {
  constructor(
    @Inject(DIToken.UserModule.UserRepository)
    private readonly userRepository: UserRepository,
    private readonly cipher: FieldCipher,
  ) {}

  public async read(userId: UserId): Promise<PersonalData | null> {
    const doc = await this.userRepository.findById(userId.raw);
    if (!doc) {
      return null;
    }
    return {
      userId: userId.toString(),
      email: doc.email,
      nickname: doc.nickname,
      realName: this.decryptOrTombstone(doc.realNameEnc),
      phone: this.decryptOrTombstone(doc.phoneEnc),
      roles: doc.roles,
      status: doc.status,
      createdAt: doc.createdAt ?? null,
      withdrawnAt: doc.withdrawnAt ?? null,
    };
  }

  public anonymize(userId: UserId): Promise<number> {
    return this.userRepository.anonymize(userId.raw, {
      realNameEnc: ERASED_PII,
      phoneEnc: ERASED_PII,
      email: erasedEmail(userId.toString()),
      nickname: erasedNickname(userId.toString()),
      status: UserStatus.WITHDRAWN,
      withdrawnAt: new Date(),
      purgeAfter: null,
    });
  }

  public countResidual(userId: UserId): Promise<number> {
    return this.userRepository.countUnanonymized(userId.raw, ERASED_PII);
  }

  private decryptOrTombstone(encoded: string): string {
    // An erased row holds a tombstone, not real ciphertext — never decrypt it.
    return encoded === ERASED_PII ? ERASED_PII : this.cipher.decrypt(encoded);
  }
}
