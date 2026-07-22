export interface ListStaffPromotionsQuery {
  shelterId: string;
  /** The caller — must be staff of the shelter. */
  actorId: string;
}

/** One pending promotion request, enriched with the candidate's track record. */
export interface StaffPromotionRequestView {
  /** The approval-request id — feed it to POST /approvals/:id/decision. */
  approvalId: string;
  candidateUserId: string;
  candidateNickname: string;
  /** Candidate's sign-up time (their 가입 기간); null if unknown. */
  candidateJoinedAt: Date | null;
  /** Candidate's approved volunteer sign-ups (their 봉사 N회). */
  volunteerCount: number;
}

/** A shelter's pending staff-promotion queue. Staff only. */
export interface ListStaffPromotionsUseCase {
  invoke(query: ListStaffPromotionsQuery): Promise<StaffPromotionRequestView[]>;
}
