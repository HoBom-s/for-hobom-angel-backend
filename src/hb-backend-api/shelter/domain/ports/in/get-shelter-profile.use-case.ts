import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";

export interface GetShelterProfileQuery {
  shelterId: string;
  /** The staff member reading the profile (must manage the shelter). */
  actorId: string;
}

/**
 * The shelter's own editable "소개(About)" profile, read by its staff to prefill
 * the console editor. The read symmetric to `EditShelterProfileUseCase` — same
 * shelter, same staff authorization, returning the current profile values.
 */
export interface GetShelterProfileUseCase {
  invoke(query: GetShelterProfileQuery): Promise<Shelter>;
}
