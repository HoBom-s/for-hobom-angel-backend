import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";

/** Write-side port for foster applications. Enlists in the ambient Mongo session. */
export interface FosterApplicationPersistencePort {
  create(application: FosterApplication): Promise<void>;
  save(application: FosterApplication): Promise<void>;
}
