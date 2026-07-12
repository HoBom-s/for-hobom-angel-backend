import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";

/** Write-side port for volunteer signups. Enlists in the ambient Mongo session. */
export interface VolunteerSignupPersistencePort {
  create(signup: VolunteerSignup): Promise<void>;
  save(signup: VolunteerSignup): Promise<void>;
}
