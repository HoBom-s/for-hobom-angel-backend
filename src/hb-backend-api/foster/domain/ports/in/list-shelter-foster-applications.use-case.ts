import { Page } from "src/shared/pagination/page";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";

export interface ListShelterFosterApplicationsQuery {
  shelterId: string;
  /** The caller — must be staff of the shelter. */
  actorId: string;
  status?: FosterApplicationStatus;
  cursor?: string;
  limit: number;
}

/** A shelter's incoming foster applications (the review queue). Staff only. */
export interface ListShelterFosterApplicationsUseCase {
  invoke(
    query: ListShelterFosterApplicationsQuery,
  ): Promise<Page<FosterApplication>>;
}
