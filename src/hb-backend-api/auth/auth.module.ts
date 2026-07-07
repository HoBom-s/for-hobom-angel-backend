import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { DIToken } from "src/shared/di/token.di";
import { JwtAuthAdapter } from "src/infra/adapters/jwt/jwt-auth.adapter";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { RefreshTokenService } from "src/hb-backend-api/auth/application/use-cases/refresh-token.service";
import { RefreshTokenEntity } from "src/hb-backend-api/auth/domain/model/refresh-token.entity";
import { RefreshTokenSchema } from "src/hb-backend-api/auth/domain/model/refresh-token.schema";
import { RefreshTokenRepositoryImpl } from "src/hb-backend-api/auth/infra/repositories/refresh-token.repository.impl";
import { JwtStrategy } from "src/hb-backend-api/auth/adapters/in/rest/strategy/jwt.strategy";
import { RolesGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/roles.guard";

/**
 * Self-contained auth: Angel issues & verifies its own JWTs, with rotating
 * refresh tokens + reuse detection (see {@link RefreshTokenService}).
 *
 * TODO: login controllers (email/phone OTP + CI/DI identity verification via
 * VERIFY_PROVIDER_* — provider TBD) call `RefreshTokenService.issue`; the
 * refresh/logout endpoints call `rotate`/`revoke`.
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("HOBOM_JWT_SECRET"),
      }),
    }),
    MongooseModule.forFeature([
      { name: RefreshTokenEntity.name, schema: RefreshTokenSchema },
    ]),
    UserModule,
  ],
  providers: [
    JwtStrategy,
    RolesGuard,
    RefreshTokenService,
    {
      provide: DIToken.AuthModule.JwtAuthPort,
      useClass: JwtAuthAdapter,
    },
    {
      provide: DIToken.AuthModule.RefreshTokenRepository,
      useClass: RefreshTokenRepositoryImpl,
    },
  ],
  exports: [
    JwtModule,
    PassportModule,
    RolesGuard,
    RefreshTokenService,
    DIToken.AuthModule.JwtAuthPort,
  ],
})
export class AuthModule {}
