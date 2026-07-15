import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
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
  /** A shelter's applications in a status — e.g. the PENDING review queue. */
  countByShelterAndStatus(
    shelterId: ShelterId,
    status: AdoptionApplicationStatus,
  ): Promise<number>;
  /** Applications of a status last updated within [from, to) — the adoption trend. */
  countByShelterAndStatusBetween(
    shelterId: ShelterId,
    status: AdoptionApplicationStatus,
    from: Date,
    to: Date,
  ): Promise<number>;
}
