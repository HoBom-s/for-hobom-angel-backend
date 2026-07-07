/**
 * At-most-once guard. Call `reserve` at the start of a `@Transactional()`
 * operation with a stable key (e.g. a client `Idempotency-Key` header, or an
 * approval transition id). A duplicate reservation throws
 * {@link IdempotencyConflictException}, aborting the transaction so the work is
 * never applied twice.
 */
export interface IdempotencyPort {
  reserve(scope: string, key: string): Promise<void>;
}
