import { Faq } from "src/hb-backend-api/faq/domain/model/faq";
import { FaqId } from "src/hb-backend-api/faq/domain/model/vo/faq-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

/** Read-side port for shelter FAQ entries. */
export interface FaqQueryPort {
  findById(id: FaqId): Promise<Faq | null>;
  /** A shelter's FAQ list in display order, capped at `limit`. */
  findByShelter(shelterId: ShelterId, limit: number): Promise<Faq[]>;
}
