/** Platform-wide KPIs for the operator dashboard (§07.7 운영자 지표). */
export interface AdminStats {
  /** VERIFIED shelters. */
  verifiedShelters: number;
  /** ACTIVE member accounts. */
  activeUsers: number;
  /** Sign-ups this KST month. */
  thisMonthSignups: number;
  /** Cumulative adoptions — animals now ADOPTED. */
  totalAdoptions: number;
  /** Adoptions completed this KST month. */
  thisMonthAdoptions: number;
  /** Applications awaiting review — adoption PENDING + foster PENDING. */
  pendingApplications: number;
}

/** `actorId` must be a platform operator. */
export interface GetAdminStatsUseCase {
  invoke(actorId: string): Promise<AdminStats>;
}
