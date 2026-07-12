import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { ApplicationId } from "src/hb-backend-api/adoption/domain/model/vo/application-id.vo";

/** Read-side port for adoption applications. */
export interface AdoptionApplicationQueryPort {
  findById(id: ApplicationId): Promise<AdoptionApplication | null>;
  countByApplicantAndStatus(
    applicantId: UserId,
    status: AdoptionApplicationStatus,
  ): Promise<number>;
}
