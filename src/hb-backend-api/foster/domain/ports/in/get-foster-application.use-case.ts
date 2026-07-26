import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";

export interface GetFosterApplicationQuery {
  applicationId: string;
  /** The caller — must be the applicant or staff of the owning shelter. */
  actorId: string;
}

/** One foster application with its answers. Applicant or owning-shelter staff. */
export interface GetFosterApplicationUseCase {
  invoke(query: GetFosterApplicationQuery): Promise<FosterApplication>;
}
