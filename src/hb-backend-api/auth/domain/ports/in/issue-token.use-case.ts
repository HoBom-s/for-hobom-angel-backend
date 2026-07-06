import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";

/**
 * Issues a fresh access/refresh pair for an already-authenticated principal.
 * The seam the login flow (email/phone OTP + CI/DI identity verification — provider
 * TBD) calls once it has resolved the member.
 */
export interface IssueTokenUseCase {
  invoke(userId: string, nickname: string): Promise<TokenPair>;
}
