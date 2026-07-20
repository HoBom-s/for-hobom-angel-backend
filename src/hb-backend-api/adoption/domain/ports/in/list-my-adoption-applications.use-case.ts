import { Page } from "src/shared/pagination/page";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";

export interface ListMyAdoptionApplicationsQuery {
  applicantId: string;
  status?: AdoptionApplicationStatus;
  cursor?: string;
  limit: number;
}

/** The caller's own adoption applications. */
export interface ListMyAdoptionApplicationsUseCase {
  invoke(
    query: ListMyAdoptionApplicationsQuery,
  ): Promise<Page<AdoptionApplication>>;
}
