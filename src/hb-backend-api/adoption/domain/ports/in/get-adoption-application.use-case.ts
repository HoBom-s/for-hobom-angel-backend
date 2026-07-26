import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";

export interface GetAdoptionApplicationQuery {
  applicationId: string;
  /** The caller — must be the applicant or staff of the owning shelter. */
  actorId: string;
}

/** One adoption application with its answers. Applicant or owning-shelter staff. */
export interface GetAdoptionApplicationUseCase {
  invoke(query: GetAdoptionApplicationQuery): Promise<AdoptionApplication>;
}
