import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterSlug } from "src/hb-backend-api/shelter/domain/model/vo/shelter-slug.vo";

/** Read-side port. Returns hydrated {@link Shelter} aggregates. */
export interface ShelterQueryPort {
  findById(id: ShelterId): Promise<Shelter | null>;
  findBySlug(slug: ShelterSlug): Promise<Shelter | null>;
  /**
   * Map-visible shelters (verified, address not hidden, coordinates present),
   * optionally narrowed to a region. Hidden shelters are excluded per the
   * address disclosure policy.
   */
  findMappable(region?: string): Promise<Shelter[]>;
}
