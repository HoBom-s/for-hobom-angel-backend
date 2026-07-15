import { Faq } from "src/hb-backend-api/faq/domain/model/faq";

/** Write-side port for the FAQ aggregate. */
export interface FaqPersistencePort {
  create(faq: Faq): Promise<Faq>;
  /** Persists an edited FAQ (question/answer/order) under optimistic concurrency. */
  save(faq: Faq): Promise<void>;
  remove(faq: Faq): Promise<void>;
}
