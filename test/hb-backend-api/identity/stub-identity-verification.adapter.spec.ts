import { ServiceUnavailableException } from "@nestjs/common";
import { StubIdentityVerificationAdapter } from "src/hb-backend-api/identity/infra/adapters/stub-identity-verification.adapter";

/**
 * The placeholder must fail loud, not fabricate an identity — that contract is
 * what keeps signup/login secure until the real vendor adapter is dropped in.
 */
describe("StubIdentityVerificationAdapter", () => {
  it("rejects verification with 503 until the vendor is wired", () => {
    const adapter = new StubIdentityVerificationAdapter();
    expect(() => adapter.verify("any-receipt")).toThrow(
      ServiceUnavailableException,
    );
  });
});
