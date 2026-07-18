import { Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";
import { ErasureModule } from "src/shared/erasure/erasure.module";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { UserSchema } from "src/hb-backend-api/user/domain/model/user.schema";
import { PersonalDataAdapter } from "src/hb-backend-api/user/adapters/out/personal-data.adapter";
import { UserPersistenceAdapter } from "src/hb-backend-api/user/adapters/out/user-persistence.adapter";
import { UserQueryAdapter } from "src/hb-backend-api/user/adapters/out/user-query.adapter";
import { IdentityDestroyer } from "src/hb-backend-api/user/adapters/erasure/identity.destroyer";
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
 * consumes UserQueryPort for authorization decisions. Owns the IDENTITY
 * destroyer (self-registered into the erasure engine) and the PII port that
 * backs DSAR export.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
    ErasureModule,
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
    {
      provide: DIToken.UserModule.PersonalDataPort,
      useClass: PersonalDataAdapter,
    },
    IdentityDestroyer,
  ],
  exports: [
    DIToken.UserModule.UserPersistencePort,
    DIToken.UserModule.UserQueryPort,
    DIToken.UserModule.PersonalDataPort,
  ],
})
export class UserModule implements OnModuleInit {
  constructor(
    private readonly destroyerRegistry: DestroyerRegistry,
    private readonly identityDestroyer: IdentityDestroyer,
  ) {}

  public onModuleInit(): void {
    this.destroyerRegistry.register(this.identityDestroyer);
  }
}
