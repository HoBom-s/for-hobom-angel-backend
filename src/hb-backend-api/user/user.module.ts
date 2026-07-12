import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { UserSchema } from "src/hb-backend-api/user/domain/model/user.schema";
import { UserPersistenceAdapter } from "src/hb-backend-api/user/adapters/out/user-persistence.adapter";
import { UserQueryAdapter } from "src/hb-backend-api/user/adapters/out/user-query.adapter";
import { UserRepositoryImpl } from "src/hb-backend-api/user/infra/repositories/user.repository.impl";
import { ChangeNicknameService } from "src/hb-backend-api/user/application/use-cases/change-nickname.service";
import { WithdrawAccountService } from "src/hb-backend-api/user/application/use-cases/withdraw-account.service";
import { UserController } from "src/hb-backend-api/user/adapters/in/user.controller";

/**
 * User store. Owns member records (encrypted PII, CI/DI identity, roles) and the
 * self-service profile surface (view / rename / withdraw). Exposes
 * query/persistence ports; the auth layer consumes UserQueryPort for
 * authorization decisions.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [
    {
      provide: DIToken.UserModule.ChangeNicknameUseCase,
      useClass: ChangeNicknameService,
    },
    {
      provide: DIToken.UserModule.WithdrawAccountUseCase,
      useClass: WithdrawAccountService,
    },
    {
      provide: DIToken.UserModule.UserRepository,
      useClass: UserRepositoryImpl,
    },
    {
      provide: DIToken.UserModule.UserPersistencePort,
      useClass: UserPersistenceAdapter,
    },
    {
      provide: DIToken.UserModule.UserQueryPort,
      useClass: UserQueryAdapter,
    },
  ],
  exports: [
    DIToken.UserModule.UserPersistencePort,
    DIToken.UserModule.UserQueryPort,
  ],
})
export class UserModule {}
