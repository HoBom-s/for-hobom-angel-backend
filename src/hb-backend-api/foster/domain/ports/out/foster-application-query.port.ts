import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationId } from "src/hb-backend-api/foster/domain/model/vo/foster-application-id.vo";

/** Read-side port for foster applications. */
export interface FosterApplicationQueryPort {
  findById(id: FosterApplicationId): Promise<FosterApplication | null>;
  countByApplicantAndStatus(
    applicantId: UserId,
    status: FosterApplicationStatus,
  ): Promise<number>;
}
