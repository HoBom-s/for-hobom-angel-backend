import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { UserRepository } from "src/hb-backend-api/user/domain/repositories/user.repository";
import { toDomain } from "src/hb-backend-api/user/adapters/out/user.mapper";

@Injectable()
export class UserQueryAdapter implements UserQueryPort {
  constructor(
    @Inject(DIToken.UserModule.UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  public async findById(id: UserId): Promise<User | null> {
    const doc = await this.userRepository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findByNickname(nickname: string): Promise<User | null> {
    const doc = await this.userRepository.findByNickname(nickname);
    return doc ? toDomain(doc) : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const doc = await this.userRepository.findByEmail(email);
    return doc ? toDomain(doc) : null;
  }

  public countByStatus(status: UserStatus): Promise<number> {
    return this.userRepository.countByStatus(status);
  }

  public countCreatedBetween(from: Date, to: Date): Promise<number> {
    return this.userRepository.countCreatedBetween(from, to);
  }
}
