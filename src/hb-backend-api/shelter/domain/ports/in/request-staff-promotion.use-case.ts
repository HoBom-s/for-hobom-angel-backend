export interface RequestStaffPromotionCommand {
  shelterId: string;
  candidateUserId: string;
  /** The shelter admin requesting the promotion. */
  requestedBy: string;
}

export interface RequestStaffPromotionResult {
  approvalId: string;
}

/**
 * Opens a STAFF_PROMOTION approval to make a member a shelter's staff. The
 * shelter's representative decides it; on approval the candidate gains the
 * SHELTER_STAFF role scoped to that shelter.
 */
export interface RequestStaffPromotionUseCase {
  invoke(
    command: RequestStaffPromotionCommand,
  ): Promise<RequestStaffPromotionResult>;
}
