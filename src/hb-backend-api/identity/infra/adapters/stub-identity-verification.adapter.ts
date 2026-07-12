import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { VerifiedIdentity } from "src/hb-backend-api/identity/domain/model/verified-identity";
import { IdentityVerificationPort } from "src/hb-backend-api/identity/domain/ports/out/identity-verification.port";

/**
 * Placeholder 본인확인 adapter until the CI/DI vendor is selected. It fails loud
 * (503) rather than fabricating an identity, so signup/login return a clear
 * "not yet available" instead of silently trusting client-supplied identity —
 * which would be a security hole in production.
 *
 * TODO: replace with the real vendor adapter (VERIFY_PROVIDER_* config). Swapping
 * this one binding in {@link IdentityModule} lights up signup + login unchanged.
 */
@Injectable()
export class StubIdentityVerificationAdapter implements IdentityVerificationPort {
  // The stub intentionally ignores the receipt — it has no vendor to call yet.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public verify(verificationToken: string): Promise<VerifiedIdentity> {
    throw new ServiceUnavailableException(
      "본인확인 연동이 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.",
    );
  }
}
