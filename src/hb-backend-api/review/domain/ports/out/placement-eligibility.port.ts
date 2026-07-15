import { PlacementType } from "src/hb-backend-api/review/domain/enums/placement-type.enum";

/**
 * A completed placement, resolved from the adoption/foster side. Only the facts
 * a review needs to authorize authorship: who was placed, at which shelter, and
 * whether the placement actually completed (APPROVED). Null shelterId/adopterId
 * are impossible for a real placement — the port returns null instead.
 */
export interface PlacementRecord {
  shelterId: string;
  adopterId: string;
  completed: boolean;
}

/**
 * Outbound port letting the review domain confirm a placement without depending
 * on the adoption/foster aggregates directly. The adapter delegates to their
 * query ports.
 */
export interface PlacementEligibilityPort {
  find(
    placementType: PlacementType,
    placementRef: string,
  ): Promise<PlacementRecord | null>;
}
