import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";

export interface SignUpCommand {
  email: string;
  password: string;
  nickname: string;
  realName: string;
  phone: string;
}

export interface SignUpResult {
  userId: string;
  nickname: string;
  tokens: TokenPair;
}

/** Registers a new member from the signup funnel and opens a session. */
export interface SignUpUseCase {
  invoke(command: SignUpCommand): Promise<SignUpResult>;
}
