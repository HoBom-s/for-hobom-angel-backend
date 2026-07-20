import { Page } from "src/shared/pagination/page";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";

export interface ListShelterAdoptionApplicationsQuery {
  shelterId: string;
  /** The caller — must be staff of the shelter. */
  actorId: string;
  status?: AdoptionApplicationStatus;
  cursor?: string;
  limit: number;
}

/** A shelter's incoming adoption applications (the review queue). Staff only. */
export interface ListShelterAdoptionApplicationsUseCase {
  invoke(
    query: ListShelterAdoptionApplicationsQuery,
  ): Promise<Page<AdoptionApplication>>;
}
