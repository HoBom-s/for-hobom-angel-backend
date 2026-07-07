/** Persistence contract over the idempotency_keys collection. */
export interface IdempotencyRepository {
  /** Insert the (scope, key); throws IdempotencyConflictException on duplicate. */
  reserve(scope: string, key: string): Promise<void>;
}
