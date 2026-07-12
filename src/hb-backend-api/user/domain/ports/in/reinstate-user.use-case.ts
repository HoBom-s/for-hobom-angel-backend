export interface ReinstateUserCommand {
  userId: string;
  actorId: string;
}

/** Lifts a member's suspension, returning them to ACTIVE (operator only). */
export interface ReinstateUserUseCase {
  invoke(command: ReinstateUserCommand): Promise<void>;
}
