import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { DIToken } from "src/shared/di/token.di";
import { JwtAuthAdapter } from "src/infra/adapters/jwt/jwt-auth.adapter";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { IssueTokenService } from "src/hb-backend-api/auth/application/use-cases/issue-token.service";
import { JwtStrategy } from "src/hb-backend-api/auth/adapters/in/rest/strategy/jwt.strategy";
import { RolesGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/roles.guard";

/**
 * Self-contained auth: Angel issues & verifies its own JWTs. Provides the JWT
 * infrastructure (strategy, guards, token issuance) that domain modules consume.
 *
 * TODO: login controllers (email/phone OTP + CI/DI identity verification via
 * VERIFY_PROVIDER_* — provider TBD) and refresh/logout endpoints plug into
 * {@link IssueTokenService}.
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
    UserModule,
  ],
  providers: [
    JwtStrategy,
    RolesGuard,
    {
      provide: DIToken.AuthModule.JwtAuthPort,
      useClass: JwtAuthAdapter,
    },
    {
      provide: DIToken.AuthModule.IssueTokenUseCase,
      useClass: IssueTokenService,
    },
  ],
  exports: [
    JwtModule,
    PassportModule,
    RolesGuard,
    DIToken.AuthModule.JwtAuthPort,
    DIToken.AuthModule.IssueTokenUseCase,
  ],
})
export class AuthModule {}
