import { Page } from "src/shared/pagination/page";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationId } from "src/hb-backend-api/foster/domain/model/vo/foster-application-id.vo";

/** Read-side port for foster applications. */
export interface FosterApplicationQueryPort {
  findById(id: FosterApplicationId): Promise<FosterApplication | null>;
  /** A shelter's applications (optionally one status), newest first, cursor-paged. */
  findPageByShelter(
    shelterId: ShelterId,
    status: FosterApplicationStatus | null,
    cursor: string | null,
    limit: number,
  ): Promise<Page<FosterApplication>>;
  /** An applicant's own applications, newest first, cursor-paged. */
  findPageByApplicant(
    applicantId: UserId,
    status: FosterApplicationStatus | null,
    cursor: string | null,
    limit: number,
  ): Promise<Page<FosterApplication>>;
  countByApplicantAndStatus(
    applicantId: UserId,
    status: FosterApplicationStatus,
  ): Promise<number>;
  /** A shelter's applications in a status — e.g. the PENDING review queue. */
  countByShelterAndStatus(
    shelterId: ShelterId,
    status: FosterApplicationStatus,
  ): Promise<number>;
  /** Platform-wide count in a status (operator stats). */
  countByStatus(status: FosterApplicationStatus): Promise<number>;
}
