import { PlacementType } from "src/hb-backend-api/review/domain/enums/placement-type.enum";

export interface SubmitReviewCommand {
  shelterId: string;
  authorId: string;
  placementType: PlacementType;
  placementRef: string;
  rating: number;
  body: string;
}

export interface SubmitReviewResult {
  reviewId: string;
}

/** Writes a shelter review, gated by a completed placement the author owns. */
export interface SubmitReviewUseCase {
  invoke(command: SubmitReviewCommand): Promise<SubmitReviewResult>;
}
