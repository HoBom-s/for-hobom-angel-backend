/**
 * Ambient inputs a destroyer may need while erasing a subject. The Mongo session
 * is NOT carried here — it flows implicitly through {@link MongoSessionContext}
 * (AsyncLocalStorage), so each per-category task runs in its own bounded
 * transaction without threading a session through signatures.
 */
export class ErasureContext {
  private constructor(
    public readonly actorId: string,
    public readonly reason: string | null,
  ) {}

  public static of(actorId: string, reason: string | null): ErasureContext {
    return new ErasureContext(actorId, reason);
  }
}
