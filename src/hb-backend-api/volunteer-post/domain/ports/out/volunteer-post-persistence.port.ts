import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";

/** Write-side port for the volunteer post aggregate. */
export interface VolunteerPostPersistencePort {
  create(post: VolunteerPost): Promise<VolunteerPost>;
  remove(post: VolunteerPost): Promise<void>;
}
