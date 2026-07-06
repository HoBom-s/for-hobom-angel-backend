/** Opaque-cursor page envelope for keyset pagination (createdAt/_id ordered). */
export class CursorPaginatedResponse<T> {
  private constructor(
    public readonly items: T[],
    public readonly nextCursor: string | null,
    public readonly hasNext: boolean,
  ) {}

  public static of<T>(
    items: T[],
    nextCursor: string | null,
  ): CursorPaginatedResponse<T> {
    return new CursorPaginatedResponse<T>(
      items,
      nextCursor,
      nextCursor !== null,
    );
  }
}
