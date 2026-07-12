export interface WithdrawVolunteerSignupCommand {
  signupId: string;
  /** The volunteer withdrawing their own signup. */
  volunteerId: string;
}

/**
 * A volunteer withdraws their signup, returning the capacity slot — one
 * transaction. Only the signup's owner may withdraw it.
 */
export interface WithdrawVolunteerSignupUseCase {
  invoke(command: WithdrawVolunteerSignupCommand): Promise<void>;
}
