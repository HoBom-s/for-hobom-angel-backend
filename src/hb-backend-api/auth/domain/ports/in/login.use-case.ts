import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";

export interface LoginCommand {
  email: string;
  password: string;
}

/** Authenticates a member by email + password and opens a session. */
export interface LoginUseCase {
  invoke(command: LoginCommand): Promise<TokenPair>;
}
