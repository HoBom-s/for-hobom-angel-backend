import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { UserSchema } from "src/hb-backend-api/user/domain/model/user.schema";
import { UserPersistenceAdapter } from "src/hb-backend-api/user/adapters/out/user-persistence.adapter";
import { UserQueryAdapter } from "src/hb-backend-api/user/adapters/out/user-query.adapter";
import { UserRepositoryImpl } from "src/hb-backend-api/user/infra/repositories/user.repository.impl";

/**
 * User store. Owns member records (encrypted PII, CI/DI identity, roles).
 * Exposes query/persistence ports; the auth layer consumes UserQueryPort for
 * authorization decisions.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
  ],
  providers: [
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
