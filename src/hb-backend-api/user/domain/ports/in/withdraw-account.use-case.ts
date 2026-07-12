export interface WithdrawAccountCommand {
  userId: string;
}

/** Soft-withdraws the caller's account, starting the PII purge grace period. */
export interface WithdrawAccountUseCase {
  invoke(command: WithdrawAccountCommand): Promise<void>;
}
