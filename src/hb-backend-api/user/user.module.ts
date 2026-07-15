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
import { SanctionUserService } from "src/hb-backend-api/user/application/use-cases/sanction-user.service";
import { ReinstateUserService } from "src/hb-backend-api/user/application/use-cases/reinstate-user.service";
import { UserController } from "src/hb-backend-api/user/adapters/in/user.controller";

/**
 * User store. Owns member records (encrypted PII, roles) and the self-service
 * profile surface (view / rename / withdraw), plus operator moderation
 * (sanction / reinstate). Exposes query/persistence ports; the auth layer
 * consumes UserQueryPort for authorization decisions.
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
      provide: DIToken.UserModule.SanctionUserUseCase,
      useClass: SanctionUserService,
    },
    {
      provide: DIToken.UserModule.ReinstateUserUseCase,
      useClass: ReinstateUserService,
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
