import { Page } from "src/shared/pagination/page";
import { PlacementType } from "src/hb-backend-api/review/domain/enums/placement-type.enum";
import { Review } from "src/hb-backend-api/review/domain/model/review";
import { ReviewId } from "src/hb-backend-api/review/domain/model/vo/review-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterReputation } from "src/hb-backend-api/review/domain/model/shelter-reputation";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

/** Read-side port for reviews and the reputation they roll up to. */
export interface ReviewQueryPort {
  findById(id: ReviewId): Promise<Review | null>;
  findByShelter(
    shelterId: ShelterId,
    cursor: string | null,
    limit: number,
  ): Promise<Page<Review>>;
  hasReviewedPlacement(
    authorId: UserId,
    placementType: PlacementType,
    placementRef: string,
  ): Promise<boolean>;
  reputationOf(shelterId: ShelterId): Promise<ShelterReputation>;
}
