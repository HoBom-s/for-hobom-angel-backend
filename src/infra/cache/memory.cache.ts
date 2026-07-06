interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

/**
 * Minimal in-process TTL cache (LRU-ish by insertion order). Stand-in until the
 * Redis adapter lands — Angel BE will use Redis for cache/lock,
 * at which point callers depending on this can be pointed at a Redis-backed
 * implementation of the same shape.
 */
export class MemoryCache<V> {
  private readonly store = new Map<string, CacheEntry<V>>();

  private constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
  ) {}

  public static of<V>(ttlMs = 30_000, maxEntries = 1_000): MemoryCache<V> {
    return new MemoryCache<V>(ttlMs, maxEntries);
  }

  public get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  public set(key: string, value: V): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  public delete(key: string): void {
    this.store.delete(key);
  }
}
