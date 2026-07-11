import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";

/**
 * Write-side port for the shelters collection. `create` inserts a freshly
 * registered shelter; `save` applies a version-guarded (optimistic-lock) update
 * of the mutable fields. Both enlist in the ambient Mongo session, so a shelter
 * write and the approval request it triggers commit atomically.
 */
export interface ShelterPersistencePort {
  create(shelter: Shelter): Promise<void>;
  save(shelter: Shelter): Promise<void>;
}
