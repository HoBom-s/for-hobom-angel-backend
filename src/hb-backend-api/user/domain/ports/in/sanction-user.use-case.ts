export interface SanctionUserCommand {
  userId: string;
  actorId: string;
  reason: string;
}

/** Suspends a member's account (operator only). Blocks all their actions. */
export interface SanctionUserUseCase {
  invoke(command: SanctionUserCommand): Promise<void>;
}
