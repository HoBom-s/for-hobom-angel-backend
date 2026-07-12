import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";

export interface LoginCommand {
  /** 본인확인 vendor receipt — the member is resolved by its attested CI. */
  verificationToken: string;
}

/** Authenticates a returning member via 본인확인 and opens a session. */
export interface LoginUseCase {
  invoke(command: LoginCommand): Promise<TokenPair>;
}
