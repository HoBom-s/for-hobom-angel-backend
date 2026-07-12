import { Module } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { StubIdentityVerificationAdapter } from "src/hb-backend-api/identity/infra/adapters/stub-identity-verification.adapter";

/**
 * 본인확인 (CI/DI identity verification) integration. Exposes only the outbound
 * port so signup/login depend on the contract, not the vendor. Currently bound
 * to a fail-loud stub; the real vendor adapter is a drop-in replacement.
 */
@Module({
  providers: [
    {
      provide: DIToken.IdentityModule.IdentityVerificationPort,
      useClass: StubIdentityVerificationAdapter,
    },
  ],
  exports: [DIToken.IdentityModule.IdentityVerificationPort],
})
export class IdentityModule {}
