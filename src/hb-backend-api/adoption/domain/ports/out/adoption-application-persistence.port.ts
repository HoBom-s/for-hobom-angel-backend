import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";

/**
 * Write-side port for adoption applications. Enlists in the ambient Mongo
 * session, so an application and the animal reservation (or the decision and the
 * animal transition) commit atomically.
 */
export interface AdoptionApplicationPersistencePort {
  create(application: AdoptionApplication): Promise<void>;
  save(application: AdoptionApplication): Promise<void>;
}
