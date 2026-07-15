export interface ShelterStats {
  /** Cumulative adoptions — animals now ADOPTED. */
  adoptedCount: number;
  /** Currently in care — AVAILABLE + RESERVED + FOSTERED. */
  shelteredCount: number;
}

/** Aggregates a shelter's animal counts for the §04 About page. */
export interface GetShelterStatsUseCase {
  invoke(shelterId: string): Promise<ShelterStats>;
}
