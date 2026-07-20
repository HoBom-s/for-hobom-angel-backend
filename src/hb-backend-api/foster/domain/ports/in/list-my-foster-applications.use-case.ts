import { Page } from "src/shared/pagination/page";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";

export interface ListMyFosterApplicationsQuery {
  applicantId: string;
  status?: FosterApplicationStatus;
  cursor?: string;
  limit: number;
}

/** The caller's own foster applications. */
export interface ListMyFosterApplicationsUseCase {
  invoke(
    query: ListMyFosterApplicationsQuery,
  ): Promise<Page<FosterApplication>>;
}
