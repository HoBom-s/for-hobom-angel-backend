import { Animal } from "src/hb-backend-api/animal/domain/model/animal";

/**
 * Write-side port for the animals collection. `create` inserts a new animal;
 * `save` applies a version-guarded (optimistic-lock) update. Both enlist in the
 * ambient Mongo session, so an animal transition and any event it triggers
 * (e.g. an adoption completion) commit atomically.
 */
export interface AnimalPersistencePort {
  create(animal: Animal): Promise<void>;
  save(animal: Animal): Promise<void>;
}
