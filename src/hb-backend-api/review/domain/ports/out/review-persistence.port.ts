import { Review } from "src/hb-backend-api/review/domain/model/review";

/** Write-side port for the review aggregate. */
export interface ReviewPersistencePort {
  create(review: Review): Promise<Review>;
  /** Persists an edited review (rating/body) under optimistic concurrency. */
  save(review: Review): Promise<void>;
  remove(review: Review): Promise<void>;
}
