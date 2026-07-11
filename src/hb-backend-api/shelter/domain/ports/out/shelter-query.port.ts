import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterSlug } from "src/hb-backend-api/shelter/domain/model/vo/shelter-slug.vo";

/** Read-side port. Returns hydrated {@link Shelter} aggregates. */
export interface ShelterQueryPort {
  findById(id: ShelterId): Promise<Shelter | null>;
  findBySlug(slug: ShelterSlug): Promise<Shelter | null>;
}
