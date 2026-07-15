/**
 * A shelter's reputation, derived from its reviews. Read model only — computed
 * by aggregating the reviews collection, never stored. `average` is rounded to
 * one decimal; `distribution` maps each star (1–5) to its count.
 */
export interface ShelterReputation {
  shelterId: string;
  reviewCount: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}
