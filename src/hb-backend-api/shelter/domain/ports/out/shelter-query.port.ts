import { Page } from "src/shared/pagination/page";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterSlug } from "src/hb-backend-api/shelter/domain/model/vo/shelter-slug.vo";

/** Read-side port. Returns hydrated {@link Shelter} aggregates. */
export interface ShelterQueryPort {
  findById(id: ShelterId): Promise<Shelter | null>;
  /** Platform-wide count in a status (operator stats). */
  countByStatus(status: ShelterStatus): Promise<number>;
  findBySlug(slug: ShelterSlug): Promise<Shelter | null>;
  /**
   * Map-visible shelters (verified, address not hidden, coordinates present),
   * optionally narrowed to a region. Hidden shelters are excluded per the
   * address disclosure policy.
   */
  findMappable(region?: string): Promise<Shelter[]>;
  /**
   * The verified-shelter directory (§04 list) — newest first, cursor-paged,
   * optionally filtered by region. Unlike the map, hidden-address shelters are
   * included (the list reveals only region-level location).
   */
  findVerified(params: {
    region?: string;
    keyword?: string;
    cursor?: string;
    limit: number;
  }): Promise<Page<Shelter>>;
}
