import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";

export interface SignUpCommand {
  /** 본인확인 vendor receipt — yields the verified real name / CI / phone. */
  verificationToken: string;
  nickname: string;
  email: string;
}

export interface SignUpResult {
  userId: string;
  nickname: string;
  tokens: TokenPair;
}

/** Registers a new member from a verified identity and opens a session. */
export interface SignUpUseCase {
  invoke(command: SignUpCommand): Promise<SignUpResult>;
}
