export interface MonthlyAdoptionPoint {
  /** "YYYY-MM" in KST. */
  month: string;
  count: number;
}

/**
 * The §07 management dashboard for one shelter. Composes animal inventory counts
 * (from the Animal module) with adoption/foster application read models.
 */
export interface ShelterDashboard {
  /** Cumulative adoptions — animals now ADOPTED. */
  adoptedCount: number;
  /** Currently in care — AVAILABLE + RESERVED + FOSTERED. */
  shelteredCount: number;
  /** Open to adoption right now — AVAILABLE only. */
  availableCount: number;
  /** adopted / (adopted + sheltered), 0..1 rounded to 3 dp; 0 when there are none. */
  adoptionRate: number;
  /** Adoptions completed this KST month. */
  thisMonthAdoptions: number;
  /** Adoptions completed last KST month. */
  lastMonthAdoptions: number;
  /** Last 6 KST months, oldest first. */
  monthlyAdoptions: MonthlyAdoptionPoint[];
  /** Applications awaiting review — adoption PENDING + foster PENDING. */
  pendingApplications: number;
}

export interface GetShelterDashboardUseCase {
  /** `actorId` must be a staff/admin of the shelter — this is a §07 console view. */
  invoke(shelterId: string, actorId: string): Promise<ShelterDashboard>;
}
