import { Animal } from "src/hb-backend-api/animal/domain/model/animal";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

/** Read-side port. Returns hydrated {@link Animal} aggregates. */
export interface AnimalQueryPort {
  findById(id: AnimalId): Promise<Animal | null>;
  findByShelter(shelterId: ShelterId): Promise<Animal[]>;
}
